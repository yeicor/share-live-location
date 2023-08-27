import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// noinspection JSUnusedGlobalSymbols
new (L.Control.extend({
    onAdd: function(_map) {
        const button = document.createElement('button');
        button.innerHTML = "🛰️"
        button.style.fontSize = "48px"
        button.style.padding = '0px 10px';
        button.style.background = 'white';
        button.style.cursor = 'pointer';
        button.onclick = () => { alert("Locate & Share...") }
        return button;
    },
}))({"position": "topright"}).addTo(map);