# My Location Map

## Project purpose

My Location Map is a lightweight browser geolocation test application. It uses HTML5, plain CSS, vanilla JavaScript, Leaflet.js, OpenStreetMap tiles, and the Browser Geolocation API. It has no backend or database.

## Current version

**Version 0.3 is the current implementation.** Version 0.2 remains the approved and validated stable baseline; Version 0.1 remains the approved baseline for the original one-time location behavior.

## Version 0.2 functionality

- Loads a Leaflet street map with OpenStreetMap tiles. The map is 800 × 600 pixels on a wide desktop screen and fits smaller mobile screens.
- Starts continuous tracking automatically when the page loads using `navigator.geolocation.watchPosition()`. There are no Start/Stop tracking buttons.
- Tries a fresh high-accuracy watch first. If the initial fix is unavailable or times out, it clears that watch and starts one standard-accuracy watch.
- Updates latitude, longitude, browser-reported accuracy, and location quality on every successful position update.
- Moves the existing marker and updates the existing accuracy circle, including its radius. It does not create a new marker or circle for each update.
- Centers on the first detected position and follows later positions until the user drags the map. Dragging pauses automatic centering while the marker, circle, and fields continue to update; reloading resumes following.
- Shows a tracking status and handles common geolocation errors, unsupported geolocation, and insecure connections.
- Uses responsive styling, an HTTPS OpenStreetMap tile URL, and map-size recalculation when the map container changes.

## Version 0.3 functionality

- **Save Location** becomes available after the first valid geolocation result.
- Pressing it captures a frozen snapshot of the latest latitude, longitude, browser accuracy, and the time the button was pressed. Later tracking updates continue on the map but do not change the dialog snapshot.
- A native dialog shows read-only coordinates and accuracy and asks for a required location name. Names are trimmed, must not be empty, and are limited to 80 characters. Cancel or Escape closes the dialog without saving.
- Save appends a named record to the browser's `localStorage`, closes the dialog, and shows “Location saved”. No saved-location list or marker is added to the map.

Saved locations use the `locationMap.savedLocations` key as a JSON array. Each record has `name`, numeric `latitude`, numeric `longitude`, numeric `accuracy`, and an ISO 8601 `timestamp`, ready for a possible future CSV export. The stored accuracy is the unrounded browser value; only the dialog display rounds it to the nearest meter.

Saved locations remain only in that browser and device, for that site's origin. They are not uploaded to GitHub, written to `README.md` or a project CSV file, synchronized between devices, or stored on a server. Clearing the browser's site data may remove them. Malformed saved JSON is handled as an empty array when saving a new location. Version 0.3 does not export CSV.

## Accuracy classification

| Browser-reported accuracy | Location quality |
| --- | --- |
| 0–50 m | Excellent |
| 51–200 m | Good |
| 201–1000 m | Approximate |
| More than 1000 m | Low accuracy |

The input is the numeric `position.coords.accuracy` value returned by the browser. The code compares the unrounded value against 50, 200, and 1000 meters, so fractional values just above a boundary enter the next category. The displayed accuracy is rounded to the nearest whole meter and shown as `±N m`. The accuracy circle uses the unrounded value. The application does not calculate or improve location accuracy.

## Desktop versus mobile accuracy

A desktop computer may report coarse positioning, including accuracy measured in hundreds or thousands of meters. Available sources may include nearby Wi-Fi networks, network/IP-based positioning, and operating-system location services. Mobile phones may provide significantly better accuracy because GPS/GNSS and other positioning sources may be available.

`enableHighAccuracy: true` asks the browser for the best available positioning source. It does not guarantee GPS-level precision. Accuracy still depends on the device, environment, signal conditions, and settings.

## Continuous tracking behavior

Versions 0.2 and 0.3 use `navigator.geolocation.watchPosition()` and keep one active watch ID internally. The browser and operating system determine when a new location update is produced; the application does not request positions at a fixed interval. Tracking continues while the Save Location dialog is open. Updates may slow or stop while the page is in the background.

