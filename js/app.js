function initializeMap() {
  const map = L.map("map").setView([51.505, -0.09], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  return map;
}

function getAccuracyQuality(accuracy) {
  if (accuracy <= 50) return "Excellent";
  if (accuracy <= 200) return "Good";
  if (accuracy <= 1000) return "Approximate";
  return "Low accuracy";
}

const map = initializeMap();
const csvMarkersLayer = L.featureGroup().addTo(map);
const savedLocationsKey = "locationMap.savedLocations";
const saveDialog = document.getElementById("save-location-dialog");
const locationNameInput = document.getElementById("location-name");
let watchId = null;
let usingStandardAccuracy = false;
let receivedPosition = false;
let locationMarker = null;
let accuracyCircle = null;
let followLocation = true;
let latestPosition = null;
let pendingSnapshot = null;
let activeRouteLayer = null;
let pendingRouteController = null;
let pendingRouteDestination = null;
let routeRequestId = 0;

map.on("dragstart", () => {
  followLocation = false;
});

if (window.ResizeObserver) {
  const mapSizeObserver = new window.ResizeObserver(() => map.invalidateSize({ pan: false }));
  mapSizeObserver.observe(document.getElementById("map"));
}

function handlePositionUpdate(position) {
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      !Number.isFinite(accuracy) || accuracy < 0) return;

  const coordinates = [latitude, longitude];

  if (locationMarker) {
    locationMarker.setLatLng(coordinates);
    accuracyCircle.setLatLng(coordinates);
    accuracyCircle.setRadius(accuracy);
    if (followLocation) map.panTo(coordinates, { animate: false });
  } else {
    locationMarker = L.marker(coordinates).addTo(map);
    accuracyCircle = L.circle(coordinates, { radius: accuracy }).addTo(map);
    if (followLocation) map.setView(coordinates, 16);
  }

  receivedPosition = true;
  latestPosition = { latitude, longitude, accuracy };
  document.getElementById("save-location").disabled = false;
  document.getElementById("latitude").textContent = latitude.toFixed(6);
  document.getElementById("longitude").textContent = longitude.toFixed(6);
  document.getElementById("accuracy").textContent = `±${Math.round(accuracy)} m`;
  document.getElementById("location-quality").textContent = getAccuracyQuality(accuracy);
  document.getElementById("tracking-status").textContent = "Tracking active";
  document.getElementById("status").textContent = "Your location was found.";
}

function captureLocationSnapshot() {
  if (!latestPosition) return null;
  return { ...latestPosition, timestamp: new Date().toISOString() };
}

function openSaveLocationDialog() {
  if (!latestPosition || saveDialog.open) return;

  pendingSnapshot = captureLocationSnapshot();
  document.getElementById("snapshot-latitude").value = pendingSnapshot.latitude.toFixed(6);
  document.getElementById("snapshot-longitude").value = pendingSnapshot.longitude.toFixed(6);
  document.getElementById("snapshot-accuracy").value = `±${Math.round(pendingSnapshot.accuracy)} m`;
  document.getElementById("save-message").textContent = "";
  saveDialog.showModal();
  locationNameInput.focus();
}

function resetSaveLocationDialog() {
  pendingSnapshot = null;
  locationNameInput.value = "";
  document.getElementById("save-error").textContent = "";
}

function closeSaveLocationDialog() {
  saveDialog.close();
  resetSaveLocationDialog();
}

function getSavedLocations() {
  try {
    const stored = window.localStorage.getItem(savedLocationsKey);
    if (!stored) return [];
    const locations = JSON.parse(stored);
    return Array.isArray(locations) ? locations : [];
  } catch {
    return [];
  }
}

function isSavedLocationRecord(location) {
  return location !== null && typeof location === "object" &&
    typeof location.name === "string" && location.name.trim() !== "" &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Number.isFinite(location.accuracy) && location.accuracy >= 0 &&
    typeof location.timestamp === "string" &&
    !Number.isNaN(Date.parse(location.timestamp)) &&
    new Date(location.timestamp).toISOString() === location.timestamp;
}

