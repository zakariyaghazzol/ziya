import assert from "node:assert/strict";
import {
  buildBetterMatches,
  filterComparableProducts,
  scoreBetterMatch
} from "../src/lib/betterMatches.js";

function ingredient(name, risk = "safe", type = "Ingredient") {
  return { name, risk, type, classificationKind: risk === "safe" ? "common" : "concerning" };
}

function makeProduct(overrides = {}) {
  return {
    id: overrides.id || "product",
    barcode: overrides.barcode || `${overrides.id || "product"}-barcode`,
    name: "Whole Grain Cereal",
    brand: "Test Brand",
    category: "food",
    categoryPath: "Breakfast cereals",
    sourceType: "food-provider",
    score: 50,
    processing: "Ultra-processed",
    countriesTags: ["en:united-states"],
    ingredients: [
      ingredient("Whole grain oats"),
      ingredient("Red 40", "harmful", "Color additive"),
      ingredient("Artificial flavor", "moderate", "Flavor additive")
    ],
    additives: { count: 2, tags: ["Red 40", "Artificial flavor"] },
    allergens: "Contains wheat",
    nutrition: {
      basis: "100g",
      servingSize: "Per 100 g",
      calories: 390,
      protein: 7,
      carbs: 78,
      fat: 6,
      fiber: 5,
      sugar: 24,
      sodium: 520
    },
    ...overrides
  };
}

function betterCereal(overrides = {}) {
  return makeProduct({
    id: "better-cereal",
    barcode: "better-cereal-barcode",
    name: "Simple Whole Grain Cereal",
    score: 74,
    processing: "Processed",
    ingredients: [ingredient("Whole grain oats"), ingredient("Sea salt")],
    additives: { count: 0, tags: [] },
    nutrition: {
      basis: "100g",
      servingSize: "Per 100 g",
      calories: 350,
      protein: 10,
      carbs: 68,
      fat: 5,
      fiber: 8,
      sugar: 8,
      sodium: 180
    },
    ...overrides
  });
}

function profile(overrides = {}) {
  return {
    allergies: [],
    dietPreferences: [],
    avoidedIngredients: [],
    watchlistIngredients: [],
    productRegion: "global",
    ...overrides
  };
}

function resultFor(product, candidates, options = {}) {
  return buildBetterMatches({ product, candidates, profile: profile(options.profile), ...options });
}

function testComparableProductsWin() {
  const current = makeProduct({ id: "current" });
  const cereal = betterCereal();
  const soda = betterCereal({ id: "soda", barcode: "soda", name: "Clear Cola", categoryPath: "Soft drinks" });
  const result = resultFor(current, [soda, cereal]);
  assert.deepEqual(result.matches.map((match) => match.product.id), ["better-cereal"]);
}

function testDifferentCategoriesAreRejected() {
  const current = makeProduct({ id: "current" });
  const shampoo = betterCereal({ id: "shampoo", category: "beauty", name: "Daily Shampoo", categoryPath: "Shampoo" });
  assert.equal(resultFor(current, [shampoo]).status, "empty");
}

function testLowerSugarRanksForSugarGoal() {
  const current = makeProduct({ id: "current" });
  const lowSugar = betterCereal({ id: "low-sugar", barcode: "low-sugar" });
  const sameSugar = betterCereal({
    id: "same-sugar",
    barcode: "same-sugar",
    nutrition: { ...betterCereal().nutrition, sugar: 23, sodium: 170 }
  });
  const result = resultFor(current, [sameSugar, lowSugar], { profile: { dietPreferences: ["low sugar"] } });
  assert.equal(result.matches[0].product.id, "low-sugar");
  assert(result.matches[0].reasons.some((reason) => /lower sugar/i.test(reason)));
}

function testLowerSodiumRanksForSodiumGoal() {
  const current = makeProduct({ id: "current" });
  const lowSodium = betterCereal({ id: "low-sodium", barcode: "low-sodium" });
  const sameSodium = betterCereal({
    id: "same-sodium",
    barcode: "same-sodium",
    nutrition: { ...betterCereal().nutrition, sodium: 500, sugar: 7 }
  });
  const result = resultFor(current, [sameSodium, lowSodium], { profile: { dietPreferences: ["low sodium"] } });
  assert.equal(result.matches[0].product.id, "low-sodium");
  assert(result.matches[0].reasons.some((reason) => /lower sodium/i.test(reason)));
}

function testHigherProteinRanksForProteinGoal() {
  const current = makeProduct({ id: "current", nutrition: { ...makeProduct().nutrition, protein: 4 } });
  const higherProtein = betterCereal({ id: "higher-protein", barcode: "higher-protein", nutrition: { ...betterCereal().nutrition, protein: 18 } });
  const lowerProtein = betterCereal({ id: "lower-protein", barcode: "lower-protein", nutrition: { ...betterCereal().nutrition, protein: 5 } });
  const plate = { goals: { protein: 120 }, totals: { protein: 20 }, entryCount: 2 };
  const result = resultFor(current, [lowerProtein, higherProtein], { plate });
  assert.equal(result.matches[0].product.id, "higher-protein");
  assert(result.matches[0].reasons.some((reason) => /protein/i.test(reason)));
}

