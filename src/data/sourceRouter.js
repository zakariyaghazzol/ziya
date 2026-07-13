export const PRODUCT_FACT_SOURCE_REGISTRY = Object.freeze({
  identity: ["food-product-data", "general-barcode-data", "local-product-override"],
  category: ["provider-category-fields", "user-category-override", "category-inference"],
  image: ["product-data-image", "general-barcode-image", "user-product-photo", "placeholder"],
  ingredients: ["provider-ingredient-fields", "provider-additive-tags", "user-label-override", "detected-ingredient-section"],
  nutrition: ["provider-nutrition-fields", "user-nutrition-override", "server-nutrition-fallback"],
  allergens: ["provider-allergen-tags", "user-allergen-override"],
  additives: ["curated-additive-records", "provider-additive-tags", "user-label-override", "regulatory-source-records"],
  chemicalIdentity: ["curated-ingredient-records", "chemical-identity-database"],
  literature: ["scientific-citation-metadata"],
  medicine: ["medicine-label-data", "curated-medicine-records", "user-label-override"],
  textile: ["curated-material-records", "user-label-override"]
});

export const CATEGORY_KNOWLEDGE_ROUTES = Object.freeze({
  food: ["curated-additive-records", "regulatory-source-records", "chemical-identity-database", "scientific-citation-metadata"],
  beauty: ["curated-cosmetic-records", "chemical-identity-database", "cosmetic-source-records", "scientific-citation-metadata"],
  household: ["curated-household-records", "chemical-identity-database", "chemical-safety-source-records"],
  medicine: ["medicine-label-data", "curated-medicine-records", "chemical-identity-database"],
  textile: ["curated-material-records", "material-source-records"],
  unknown: ["curated-ingredient-records", "chemical-identity-database"]
});

export function routeProductFact(fact, { providerAvailable = false, userOverrideAvailable = false } = {}) {
  const candidates = PRODUCT_FACT_SOURCE_REGISTRY[fact] || [];
  if (userOverrideAvailable) {
    const userSource = candidates.find((source) => source.includes("user") || source.includes("override"));
    if (userSource) return { fact, selected: userSource, candidates, reason: "User supplied missing label data" };
  }
  if (providerAvailable) {
    const providerSource = candidates.find((source) => source.includes("provider") || source.includes("product-data"));
    if (providerSource) return { fact, selected: providerSource, candidates, reason: "Dedicated provider field available" };
  }
  return { fact, selected: "unavailable", candidates, reason: "No source currently supplies this field" };
}

export function createProductSourceRouting({
  providerType,
  hasIdentity,
  hasCategory,
  hasImage,
  hasIngredients,
  hasNutrition,
  hasAllergens,
  hasAdditives,
  overrideFields = []
} = {}) {
  const overridden = new Set(overrideFields);
  const facts = {
    identity: hasIdentity,
    category: hasCategory,
    image: hasImage,
    ingredients: hasIngredients,
    nutrition: hasNutrition,
    allergens: hasAllergens,
    additives: hasAdditives
  };
  return {
    providerType: providerType || "unknown",
    decisions: Object.fromEntries(Object.entries(facts).map(([fact, available]) => [
      fact,
      routeProductFact(fact, { providerAvailable: Boolean(available), userOverrideAvailable: overridden.has(fact) })
    ]))
  };
}

export function getKnowledgeSourceRoute(category) {
  return CATEGORY_KNOWLEDGE_ROUTES[category] || CATEGORY_KNOWLEDGE_ROUTES.unknown;
}