function updateExportButtonState(locations = getSavedLocations()) {
  document.getElementById("export-csv").disabled =
    locations.length === 0 || !locations.every(isSavedLocationRecord);
}

function updateSavedLocationsCount() {
  const locations = getSavedLocations();
  document.getElementById("saved-locations-count").textContent = String(locations.length);
  updateExportButtonState(locations);
}

function setSavedLocations(locations) {
  try {
    window.localStorage.setItem(savedLocationsKey, JSON.stringify(locations));
    return true;
  } catch {
    return false;
  }
}

function saveLocationSnapshot(event) {
  event.preventDefault();
  if (!pendingSnapshot) return;

  const name = locationNameInput.value.trim();
  if (!name || name.length > 80) {
    document.getElementById("save-error").textContent =
      "Enter a location name of up to 80 characters.";
    locationNameInput.focus();
    return;
  }

  const locations = getSavedLocations();
  locations.push({ name, ...pendingSnapshot });
  if (!setSavedLocations(locations)) {
    document.getElementById("save-error").textContent =
      "Could not save the location in this browser.";
    return;
  }

  updateSavedLocationsCount();
  closeSaveLocationDialog();
  document.getElementById("save-message").textContent = "Location saved";
}

function escapeCsvValue(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(locations) {
  const columns = ["name", "latitude", "longitude", "accuracy", "timestamp"];
  const rows = locations.map(location =>
    columns.map(column => escapeCsvValue(location[column])).join(",")
  );
  return [columns.join(","), ...rows].join("\r\n") + "\r\n";
}

function generateCsvFilename() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  const date = `${String(now.getFullYear()).padStart(4, "0")}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `saved-locations-${date}-${time}.csv`;
}

function downloadCsv(csvText, filename) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  let initiated = false;

  try {
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    initiated = true;
  } finally {
    link.remove();
    if (initiated) {
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      URL.revokeObjectURL(url);
    }
  }
}

function exportSavedLocationsToCsv() {
  const locations = getSavedLocations();
  if (locations.length === 0 || !locations.every(isSavedLocationRecord)) {
    updateExportButtonState(locations);
    return;
  }

  try {
    const csvText = buildCsv(locations);
    downloadCsv(csvText, generateCsvFilename());
  } catch {
    document.getElementById("save-message").textContent = "Could not export saved locations.";
    return;
  }

  if (!setSavedLocations([])) {
    document.getElementById("save-message").textContent =
      "CSV download started, but saved locations could not be cleared.";
    return;
  }

  updateSavedLocationsCount();
  document.getElementById("save-message").textContent =
    `CSV exported: ${locations.length} locations. Saved locations cleared.`;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const text = csvText.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (inQuotes) {
      if (character === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field === "") {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (!inQuotes && (row.length > 0 || field !== "")) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function validateCsvLocation(row) {
  if (row.length !== 5 || !row[0].trim() || !row[1].trim() || !row[2].trim()) return null;
  const decimal = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  if (!decimal.test(row[1].trim()) || !decimal.test(row[2].trim())) return null;
  const latitude = Number(row[1]);
  const longitude = Number(row[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { name: row[0], latitude, longitude };
}

function addCsvMarker(location) {
  const label = document.createElement("span");
  label.textContent = location.name;
  L.marker([location.latitude, location.longitude])
    .bindTooltip(label, { permanent: true })
    .on("click", () => requestWalkingRoute(location))
    .addTo(csvMarkersLayer);
}

function updateCsvLocationsCount() {
  const count = csvMarkersLayer.getLayers().length;
  document.getElementById("csv-locations-count").textContent = String(count);
  document.getElementById("clear-map").disabled = count === 0;
}

function fitMapToCsvLocations() {
  if (csvMarkersLayer.getLayers().length === 0) return;
  followLocation = false;
  map.fitBounds(csvMarkersLayer.getBounds(), { padding: [30, 30], maxZoom: 16 });
}

async function loadCsvLocations() {
  try {
    const response = await fetch("locations.csv");
    if (!response.ok) return;
    const rows = parseCsv(await response.text());
    if (rows.length === 0 || rows[0].join(",") !== "name,latitude,longitude,accuracy,timestamp") return;

    for (const row of rows.slice(1)) {
      if (row.every(value => value.trim() === "")) continue;
      const location = validateCsvLocation(row);
      if (location) addCsvMarker(location);
    }
    updateCsvLocationsCount();
    fitMapToCsvLocations();
  } catch (error) {
    console.warn("Could not load locations.csv:", error);
  }
}

function clearCsvMarkers() {
  clearRoute();
  csvMarkersLayer.clearLayers();
  updateCsvLocationsCount();
}

function buildRouteRequest(origin, destination) {
  return { coordinates: [
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude]
  ] };
}

function formatRouteDistance(distanceMeters) {
  return distanceMeters < 1000
    ? `${Math.round(distanceMeters)} m`
    : `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatRouteDuration(durationSeconds) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const hours = Math.floor(minutes / 60);
  return hours === 0 ? `${minutes} min` : `${hours} h ${minutes % 60} min`;
}

