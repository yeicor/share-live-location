import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.Control.Watermark = L.Control.extend({  //download-button
    onAdd: function(map) {
        const div = L.DomUtil.create('div');
        div.innerHTML = "Share: 📡 | Receive: 🔗"
        div.style.fontSize = "64px"
        div.style.background = 'white';

        L.DomEvent.on(div, 'click', this._download, this);  //_download
        L.DomEvent.disableClickPropagation(div)

        return div;
    },
    _download: function(ev) {  //console.log(this._map._layers)  //must be named mytrack!
        if('msSaveOrOpenBlob' in navigator) navigator.msSaveOrOpenBlob(new Blob([JSON.stringify(mytrack.gpx)]),"mytrack.json");  //L.mytrack???
        else ev.target.href="data:application/geo+json,"+JSON.stringify(mytrack.gpx)
    }
    //, onRemove: function(map) { }   // Nothing to do here
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}

L.control.watermark({ position: 'topright' }).addTo(map);