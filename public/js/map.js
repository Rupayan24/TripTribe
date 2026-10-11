mapboxgl.accessToken = mapToken;

// Default coordinates (e.g. New Delhi: [lng, lat])
const defaultCoordinates = [77.209, 28.6139];

let coordinates = defaultCoordinates;

// Validate that coordinates exist, has 2 items, and neither item is NaN or null
if (
  listing &&
  listing.geometry &&
  Array.isArray(listing.geometry.coordinates) &&
  listing.geometry.coordinates.length === 2 &&
  !isNaN(Number(listing.geometry.coordinates[0])) &&
  !isNaN(Number(listing.geometry.coordinates[1])) &&
  listing.geometry.coordinates[0] !== null &&
  listing.geometry.coordinates[1] !== null
) {
  coordinates = [
    Number(listing.geometry.coordinates[0]),
    Number(listing.geometry.coordinates[1]),
  ];
}

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: coordinates,
  zoom: 9,
});

new mapboxgl.Marker({ color: "red" })
  .setLngLat(coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h4>${listing.title || "Listing"}</h4><p>Exact location will be provided after booking</p>`,
    ),
  )
  .addTo(map);
