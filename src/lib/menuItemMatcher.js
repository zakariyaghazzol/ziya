import { restaurantNameSimilarity } from "./restaurantMatcher";

export function matchMenuItem(query, menuItems = []) {
  const ranked = menuItems.map((item) => ({
    item,
    score: Math.max(
      restaurantNameSimilarity(query, item.name),
      restaurantNameSimilarity(query, `${item.name} ${item.description || ""}`)
    )
  })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 0.3) return { item: null, score: best?.score || 0, confidence: "not-confident" };
  return {
    item: best.item,
    score: best.score,
    confidence: best.score >= 0.86 ? "high" : best.score >= 0.55 ? "possible" : "needs-confirmation"
  };
}

export function matchMenuItems(queries = [], menuItems = []) {
  return queries.map((query) => ({ query, ...matchMenuItem(query, menuItems) }));
}