function displayRouteInfo(name, distance, duration) {
  document.getElementById("route-status").textContent = "";
  document.getElementById("route-destination").textContent = name;
  document.getElementById("route-distance").textContent = formatRouteDistance(distance);
  document.getElementById("route-duration").textContent = formatRouteDuration(duration);
  document.getElementById("route-details").hidden = false;
  document.getElementById("clear-route").disabled = false;
}

function clearRoute() {
  routeRequestId++;
  if (pendingRouteController) pendingRouteController.abort();
  pendingRouteController = null;
  pendingRouteDestination = null;
  if (activeRouteLayer) map.removeLayer(activeRouteLayer);
  activeRouteLayer = null;
  document.getElementById("route-status").textContent =
    "Tap a location marker to calculate a walking route.";
  document.getElementById("route-destination").textContent = "";
  document.getElementById("route-distance").textContent = "";
  document.getElementById("route-duration").textContent = "";
  document.getElementById("route-details").hidden = true;
  document.getElementById("clear-route").disabled = true;
}

function handleRoutingError() {
  document.getElementById("route-status").textContent =
    "Walking route could not be calculated.";
  document.getElementById("clear-route").disabled = true;
}

function displayRoute(routeGeoJson, name) {
  const feature = routeGeoJson?.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  const summary = feature?.properties?.summary;
  if (routeGeoJson?.type !== "FeatureCollection" ||
      !Array.isArray(routeGeoJson.features) || routeGeoJson.features.length === 0 ||
      feature?.type !== "Feature" ||
      feature?.geometry?.type !== "LineString" ||
      !Array.isArray(coordinates) || coordinates.length < 2 ||
      !coordinates.every(point => Array.isArray(point) && point.length >= 2 &&
        Number.isFinite(point[0]) && point[0] >= -180 && point[0] <= 180 &&
        Number.isFinite(point[1]) && point[1] >= -90 && point[1] <= 90) ||
      !Number.isFinite(summary?.distance) || summary.distance < 0 ||
      !Number.isFinite(summary?.duration) || summary.duration < 0) {
    throw new Error("Invalid walking route response");
  }

  const routeLayer = L.geoJSON(feature).addTo(map);
  activeRouteLayer = routeLayer;
  followLocation = false;
  map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });
  displayRouteInfo(name, summary.distance, summary.duration);
}

