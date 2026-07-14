import { getProductCountryTags, productMatchesRegion } from "../data/productRegionConfig";
import { getPersonalAlerts } from "../profile/personalAlerts";

const BANNED_REASON_WORDS = /\b(?:safe|allergy-safe|allergen-free|healthy|harmless)\b/i;
const REAL_PRODUCT_SOURCES = new Set(["food-provider", "barcode-provider", "verified"]);
const NUTRIENT_KEYS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];

const TYPE_DEFINITIONS = Object.freeze({
  food: Object.freeze([
    ["hazelnut-spread", /\b(?:hazelnut|chocolate)\s+(?:cocoa\s+)?spread\b|\bnutella\b|\bpate a tartiner\b/],
    ["peanut-butter", /\bpeanut butter\b/],
    ["seed-butter", /\b(?:sunflower|sesame|seed) butter\b|\btahini\b/],
    ["generic-spread", /\b(?:sweet|chocolate|cocoa|nut) spread\b|\bspreads?\b/],
    ["popcorn", /\bpopcorn\b/],
    ["crackers", /\bcracker(?:s)?\b|\bcheddar squares?\b/],
    ["protein-bar", /\bprotein bars?\b/],
    ["snack-bar", /\b(?:snack|energy|granola|cereal) bars?\b/],
    ["cereal", /\b(?:breakfast )?cereal\b|\bgranola\b/],
    ["soda", /\b(?:soda|soft drink|cola)\b/],
    ["yogurt", /\b(?:yogurt|yoghurt)\b/],
    ["chips", /\b(?:potato|corn|tortilla|vegetable)?\s*chips\b|\bcrisps\b/],
    ["cookies", /\b(?:cookie|cookies|biscuit|biscuits)\b/],
    ["ice-cream", /\bice cream\b|\bfrozen dessert\b/],
    ["sauce", /\b(?:pasta|tomato|hot|barbecue|bbq) sauce\b|\bsalsa\b/],
    ["juice", /\b(?:fruit )?juice\b/],
    ["frozen-meal", /\bfrozen (?:meal|dinner|entree)\b/]
  ]),
  beauty: Object.freeze([
    ["shampoo", /\bshampoo\b/],
    ["conditioner", /\bconditioner\b/],
    ["lotion", /\b(?:lotion|moisturizer|moisturiser)\b/],
    ["deodorant", /\b(?:deodorant|antiperspirant)\b/],
    ["sunscreen", /\b(?:sunscreen|sunblock)\b/],
    ["toothpaste", /\btoothpaste\b/],
    ["face-wash", /\b(?:face|facial) (?:wash|cleanser)\b/],
    ["soap", /\b(?:body wash|hand soap|bar soap)\b/]
  ]),
  household: Object.freeze([
    ["laundry-detergent", /\blaundry detergent\b/],
    ["dish-soap", /\b(?:dish soap|dishwashing liquid|washing-up liquid)\b/],
    ["surface-cleaner", /\b(?:all-purpose|all purpose|surface|glass) cleaner\b/],
    ["air-freshener", /\bair freshener\b/],
    ["fabric-softener", /\bfabric softener\b/]
  ]),
  textile: Object.freeze([
    ["shirt", /\b(?:shirt|t-shirt|tee)\b/],
    ["towel", /\btowel\b/],
    ["scrubber", /\b(?:body scrubber|bath sponge|loofah)\b/]
  ])
});

const COMPATIBLE_TYPE_GROUPS = Object.freeze([
  new Set(["hazelnut-spread", "peanut-butter", "seed-butter", "generic-spread"]),
  new Set(["protein-bar", "snack-bar"])
]);

