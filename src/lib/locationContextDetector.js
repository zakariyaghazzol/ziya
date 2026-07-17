export function haversineDistanceMeters(left, right) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const radius = 6371000;
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(left.latitude)) * Math.cos(toRadians(right.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearbySavedPlace(position, savedPlaces = []) {
  const ranked = savedPlaces.map((place) => ({
    place,
    distanceMeters: haversineDistanceMeters(position, place)
  })).sort((a, b) => a.distanceMeters - b.distanceMeters);
  const nearest = ranked[0];
  if (!nearest || nearest.distanceMeters > nearest.place.radiusMeters) return null;
  return {
    placeId: nearest.place.id,
    name: nearest.place.name,
    type: nearest.place.type,
    distanceMeters: Math.round(nearest.distanceMeters),
    detectedAt: new Date().toISOString(),
    confirmed: false
  };
}

function geolocationError(error) {
  if (error?.code === 1) return { code: "denied", message: "Location permission was not granted." };
  if (error?.code === 2) return { code: "unavailable", message: "Your location is unavailable right now." };
  if (error?.code === 3) return { code: "timeout", message: "The location check took too long." };
  return { code: "unavailable", message: "Location could not be checked." };
}

export function requestCurrentPosition({ timeout = 9000, maximumAge = 60000 } = {}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject({ code: "unsupported", message: "This browser does not provide location checks." });
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        checkedAt: new Date(position.timestamp || Date.now()).toISOString()
      }),
      (error) => reject(geolocationError(error)),
      { enableHighAccuracy: false, timeout, maximumAge }
    );
  });
}

export async function detectLocationContext(savedPlaces = [], options = {}) {
  const position = await requestCurrentPosition(options);
  return { position, context: findNearbySavedPlace(position, savedPlaces) };
}
