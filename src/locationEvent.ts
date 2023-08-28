import {LocationEvent} from "leaflet";

export type MyLocationEvent = {
    latlng: { lat: number, lng: number },
    accuracy: number,
    altitude: number | null,
    altitudeAccuracy: number | null,
    heading: number | null,
    speed: number | null,
    timestamp: number,
}

export function myLocationEvent(locEv: LocationEvent): MyLocationEvent { // Drop unwanted fields
    return {
        latlng: locEv.latlng,
        accuracy: locEv.accuracy,
        altitude: locEv.altitude,
        altitudeAccuracy: locEv.altitudeAccuracy,
        heading: locEv.heading,
        speed: locEv.speed,
        timestamp: locEv.timestamp,
    }
}