import {Map} from "leaflet";
import {AppConfig} from "./config";
import {myLocationEvent} from "./event";
import alertify from "alertifyjs";

export function setupApp(myMap: Map, appConfig: AppConfig) {
    console.debug("App config: ", appConfig)
    if (appConfig.isSharing) {
        // Start location tracking
        console.debug("Starting location tracking")
        myMap.locate({watch: true});
        // Start publishing on location found
        console.debug("Publishing location on location found")
        myMap.addEventListener('locationfound', (e) => appConfig.ntfy.publish(myLocationEvent(e)));
    } else {
        // Start receiving locations
        console.debug("Downloading old locations and subscribing to new ones")
        let subscribeSince = null;
        appConfig.ntfy.download(subscribeSince).then((locEvDates) => {
            let maxInitialLocations = parseInt(new URL(location.href).searchParams.get("maxInitialLocations") ?? "100");
            if (locEvDates.length > maxInitialLocations) {
                console.info("Downloaded " + locEvDates.length + " locations, but only showing the first (?maxInitialLocations=" + maxInitialLocations + ")");
                alertify.warning("Downloaded " + locEvDates.length + " locations, but only showing the first " + maxInitialLocations);
                locEvDates = locEvDates.slice(locEvDates.length - maxInitialLocations);
            }
            console.debug("Showing the last " + locEvDates.length + " locations")
            locEvDates.forEach((locEvDate) => {
                myMap.fireEvent('locationfound', locEvDate.locEv)
                subscribeSince = (locEvDate.date.getTime()).toFixed(0);
            })
            console.warn("Subscribing to new locations since " + subscribeSince + " (" + new Date(parseInt(subscribeSince) * 1000) + ")")
            appConfig.ntfy.subscribe(async (locEv, _date) => {
                myMap.fireEvent('locationfound', locEv);
            }, subscribeSince).onerror = (e) => {
                console.error("Ntfy event source error: ", e);
                alertify.error("Ntfy event source error: " + JSON.stringify(e));
            };
        });
    }
}