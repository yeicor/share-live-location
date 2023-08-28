import {circle, Control, latLng, LatLng, map, polyline, tileLayer} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {NtfyShare} from "./ntfy";

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
let trailPath = []
const trailHistory = 1000
const trailOpacity = (index: number) => 0.75 - 0.5 * (index / trailHistory) ** 1.25
let trailPathPrevLoc: LatLng | null = null;
myMap.addEventListener('locationfound', (e) => {
    console.debug("Received new location: ", e.latlng, e.accuracy);

    // Render latest location and accuracy
    [locCircle, accCircle].forEach((circle) => {
        circle.setLatLng(e.latlng)
    });
    accCircle.setRadius(e.accuracy);
    locCircle.addTo(myMap);

    // Set view to latest location
    myMap.setView(e.latlng);

    // Render trail
    // TODO: Add markers with timestamps, speed, etc.
    if (trailPathPrevLoc != null) {
        trailPath.push(polyline([trailPathPrevLoc, e.latlng]).addTo(myMap))
        if (trailPath.length > trailHistory) trailPath.shift()?.remove();
        trailPath.forEach((path, i) => path.setStyle({opacity: trailOpacity(i)}))
    }
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
console.debug("Auto-config URL: ", autoConfigUrl);
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
    myMap.addEventListener('locationfound', (e) => ntfyShare.publish(e));
}

// Set up receiving (if configured to receive)
if (isReceiving) {
    console.debug("Subscribing to location updates");
    // Start receiving locations
    ntfyShare.subscribe((locEv, _date) => {
        myMap.fireEvent('locationfound', locEv);
    });
}