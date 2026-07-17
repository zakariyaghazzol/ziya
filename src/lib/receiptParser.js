import { matchRestaurant } from "./restaurantMatcher";
import { matchMenuItem } from "./menuItemMatcher";

const NON_ITEM_PATTERNS = [
  /^(subtotal|total|tax|tip|change|cash|credit|debit|visa|mastercard|amex|balance|amount due|payment|order|receipt|thank you)\b/i,
  /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/,
  /^\d{1,2}:\d{2}(?:\s?[ap]m)?$/i,
  /^[*-=_\s]+$/
];

function cleanLine(value) {
  return String(value || "").replace(/[|]+/g, " ").replace(/\s+/g, " ").trim();
}

function isLikelyItem(line) {
  if (line.length < 2 || NON_ITEM_PATTERNS.some((pattern) => pattern.test(line))) return false;
  const withoutPrice = line.replace(/(?:\$|USD\s*)?\d+[.,]\d{2}\s*$/i, "").trim();
  return /[a-zA-Z\u00C0-\u024F]/.test(withoutPrice);
}

function parsePrice(line) {
  const match = line.match(/(?:\$|USD\s*)?(\d+[.,]\d{2})\s*$/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function parseQuantity(line) {
  const match = line.match(/^\s*(\d+(?:\.\d+)?)\s*[xX]\s+/);
  return match ? Math.max(0.1, Number(match[1])) : 1;
}

function itemName(line) {
  return cleanLine(line)
    .replace(/^\s*\d+(?:\.\d+)?\s*[xX]\s+/, "")
    .replace(/(?:\$|USD\s*)?\d+[.,]\d{2}\s*$/i, "")
    .replace(/\.{2,}$/g, "")
    .trim();
}

export function parseReceiptText(input, { restaurants = [], now = new Date() } = {}) {
  const originalText = String(input || "").trim();
  const lines = originalText.split(/\r?\n/).map(cleanLine).filter(Boolean);
  if (!lines.length) {
    return {
      restaurant: null,
      restaurantName: "",
      items: [],
      confidence: "not-confident",
      status: "not-confident",
      originalText,
      parsedAt: new Date(now).toISOString()
    };
  }

  const restaurantCandidates = lines.slice(0, Math.min(4, lines.length));
  const restaurantMatches = restaurantCandidates.map((line) => ({ line, ...matchRestaurant(line, restaurants) })).sort((a, b) => b.score - a.score);
  const bestRestaurant = restaurantMatches[0]?.restaurant ? restaurantMatches[0] : null;
  const restaurant = bestRestaurant?.restaurant || null;
  const restaurantName = restaurant?.name || restaurantCandidates[0] || "";
  const menuItems = restaurant?.menuItems || [];
  const itemLines = lines.filter((line, index) => {
    if (!isLikelyItem(line)) return false;
    if (bestRestaurant && index < 4 && line === bestRestaurant.line) return false;
    if (!restaurant && index === 0) return false;
    return true;
  });

  const items = itemLines.map((line, index) => {
    const name = itemName(line);
    const menuMatch = matchMenuItem(name, menuItems);
    return {
      id: `receipt-item:${Date.now()}:${index}`,
      rawText: line,
      name: menuMatch.item?.name || name,
      quantity: parseQuantity(line),
      price: parsePrice(line),
      menuItemId: menuMatch.item?.id || "",
      confidence: menuMatch.item ? menuMatch.confidence : "needs-confirmation",
      confirmed: false,
      nutrition: menuMatch.item?.nutrition || {},
      servingSize: menuMatch.item?.servingSize || "1 item",
      ingredients: menuMatch.item?.ingredients || [],
      sourceNote: menuMatch.item?.sourceNote || ""
    };
  }).filter((item) => item.name);

  const highMatches = items.filter((item) => item.confidence === "high").length;
  const confidence = restaurant && items.length && highMatches === items.length
    ? "high"
    : items.length
      ? "possible"
      : "not-confident";
  return {
    restaurant,
    restaurantName,
    items,
    confidence,
    status: items.length ? "needs-confirmation" : "not-confident",
    originalText,
    parsedAt: new Date(now).toISOString()
  };
}

export function receiptConfidenceCopy(confidence) {
  if (confidence === "high") return "Matched with high confidence. Review before saving.";
  if (confidence === "possible") return "Possible match. Confirm the items before saving.";
  if (confidence === "needs-confirmation") return "Needs confirmation.";
  return "Could not identify these items confidently.";
}