function testAvoidListConflictLowersRank() {
  const current = makeProduct({ id: "current", ingredients: [ingredient("Whole grain oats")] });
  const clean = betterCereal({ id: "clean", barcode: "clean" });
  const avoided = betterCereal({
    id: "avoided",
    barcode: "avoided",
    ingredients: [ingredient("Whole grain oats"), ingredient("Red 40", "harmful", "Color additive")],
    additives: { count: 1, tags: ["Red 40"] }
  });
  const result = resultFor(current, [avoided, clean], { profile: { avoidedIngredients: ["Red 40"] } });
  assert.equal(result.matches[0].product.id, "clean");
}

function testRed40AliasResolution() {
  const current = makeProduct({ id: "current", ingredients: [ingredient("Allura Red AC", "harmful", "Color additive")] });
  const clean = betterCereal({ id: "without-red", barcode: "without-red" });
  const result = resultFor(current, [clean], { profile: { avoidedIngredients: ["E129"] } });
  assert.equal(result.matches[0].product.id, "without-red");
  assert(result.matches[0].reasons.some((reason) => /red 40|allura red/i.test(reason)));
}

function testMissingIngredientsAreNotAutomaticImprovement() {
  const current = makeProduct({ id: "current" });
  const complete = betterCereal({ id: "complete", barcode: "complete" });
  const missing = betterCereal({ id: "missing", barcode: "missing", ingredients: [], additives: undefined, fieldConfidence: { ingredients: "Missing", additives: "Missing" } });
  const unknown = betterCereal({
    id: "unknown-ingredients",
    barcode: "unknown-ingredients",
    ingredients: [ingredient("Unclassified blend", "unknown"), ingredient("Unlisted compound", "unknown")],
    additives: undefined
  });
  const result = resultFor(current, [missing, unknown, complete]);
  assert.equal(result.matches[0].product.id, "complete");
  const missingMatch = result.matches.find((match) => match.product.id === "missing");
  assert(!missingMatch || missingMatch.caveats.includes("Ingredient data incomplete."));
  const unknownMatch = result.matches.find((match) => match.product.id === "unknown-ingredients");
  assert(!unknownMatch || unknownMatch.caveats.includes("Some ingredient details need review."));
}

function testMissingNutritionIsNotAutomaticImprovement() {
  const current = makeProduct({ id: "current" });
  const complete = betterCereal({ id: "complete", barcode: "complete" });
  const missing = betterCereal({ id: "missing", barcode: "missing", nutrition: {} });
  const result = resultFor(current, [missing, complete]);
  assert.equal(result.matches[0].product.id, "complete");
  const missingMatch = result.matches.find((match) => match.product.id === "missing");
  assert(!missingMatch || missingMatch.caveats.includes("Nutrition data incomplete."));
}

function testRegionMatchRanksFirst() {
  const current = makeProduct({ id: "current" });
  const us = betterCereal({ id: "us", barcode: "us", countriesTags: ["en:united-states"] });
  const france = betterCereal({ id: "france", barcode: "france", countriesTags: ["en:france"] });
  const result = resultFor(current, [france, us], { selectedRegion: "us" });
  assert.equal(result.matches[0].product.id, "us");
  assert.equal(result.matches[0].comparison.regionStatus, "match");
}

function testPlantVariantRemainsDistinct() {
  const current = makeProduct({ id: "nutella", barcode: "nutella", name: "Nutella Hazelnut Spread", categoryPath: "Hazelnut spreads" });
  const regular = betterCereal({ id: "regular-spread", barcode: "regular-spread", name: "Classic Hazelnut Spread", categoryPath: "Hazelnut spreads" });
  const plant = betterCereal({ id: "plant-spread", barcode: "plant-spread", name: "Plant-Based Hazelnut Spread", categoryPath: "Hazelnut spreads" });
  const comparable = filterComparableProducts(current, [regular, plant]);
  assert.deepEqual(new Set(comparable.map((item) => item.product.id)), new Set(["regular-spread", "plant-spread"]));
}

function testCurrentProductIsExcluded() {
  const current = makeProduct({ id: "current", barcode: "same-barcode" });
  const duplicate = betterCereal({ id: "duplicate-provider-record", barcode: "same-barcode" });
  assert.equal(resultFor(current, [duplicate]).status, "empty");
}