const TYPE_LABELS = Object.freeze({
  "hazelnut-spread": "hazelnut spread",
  "peanut-butter": "nut spread",
  "seed-butter": "seed spread",
  "generic-spread": "spread",
  popcorn: "popcorn",
  crackers: "cracker",
  "protein-bar": "protein bar",
  "snack-bar": "snack bar",
  cereal: "cereal",
  soda: "soft drink",
  yogurt: "yogurt",
  chips: "chips",
  cookies: "cookie",
  "ice-cream": "frozen dessert",
  sauce: "sauce",
  juice: "juice",
  "frozen-meal": "frozen meal",
  shampoo: "shampoo",
  conditioner: "conditioner",
  lotion: "moisturizer",
  deodorant: "deodorant",
  sunscreen: "sunscreen",
  toothpaste: "toothpaste",
  "face-wash": "facial cleanser",
  soap: "soap",
  "laundry-detergent": "laundry detergent",
  "dish-soap": "dish soap",
  "surface-cleaner": "surface cleaner",
  "air-freshener": "air freshener",
  "fabric-softener": "fabric softener",
  shirt: "shirt",
  towel: "towel",
  scrubber: "body scrubber"
});

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value === null || value === undefined ? [] : [value];
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function identityText(product) {
  return normalizeText([
    product?.name,
    product?.genericName,
    product?.categoryPath,
    product?.description,
    product?.productType,
    ...asArray(product?.categoriesTags),
    ...asArray(product?.categories_tags)
  ].filter(Boolean).join(" "));
}

export function getComparableProductType(product) {
  const definitions = TYPE_DEFINITIONS[product?.category] || [];
  const text = identityText(product);
  return definitions.find(([, pattern]) => pattern.test(text))?.[0] || null;
}

function compareTypes(currentType, candidateType) {
  if (!currentType || !candidateType) return null;
  if (currentType === candidateType) return { strength: 1, label: TYPE_LABELS[currentType] || "product" };
  const compatible = COMPATIBLE_TYPE_GROUPS.some((group) => group.has(currentType) && group.has(candidateType));
  return compatible ? { strength: 0.76, label: TYPE_LABELS[currentType] || "similar product" } : null;
}

function productIdentityKey(product) {
  const barcode = normalizeText(product?.barcode || product?.code || product?.upc || product?.gtin);
  if (barcode) return `barcode:${barcode}`;
  if (product?.id) return `id:${product.id}`;
  return `name:${normalizeText(`${product?.brand || ""} ${product?.name || ""}`)}`;
}

function isSameProduct(current, candidate) {
  if (!current || !candidate) return true;
  if (current.id && candidate.id && current.id === candidate.id) return true;
  const currentBarcode = normalizeText(current.barcode || current.code || current.upc || current.gtin);
  const candidateBarcode = normalizeText(candidate.barcode || candidate.code || candidate.upc || candidate.gtin);
  return Boolean(currentBarcode && candidateBarcode && currentBarcode === candidateBarcode);
}

function ingredientDataAvailable(product) {
  return Array.isArray(product?.ingredients)
    && product.ingredients.length > 0
    && product.fieldConfidence?.ingredients !== "Missing";
}

function allergenDataAvailable(product) {
  const value = asArray(product?.allergens).join(" ").trim();
  return Boolean(value && !/^(?:none|not listed|not available|unknown|no major)/i.test(value) && product.fieldConfidence?.allergens !== "Missing");
}

function nutritionDataAvailable(product) {
  const nutrition = product?.nutrition || {};
  return NUTRIENT_KEYS.filter((key) => finiteNumber(nutrition[key]) !== null).length >= 3;
}

function getIngredientRiskSummary(product) {
  if (!ingredientDataAvailable(product)) return { available: false, flagged: null, unknown: null, burden: null };
  let moderate = 0;
  let higher = 0;
  let unknown = 0;
  product.ingredients.forEach((ingredient) => {
    const risk = normalizeText(ingredient?.risk || ingredient?.concernLevel || ingredient?.statusLabel);
    if (/harmful|higher|high concern/.test(risk)) higher += 1;
    else if (/moderate/.test(risk)) moderate += 1;
    else if (!risk || /unknown|needs review|unclassified/.test(risk) || ingredient?.classificationKind === "unknown") unknown += 1;
  });
  return { available: true, flagged: moderate + higher, unknown, burden: moderate + higher * 2 };
}

