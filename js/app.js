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

  closeSaveLocationDialog();
  document.getElementById("save-message").textContent = "Location saved";
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
document.getElementById("cancel-save").addEventListener("click", closeSaveLocationDialog);
document.getElementById("save-location-form").addEventListener("submit", saveLocationSnapshot);
saveDialog.addEventListener("cancel", resetSaveLocationDialog);

startLocationTracking();
