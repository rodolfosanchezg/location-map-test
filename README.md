# My Location Map

## Project purpose

My Location Map is a lightweight browser geolocation test application. It uses HTML5, plain CSS, vanilla JavaScript, Leaflet.js, OpenStreetMap tiles, and the Browser Geolocation API. It has no backend or database.

## Current version

**Version 0.2 is the current approved and validated stable baseline.** Version 0.1 remains the approved baseline for the original one-time location behavior.

## Version 0.2 functionality

- Loads a Leaflet street map with OpenStreetMap tiles. The map is 800 × 600 pixels on a wide desktop screen and fits smaller mobile screens.
- Starts continuous tracking automatically when the page loads using `navigator.geolocation.watchPosition()`. There are no Start/Stop tracking buttons.
- Tries a fresh high-accuracy watch first. If the initial fix is unavailable or times out, it clears that watch and starts one standard-accuracy watch.
- Updates latitude, longitude, browser-reported accuracy, and location quality on every successful position update.
- Moves the existing marker and updates the existing accuracy circle, including its radius. It does not create a new marker or circle for each update.
- Centers on the first detected position and follows later positions until the user drags the map. Dragging pauses automatic centering while the marker, circle, and fields continue to update; reloading resumes following.
- Shows a tracking status and handles common geolocation errors, unsupported geolocation, and insecure connections.
- Uses responsive styling, an HTTPS OpenStreetMap tile URL, and map-size recalculation when the map container changes.

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

Version 0.2 uses `navigator.geolocation.watchPosition()` and keeps one active watch ID internally. The browser and operating system determine when a new location update is produced; the application does not request positions at a fixed interval. Updates may slow or stop while the page is in the background.

## HTTPS requirement

Browser geolocation requires a secure context. `http://localhost:8000` can be used on the same computer for development. A LAN URL such as `http://192.168.x.x:8000` can display the page on a phone but is not sufficient for mobile geolocation. Open an HTTPS URL for iPhone testing. GitHub Pages provides HTTPS and allows testing outside the local network; Cloudflare Tunnel or another HTTPS endpoint can also be used for local testing.

## Local development

From the project directory, run:

```bash
npx http-server . -p 8000 -c-1
```

Open `http://localhost:8000` on the same computer and allow location access. The command serves the project on port 8000; `-c-1` disables caching during development. `npx` may fetch `http-server` on first use, but the project has no installed runtime dependencies.

## GitHub Pages deployment

Version 0.2 has been deployed and tested using GitHub Pages for HTTPS mobile testing. The general workflow is:

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

## Known limitations

- Accuracy depends on the device, available positioning sources, and environment.
- The browser controls update frequency; the application does not set a fixed interval.
- Continuous high-accuracy geolocation may use additional battery power.
- Mobile browsers and operating systems may limit background tracking.
- OpenStreetMap tiles and the Leaflet CDN require internet access; public tile availability is best-effort.
- No route history is stored. There is no backend or database, and no location data is persisted.

## Out-of-scope features

Version 0.2 does not include route history, breadcrumb trails, distance traveled, speed, heading visualization, saved positions, a backend, a database, user accounts, address lookup, route planning, or vehicle tracking. These are potential future-version features only.
