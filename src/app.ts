import {
    circle,
    Control,
    latLng,
    LatLng,
    Layer,
    layerGroup,
    LayerGroup,
    map,
    Marker,
    Path,
    polyline,
    tileLayer
} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {NtfyShare} from "./ntfy";
import {myLocationEvent} from "./locationEvent";

const myMap = map('map').setView([0, 0], 1.33);

tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

// noinspection JSUnusedGlobalSymbols
new (Control.extend({
    onAdd: () => { // Extract the widget from the DOM
        let widget = document.getElementById("share-widget");
        widget.remove();
        widget.style.display = "block";
        return widget;
    },
}))({"position": "topright"}).addTo(myMap);

// Location found events are emitted both when sharing and when receiving!
let locCircle = circle(latLng(0, 0), {radius: 2}).addTo(myMap);
let accCircle = circle(latLng(0, 0)).addTo(myMap);
let trailPath: LayerGroup[] = []
const trailHistory = 10_000
const trailOpacity = (index: number) => 0.75 - 0.5 * (index / trailHistory) ** 1.25
let trailPathPrevLoc: LatLng | null = null;
myMap.addEventListener('locationfound', (e) => {
    console.debug("Received new location: ", e.latlng, e.accuracy);

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

// Get configuration from URL hash
let autoConfigUrl = undefined
let fullUrl = new URL(window.location.href);
if (fullUrl.hash.startsWith("#")) {
    try {
        let autoConfigUrlStr = fullUrl.hash.substring(1);
        console.debug("Auto-config URL: ", autoConfigUrlStr);
        autoConfigUrl = new URL(autoConfigUrlStr, window.location.href);
    } catch (e) {
        console.error("Failed to parse auto-config URL: ", e);
    }
}
let canShare = true
let isReceiving = false
let shareHost = autoConfigUrl?.searchParams?.get("host")
if (shareHost == null) shareHost = undefined
let shareId = autoConfigUrl?.searchParams?.get("id")
if (shareId == null) shareId = undefined
const ntfyShare = new NtfyShare(shareHost, shareId)
if (autoConfigUrl?.pathname == "/share") { // Automatically share
} else if (autoConfigUrl?.pathname == "/receive") { // Automatically receive
    canShare = false
    isReceiving = true
} // else: no autoConfig, default to share manually

// Does the device support precise location?
if (!navigator.geolocation && !isReceiving) {
    alert("Your device/browser does not support sharing your location.");
    canShare = false
}

// Set up sharing (if not configured to receive)
let shareButton = document.getElementById("share-button") as HTMLButtonElement;
shareButton.disabled = !canShare
shareButton.onclick = () => {
    shareButton.disabled = true
    // Start location tracking
    console.debug("Starting location tracking")
    myMap.locate({watch: true});
    // Start publishing on location found
    console.debug("Publishing location on location found")
    myMap.addEventListener('locationfound', (e) => ntfyShare.publish(myLocationEvent(e)));
}

// Set up receiving (if configured to receive)
if (isReceiving) {
    console.debug("Subscribing to location updates");
    // Start receiving locations
    ntfyShare.subscribe((locEv, _date) => {
        myMap.fireEvent('locationfound', locEv);
    });
}