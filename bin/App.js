//let map;
const map = L.map('map').setView([51.505, -0.09], 13); // Coordinates for London with zoom level 13

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
}).addTo(map);

// Add a marker at the same location
const marker = L.marker([51.505, -0.09]).addTo(map);
marker.bindPopup('Hello, Leaflet!').openPopup();

const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
};

function success(position) {
    const { latitude, longitude, accuracy } = position.coords;

    console.log("Your current position is:");
    console.log(`Latitude: ${latitude}`);
    console.log(`Longitude: ${longitude}`);
    console.log(`Accuracy: ${accuracy} meters`);

    // Initialize the map at the user's location
    if (!map) {
        map = L.map('map').setView([latitude, longitude], 13); // Zoom level 13
    }

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add a marker at the user's location
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`<b>You are here!</b><br>Accuracy: ${accuracy} meters.`).openPopup();
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    alert("Could not retrieve your location. Please enable location services and try again.");
}

// Request the user's current location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error, options);
} else {
    console.error("Geolocation is not supported by this browser.");
    alert("Geolocation is not supported by your browser.");
}