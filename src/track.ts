import {Circle, circle, LatLng, Map, polyline} from "leaflet";
import {myLocationEvent} from "./event";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";

export function setupLocationListener(myMap: Map) {
// Location found events are emitted both when sharing and when receiving!
    let accCircle = null as Circle;
    let trailPathPrevLoc: LatLng | null = null;
    myMap.addEventListener('locationfound', (e) => {
        console.debug("Received new location: ", e.latlng, e.accuracy);

        // Render only the latest accuracy
        if (accCircle == null) accCircle = circle(e.latlng, {radius: e.accuracy}).addTo(myMap);
        accCircle.setLatLng(e.latlng)
        accCircle.setRadius(e.accuracy);

        // Set view to latest location
        if (myMap.getZoom() < 2) myMap.setView(e.latlng, 16); else myMap.setView(e.latlng);

        // Render trail
        circle(e.latlng, {radius: 2, fillOpacity: 1, fill: true, fillColor: "#000"})
            .bindPopup("<pre>" + JSON.stringify(myLocationEvent(e), undefined, 4) + "</pre>")
            .addTo(myMap);
        if (trailPathPrevLoc != null) {
            polyline([trailPathPrevLoc, e.latlng]).addTo(myMap);
        }
        trailPathPrevLoc = e.latlng;
    })
    myMap.addEventListener('locationerror', (e) => {
        console.error("Failed to get location: ", e);
        alertify.error("Failed to get location (" + e.code + "): " + e.message);
    });
}