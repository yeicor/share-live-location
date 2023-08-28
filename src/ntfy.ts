function randomId(size: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < size; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

type MyLocationEvent = {
    latlng: { lat: number, lng: number },
    accuracy: number,
    altitude: number | null,
    altitudeAccuracy: number | null,
    heading: number | null,
    speed: number | null,
    timestamp: number,
}

export class NtfyShare {
    host: string;
    id: string;

    constructor(host: string = "https://ntfy.sh", anyId: string = randomId(8)) {
        this.host = host;
        this.id = anyId;
        console.debug("NtfyShare initialized with host: ", this.host, " and id: ", this.id)
    }

    /**
     * Publishes the given location to the server, which will then be shared with any clients that connect to the same Host + ID.
     * @param locEv The location to publish.
     */
    publish(locEv: MyLocationEvent) {
        let msg = { // Drop unwanted fields
            latlng: locEv.latlng,
            accuracy: locEv.accuracy,
            altitude: locEv.altitude,
            altitudeAccuracy: locEv.altitudeAccuracy,
            heading: locEv.heading,
            speed: locEv.speed,
            timestamp: locEv.timestamp,
        } as MyLocationEvent
        let bodyJson = JSON.stringify(msg)
        let url = this.host + "/" + this.id
        console.log(url, "sending body of length", bodyJson.length);
        fetch(url, {method: "POST", body: bodyJson}).then((response) => {
            console.assert(response.ok, "Failed to publish location: ", response)
        })
    }

    /**
     * Connects to the server and listens for any published locations.
     * @param callback The function to call when a location is published. The date should be very close to the timestamp in the LocationEvent.
     */
    subscribe(callback: (locEv: MyLocationEvent, date: Date) => void): AbortController {
        // Fetch all cached (last day) messages and subscribe to new ones as they come in
        let abortController = new AbortController();
        let url = this.host + "/" + this.id + "/json?since=" + (Date.now() - 86400000);
        console.debug("Subscribing to: ", url);
        fetch(url, {signal: abortController.signal}).then((response) => {
            // Each line is a JSON object, we want to read them one by one in streaming fashion
            const handleLine = (line: string) => {
                const event = JSON.parse(line) as { event: string, message: string, time: number };
                if (event.event == "message") {
                    callback(JSON.parse(event.message), new Date(event.time));
                } else {
                    console.debug("Ignoring ntfy event: ", event);
                }
            }
            let lineBuffer = "";
            let reader = response.body!
                .pipeThrough(new TextDecoderStream())
                .getReader();
            const handleChunk = ({done, value}: { done: boolean, value: string }) => {
                if (done) { // Handle any remaining data
                    handleLine(lineBuffer);
                    console.debug("Stopped subscription to: ", url)
                    return;
                }
                lineBuffer += value;
                let completeLines = lineBuffer.split("\n");
                lineBuffer = completeLines.pop()!; // Last line is incomplete, save it for next time
                completeLines.forEach(handleLine);
                reader.read().then(handleChunk);
            }
            reader.read().then(handleChunk);
        });
        return abortController;
    }
}
