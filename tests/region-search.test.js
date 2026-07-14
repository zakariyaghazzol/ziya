import assert from "node:assert/strict";
import { getProductMarketLabel } from "../src/data/productRegionConfig.js";
import {
  OPEN_FOOD_FACTS_SEARCH_FIELDS,
  buildOpenFoodFactsSearchParams,
  createRegionSearchCacheKey
} from "../src/lib/productRegionSearch.js";
import { rankAndDedupeSearchResults } from "../src/lib/searchResultDedupe.js";
import { lookupProductByBarcode, normalizeOpenFoodFactsProduct, upgradeLegacyIngredientRecord } from "../src/main.jsx";

const nutrition = { "energy-kcal_100g": 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 };
const mockProducts = [
  {
    code: "fr-400",
    product_name: "Nutella",
    product_name_fr: "Nutella",
    brands: "Ferrero",
    quantity: "400 g",
    countries_tags: ["en:france"],
    ingredients_text_fr: "sucre, huile de palme, noisettes",
    nutriments: nutrition,
    image_front_url: "fr.jpg",
    completeness: 0.92,
    last_modified_t: 1700000000
  },
  {
    code: "us-13",
    product_name: "Nutella",
    product_name_en: "Nutella",
    brands: "Ferrero",
    quantity: "13 oz",
    countries_tags: ["en:united-states"],
    ingredients_text_en: "sugar, palm oil, hazelnuts",
    nutriments: nutrition,
    image_front_url: "us.jpg",
    completeness: 0.9
  },
  {
    code: "ca-725",
    product_name: "Nutella",
    brands: "Ferrero",
    quantity: "725 g",
    countries_tags: ["en:canada"],
    image_front_url: "ca.jpg",
    completeness: 0.45
  },
  {
    code: "fr-plant",
    product_name: "Nutella Plant-Based",
    product_name_fr: "Nutella Plant-Based",
    brands: "Ferrero",
    quantity: "350 g",
    countries_tags: ["en:france"],
    ingredients_text_fr: "pois chiches, sucre, cacao",
    nutriments: nutrition,
    image_front_url: "plant.jpg",
    completeness: 0.88
  },
  {
    code: "unknown-image",
    product_name: "Nutella",
    brands: "Ferrero",
    image_front_url: "unknown.jpg",
    completeness: 0.3
  },
  {
    code: "fr-400-duplicate",
    product_name: "Nutella",
    brands: "Ferrero",
    quantity: "400 g",
    countries_tags: ["en:france"],
    image_front_url: "fr-old.jpg",
    completeness: 0.2,
    last_modified_t: 1500000000
  },
  {
    code: "fr-750",
    product_name: "Nutella",
    brands: "Ferrero",
    quantity: "750 g",
    countries_tags: ["en:france"],
    ingredients_text_fr: "sucre, noisettes",
    nutriments: nutrition,
    completeness: 0.85
  }
];

function testRequestFilters() {
  const cases = [
    ["us", "united-states"],
    ["fr", "france"],
    ["ma", "morocco"]
  ];
  cases.forEach(([regionId, expectedTag]) => {
    const params = buildOpenFoodFactsSearchParams("Nutella", { regionId, limit: 8 });
    assert.equal(params.get("tagtype_0"), "countries");
    assert.equal(params.get("tag_contains_0"), "contains");
    assert.equal(params.get("tag_0"), expectedTag);
  });
  const globalParams = buildOpenFoodFactsSearchParams("Nutella", { regionId: "global" });
  assert.equal(globalParams.has("tagtype_0"), false);
  ["product_name_fr", "ingredients_text_ar", "countries_tags", "quantity", "completeness", "last_modified_t"].forEach((field) => {
    assert(OPEN_FOOD_FACTS_SEARCH_FIELDS.includes(field), `${field} should be requested`);
    assert(globalParams.get("fields").includes(field), `${field} should be in the request`);
  });
}