function getAdditiveSummary(product) {
  if (product?.fieldConfidence?.additives === "Missing") return { available: false, count: null };
  const hasDeclaredAdditiveData = product?.additives !== null && product?.additives !== undefined;
  const names = new Set();
  const additiveValues = Array.isArray(product?.additives)
    ? product.additives
    : asArray(product?.additives?.tags);
  additiveValues.forEach((value) => {
    const name = normalizeText(typeof value === "string" ? value : value?.name);
    if (name) names.add(name);
  });
  asArray(product?.ingredients).forEach((ingredient) => {
    if (/additive|preservative|color|flavo[u]?r|emulsifier|stabili[sz]er|sweetener/i.test(`${ingredient?.type || ""} ${ingredient?.name || ""}`)) {
      const name = normalizeText(ingredient?.canonicalName || ingredient?.name);
      if (name) names.add(name);
    }
  });
  const declaredCount = finiteNumber(product?.additives?.count);
  if (names.size) return { available: true, count: names.size };
  if (declaredCount !== null) return { available: true, count: declaredCount };
  return hasDeclaredAdditiveData ? { available: true, count: 0 } : { available: false, count: null };
}

function parseServingMeasure(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*(g|gram(?:s)?|ml|milliliter(?:s)?)\b/i);
  if (!match) return null;
  const amount = finiteNumber(match[1]);
  if (!amount || amount <= 0) return null;
  const unit = /^m/i.test(match[2]) ? "ml" : "g";
  return { amount, unit };
}

function getNutritionSnapshot(product) {
  const nutrition = product?.nutrition || {};
  if (!nutritionDataAvailable(product)) return { available: false, basis: null, values: null };
  const rawBasis = ["100g", "100ml", "serving"].includes(nutrition.basis) ? nutrition.basis : "serving";
  const values = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, finiteNumber(nutrition[key])]));
  if (rawBasis === "100g" || rawBasis === "100ml") return { available: true, basis: rawBasis, values };
  const measure = parseServingMeasure(nutrition.servingSize);
  if (measure) {
    const factor = 100 / measure.amount;
    return {
      available: true,
      basis: measure.unit === "ml" ? "100ml" : "100g",
      values: Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, values[key] === null ? null : values[key] * factor]))
    };
  }
  const servingKey = normalizeText(nutrition.servingSize);
  const meaningfulServing = servingKey && !/^(?:1 )?serving$/.test(servingKey);
  return { available: true, basis: meaningfulServing ? `serving:${servingKey}` : "serving:unknown", values };
}

function compareNutrition(current, candidate) {
  const currentSnapshot = getNutritionSnapshot(current);
  const candidateSnapshot = getNutritionSnapshot(candidate);
  if (!currentSnapshot.available || !candidateSnapshot.available) {
    return { comparable: false, current: currentSnapshot, candidate: candidateSnapshot, caveat: "Nutrition data incomplete." };
  }
  if (currentSnapshot.basis !== candidateSnapshot.basis || currentSnapshot.basis === "serving:unknown") {
    return { comparable: false, current: currentSnapshot, candidate: candidateSnapshot, caveat: "Serving sizes differ." };
  }
  return { comparable: true, current: currentSnapshot, candidate: candidateSnapshot, caveat: "" };
}

function meaningfulLower(current, candidate, minimum, ratio = 0.1) {
  if (current === null || candidate === null || candidate >= current) return false;
  return current - candidate >= Math.max(minimum, current * ratio);
}

function meaningfulHigher(current, candidate, minimum, ratio = 0.12) {
  if (current === null || candidate === null || candidate <= current) return false;
  return candidate - current >= Math.max(minimum, current * ratio);
}

function getProcessingRank(value) {
  const normalized = normalizeText(value);
  if (!normalized || /unknown|not evaluated/.test(normalized)) return null;
  if (/minimal/.test(normalized)) return 3;
  if (/ultra/.test(normalized)) return 1;
  if (/processed/.test(normalized)) return 2;
  return null;
}

function getRegionStatus(product, selectedRegion) {
  if (!selectedRegion || selectedRegion === "global") return "global";
  const compatibleProduct = {
    ...product,
    countries_tags: product?.countries_tags || product?.countriesTags,
    countries_tags_en: product?.countries_tags_en || product?.countriesTagsEn
  };
  if (!getProductCountryTags(compatibleProduct).length) return "unknown";
  return productMatchesRegion(compatibleProduct, selectedRegion) ? "match" : "other-market";
}

