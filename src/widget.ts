import {AppConfig} from "./config";
import {Map} from "leaflet";
import {myLocationEvent, MyLocationEvent} from "./event";

function getRelativeTime(t1, t2 = new Date().getTime()) {
    let number = Math.round((t1 - t2) / 1000);
    return Math.abs(number) + "s" + (number <= 0 ? " ago" : "");
}

export function setupWidget(myMap: Map, appConfig: AppConfig) {
    const widgetStatus = document.getElementById("main-widget-status")! as HTMLDivElement;
    const widgetStatus2 = document.getElementById("main-widget-status-2")! as HTMLDivElement;
    const widgetLink = document.getElementById("main-widget-link")! as HTMLAnchorElement;
    const widgetOpenMap = document.getElementById("main-widget-open-map")! as HTMLAnchorElement;


    let baseUrl = new URL(location.href);
    baseUrl.hash = "#r?id=" + appConfig.ntfy.id + "&host=" + appConfig.ntfy.host;
    widgetLink.href = baseUrl.toString()
    if (appConfig.isSharing) {
        widgetStatus.innerText = "Sharing location...";
    } else {
        widgetStatus.innerText = "Receiving location...";
    }

    let lastEvent: MyLocationEvent | null = null;
    const updateWidgetStatus2 = () => {
        if (lastEvent == null) widgetStatus2.innerText = "No location received yet";
        else widgetStatus2.innerText = "Updated " + getRelativeTime(lastEvent.timestamp);
    }
    setInterval(updateWidgetStatus2, 1000);
    myMap.addEventListener('locationfound', (e) => {
        lastEvent = myLocationEvent(e);
        widgetOpenMap.href = "geo:" + e.latlng.lat + "," + e.latlng.lng;
    })
}