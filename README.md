# My Location Map

## Project purpose

My Location Map is a lightweight browser geolocation test application. It uses HTML5, plain CSS, vanilla JavaScript, Leaflet.js, OpenStreetMap tiles, and the Browser Geolocation API. It has no backend or database.

## Current version

**Version 0.6 — approved and validated stable baseline.** Version 0.5 remains the approved CSV marker-loading baseline; Version 0.4 remains the approved CSV export baseline; Version 0.3 remains the approved named-location and `localStorage` baseline; Version 0.2 remains the approved continuous-tracking baseline; Version 0.1 remains the original approved baseline for one-time location behavior.

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
- The **Saved locations** counter shows how many named records exist in this browser's `localStorage`. It is calculated when the page loads and updates immediately after a successful save, so reloading the page can confirm that the count persisted.

Saved locations use the `locationMap.savedLocations` key as a JSON array. Each record has `name`, numeric `latitude`, numeric `longitude`, numeric `accuracy`, and an ISO 8601 `timestamp`. Version 0.4 exports these fields to CSV. The stored accuracy is the unrounded browser value; only the dialog display rounds it to the nearest meter.

In Version 0.3, saved locations remain only in that browser and device, for that site's origin. They are not uploaded to GitHub, written to `README.md` or a project CSV file, synchronized between devices, or stored on a server. Clearing the browser's site data may remove them. Malformed saved JSON is handled as an empty array when saving a new location. Version 0.3 does not export CSV.

Version 0.3 passed desktop browser and iPhone HTTPS testing through the deployed GitHub Pages site. Testing confirmed continuous geolocation, Save Location, frozen snapshots while tracking continues, named records in `localStorage`, and the Saved locations counter, including persistence after reloading the page.

## Version 0.4 functionality

- **Export CSV** exports all currently saved records from `locationMap.savedLocations` with `name`, `latitude`, `longitude`, `accuracy`, and `timestamp` columns. The file is generated and downloaded entirely in the browser with proper CSV escaping. No backend or external CSV library is used. Stored record timestamps remain the original ISO 8601 values captured with each location.
- The filename is `saved-locations-YYYY-MM-DD-HHMMSS.csv`, for example `saved-locations-2026-09-30-191845.csv`. It uses the device/browser local date and time at export, a 24-hour clock, and zero-padded values. It contains no colons, slashes, or spaces; the time distinguishes batches exported at different seconds on the same day.
- Export CSV is disabled when there are no saved records or the stored data is malformed.
- After the download is initiated successfully, the app writes an empty array (`[]`) to `locationMap.savedLocations`. The Saved locations counter returns to zero and Export CSV becomes disabled. The downloaded CSV is the archive of that batch.
- Saving a new location starts another collection cycle: the counter increases and Export CSV becomes available again. If CSV preparation or download initiation fails, saved records are retained. If clearing storage fails after initiation, the app reports that the download started but the records remain stored.

Version 0.4 passed laptop/browser and iPhone HTTPS testing through the deployed GitHub Pages site. Testing confirmed saved records in `localStorage`, CSV generation and contents, export-and-clear behavior, the counter returning to zero, Export CSV disabling after export, and a new collection cycle after another save. The local date-and-time filenames were validated for multiple batches on the same day.

## Version 0.5 functionality

- On page load, the app reads only the fixed root file `locations.csv`. It expects the Version 0.4 header `name,latitude,longitude,accuracy,timestamp`. The app does not write to or modify this file.
- The built-in CSV parser handles quoted names with commas, doubled quotes, and line breaks. Blank rows and rows without a name, five columns, or valid latitude/longitude are skipped; valid rows still load. Latitude must be from -90 to 90 and longitude from -180 to 180.
- Each valid row becomes a separate Leaflet marker with its `name` shown in a permanently visible label. These CSV markers are kept apart from the live GPS marker and accuracy circle.
- The **CSV locations** counter shows the number of displayed CSV markers. After loading valid markers, the map fits their bounds once and live GPS updates continue without recentering the CSV overview. If the file is missing, empty, or has no valid records, the counter stays at zero and tracking continues.
- **Clear Map** removes only the CSV markers and their labels and resets the CSV counter. It does not change `locations.csv`, `localStorage`, saved Version 0.4 locations, or live GPS tracking. Refreshing the page reads the unchanged CSV again and restores its valid markers.

The root `locations.csv` currently contains saved location records. To display a different batch, replace that root file with a downloaded Version 0.4 CSV batch and reload the page. For GitHub Pages, publish the updated root file with the site. CSV loading requires the local server or a deployed site; the app cannot modify the file from the browser.

