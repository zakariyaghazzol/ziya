import {
  getPreferredProductLanguages,
  getProductCountryTags,
  getProductMarketLabel,
  productMatchesRegion,
  sanitizeProductRegion
} from "../data/productRegionConfig";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function firstBrand(product) {
  return String(product?.brands || product?.brand || "").split(",")[0].trim();
}

function productName(product, languages) {
  for (const language of languages) {
    const value = product?.[`product_name_${language}`];
    if (String(value || "").trim()) return value;
  }
  return product?.product_name || product?.product_name_en || product?.name || "";
}

function hasIngredients(product) {
  return Boolean(String(product?.ingredients_text || "").trim())
    || ["en", "fr", "es", "ar"].some((language) => Boolean(String(product?.[`ingredients_text_${language}`] || "").trim()))
    || (Array.isArray(product?.ingredients) && product.ingredients.length > 0);
}

function hasNutrition(product) {
  const nutriments = product?.nutriments;
  return Boolean(nutriments && typeof nutriments === "object" && Object.keys(nutriments).length);
}

function hasImage(product) {
  return Boolean(product?.image_front_url || product?.image_url || product?.image_front_small_url || product?.image_front_thumb_url);
}

function selectedLanguageAvailable(product, languages) {
  return languages.some((language) => Boolean(product?.[`product_name_${language}`] || product?.[`ingredients_text_${language}`]));
}

function scoreProduct(product, { query, regionId, languages }) {
  const name = normalizeText(productName(product, languages));
  const brand = normalizeText(firstBrand(product));
  const queryKey = normalizeText(query);
  const selectedMatch = regionId !== "global" && productMatchesRegion(product, regionId);
  return (
    (selectedMatch ? 1000 : 0)
    + (name === queryKey ? 220 : name.startsWith(queryKey) ? 120 : name.includes(queryKey) ? 60 : 0)
    + (brand === queryKey ? 100 : brand && (brand.includes(queryKey) || queryKey.includes(brand)) ? 45 : 0)
    + (hasIngredients(product) ? 70 : 0)
    + (hasNutrition(product) ? 55 : 0)
    + (hasImage(product) ? 40 : 0)
    + (product?.code ? 25 : 0)
    + Math.min(60, Number(product?.completeness || 0) * 60)
    + Math.min(25, Math.log10(Math.max(1, Number(product?.unique_scans_n || 0))) * 6)
    + (selectedLanguageAvailable(product, languages) ? 20 : 0)
    + Math.min(15, Math.max(0, Number(product?.last_modified_t || 0) / 1e9))
  );
}

function variantKey(product, languages) {
  const name = normalizeText(productName(product, languages));
  const brand = normalizeText(firstBrand(product));
  const quantity = normalizeText(product?.quantity || "unknown-size");
  const market = getProductCountryTags(product).sort().join("+") || "unknown-market";
  return `${brand}|${name}|${quantity}|${market}`;
}

function dedupeRanked(items, context, limit) {
  const representative = new Map();
  items.forEach((product) => {
    const score = scoreProduct(product, context);
    const key = variantKey(product, context.languages);
    const existing = representative.get(key);
    if (!existing || score > existing.score) representative.set(key, { product, score });
  });
  return [...representative.values()]
    .sort((a, b) => b.score - a.score || normalizeText(productName(a.product, context.languages)).localeCompare(normalizeText(productName(b.product, context.languages))))
    .slice(0, limit)
    .map(({ product }) => product);
}

export function rankAndDedupeSearchResults(rawProducts, {
  query = "",
  regionId = "global",
  preferredLanguage = "auto",
  strictRegion = true,
  limit = 8
} = {}) {
  const resolvedRegion = sanitizeProductRegion(regionId);
  const languages = getPreferredProductLanguages(resolvedRegion, preferredLanguage);
  const products = (Array.isArray(rawProducts) ? rawProducts : []).filter((product) => product?.code);
  const context = { query, regionId: resolvedRegion, languages };

  if (resolvedRegion === "global" || !strictRegion) {
    return {
      products: dedupeRanked(products, context, limit),
      fallbackProducts: [],
      hasStrongRegionMatch: resolvedRegion === "global",
      fallbackAvailable: false
    };
  }

  const selected = products.filter((product) => productMatchesRegion(product, resolvedRegion));
  const unknownMarket = products.filter((product) => getProductCountryTags(product).length === 0);
  const otherMarkets = products.filter((product) => !productMatchesRegion(product, resolvedRegion) && getProductCountryTags(product).length > 0);
  return {
    products: dedupeRanked([...selected, ...unknownMarket], context, limit),
    fallbackProducts: dedupeRanked(otherMarkets, { ...context, regionId: "global" }, limit),
    hasStrongRegionMatch: selected.length > 0,
    fallbackAvailable: selected.length === 0 || otherMarkets.length > 0
  };
}

export function getSearchResultMetadata(product) {
  return {
    market: product?.marketLabel || getProductMarketLabel({ ...product, countries_tags: product?.countriesTags }),
    quantity: String(product?.quantity || "").trim()
  };
}

export { normalizeText as normalizeSearchText };
