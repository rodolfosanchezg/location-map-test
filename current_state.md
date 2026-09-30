# Current state

## Versions

Version 0.1 is the approved, stable baseline. It provides a responsive Leaflet/OpenStreetMap page, an automatic one-time browser location request with a high-accuracy attempt and fallback, a marker, an accuracy circle, coordinates, browser accuracy, a quality label, and clear error messages. Mobile HTTPS testing was validated through a tunnel.

Version 0.2 is the current implementation. It replaces the one-time request with `watchPosition()` so the displayed location can update without reloading. Tracking starts automatically when the page loads, with no manual Start/Stop controls. Each update moves the existing marker and accuracy circle and refreshes the coordinates, accuracy, and quality label. Dragging the map pauses automatic centering while location updates continue; reloading resumes following. The map uses OpenStreetMap's documented tile URL and recalculates its size when the map container changes.

## Testing and access

Run `npx http-server . -p 8000 -c-1` from the project directory for local development. `http://localhost:8000` supports desktop geolocation on the same computer. A phone can view the layout over the computer's HTTP LAN address, but phone geolocation needs an HTTPS URL, such as one provided by a tunnel to local port 8000.

The browser reports the accuracy value; the application cannot make it more precise. Desktop estimates may be coarse. `watchPosition()` updates are controlled by the browser and device, not a fixed timer.

Version 0.2 was checked with JavaScript syntax validation, simulated watch callbacks for automatic startup, fallback, errors, marker and circle reuse, and accuracy ranges. A narrow browser render confirmed the map still fits the screen. Live Version 0.2 tracking on an iPhone remains a manual test.

See `README.md` for features, testing steps, accuracy thresholds, known limitations, and version history.
