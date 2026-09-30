# My Location Map

## Project purpose

This small web project tests browser geolocation on a Leaflet street map with OpenStreetMap tiles. It shows the coordinates, browser-reported accuracy, and a plain-language quality label. It uses plain HTML, CSS, and vanilla JavaScript, with no backend or database.

## Current version

Version 0.2 is the current implementation. Version 0.1 is the approved, stable baseline.

## Version 0.1 features

- An 800 × 600 pixel map on desktop and a layout that fits mobile screens.
- A default map before geolocation succeeds, then a marker and accuracy circle at the detected location.
- An automatic, one-time location request that tries high accuracy first and falls back to standard accuracy if the first attempt is unavailable or times out.
- Latitude, longitude, accuracy in meters, and location quality.
- Status messages for permission denied, position unavailable, timeout, unsupported geolocation, and insecure HTTP contexts.
- Local development with `npx http-server` and mobile geolocation testing through an HTTPS tunnel.

## Version 0.2 features

- Automatic continuous location tracking using `navigator.geolocation.watchPosition()` when the page loads, with no manual tracking controls.
- A tracking-status field that reports when the page is waiting, tracking, or encountering an error.
- Live updates to the existing marker, accuracy circle, coordinates, accuracy, and quality label. The map follows the latest location until you drag it.
- The initial high-accuracy request and standard-accuracy fallback are retained for tracking. Only one watch is active at a time.

## Project structure

```text
location-map-test/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── .gitignore
├── README.md
└── current_state.md
```

## Requirements

- A modern browser with location services and permission to use them.
- Internet access for the Leaflet CDN and OpenStreetMap tiles.
- Node.js and `npx` to use the local server command below. No project dependencies need to be installed.
- A secure context (`localhost` on the same device or HTTPS) for browser geolocation.

## How to run locally

From the project directory, run:

```bash
npx http-server . -p 8000 -c-1
```

Open `http://localhost:8000` on the computer. The browser will ask for location permission. `npx` may fetch `http-server` on first use; it does not add a dependency to this project. The `-c-1` option disables caching while testing changes.

Tracking starts automatically when the page loads, preserving the initial location behavior from Version 0.1. There are no Start or Stop controls. The page keeps one active watcher and uses `clearWatch()` internally only when switching from the initial high-accuracy attempt to the fallback or when permission is denied.

Dragging the map pauses automatic centering so a location update does not interrupt map browsing. The marker, circle, and location fields still update. Reload the page to resume automatic centering. The map uses OpenStreetMap's documented tile URL and recalculates its layout if the map area changes size.

## How to test on another device

Keep the local server running and open `http://<computer-LAN-IP>:8000` on a device on the same network to check the layout. `localhost` on a phone refers to the phone, not the computer. For a location test on an iPhone, use an HTTPS tunnel that forwards to local port 8000, then open the tunnel's HTTPS URL on the iPhone. Allow location access when asked. No particular tunnel service or command is required by this project.

On desktop, check that tracking begins on load and the map, marker, accuracy circle, and fields update when a new position is reported. On iPhone, perform the same checks using the HTTPS URL and move with the page open to observe updates. `watchPosition()` has no fixed update interval: the browser and device decide when to report a meaningful change, and backgrounded pages may receive fewer updates or none.

## HTTPS requirement for mobile geolocation

Browser geolocation requires a secure context. A phone can display the map from a computer's plain HTTP LAN address, but geolocation will not work there even if location permission was granted. Use an HTTPS URL for mobile location testing. Cloudflare Tunnel or another HTTPS endpoint can forward to the local server for iPhone testing. Version 0.1 mobile HTTPS testing was validated through a tunnel.

## Geolocation accuracy explanation

The accuracy value comes directly from `position.coords.accuracy`. The page rounds it to the nearest whole meter for display, shows it as `±N m`, and uses the unrounded value for the accuracy circle and quality label. The app does not improve or estimate the browser's accuracy.

Desktop geolocation can legitimately be coarse, including approximately 2 km, depending on available positioning sources. `enableHighAccuracy: true` asks the browser for better accuracy but does not guarantee GPS-level precision. Mobile devices with GPS/GNSS may provide much better accuracy. Accuracy and update behavior can vary with the environment, signal conditions, device settings, and power-saving behavior.

## Accuracy-quality classification

| Browser-reported accuracy | Location quality |
| --- | --- |
| 0–50 m | Excellent |
| Over 50–200 m | Good |
| Over 200–1000 m | Approximate |
| Over 1000 m | Low accuracy |

The thresholds use the unrounded numeric accuracy, so a value just above a boundary can display as the boundary after rounding while receiving the next quality label.

## Known limitations

- The browser controls when location updates arrive; there is no fixed update rate.
- Location access and precision depend on browser, device, operating system settings, network, and positioning signals. Mobile power-saving settings or a backgrounded page may limit updates.
- The map tiles and Leaflet CDN require internet access.
- OpenStreetMap's public tile service is best-effort; a slow or unavailable connection can leave tiles blank temporarily.
- This project keeps only the latest location. It has no route history, saved positions, backend, or database.

## Version history

### Version 0.1 — approved baseline

- Initial map and one-time geolocation with high-accuracy attempt and fallback.
- Marker, accuracy circle, coordinates, browser accuracy, and accuracy-quality classification.
- Responsive mobile support and error handling.
- HTTPS mobile testing validated through a tunnel.

### Version 0.2 — current implementation

- Automatic continuous geolocation using `watchPosition()` when the page loads.
- Live updates that reuse the marker and accuracy circle and refresh the coordinates, accuracy, and quality label.
- Removed manual Start/Stop Tracking controls to simplify the application; a tracking-status field remains.
- Dragging pauses automatic centering, and the map refreshes when its container size changes.