async function requestWalkingRoute(destination) {
  if (pendingRouteController && pendingRouteDestination === destination) return;
  clearRoute();

  if (!latestPosition) {
    document.getElementById("route-status").textContent =
      "Current location is not available yet.";
    return;
  }

  if (typeof ORS_API_KEY !== "string" || !ORS_API_KEY.trim() ||
      ORS_API_KEY.trim() === "PASTE_API_KEY_HERE") {
    document.getElementById("route-status").textContent =
      "Add an openrouteservice API key in js/config.js to calculate routes.";
    return;
  }

  const requestId = routeRequestId;
  const controller = new AbortController();
  pendingRouteController = controller;
  pendingRouteDestination = destination;
  document.getElementById("route-status").textContent = "Calculating walking route...";
  document.getElementById("clear-route").disabled = false;

  try {
    const response = await fetch(
      "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: ORS_API_KEY.trim()
        },
        body: JSON.stringify(buildRouteRequest(latestPosition, destination)),
        signal: controller.signal
      }
    );
    if (!response.ok) throw new Error(`Routing service returned ${response.status}`);
    const routeGeoJson = await response.json();
    if (requestId !== routeRequestId) return;
    displayRoute(routeGeoJson, destination.name);
  } catch (error) {
    if (requestId === routeRequestId && error.name !== "AbortError") {
      console.warn("Walking route error:", error);
      handleRoutingError();
    }
  } finally {
    if (requestId === routeRequestId) {
      pendingRouteController = null;
      pendingRouteDestination = null;
    }
  }
}

function handleGeolocationError(error) {
  if (!receivedPosition && !usingStandardAccuracy && (error.code === 2 || error.code === 3)) {
    navigator.geolocation.clearWatch(watchId);
    usingStandardAccuracy = true;
    document.getElementById("tracking-status").textContent = "Waiting for location...";
    document.getElementById("status").textContent = "Trying a standard location estimate…";
    watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleGeolocationError,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
    return;
  }

  const messages = {
    1: "Location access was denied. Check browser and device location permissions.",
    2: "Your browser could not determine your location. Check your device's location services and network, then try again.",
    3: "The location request timed out."
  };
  const trackingMessages = {
    1: "Location permission denied",
    2: "Location unavailable",
    3: "Location request timed out"
  };

  console.warn("Geolocation error:", error.code, error.message);
  if (error.code === 1 && watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  document.getElementById("tracking-status").textContent =
    trackingMessages[error.code] || "Geolocation unavailable";
  document.getElementById("status").textContent =
    messages[error.code] || "Could not get your location.";
}

function startLocationTracking() {
  if (watchId !== null) return;

  if (!window.isSecureContext) {
    document.getElementById("tracking-status").textContent = "Secure connection required";
    document.getElementById("status").textContent =
      "Geolocation requires HTTPS or localhost on this device.";
    return;
  }

  if (!navigator.geolocation) {
    document.getElementById("tracking-status").textContent = "Geolocation unavailable";
    document.getElementById("status").textContent =
      "Geolocation is not supported by this browser.";
    return;
  }

  usingStandardAccuracy = false;
  receivedPosition = false;
  followLocation = true;
  document.getElementById("tracking-status").textContent = "Waiting for location...";
  document.getElementById("status").textContent = "Requesting your location…";
  watchId = navigator.geolocation.watchPosition(
    handlePositionUpdate,
    handleGeolocationError,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

document.getElementById("save-location").addEventListener("click", openSaveLocationDialog);
document.getElementById("export-csv").addEventListener("click", exportSavedLocationsToCsv);
document.getElementById("clear-map").addEventListener("click", clearCsvMarkers);
document.getElementById("clear-route").addEventListener("click", clearRoute);
document.getElementById("cancel-save").addEventListener("click", closeSaveLocationDialog);
document.getElementById("save-location-form").addEventListener("submit", saveLocationSnapshot);
saveDialog.addEventListener("cancel", resetSaveLocationDialog);

updateSavedLocationsCount();
updateCsvLocationsCount();
startLocationTracking();
loadCsvLocations();