## HTTPS requirement

Browser geolocation requires a secure context. `http://localhost:8000` can be used on the same computer for development. A LAN URL such as `http://192.168.x.x:8000` can display the page on a phone but is not sufficient for mobile geolocation. Open an HTTPS URL for iPhone testing. GitHub Pages provides HTTPS and allows testing outside the local network; Cloudflare Tunnel or another HTTPS endpoint can also be used for local testing.

## Local development

From the project directory, run:

```bash
npx http-server . -p 8000 -c-1
```

Open `http://localhost:8000` on the same computer and allow location access. The command serves the project on port 8000; `-c-1` disables caching during development. `npx` may fetch `http-server` on first use, but the project has no installed runtime dependencies.

## GitHub Pages deployment

Version 0.2 has been deployed and tested using GitHub Pages for HTTPS mobile testing. Version 0.3 remains a static site compatible with the same deployment approach. The general workflow is:

```text
Local development → Git commit → Git push to main → GitHub Pages deployment → HTTPS mobile testing
```

For branch-based publishing, configure GitHub Pages to serve the repository root on `main`, then push changes to that branch. Open the resulting HTTPS Pages address on the iPhone, allow location access, and test outdoors while moving with the page in the foreground. The site can be opened outside the local network. The repository includes `.nojekyll` for its static Pages site. See GitHub's [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) documentation.

## Project structure

```text
location-map-test/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── .gitignore
├── .nojekyll
├── README.md
└── current_state.md
```

## Error handling

The tracking-status field uses these states:

| State | When shown |
| --- | --- |
| Waiting for location... | A watch has started or the initial high-accuracy attempt is falling back. |
| Tracking active | A position update succeeded. |
| Location permission denied | The browser or device denied location access. |
| Location unavailable | The browser could not determine a position. |
| Location request timed out | A position request exceeded its timeout. |
| Geolocation unavailable | The browser does not provide the Geolocation API, or an unknown error occurred. |
| Secure connection required | The page is not in a secure context. |

The separate status message provides more detail. The map remains visible if geolocation fails; before the first successful fix it shows the default location.

## Version history

### Version 0.1 — approved baseline

- Initial Leaflet/OpenStreetMap street map and one-time browser geolocation.
- Marker, accuracy circle, latitude, longitude, accuracy display, and accuracy-quality classification.
- Responsive desktop/mobile layout and geolocation error handling.
- HTTPS mobile testing validated.

### Version 0.2 — approved stable baseline

- Replaced one-time positioning with automatic continuous tracking using `watchPosition()`.
- Tracking starts on page load, with no Start/Stop controls.
- The existing marker and accuracy circle update continuously; coordinates, accuracy, and quality update with each successful position.
- GitHub Pages deployment added for HTTPS mobile testing, and an outdoor/mobile testing workflow established.
- Version 0.2 approved and validated as the stable baseline.

### Version 0.3 — current implementation

- Added Save Location and a naming dialog.
- Captures a frozen GPS snapshot when the button is pressed, while live tracking continues.
- Stores named locations as browser-local records containing name, latitude, longitude, accuracy, and timestamp.
- Uses an array structure suitable for a future CSV export; CSV export is not implemented.

## Known limitations

- Accuracy depends on the device, available positioning sources, and environment.
- The browser controls update frequency; the application does not set a fixed interval.
- Continuous high-accuracy geolocation may use additional battery power.
- Mobile browsers and operating systems may limit background tracking.
- OpenStreetMap tiles and the Leaflet CDN require internet access; public tile availability is best-effort.
- No route history is stored. There is no backend or database. Saved locations persist only in the current browser's site storage and may be removed if that site data is cleared.

## Out-of-scope features

Version 0.3 does not include CSV export or import, a saved-location list, editing or deleting saved locations, saved-location markers, route history, breadcrumb trails, distance traveled, speed, heading visualization, a backend, a database, an API, GitHub repository writing, cloud storage, user accounts, location synchronization, address lookup, route planning, or vehicle tracking. These are potential future-version features only.
