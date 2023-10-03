import {Map} from "leaflet";
import {AppConfig} from "./config";
import {myLocationEvent} from "./event";

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
        console.debug("Subscribing to location updates")
        appConfig.ntfy.subscribe(async (locEv, _date) => {
            myMap.fireEvent('locationfound', locEv);
        });
    }
}