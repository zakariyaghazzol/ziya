export const PRODUCT_REGIONS = Object.freeze([
  Object.freeze({ id: "global", label: "Auto / Global", offCountryTags: [], searchTag: null, countryCode: null, preferredLanguages: ["en", "fr", "es", "ar"], displayUnits: null, fallbackRegions: [] }),
  Object.freeze({ id: "us", label: "United States", offCountryTags: ["en:united-states", "united-states", "united states"], searchTag: "united-states", countryCode: "us", preferredLanguages: ["en"], displayUnits: "us", fallbackRegions: ["global"] }),
  Object.freeze({ id: "ca", label: "Canada", offCountryTags: ["en:canada", "canada"], searchTag: "canada", countryCode: "ca", preferredLanguages: ["en", "fr"], displayUnits: "metric", fallbackRegions: ["global"] }),
  Object.freeze({ id: "fr", label: "France", offCountryTags: ["en:france", "france"], searchTag: "france", countryCode: "fr", preferredLanguages: ["fr", "en"], displayUnits: "metric", fallbackRegions: ["global"] }),
  Object.freeze({ id: "ma", label: "Morocco", offCountryTags: ["en:morocco", "morocco", "maroc"], searchTag: "morocco", countryCode: "ma", preferredLanguages: ["fr", "ar", "en"], displayUnits: "metric", fallbackRegions: ["fr", "global"] }),
  Object.freeze({ id: "gb", label: "United Kingdom", offCountryTags: ["en:united-kingdom", "united-kingdom", "united kingdom", "uk"], searchTag: "united-kingdom", countryCode: "gb", preferredLanguages: ["en"], displayUnits: "metric", fallbackRegions: ["global"] }),
  Object.freeze({ id: "es", label: "Spain", offCountryTags: ["en:spain", "spain", "españa", "espana"], searchTag: "spain", countryCode: "es", preferredLanguages: ["es", "en"], displayUnits: "metric", fallbackRegions: ["global"] })
]);

const REGION_INDEX = new Map(PRODUCT_REGIONS.map((region) => [region.id, region]));

export function sanitizeProductRegion(value) {
  return REGION_INDEX.has(value) ? value : "global";
}

export function getProductRegionConfig(value) {
  return REGION_INDEX.get(sanitizeProductRegion(value));
}

export function normalizeCountryTag(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[a-z]{2}:/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function getProductCountryTags(product) {
  const values = [
    ...(Array.isArray(product?.countries_tags) ? product.countries_tags : []),
    ...(Array.isArray(product?.countries_tags_en) ? product.countries_tags_en : []),
    ...String(product?.countries || "").split(/[,;]/)
  ];
  return [...new Set(values.map(normalizeCountryTag).filter(Boolean))];
}

export function productMatchesRegion(product, regionValue) {
  const region = getProductRegionConfig(regionValue);
  if (region.id === "global") return true;
  const expected = new Set(region.offCountryTags.map(normalizeCountryTag));
  return getProductCountryTags(product).some((tag) => expected.has(tag));
}

export function getProductMarketLabel(product) {
  const tags = getProductCountryTags(product);
  for (const region of PRODUCT_REGIONS) {
    if (region.id === "global") continue;
    const expected = new Set(region.offCountryTags.map(normalizeCountryTag));
    if (tags.some((tag) => expected.has(tag))) return region.label;
  }
  const raw = String(product?.countries || "").split(/[,;]/).map((item) => item.trim()).find(Boolean);
  return raw || "";
}

export function getPreferredProductLanguages(regionValue, languageValue = "auto") {
  const region = getProductRegionConfig(regionValue);
  const explicit = languageValue && languageValue !== "auto" ? languageValue : null;
  return [...new Set([...(explicit ? [explicit] : []), ...region.preferredLanguages, "en"])];
}