function getPlateSignals(plate) {
  if (!plate?.goals || !plate?.totals || !(plate.entryCount > 0)) return new Set();
  const ratio = (key) => {
    const goal = finiteNumber(plate.goals[key]);
    const total = finiteNumber(plate.totals[key]);
    return goal && total !== null ? total / goal : null;
  };
  const signals = new Set();
  if ((ratio("sugar") || 0) >= 0.7) signals.add("sugar");
  if ((ratio("sodium") || 0) >= 0.7) signals.add("sodium");
  if ((ratio("calories") || 0) >= 0.75) signals.add("calories");
  const proteinRatio = ratio("protein");
  if (proteinRatio !== null && proteinRatio < 0.65) signals.add("protein");
  return signals;
}

function getDietSignals(profile) {
  return new Set(asArray(profile?.dietPreferences).map(normalizeText));
}

function alertKey(alert) {
  return `${alert.kind}:${normalizeText(alert.title)}`;
}

function alertWeight(alert) {
  return { allergy: 8, avoid: 6, preference: 3, watchlist: 2 }[alert.kind] || 0;
}

function canVerifyResolvedAlert(candidate, alert) {
  if (alert.kind === "allergy") return ingredientDataAvailable(candidate) || allergenDataAvailable(candidate);
  return ingredientDataAvailable(candidate);
}

function resolvedAlertReason(alert) {
  if (alert.kind === "allergy") return `No matching ${alert.title} source found in available data. Verify package.`;
  return `No ${alert.title} match found in available label data.`;
}

function addReason(list, value, priority, kind = "general") {
  if (!value || BANNED_REASON_WORDS.test(value) || list.some((item) => item.text === value)) return;
  list.push({ text: value, priority, kind });
}

function getDemoStatus(product) {
  return product?.dataConfidence === "Demo Data"
    || (!REAL_PRODUCT_SOURCES.has(product?.sourceType) && String(product?.image || "").startsWith("data:image/svg+xml"));
}

function getCandidateQuality(product) {
  const ingredients = ingredientDataAvailable(product);
  const nutrition = nutritionDataAvailable(product);
  const identity = Boolean(normalizeText(product?.name) && normalizeText(product?.brand));
  const count = [identity, Boolean(product?.image || product?.userPhoto), ingredients, nutrition].filter(Boolean).length;
  return { identity, ingredients, nutrition, count };
}

function chooseStableCandidate(existing, candidate) {
  if (!existing) return candidate;
  if (candidate.overrideApplied && !existing.overrideApplied) return candidate;
  return getCandidateQuality(candidate).count > getCandidateQuality(existing).count ? candidate : existing;
}

export function filterComparableProducts(currentProduct, candidates) {
  if (!currentProduct || ["medicine", "unknown"].includes(currentProduct.category)) return [];
  const currentType = getComparableProductType(currentProduct);
  if (!currentType) return [];
  const source = candidates instanceof Map ? [...candidates.values()] : asArray(candidates);
  const unique = new Map();
  source.forEach((candidate) => {
    if (!candidate || isSameProduct(currentProduct, candidate) || candidate.category !== currentProduct.category || candidate.analysisPending) return;
    const candidateType = getComparableProductType(candidate);
    const typeMatch = compareTypes(currentType, candidateType);
    if (!typeMatch) return;
    const key = productIdentityKey(candidate);
    unique.set(key, chooseStableCandidate(unique.get(key), candidate));
  });
  return [...unique.values()].map((product) => ({
    product,
    currentType,
    candidateType: getComparableProductType(product),
    typeMatch: compareTypes(currentType, getComparableProductType(product))
  }));
}

