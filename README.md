# Share Live Location

An easy way to share your live location. It uses [leaflet](https://leafletjs.com/) for map rendering and
[ntfy](https://ntfy.sh/) for relaying the location between devices.

By default, it uses the public ntfy.sh instance using random topics to share the location.
However, you can also [host your own ntfy instance](https://docs.ntfy.sh/install/) for more privacy.

## [Try it out!](https://yeicor.github.io/share-live-location/)

## Features

- Share your location with any number of people simultaneously.
- See the location history even if the connection is lost:
    - Messages are cached on the ntfy server for 12 hours by default.
- Quick link to open the latest location in Google Maps.
- [Integration with OsmAnd](#osmand-integration).

## [OsmAnd](https://osmand.net/) integration

To share your location automatically whenever you start a trip recording in OsmAnd, follow these steps:

1. Set Plugins > Trip Recording (enable it) > Settings > Online Tracking (enable it) > Web address to:
    - `https://<ntfy-host>/<secret-topic>/publish?message=%7B%22latlng%22%3A%7B%22lat%22%3A{0}%2C%22lng%22%3A{1}%7D%2C%22timestamp%22%3A{2}%2C%22accuracy%22%3A{3}%2C%22altitude%22%3A{4}%2C%22speed%22%3A{5}%2C%22heading%22%3A{6}%7D`

You should increase the time between updates to avoid spamming the server.

You can also start recording (and sharing) automatically during navigation.

