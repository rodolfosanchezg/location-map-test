# Current state

## Versions

Version 0.1 is the approved, stable baseline. It provides a responsive Leaflet/OpenStreetMap page, an automatic one-time browser location request with a high-accuracy attempt and fallback, a marker, an accuracy circle, coordinates, browser accuracy, a quality label, and clear error messages. Mobile HTTPS testing was validated through a tunnel.

Version 0.2 is the approved and validated stable baseline. It replaces the one-time request with `watchPosition()` so the displayed location can update without reloading. Tracking starts automatically when the page loads, with no manual Start/Stop controls. Each update moves the existing marker and accuracy circle and refreshes the coordinates, accuracy, and quality label. Dragging the map pauses automatic centering while location updates continue; reloading resumes following. The map uses OpenStreetMap's documented tile URL and recalculates its size when the map container changes.

Version 0.3 is the current implementation on top of that baseline. After a valid position is received, Save Location can capture a frozen latitude, longitude, accuracy, and timestamp. A native dialog requests a name, and Save appends the named snapshot to the `locationMap.savedLocations` array in this browser's `localStorage`. A visible Saved locations counter reads that array on page load and updates after each successful save. Live tracking continues while the dialog is open. No saved-location list, export, or server storage is included.

## Testing and access

Run `npx http-server . -p 8000 -c-1` from the project directory for local development. `http://localhost:8000` supports desktop geolocation on the same computer. A phone can view the layout over the computer's HTTP LAN address, but phone geolocation needs an HTTPS URL. Version 0.2 has been deployed and tested through GitHub Pages, which provides an HTTPS address for iPhone testing outside the local network. A tunnel to local port 8000 is another option.

The browser reports the accuracy value; the application cannot make it more precise. Desktop estimates may be coarse. `watchPosition()` updates are controlled by the browser and device, not a fixed timer. Saved locations remain local to the browser and device and may be removed when site data is cleared.

Version 0.2 was checked with JavaScript syntax validation, simulated watch callbacks for automatic startup, fallback, errors, marker and circle reuse, and accuracy ranges. A narrow browser render confirmed the map still fits the screen. GitHub Pages HTTPS mobile testing is recorded as validated for this approved baseline.

Version 0.3 was checked with simulated GPS updates and browser storage for snapshot freezing, name validation, multiple saves, persistence after reload, malformed stored JSON, Cancel, and the existing tracking fallback. A phone-width browser render confirmed the dialog fits. Live Version 0.3 testing on an iPhone and deployment remain to be done.

See `README.md` for features, testing steps, accuracy thresholds, known limitations, and version history.
