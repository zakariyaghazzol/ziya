import { getProductRegionConfig, sanitizeProductRegion } from "../data/productRegionConfig";

export const OPEN_FOOD_FACTS_SEARCH_FIELDS = Object.freeze([
  "code", "status", "product_name", "product_name_en", "product_name_fr", "product_name_es", "product_name_ar",
  "generic_name", "brands", "quantity", "categories", "categories_tags", "countries", "countries_tags", "countries_tags_en",
  "lang", "languages_tags", "image_url", "image_front_url", "image_front_small_url", "image_front_thumb_url", "selected_images",
  "ingredients_text", "ingredients_text_en", "ingredients_text_fr", "ingredients_text_es", "ingredients_text_ar", "ingredients",
  "ingredients_tags", "allergens", "allergens_tags", "traces", "traces_tags", "additives_n", "additives_tags",
  "additives_original_tags", "nutriments", "serving_size", "nutriscore_grade", "nova_group", "completeness",
  "unique_scans_n", "last_modified_t"
]);

const SEARCH_CACHE_VERSION = 2;
const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const memoryCache = new Map();

function normalizeQuery(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function createRegionSearchCacheKey({ query, regionId = "global", preferredLanguage = "auto", globalFallback = false, limit = 8 }) {
  return [
    `v${SEARCH_CACHE_VERSION}`,
    normalizeQuery(query),
    sanitizeProductRegion(globalFallback ? "global" : regionId),
    preferredLanguage || "auto",
    globalFallback ? "fallback" : "strict",
    String(limit)
  ].join(":");
}

export function buildOpenFoodFactsSearchParams(query, {
  regionId = "global",
  preferredLanguage = "auto",
  globalFallback = false,
  limit = 8
} = {}) {
  const effectiveRegion = getProductRegionConfig(globalFallback ? "global" : regionId);
  const params = new URLSearchParams({
    search_terms: String(query || "").trim(),
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(Math.max(limit, Math.min(30, limit * 3))),
    fields: OPEN_FOOD_FACTS_SEARCH_FIELDS.join(",")
  });
  if (effectiveRegion.id !== "global") {
    params.set("tagtype_0", "countries");
    params.set("tag_contains_0", "contains");
    params.set("tag_0", effectiveRegion.searchTag);
  }
  const language = preferredLanguage !== "auto" ? preferredLanguage : effectiveRegion.preferredLanguages[0];
  if (language) params.set("lc", language);
  return params;
}

function readStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(`ziya-region-search:${key}`) || "null");
  } catch {
    return null;
  }
}

function writeStorage(key, entry) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`ziya-region-search:${key}`, JSON.stringify(entry));
  } catch {
    // Search remains usable when browser storage is unavailable.
  }
}

export function getCachedRegionSearch(key, now = Date.now()) {
  const entry = memoryCache.get(key) || readStorage(key);
  if (!entry || !Array.isArray(entry.products) || now - Number(entry.savedAt || 0) > SEARCH_CACHE_TTL_MS) return null;
  memoryCache.set(key, entry);
  return entry.products;
}

export function setCachedRegionSearch(key, products, now = Date.now()) {
  const entry = { savedAt: now, products: Array.isArray(products) ? products : [] };
  memoryCache.set(key, entry);
  writeStorage(key, entry);
  return entry.products;
}

export function clearRegionSearchMemoryCache() {
  memoryCache.clear();
}