Version 0.5 passed laptop/browser and iPhone HTTPS testing through the deployed GitHub Pages site. Testing confirmed automatic CSV loading, permanently labeled markers, the CSV locations counter, automatic map fitting, Clear Map removing only CSV markers, restoration after refresh, and continued live GPS tracking.

## Version 0.6 functionality

- Tapping a CSV marker requests one walking route from the latest valid live GPS position to that marker. If GPS has not provided a valid position, the page shows “Current location is not available yet” and makes no route request.
- Routing uses the openrouteservice Directions API at `https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson`. It sends a JSON POST with `[longitude, latitude]` coordinates and an `Authorization` header. The profile is `foot-walking` only.
- A separate Leaflet route layer displays the returned GeoJSON. The map fits the route once, and the page shows the destination, walking distance, and approximate walking time returned by the API. CSV markers, the live GPS marker, and the accuracy circle remain separate.
- Only one route is shown at a time. Tapping another CSV marker replaces it; a repeated tap while the same request is pending is ignored. **Clear Route** removes the route and its information. **Clear Map** still removes CSV markers and also clears an active or pending route.
- Live GPS fields, marker, and accuracy circle keep updating while a route remains static. To calculate from a newer GPS position, tap a CSV marker again. Routing errors leave the rest of the map and saving/export features working.

The openrouteservice testing API key is stored locally in `js/config.js`. That file is listed in `.gitignore` and must not be committed or pushed to GitHub. The key is still visible to anyone who can access the locally served site because the browser loads this file; Git ignore does not protect a key served to a browser. Routing has been validated through a local HTTPS Cloudflare Tunnel and is not deployed publicly with the key. Public GitHub Pages deployment of routing is deferred until a safe API-key protection method is selected. The app currently has no backend, protected proxy, or secret manager. See the [openrouteservice Directions documentation](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types) for the POST GeoJSON response format.

Version 0.6 passed laptop/browser and iPhone/mobile testing through a local HTTPS Cloudflare Tunnel. Testing confirmed CSV markers, walking route calculation to the selected destination, route drawing, destination name, walking distance, approximate walking time, route replacement when another marker is selected, Clear Route, and continued live GPS updates while a route remains static. Version 0.6 is approved and validated as the stable baseline.

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

Versions 0.2 through 0.6 use `navigator.geolocation.watchPosition()` and keep one active watch ID internally. The browser and operating system determine when a new location update is produced; the application does not request positions at a fixed interval. Tracking continues while the Save Location dialog is open. Updates may slow or stop while the page is in the background.

## HTTPS requirement

Browser geolocation requires a secure context. `http://localhost:8000` can be used on the same computer for development. A LAN URL such as `http://192.168.x.x:8000` can display the page on a phone but is not sufficient for mobile geolocation. Open an HTTPS URL for iPhone testing. GitHub Pages provides HTTPS and allows testing outside the local network; Cloudflare Tunnel or another HTTPS endpoint can also be used for local testing.

## Local development

From the project directory, run:

```bash
npx http-server . -p 8000 -c-1
```

Open `http://localhost:8000` on the same computer and allow location access. The command serves the project on port 8000; `-c-1` disables caching during development. `npx` may fetch `http-server` on first use, but the project has no installed runtime dependencies.

For local HTTPS mobile routing tests, run `cloudflared tunnel --url http://localhost:8000` while the local server is running. Keep the tunnel URL limited to testing because the browser serves `js/config.js` to anyone with access to that URL.

## GitHub Pages deployment

Versions 0.2 through 0.5 were deployed and tested using GitHub Pages for HTTPS mobile testing. Version 0.5 passed iPhone HTTPS testing on the deployed site. GitHub Pages may still host the non-routing project files, but Version 0.6 routing has only been validated through a local HTTPS tunnel. Do not publish `js/config.js` or the routing API key to GitHub Pages. The earlier deployment workflow was:

```text
Local development → Git commit → Git push to main → GitHub Pages deployment → HTTPS mobile testing
```

For branch-based publishing of non-routing files, GitHub Pages can serve the repository root on `main`. With `js/config.js` excluded, routing is unavailable there. The repository includes `.nojekyll` for its static Pages site. See GitHub's [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) documentation.

## Project structure