function testOverridesAreRespected() {
  const current = makeProduct({ id: "current", ingredients: [ingredient("E129", "harmful", "Color additive")] });
  const corrected = betterCereal({
    id: "corrected",
    barcode: "corrected",
    overrideApplied: true,
    ingredients: [ingredient("Whole grain oats"), ingredient("Sea salt")]
  });
  const result = resultFor(current, [corrected], { profile: { avoidedIngredients: ["Red 40"] } });
  assert.equal(result.matches[0].product, corrected);
  assert(result.matches[0].reasons.some((reason) => /red 40/i.test(reason)));
}

function testPlateSignalsOnlyApplyWhenAvailable() {
  const current = makeProduct({ id: "current" });
  const sugar = betterCereal({ id: "a-sugar", barcode: "a-sugar", nutrition: { ...betterCereal().nutrition, sugar: 4, sodium: 480 } });
  const sodium = betterCereal({ id: "z-sodium", barcode: "z-sodium", nutrition: { ...betterCereal().nutrition, sugar: 22, sodium: 80 } });
  const withoutPlate = resultFor(current, [sodium, sugar]);
  assert(!withoutPlate.matches.flatMap((match) => match.reasons).some((reason) => /current day|sodium goal/i.test(reason)));
  const withPlate = resultFor(current, [sugar, sodium], {
    plate: { goals: { sodium: 2300, sugar: 50, calories: 2000, protein: 120 }, totals: { sodium: 2100, sugar: 5, calories: 700, protein: 80 }, entryCount: 3 }
  });
  assert.equal(withPlate.matches[0].product.id, "z-sodium");
  assert(withPlate.matches[0].reasons.some((reason) => /sodium goal/i.test(reason)));
}

function testGeneratedCopyAvoidsBannedWording() {
  const result = resultFor(makeProduct({ id: "current" }), [betterCereal()]);
  const generated = result.matches.flatMap((match) => [match.label, ...match.reasons, ...match.caveats]).join(" ");
  assert(!/\b(?:safe|allergy-safe|safe for allergy|safe to eat|allergen-free|no allergen risk|guaranteed free from|healthy|good for you|harmless)\b/i.test(generated));
}

function testNoProductIsInvented() {
  const candidate = betterCereal();
  const result = resultFor(makeProduct({ id: "current" }), [candidate]);
  assert.equal(result.matches[0].product, candidate);
}

function testHonestEmptyState() {
  const current = makeProduct({ id: "current" });
  const unrelated = betterCereal({ id: "water", name: "Spring Water", categoryPath: "Waters" });
  const result = resultFor(current, [unrelated]);
  assert.equal(result.status, "empty");
  assert.equal(result.matches.length, 0);
  assert.match(result.emptyReason, /scan or search more similar products/i);
}

function testExistingScoreIsNotMutated() {
  const current = makeProduct({ id: "current" });
  const candidate = betterCereal();
  const before = JSON.stringify({ current, candidate });
  resultFor(current, [candidate]);
  assert.equal(JSON.stringify({ current, candidate }), before);
}

function testIngredientClassificationIsReused() {
  const current = makeProduct({ id: "current" });
  const candidate = betterCereal({
    ingredients: [{ name: "Existing classified additive", risk: "harmful", classificationKind: "concerning", type: "Color additive" }]
  });
  const before = JSON.stringify(candidate.ingredients);
  scoreBetterMatch(current, candidate);
  assert.equal(JSON.stringify(candidate.ingredients), before);
}

function testStableOutputShape() {
  const result = resultFor(makeProduct({ id: "current" }), [betterCereal()]);
  assert.deepEqual(Object.keys(result).sort(), ["candidateCount", "emptyReason", "matches", "status"]);
  const match = result.matches[0];
  assert.deepEqual(Object.keys(match).sort(), ["caveats", "comparison", "confidence", "isDemo", "label", "product", "rank", "reasons"]);
  assert.equal(Array.isArray(match.reasons), true);
  assert.equal(Array.isArray(match.caveats), true);
}

const tests = [
  testComparableProductsWin,
  testDifferentCategoriesAreRejected,
  testLowerSugarRanksForSugarGoal,
  testLowerSodiumRanksForSodiumGoal,
  testHigherProteinRanksForProteinGoal,
  testAvoidListConflictLowersRank,
  testRed40AliasResolution,
  testMissingIngredientsAreNotAutomaticImprovement,
  testMissingNutritionIsNotAutomaticImprovement,
  testRegionMatchRanksFirst,
  testPlantVariantRemainsDistinct,
  testCurrentProductIsExcluded,
  testOverridesAreRespected,
  testPlateSignalsOnlyApplyWhenAvailable,
  testGeneratedCopyAvoidsBannedWording,
  testNoProductIsInvented,
  testHonestEmptyState,
  testExistingScoreIsNotMutated,
  testIngredientClassificationIsReused,
  testStableOutputShape
];

tests.forEach((test) => test());
console.log(`Better Matches tests passed (${tests.length})`);
