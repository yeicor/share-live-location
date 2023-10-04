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

type MyLocationEventDate = {
    locEv: MyLocationEvent,
    date: Date,
}

export class Ntfy {
    url: URL;
    topic: string;

    constructor(urlStr: string = "https://ntfy.sh", topic: string = randomTopic(8)) {
        this.url = new URL(urlStr);
        this.topic = topic;
        console.debug("NtfyShare initialized with url: ", this.url, " and id: ", this.topic)
    }

    /**
     * Publishes the given location to the server, which will then be shared with any clients that connect to the same url + ID.
     * @param locEv The location to publish.
     */
    publish(locEv: MyLocationEvent) {
        let bodyJson = JSON.stringify(locEv)
        let url = new URL(this.topic + this.url.search, this.url)
        console.log(url, "sending body of length", bodyJson.length);
        fetch(url, {method: "POST", body: bodyJson}).then((response) => {
            if (!response.ok) {
                console.error("Failed to publish location: ", response)
                alertify.error("Failed to publish location: " + response.status + " " + response.statusText)
            }
        })
    }

    /**
     * Downloads old messages from the server, for batch processing.
     */
    download(sinceUnixSecs: string): Promise<MyLocationEventDate[]> {
        return new Promise((resolve) => {
            let buffer: MyLocationEventDate[] = [];
            let subscription: EventSource | null = null;
            let finish = () => {
                if (subscription != null) {
                    console.warn(subscription.readyState)
                    subscription.close();
                    resolve(buffer);
                } else {
                    setTimeout(finish, 1000)
                }
            };
            let timeout = setTimeout(finish, 1000);
            subscription = this.subscribe((locEv, date) => {
                buffer.push({locEv, date});
                clearTimeout(timeout);
                timeout = setTimeout(finish, 1000);
            }, sinceUnixSecs, false);
        })
    }

    /**
     * Connects to the server and listens for any published locations.
     * @param callback The function to call when a location is published. The date should be very close to the timestamp in the LocationEvent.
     * @param since Only receive messages that were published after this string (see ntfy docs)
     * @param futureMessages Whether to listen for messages that are published in the future or only download old messages.
     */
    subscribe(callback: (locEv: MyLocationEvent, date: Date) => void, since: string | null = "all", futureMessages: Boolean = true): EventSource {
        // Fetch all cached (last day) messages and subscribe to new ones as they come in
        let newSearchParams = new URLSearchParams(this.url.search)
        if (since) newSearchParams.set("since", since)
        if (!futureMessages) newSearchParams.set("poll", "1")
        let url = new URL(this.topic + "/sse?" + newSearchParams.toString(), this.url)
        console.debug("Subscribing to: ", url);
        const eventSource = new EventSource(url)
        eventSource.onmessage = (e) => {
            const line: string = e.data;
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
        };
        return eventSource
    }
}
