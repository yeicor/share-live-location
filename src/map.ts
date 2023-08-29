import {Control, map, tileLayer} from "leaflet";

export function createMap() {
    const myMap = map('map').setView([0, 0], 1.33);

    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);

    // noinspection JSUnusedGlobalSymbols
    new (Control.extend({
        onAdd: () => { // Extract the widget from the DOM
            let widget = document.getElementById("main-widget");
            widget.remove();
            widget.style.display = "block";
            return widget;
        },
    }))({"position": "topright"}).addTo(myMap);
    return myMap;
}