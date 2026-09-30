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
let watchId = null;
let usingStandardAccuracy = false;
let receivedPosition = false;
let locationMarker = null;
let accuracyCircle = null;
let followLocation = true;

map.on("dragstart", () => {
  followLocation = false;
});

if (window.ResizeObserver) {
  const mapSizeObserver = new window.ResizeObserver(() => map.invalidateSize({ pan: false }));
  mapSizeObserver.observe(document.getElementById("map"));
}

function handlePositionUpdate(position) {
  const { latitude, longitude, accuracy } = position.coords;
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
  document.getElementById("latitude").textContent = latitude.toFixed(6);
  document.getElementById("longitude").textContent = longitude.toFixed(6);
  document.getElementById("accuracy").textContent = `±${Math.round(accuracy)} m`;
  document.getElementById("location-quality").textContent = getAccuracyQuality(accuracy);
  document.getElementById("tracking-status").textContent = "Tracking active";
  document.getElementById("status").textContent = "Your location was found.";
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

startLocationTracking();