function testRegionalRanking() {
  const us = rankAndDedupeSearchResults(mockProducts, { query: "Nutella", regionId: "us", preferredLanguage: "en", limit: 8 });
  assert.equal(us.products[0].code, "us-13");
  assert(!us.products.some((item) => item.code === "fr-400"));
  assert(us.fallbackProducts.some((item) => item.code === "fr-400"));
  assert.equal(us.hasStrongRegionMatch, true);

  const france = rankAndDedupeSearchResults(mockProducts, { query: "Nutella", regionId: "fr", preferredLanguage: "fr", limit: 8 });
  assert.equal(france.products[0].code, "fr-400");
  assert(france.products.some((item) => item.code === "fr-plant"), "plant-based variant should remain separate");
  assert(france.products.some((item) => item.code === "fr-750"), "different quantity should remain separate");
  assert(!france.products.some((item) => item.code === "fr-400-duplicate"), "lower-quality duplicate should be grouped");
  assert(!france.products.some((item) => item.code === "us-13"));

  const global = rankAndDedupeSearchResults(mockProducts, { query: "Nutella", regionId: "global", preferredLanguage: "auto", limit: 12 });
  assert(global.products.some((item) => item.code === "us-13"));
  assert(global.products.some((item) => item.code === "fr-400"));
  assert(global.products.some((item) => item.code === "fr-plant"));
  assert(!global.products.some((item) => item.code === "fr-400-duplicate"));

  const spain = rankAndDedupeSearchResults(mockProducts, { query: "Nutella", regionId: "es", limit: 8 });
  assert.equal(spain.hasStrongRegionMatch, false);
  assert.equal(spain.fallbackAvailable, true);
  assert(spain.products.some((item) => item.code === "unknown-image"), "unknown country data should remain usable");
  assert(spain.fallbackProducts.length > 0);
}

function testMetadataAndCacheSeparation() {
  assert.equal(getProductMarketLabel(mockProducts[0]), "France");
  assert.equal(getProductMarketLabel(mockProducts[1]), "United States");
  const multiMarket = normalizeOpenFoodFactsProduct({
    code: "multi-market",
    product_name: "Nutella",
    brands: "Ferrero",
    countries_tags: ["en:united-states", "en:france"],
    ingredients_text_fr: "sucre, noisettes",
    nutriments: nutrition
  }, "multi-market", { regionId: "fr", preferredLanguage: "fr" });
  assert.equal(multiMarket.marketLabel, "France", "selected market should label a matching multi-market result");
  const frKey = createRegionSearchCacheKey({ query: "Nutella", regionId: "fr", preferredLanguage: "fr" });
  const usKey = createRegionSearchCacheKey({ query: "Nutella", regionId: "us", preferredLanguage: "en" });
  const fallbackKey = createRegionSearchCacheKey({ query: "Nutella", regionId: "fr", preferredLanguage: "fr", globalFallback: true });
  assert.notEqual(frKey, usKey);
  assert.notEqual(frKey, fallbackKey);
}

function testLocalizedSourceAndReadTimeUpgrade() {
  const product = normalizeOpenFoodFactsProduct({
    code: "fr-label",
    product_name_fr: "Pâte à tartiner",
    product_name_en: "Hazelnut spread",
    brands: "Ferrero",
    quantity: "400 g",
    countries_tags: ["en:france"],
    ingredients_text_fr: "sucre, huile de palme, noisettes, lactosérum en poudre",
    ingredients_text_en: "sugar, palm oil, hazelnuts, whey powder",
    nutriments: nutrition,
    image_front_url: "fr.jpg"
  }, "fr-label", { regionId: "fr", preferredLanguage: "en" });
  assert.equal(product.ingredientParsing.selectedSourceField, "ingredients_text_fr");
  assert(product.ingredients.some((item) => item.originalLabelText === "noisettes" && item.canonicalName === "hazelnuts"));

  const cached = upgradeLegacyIngredientRecord({
    name: "NOISETTES",
    originalLabelText: "NOISETTES",
    risk: "unknown",
    classificationKind: "unknown"
  }, "food");
  assert.equal(cached.canonicalName, "hazelnuts");
  assert.equal(cached.classificationKind, "common");
  assert.equal(cached.originalLabelText, "NOISETTES");

  const corrected = upgradeLegacyIngredientRecord({
    name: "Milk",
    originalLabelText: "Milk",
    ingredientSourceField: "user-entered ingredients"
  }, "food");
  assert.equal(corrected.canonicalName, "milk", "user-provided corrected text should remain the classification source");
}

async function testExactBarcodeIgnoresRegion() {
  const previousFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return new Response(JSON.stringify({
      status: 1,
      product: {
        code: "3017620422003",
        product_name: "Nutella",
        brands: "Ferrero",
        countries_tags: ["en:france"],
        ingredients_text_fr: "sucre, huile de palme, noisettes",
        nutriments: nutrition,
        image_front_url: "https://example.test/nutella.jpg"
      }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const result = await lookupProductByBarcode("3017620422003");
    assert.equal(result.status, "found");
    assert.equal(result.product.barcode, "3017620422003");
    assert(requests[0].includes("/api/v2/product/3017620422003.json"));
    assert(!requests[0].includes("tagtype_0"));
  } finally {
    globalThis.fetch = previousFetch;
  }
}

async function run() {
  testRequestFilters();
  testRegionalRanking();
  testMetadataAndCacheSeparation();
  testLocalizedSourceAndReadTimeUpgrade();
  await testExactBarcodeIgnoresRegion();
  console.log("Region search checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