```text
location-map-test/
├── index.html
├── locations.csv
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── config.js  (local, ignored by Git)
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

### Version 0.3 — approved and validated stable baseline

- Added Save Location and a naming dialog.
- Pressing Save Location captures a frozen latitude, longitude, accuracy, and timestamp; live tracking continues while the dialog is open.
- Stores named records in browser `localStorage` under `locationMap.savedLocations`. Each record contains `name`, `latitude`, `longitude`, `accuracy`, and `timestamp`.
- Added the Saved locations counter. It initializes from `localStorage` on page load and updates after every successful save; persistence after reload was validated.
- Desktop browser and iPhone HTTPS testing passed. The GitHub Pages deployment was validated.
- Version 0.3 is approved as the stable baseline for Version 0.4.

### Version 0.4 — approved and validated stable baseline

- Added Export CSV. It reads saved records from `locationMap.savedLocations` and exports `name`, `latitude`, `longitude`, `accuracy`, and `timestamp`.
- Generates the CSV entirely in the browser with proper escaping, without a backend or external CSV library. CSV contents were validated.
- Uses the device's local date and time in `saved-locations-YYYY-MM-DD-HHMMSS.csv`, giving batches exported at different seconds on the same day distinguishable filenames.
- After successful download initiation, writes `[]` to `locationMap.savedLocations`, resets the Saved locations counter to zero, and disables Export CSV until a new location is saved.
- Each export is a batch/archive cycle; saving another location starts a new cycle.
- Laptop/browser, iPhone HTTPS, and GitHub Pages deployment testing passed. Version 0.4 is approved as the stable baseline for Version 0.5.

### Version 0.5 — approved and validated stable baseline

- Added automatic loading of the root `locations.csv`, reusing the Version 0.4 CSV format.
- Creates one permanently labeled marker per valid CSV location and fits the map to all imported markers once.
- Added the CSV locations counter and Clear Map; clearing removes only imported CSV markers and labels.
- Refresh restores markers from the unchanged CSV file, while live GPS tracking continues.
- Laptop/browser, iPhone HTTPS, and GitHub Pages deployment testing passed. Version 0.5 is approved and validated as the stable baseline for Version 0.6.

### Version 0.6 — approved and validated stable baseline

- Retained all Version 0.5 functionality and added walking route calculation from the latest live GPS position to a tapped CSV marker using the openrouteservice Directions API at `api.heigit.org` with the `foot-walking` profile.
- Added a route polyline, destination name, walking distance, estimated walking time, and Clear Route. Only one route is active; selecting another marker replaces it.
- Live GPS continues updating while the route remains static. There is no automatic rerouting or turn-by-turn navigation.
- Laptop/browser, iPhone/mobile, and local HTTPS Cloudflare Tunnel testing passed. CSV markers, route calculation and drawing, destination selection, distance, walking time, route replacement, Clear Route, and continued live GPS updates were validated.
- The testing API key remains local in ignored `js/config.js`. Public deployment of the routing key is intentionally deferred. Version 0.6 is approved and validated as the stable baseline.

## Known limitations

- Accuracy depends on the device, available positioning sources, and environment.
- The browser controls update frequency; the application does not set a fixed interval.
- Continuous high-accuracy geolocation may use additional battery power.
- Mobile browsers and operating systems may limit background tracking.
- OpenStreetMap tiles and the Leaflet CDN require internet access; public tile availability is best-effort.
- No route history is stored. There is no backend, database, or cloud synchronization. Before export, saved locations persist only in the current browser's site storage and may be removed if that site data is cleared.
- There is no CSV upload from the device, saved-location list, or edit/delete functionality. The browser initiates downloads but cannot confirm that the user retained the downloaded file.
- Version 0.5 depends on `locations.csv` being available from the site. It reads only that root file and never writes changes back to it. There is no CSV upload selector, import from phone storage, support for multiple CSV files, filters, search, marker categories/colors, or editing/deleting individual CSV markers.
- Version 0.6 routing needs the local testing API key, network access, and an available openrouteservice walking route. API errors or quota limits can prevent a route from appearing. The key is exposed to users of the local test site, so routing is not publicly deployed with it; no protected API proxy exists yet.

## Out-of-scope features

Version 0.6 does not include a CSV upload selector or device-file import, multiple CSV files, a saved-location list, editing or deleting saved locations, marker categories, route history, automatic rerouting, turn-by-turn directions, route saving, distance traveled, speed, heading visualization, a backend, a database, an API proxy, GitHub repository writing, cloud storage, user accounts, location synchronization, address lookup, or route optimization. These are potential future-version features only.