export function scoreBetterMatch(currentProduct, candidateProduct, context = {}) {
  if (!currentProduct || !candidateProduct || isSameProduct(currentProduct, candidateProduct)) return null;
  if (currentProduct.category !== candidateProduct.category || ["medicine", "unknown"].includes(currentProduct.category)) return null;
  const currentType = getComparableProductType(currentProduct);
  const candidateType = getComparableProductType(candidateProduct);
  const typeMatch = compareTypes(currentType, candidateType);
  if (!typeMatch) return null;

  const profile = context.profile || {};
  const plateSignals = getPlateSignals(context.plate);
  const dietSignals = getDietSignals(profile);
  const candidateQuality = getCandidateQuality(candidateProduct);
  const currentRisks = getIngredientRiskSummary(currentProduct);
  const candidateRisks = getIngredientRiskSummary(candidateProduct);
  const currentAdditives = getAdditiveSummary(currentProduct);
  const candidateAdditives = getAdditiveSummary(candidateProduct);
  const nutrition = compareNutrition(currentProduct, candidateProduct);
  const currentAlerts = getPersonalAlerts(currentProduct, profile).filter((alert) => alert.kind !== "data");
  const candidateAlerts = getPersonalAlerts(candidateProduct, profile).filter((alert) => alert.kind !== "data");
  const candidateAlertKeys = new Set(candidateAlerts.map(alertKey));
  const reasons = [];
  const caveats = [];
  let rank = typeMatch.strength === 1 ? 42 : 30;
  let improvementPoints = 0;

  currentAlerts.forEach((alert) => {
    if (!candidateAlertKeys.has(alertKey(alert)) && canVerifyResolvedAlert(candidateProduct, alert)) {
      const points = alertWeight(alert);
      rank += points;
      improvementPoints += points;
      addReason(reasons, resolvedAlertReason(alert), 100 + points, "personal");
    }
  });
  candidateAlerts.forEach((alert) => {
    rank -= alertWeight(alert) * 1.5;
  });

  if (currentRisks.available && candidateRisks.available) {
    if (candidateRisks.burden < currentRisks.burden && candidateRisks.unknown <= currentRisks.unknown) {
      const points = Math.min(10, 5 + (currentRisks.burden - candidateRisks.burden) * 2);
      rank += points;
      improvementPoints += points;
      addReason(reasons, "Fewer flagged ingredients in available data.", 72, "ingredient");
    } else if (candidateRisks.burden > currentRisks.burden) {
      rank -= Math.min(8, (candidateRisks.burden - currentRisks.burden) * 2);
    }
  }

  if (candidateRisks.available && candidateRisks.unknown > 0) {
    rank -= Math.min(8, candidateRisks.unknown * 2);
    caveats.push("Some ingredient details need review.");
  }

  if (currentAdditives.available && candidateAdditives.available) {
    if (candidateAdditives.count < currentAdditives.count) {
      const points = Math.min(8, 4 + (currentAdditives.count - candidateAdditives.count));
      rank += points;
      improvementPoints += points;
      addReason(reasons, "Fewer flagged additives in available data.", 70, "ingredient");
    } else if (candidateAdditives.count > currentAdditives.count) {
      rank -= Math.min(6, candidateAdditives.count - currentAdditives.count);
    }
  }

  const currentProcessing = getProcessingRank(currentProduct.processing);
  const candidateProcessing = getProcessingRank(candidateProduct.processing);
  if (currentProcessing !== null && candidateProcessing !== null) {
    if (candidateProcessing > currentProcessing) {
      rank += 5;
      improvementPoints += 5;
      addReason(reasons, "Less processing in available product data.", 50, "ingredient");
    } else if (candidateProcessing < currentProcessing) rank -= 3;
  }

  if (nutrition.comparable) {
    const currentValues = nutrition.current.values;
    const candidateValues = nutrition.candidate.values;
    const lowerSugar = meaningfulLower(currentValues.sugar, candidateValues.sugar, 1);
    const lowerSodium = meaningfulLower(currentValues.sodium, candidateValues.sodium, 20);
    const higherProtein = meaningfulHigher(currentValues.protein, candidateValues.protein, 1);
    const lowerCalories = meaningfulLower(currentValues.calories, candidateValues.calories, 20);

    if (lowerSugar) {
      const personalized = dietSignals.has("low sugar") || plateSignals.has("sugar");
      const points = personalized ? 12 : 7;
      rank += points;
      improvementPoints += points;
      addReason(reasons, plateSignals.has("sugar") ? "Lower sugar for your current day." : "Lower sugar than this product.", personalized ? 94 : 62, personalized ? "personal" : "nutrition");
    } else if (meaningfulHigher(currentValues.sugar, candidateValues.sugar, 1)) rank -= 5;

    if (lowerSodium) {
      const personalized = dietSignals.has("low sodium") || plateSignals.has("sodium");
      const points = personalized ? 12 : 7;
      rank += points;
      improvementPoints += points;
      addReason(reasons, plateSignals.has("sodium") ? "Helps protect your sodium goal." : "Lower sodium than this product.", personalized ? 93 : 61, personalized ? "personal" : "nutrition");
    } else if (meaningfulHigher(currentValues.sodium, candidateValues.sodium, 20)) rank -= 5;

    if (higherProtein && !["soda", "juice"].includes(currentType)) {
      const personalized = plateSignals.has("protein");
      const points = personalized ? 10 : 5;
      rank += points;
      improvementPoints += points;
      addReason(reasons, personalized ? "More protein for your current goal." : "More protein than this product.", personalized ? 92 : 58, personalized ? "personal" : "nutrition");
    }

    if (lowerCalories && plateSignals.has("calories")) {
      rank += 8;
      improvementPoints += 8;
      addReason(reasons, "Lower calories for your current day.", 91, "personal");
    }
  } else if (currentProduct.category === "food") {
    caveats.push(nutrition.caveat);
  }

  if (!candidateQuality.ingredients) {
    rank -= 12;
    caveats.push("Ingredient data incomplete.");
  }
  if (candidateProduct.category === "food" && !candidateQuality.nutrition) {
    rank -= 10;
    caveats.push("Nutrition data incomplete.");
  }
  if (!candidateQuality.identity) rank -= 12;

  const selectedRegion = context.selectedRegion || profile.productRegion || "global";
  const regionStatus = getRegionStatus(candidateProduct, selectedRegion);
  if (regionStatus === "match") rank += 7;
  if (regionStatus === "other-market") {
    rank -= 6;
    caveats.push("Listed for another market. Verify the physical package.");
  }

  const isDemo = getDemoStatus(candidateProduct);
  if (isDemo) {
    rank -= 2;
    caveats.push("Demo product data. Verify the physical package.");
  }

  const currentScore = finiteNumber(currentProduct.score);
  const candidateScore = finiteNumber(candidateProduct.score);
  if (currentScore !== null && candidateScore !== null && candidateScore >= currentScore + 8) rank += 2;

  if (improvementPoints < 5 || rank < 38) return null;
  reasons.sort((a, b) => b.priority - a.priority || a.text.localeCompare(b.text));
  const displayedReasons = reasons.slice(0, 3).map((item) => item.text);
  if (!displayedReasons.length) return null;
  const hasPersonalReason = reasons.some((item) => item.kind === "personal");
  const confidence = candidateQuality.ingredients
    && (candidateProduct.category !== "food" || nutrition.comparable)
    && regionStatus !== "other-market"
      ? typeMatch.strength === 1 ? "High" : "Medium"
      : "Low";

  return {
    product: candidateProduct,
    rank,
    label: hasPersonalReason ? "Better fit" : displayedReasons.length > 1 ? "Good match" : "Similar product",
    reasons: displayedReasons,
    caveats: uniqueStrings(caveats).slice(0, 3),
    confidence,
    isDemo,
    comparison: {
      currentType,
      candidateType,
      typeLabel: typeMatch.label,
      typeStrength: typeMatch.strength,
      nutritionBasis: nutrition.comparable ? nutrition.current.basis : null,
      regionStatus,
      currentPersonalAlertCount: currentAlerts.length,
      candidatePersonalAlertCount: candidateAlerts.length,
      currentFlaggedIngredientCount: currentRisks.flagged,
      candidateFlaggedIngredientCount: candidateRisks.flagged,
      currentAdditiveCount: currentAdditives.count,
      candidateAdditiveCount: candidateAdditives.count,
      candidateDataQuality: candidateQuality.count
    }
  };
}

export function explainBetterMatch(currentProduct, candidateProduct, context = {}) {
  return scoreBetterMatch(currentProduct, candidateProduct, context);
}

export function buildBetterMatches({
  product,
  candidates,
  profile = {},
  plate = null,
  selectedRegion = profile?.productRegion || "global",
  limit = 3
} = {}) {
  const comparable = filterComparableProducts(product, candidates);
  const matches = comparable
    .map(({ product: candidate }) => scoreBetterMatch(product, candidate, { profile, plate, selectedRegion }))
    .filter(Boolean)
    .sort((a, b) => b.rank - a.rank || a.product.name.localeCompare(b.product.name) || productIdentityKey(a.product).localeCompare(productIdentityKey(b.product)))
    .slice(0, Math.max(1, limit));
  return {
    status: matches.length ? "ready" : "empty",
    matches,
    candidateCount: comparable.length,
    emptyReason: matches.length
      ? ""
      : "Scan or search more similar products with ingredient and nutrition data."
  };
}
