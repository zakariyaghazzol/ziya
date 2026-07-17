export const LOCATION_CONTEXT_TYPES = Object.freeze({
  gym: {
    id: "gym",
    label: "Gym",
    activityType: "gym_visit",
    prompt: "Confirm this visit to count it toward your weekly activity goal."
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    activityType: "restaurant_visit",
    prompt: "Want to compare a meal with your current goals?"
  },
  fast_food: {
    id: "fast_food",
    label: "Quick service",
    activityType: "fast_food_visit",
    prompt: "This can still fit your week. Want help comparing options?"
  },
  grocery: {
    id: "grocery",
    label: "Grocery store",
    activityType: "grocery_visit",
    prompt: "Want to scan a few products before checkout?"
  },
  cafe: {
    id: "cafe",
    label: "Cafe",
    activityType: "restaurant_visit",
    prompt: "Want to check how an item fits your goals?"
  },
  other: {
    id: "other",
    label: "Saved place",
    activityType: "place_visit",
    prompt: "Confirm this visit?"
  }
});

export const LOCATION_PERMISSION_STATES = Object.freeze({
  idle: "Not requested",
  requesting: "Requesting permission",
  granted: "Available for one-time checks",
  denied: "Permission denied",
  unavailable: "Location unavailable"
});

export function getLocationContextMeta(type) {
  return LOCATION_CONTEXT_TYPES[type] || LOCATION_CONTEXT_TYPES.other;
}

export function isSupportedLocationContext(type) {
  return Boolean(LOCATION_CONTEXT_TYPES[type]);
}
