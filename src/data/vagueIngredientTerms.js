function record({ canonicalName, aliases = [], category, function: ingredientFunction, plainDescription, whyUsed, nutritionRole, tags = [], dietFlags }) {
  return Object.freeze({
    canonicalName,
    displayName: canonicalName.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    aliases: [...new Set([canonicalName, ...aliases])],
    category: "vague label term",
    vagueCategory: category,
    function: ingredientFunction,
    plainDescription,
    whyUsed,
    nutritionRole,
    defaultConcernLevel: "limited_detail",
    confidence: "vague_label_term",
    tags: [...new Set([...tags, "limited-detail"])],
    dietFlags: dietFlags || { vegan: "unknown", vegetarian: "unknown", glutenFree: "unknown" },
    allergenSources: []
  });
}

export const VAGUE_INGREDIENT_TERMS = Object.freeze([
  record({ canonicalName: "natural flavor", aliases: ["natural flavors", "natural flavour", "natural flavouring", "natural flavoring"], category: "vague flavor term", function: "flavoring", plainDescription: "A broad label term for flavoring substances derived from natural sources. The exact source is usually not specified.", whyUsed: "Adds or adjusts flavor.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["flavoring"] }),
  record({ canonicalName: "artificial flavor", aliases: ["artificial flavors", "artificial flavour", "artificial flavouring", "artificial flavoring"], category: "vague flavor term", function: "flavoring", plainDescription: "A broad label term for one or more flavoring substances. The individual flavor compounds are not identified here.", whyUsed: "Adds or adjusts flavor.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["flavoring", "processing-marker"] }),
  record({ canonicalName: "flavoring", aliases: ["flavorings", "flavouring", "flavourings", "flavor"], category: "vague flavor term", function: "flavoring", plainDescription: "A broad term that does not identify the exact flavor substances.", whyUsed: "Adds or adjusts flavor.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["flavoring"] }),
  record({ canonicalName: "spices", aliases: ["mixed spices", "spice blend"], category: "vague seasoning term", function: "seasoning", plainDescription: "A broad label term for spice ingredients. The exact spices may not be listed individually.", whyUsed: "Adds flavor and aroma.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["seasoning"] }),
  record({ canonicalName: "seasoning", aliases: ["seasonings", "seasoning blend"], category: "vague seasoning term", function: "seasoning", plainDescription: "A broad label term for a flavoring mixture whose components may not be fully listed in this phrase.", whyUsed: "Adds flavor.", nutritionRole: "Nutrient contribution depends on the ingredients in the blend.", tags: ["seasoning"] }),
  record({ canonicalName: "smoke flavor", aliases: ["smoke flavour", "natural smoke flavor", "natural smoke flavour", "liquid smoke flavor"], category: "vague flavor term", function: "smoke flavoring", plainDescription: "A broad label term for ingredients used to add a smoke-like flavor.", whyUsed: "Adds smoke flavor and aroma.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["flavoring"] }),
  record({ canonicalName: "vegetable oil", aliases: ["vegetable oils", "vegetable oil blend"], category: "broad oil term", function: "fat / cooking oil", plainDescription: "A broad label term that does not identify the specific plant oil or oil blend.", whyUsed: "Adds fat, texture, or cooking performance.", nutritionRole: "Contributes fat and calories; the fatty-acid profile depends on the oils used.", tags: ["oil", "fat"] }),
  record({ canonicalName: "protein blend", aliases: ["protein mixture", "plant protein blend", "protein complex"], category: "broad protein term", function: "protein", plainDescription: "A broad label term for two or more protein ingredients. The exact sources require package context.", whyUsed: "Adds protein and can support texture.", nutritionRole: "May contribute protein, but source-specific allergen and dietary context is not shown by this phrase alone.", tags: ["protein"] }),
  record({ canonicalName: "starch", aliases: ["food starch"], category: "broad starch term", function: "thickener / structure", plainDescription: "A broad starch term that does not identify the plant source.", whyUsed: "Thickens, binds, or adds structure.", nutritionRole: "Primarily contributes carbohydrate when used in meaningful amounts.", tags: ["starch"] }),
  record({ canonicalName: "modified food starch", aliases: ["food starch modified", "modified starch"], category: "broad starch term", function: "thickener / structure", plainDescription: "A starch altered for specific texture or processing performance. The plant source may not be identified.", whyUsed: "Controls thickness, stability, moisture, or texture.", nutritionRole: "Primarily contributes carbohydrate when used in meaningful amounts.", tags: ["starch", "processing-marker"] }),
  record({ canonicalName: "enzymes", aliases: ["enzyme", "enzyme blend"], category: "broad processing-aid term", function: "processing aid", plainDescription: "A broad label term for proteins that support a manufacturing or fermentation step.", whyUsed: "Supports processing, fermentation, texture, or ingredient conversion.", nutritionRole: "Usually not a major nutrient contributor at use levels.", tags: ["processing-aid"] }),
  record({ canonicalName: "cultures", aliases: ["live cultures", "active cultures", "bacterial cultures", "starter cultures"], category: "broad culture term", function: "fermentation", plainDescription: "A broad term for microorganisms used in fermentation. The exact strains may not be listed.", whyUsed: "Supports fermentation, flavor, acidity, or texture.", nutritionRole: "Usually not a major nutrient contributor by itself.", tags: ["fermentation"] }),
  record({ canonicalName: "color added", aliases: ["colour added", "added color", "added colour"], category: "broad color term", function: "coloring", plainDescription: "A broad statement that color was added without identifying the exact color source in this phrase.", whyUsed: "Changes or standardizes product color.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["coloring"] }),
  record({ canonicalName: "fruit and vegetable juice for color", aliases: ["fruit and vegetable juice for colour", "vegetable juice for color", "fruit juice for color"], category: "broad color source", function: "coloring", plainDescription: "A broad label term for fruit- or vegetable-derived color sources without naming each source.", whyUsed: "Adds or adjusts color.", nutritionRole: "Usually not a major nutrient contributor at coloring amounts.", tags: ["coloring", "plant-derived"] }),
  record({ canonicalName: "gum blend", aliases: ["gums", "stabilizer blend", "gum mixture"], category: "broad texture term", function: "thickener / stabilizer", plainDescription: "A broad term for two or more gums or stabilizers whose exact identities may need package context.", whyUsed: "Controls thickness, suspension, or texture.", nutritionRole: "Usually not a major nutrient contributor at typical formulation levels.", tags: ["stabilizer", "texture"] }),
  record({ canonicalName: "emulsifiers", aliases: ["emulsifier", "emulsifiant", "emulsifiants", "emulsifying agents"], category: "broad texture term", function: "emulsification", plainDescription: "A broad label term for ingredients that help oil- and water-based components mix. The exact emulsifiers may be listed elsewhere on the label.", whyUsed: "Stabilizes mixing and texture.", nutritionRole: "Usually not a major nutrient contributor at typical formulation levels.", tags: ["emulsifier", "texture"] }),
  record({ canonicalName: "proprietary blend", aliases: ["proprietary mixture", "proprietary formula"], category: "broad blend term", function: "ingredient blend", plainDescription: "A broad blend name that does not disclose every component or amount in this phrase.", whyUsed: "Groups multiple formulation ingredients under one blend name.", nutritionRole: "Cannot be determined from the blend name alone.", tags: ["blend"] }),
  record({ canonicalName: "herbs", aliases: ["mixed herbs", "herb blend"], category: "vague seasoning term", function: "seasoning", plainDescription: "A broad label term for culinary herbs. The exact herbs may not be listed individually.", whyUsed: "Adds flavor and aroma.", nutritionRole: "Usually not a major nutrient contributor.", tags: ["seasoning"] }),
  record({ canonicalName: "vegetable powder", aliases: ["vegetable powders", "dehydrated vegetables"], category: "broad vegetable term", function: "flavor / color / food base", plainDescription: "A broad term for one or more dried vegetable ingredients without identifying each source.", whyUsed: "Adds flavor, color, or vegetable solids.", nutritionRole: "Nutrient contribution depends on the vegetables and amount used.", tags: ["vegetable"] }),
  record({ canonicalName: "fruit puree", aliases: ["fruit purée", "mixed fruit puree"], category: "broad fruit term", function: "fruit base", plainDescription: "A broad term for processed fruit pulp without identifying each fruit in this phrase.", whyUsed: "Adds fruit flavor, moisture, sweetness, or texture.", nutritionRole: "May contribute natural sugars, fiber, or micronutrients depending on source and amount.", tags: ["fruit"] })
]);

function normalizeVagueKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/flavours?/gi, "flavor")
    .replace(/colours?/gi, "color")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

const VAGUE_ALIAS_INDEX = new Map();
for (const item of VAGUE_INGREDIENT_TERMS) {
  for (const alias of item.aliases) VAGUE_ALIAS_INDEX.set(normalizeVagueKey(alias), item);
}

export function findVagueIngredientTerm(value) {
  return VAGUE_ALIAS_INDEX.get(normalizeVagueKey(value)) || null;
}

export { normalizeVagueKey };
