function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 1));
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  a.forEach((token) => {
    if (b.has(token)) overlap += 1;
  });
  return overlap / Math.max(a.size, b.size);
}

export function matchRestaurant(query, restaurants = []) {
  const normalized = normalize(query);
  if (!normalized) return { restaurant: null, confidence: "not-confident", score: 0 };
  const ranked = restaurants.map((restaurant) => {
    const restaurantName = normalize(restaurant.name);
    const exact = restaurantName === normalized;
    const contained = restaurantName.includes(normalized) || normalized.includes(restaurantName);
    const score = exact ? 1 : contained ? 0.9 : similarity(query, restaurant.name);
    return { restaurant, score };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 0.35) return { restaurant: null, confidence: "not-confident", score: best?.score || 0 };
  return {
    restaurant: best.restaurant,
    score: best.score,
    confidence: best.score >= 0.9 ? "high" : best.score >= 0.55 ? "possible" : "needs-confirmation"
  };
}

export function searchRestaurants(query, restaurants = []) {
  const normalized = normalize(query);
  if (!normalized) return restaurants.slice(0, 12);
  return restaurants
    .map((restaurant) => ({ restaurant, score: similarity(query, restaurant.name) + (normalize(restaurant.name).includes(normalized) ? 1 : 0) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.restaurant)
    .slice(0, 12);
}

export { normalize as normalizeRestaurantName, similarity as restaurantNameSimilarity };
