import 'leaflet/dist/leaflet.css';
import {setupLocationListener} from "./listener";
import {createMap} from "./map";
import {setupWidget} from "./widget";
import {setupConfig} from "./config";
import {setupApp} from "./app";

(async () => {
    const myMap = createMap();

    setupLocationListener(myMap);

    let appConfig = await setupConfig();

    setupApp(myMap, appConfig);

    setupWidget(myMap, appConfig);
})()