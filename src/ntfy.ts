import {MyLocationEvent} from "./event";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";

function randomTopic(size: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < size; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

export class Ntfy {
    host: string;
    topic: string;

    constructor(host: string = "https://ntfy.sh", topic: string = randomTopic(8)) {
        this.host = host;
        this.topic = topic;
        console.debug("NtfyShare initialized with host: ", this.host, " and id: ", this.topic)
    }

    /**
     * Publishes the given location to the server, which will then be shared with any clients that connect to the same Host + ID.
     * @param locEv The location to publish.
     */
    publish(locEv: MyLocationEvent) {
        let bodyJson = JSON.stringify(locEv)
        let url = this.host + "/" + this.topic
        console.log(url, "sending body of length", bodyJson.length);
        fetch(url, {method: "POST", body: bodyJson}).then((response) => {
            if (!response.ok) {
                console.error("Failed to publish location: ", response)
                alertify.error("Failed to publish location: " + response.status + " " + response.statusText)
            }
        })
    }

    /**
     * Connects to the server and listens for any published locations.
     * @param callback The function to call when a location is published. The date should be very close to the timestamp in the LocationEvent.
     */
    subscribe(callback: (locEv: MyLocationEvent, date: Date) => void): AbortController {
        // Fetch all cached (last day) messages and subscribe to new ones as they come in
        let abortController = new AbortController();
        let url = this.host + "/" + this.topic + "/json?since=" + (Date.now() / 1000 - 24 * 60 * 60).toFixed(0);
        console.debug("Subscribing to: ", url);
        fetch(url, {signal: abortController.signal}).then((response) => {
            if (!response.ok) {
                console.error("Failed to subscribe for location updates: ", response)
                alertify.error("Failed to subscribe for location updates: " + response.status + " " + response.statusText)
                return;
            }
            // Each line is a JSON object, we want to read them one by one in streaming fashion
            const handleLine = (line: string) => {
                if (line.trim() == "") return; // Ignore empty lines
                let event: { event: string, message: string, time: number }
                try {
                    event = JSON.parse(line);
                } catch (e) {
                    alertify.error("Ntfy event is not valid JSON: " + e + " -- " + line);
                    console.error("Ntfy event is not valid JSON: ", e, " -- ", line);
                    return;
                }
                console.debug("Received ntfy raw event: ", event)
                if (event.event == "message") {
                    let locEv: MyLocationEvent;
                    // Parse JSON
                    try {
                        locEv = JSON.parse(event.message);
                    } catch (e) {
                        alertify.error("Ntfy message is not valid JSON: " + e + " -- " + event.message);
                        console.error("Ntfy message is not valid JSON: ", e, " -- ", event.message);
                        return;
                    }
                    // Validate location event (required fields)
                    if (!locEv.latlng || !locEv.latlng.lat || !locEv.latlng.lng || !locEv.accuracy || !locEv.timestamp) {
                        alertify.error("Ntfy message is missing required fields: " + event.message);
                        console.error("Ntfy message is missing required fields: ", event.message);
                        return;
                    }
                    // Fill optional fields with nulls if needed
                    if (!locEv.altitude) locEv.altitude = null;
                    if (!locEv.altitudeAccuracy) locEv.altitudeAccuracy = null;
                    if (!locEv.heading) locEv.heading = null;
                    if (!locEv.speed) locEv.speed = null;
                    // Call callback
                    callback(locEv, new Date(event.time));
                } else {
                    console.debug("Ignoring ntfy event: ", event);
                }
            }
            let lineBuffer = "";
            let reader = response.body!
                .pipeThrough(new TextDecoderStream())
                .getReader();
            const handleChunk = ({done, value}: { done: boolean, value: string }) => {
                try {
                    if (done) { // Handle any remaining data
                        handleLine(lineBuffer);
                        console.debug("Stopped subscription to: ", url)
                        alertify.warning("Stopped subscription to: " + url)
                        return;
                    }
                    lineBuffer += value;
                    let completeLines = lineBuffer.split("\n");
                    lineBuffer = completeLines.pop()!; // Last line is incomplete, save it for next time
                    completeLines.forEach(handleLine);
                } catch (e) {
                    console.error("Failed to handle chunk: ", e);
                    alertify.error("Failed to handle chunk: " + e);
                } finally { // Try to recover from any unknown error
                    reader.read().then(handleChunk);
                }
            }
            reader.read().then(handleChunk);
        });
        return abortController;
    }
}
