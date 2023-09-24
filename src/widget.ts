import {AppConfig} from "./config";
import {Map} from "leaflet";
import {myLocationEvent, MyLocationEvent} from "./event";

export function setupWidget(myMap: Map, appConfig: AppConfig) {
    const widgetStatus = document.getElementById("main-widget-status")! as HTMLDivElement;
    const widgetStatus2 = document.getElementById("main-widget-status-2")! as HTMLDivElement;
    const widgetLink = document.getElementById("main-widget-link")! as HTMLAnchorElement;
    const widgetOpenMap = document.getElementById("main-widget-open-map")! as HTMLAnchorElement;


    let baseUrl = new URL(location.href);
    baseUrl.hash = "#receive?id=" + appConfig.ntfy.topic + "&url=" + appConfig.ntfy.url;
    widgetLink.href = baseUrl.toString()
    if (appConfig.isSharing) {
        widgetStatus.innerText = "Sharing location...";
    } else {
        widgetStatus.innerText = "Receiving location...";
    }

    let lastEvent: MyLocationEvent | null = null;
    const updateWidgetStatus2 = () => {
        if (lastEvent == null) widgetStatus2.innerText = "No location received yet";
        else {
            let deltaSecs = Math.round((Date.now() - lastEvent.timestamp) / 1000);
            widgetStatus2.innerHTML = "Updated " + deltaSecs + "s ago";
            let spanClass = deltaSecs > 60 ? "text-danger" : "text-muted";
            widgetStatus2.classList.add(spanClass);
        }
    }
    setInterval(updateWidgetStatus2, 1000);
    myMap.addEventListener('locationfound', (e) => {
        lastEvent = myLocationEvent(e);
        widgetOpenMap.href = "https://www.google.com/maps/search/?api=1&query=" + e.latlng.lat + "%2C" + e.latlng.lng;
    })
}