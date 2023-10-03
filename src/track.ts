import {circle, LatLng, latLng, Layer, layerGroup, LayerGroup, Map, Marker, Path, polyline} from "leaflet";
import {myLocationEvent} from "./event";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";

export function setupLocationListener(myMap: Map) {
// Location found events are emitted both when sharing and when receiving!
    let locCircle = circle(latLng(0, 0), {radius: 2}).addTo(myMap);
    let accCircle = circle(latLng(0, 0)).addTo(myMap);
    let trailPath: LayerGroup[] = []
    const trailHistory = 10_000
    const trailOpacity = (index: number) => 0.75 - 0.5 * (index / trailHistory) ** 1.25
    let trailPathPrevLoc: LatLng | null = null;
    myMap.addEventListener('locationfound', (e) => {
        console.debug("Received new location: ", e.latlng, e.accuracy);
        // TODO: Improve performance when receiving lots of cached locations at once

        // Render latest location and accuracy
        [locCircle, accCircle].forEach((circle) => {
            circle.setLatLng(e.latlng)
        });
        accCircle.setRadius(e.accuracy);

        // Set view to latest location
        if (myMap.getZoom() < 2) myMap.setView(e.latlng, 16); else myMap.setView(e.latlng);

        // Render trail
        let pathElems: Layer[] = []
        let infoMarker = circle(e.latlng, {radius: 2, fillOpacity: 1, fill: true, fillColor: "#000"})
            .bindPopup("<pre>" + JSON.stringify(myLocationEvent(e), undefined, 4) + "</pre>")
            .addTo(myMap);
        pathElems.push(infoMarker)
        if (trailPathPrevLoc != null) {
            let line = polyline([trailPathPrevLoc, e.latlng]).addTo(myMap);
            pathElems.push(line)
        }
        trailPath.push(layerGroup(pathElems))
        if (trailPath.length > trailHistory) trailPath.shift()?.remove();
        trailPath.forEach((layers, i) => layers.getLayers().forEach((layer) => {
            if (layer instanceof Path) layer.setStyle({opacity: trailOpacity(i)})
            else if (layer instanceof Marker) layer.setOpacity(trailOpacity(i))
            else console.warn("Unknown layer type to set opacity: ", layer)
        }))
        trailPathPrevLoc = e.latlng;
    })
    myMap.addEventListener('locationerror', (e) => {
        console.error("Failed to get location: ", e);
        alertify.error("Failed to get location (" + e.code + "): " + e.message);
    });
}