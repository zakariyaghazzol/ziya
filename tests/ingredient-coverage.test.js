import assert from "node:assert/strict";
import { COMMON_INGREDIENT_ATLAS, getCommonIngredientAtlasSize } from "../src/data/commonIngredientAtlas.js";
import { classifyIngredient } from "../src/lib/ingredientClassifier.js";
import { evaluateIngredientCoverage } from "../src/lib/ingredientCoverage.js";
import { resolveLocalIngredientKnowledge } from "../src/knowledge/ingredientKnowledge.js";
import { getPersonalAlerts } from "../src/profile/personalAlerts.js";

function expectCommon(input, expectedType, expectedStatus = "Common ingredient") {
  const result = classifyIngredient(input, { category: "food" });
  assert.equal(result.classificationKind, "common", `${input} should be common`);
  assert.match(result.type, new RegExp(expectedType, "i"));
  assert.equal(result.statusLabel, expectedStatus);
  assert(!/\bsafe\b/i.test(`${result.statusLabel} ${result.statusDescription}`));
  return result;
}

function testAtlasQuality() {
  assert(getCommonIngredientAtlasSize() >= 300, `expected at least 300 records, found ${getCommonIngredientAtlasSize()}`);
  assert.equal(new Set(COMMON_INGREDIENT_ATLAS.map((item) => item.canonicalName)).size, COMMON_INGREDIENT_ATLAS.length);
  COMMON_INGREDIENT_ATLAS.forEach((item) => {
    assert(item.plainDescription && item.whyUsed && item.nutritionRole, `${item.canonicalName} needs full explanatory fields`);
  });
}

function testCommonAndVagueCoverage() {
  expectCommon("sunflower oil", "plant oil");
  assert.equal(classifyIngredient("sunflower seed oil", { category: "food" }).canonicalName, "sunflower oil");
  expectCommon("tomato puree", "tomato product");
  assert.equal(classifyIngredient("tomato purée", { category: "food" }).canonicalName, "tomato puree");
  assert.equal(expectCommon("sugar", "sweetener").scoreRisk, "moderate", "presentation enrichment must not change the existing score signal");
  expectCommon("salt", "seasoning", "Sodium source");
  const wheat = expectCommon("wheat flour", "grain flour", "Wheat source");
  assert.equal(wheat.dietFlags.glutenFree, "not_compatible");
  assert.equal(classifyIngredient("enriched wheat flour", { category: "food" }).canonicalName, "wheat flour");
  expectCommon("milk powder", "dairy ingredient", "Milk source");
  expectCommon("soy lecithin", "emulsifier", "Soy source");

  const hazelnuts = expectCommon("noisettes", "nut", "Tree nut source");
  assert.equal(hazelnuts.canonicalName, "hazelnuts");
  assert(hazelnuts.allergenSources.includes("tree nuts"));

  const wheyPowder = expectCommon("lactoserum en poudre", "dairy ingredient", "Milk source");
  assert.equal(wheyPowder.canonicalName, "whey powder");
  assert(wheyPowder.allergenSources.includes("milk"));

  const vanillin = expectCommon("vanilline", "flavoring compound", "Common flavoring");
  assert.equal(vanillin.canonicalName, "vanillin");

  assert.equal(expectCommon("sucre", "sweetener").canonicalName, "sugar");
  assert.equal(expectCommon("cacao maigre", "cocoa").canonicalName, "cocoa powder");
  assert.equal(expectCommon("lait écrémé en poudre", "dairy ingredient", "Milk source").canonicalName, "skim milk powder");

  ["natural flavor", "artificial flavor", "spices", "vegetable oil", "emulsifiants"].forEach((input) => {
    const result = classifyIngredient(input, { category: "food" });
    assert.equal(result.classificationKind, "vague", `${input} should be limited-detail`);
    assert.equal(result.statusLabel, "Limited detail");
  });

  const starch = classifyIngredient("modified food starch", { category: "food" });
  assert.equal(starch.classificationKind, "common");
  assert(starch.processingMarkers.length > 0);
  assert.equal(starch.statusLabel, "Processing marker");
  const maltodextrin = classifyIngredient("maltodextrin", { category: "food" });
  assert(maltodextrin.processingMarkers.length > 0);
}

function testAdditivePriorityAndAliases() {
  const cases = [
    ["Red 40", "Allura Red AC"], ["E129", "Allura Red AC"], ["Red 3", "Erythrosine"], ["E127", "Erythrosine"],
    ["Yellow 5", "Tartrazine"], ["E102", "Tartrazine"], ["Yellow 6", "Sunset Yellow FCF"], ["E110", "Sunset Yellow FCF"],
    ["Blue 1", "Brilliant Blue FCF"], ["E133", "Brilliant Blue FCF"], ["Blue 2", "Indigo carmine"], ["E132", "Indigo carmine"],
    ["titanium dioxide", "Titanium dioxide"], ["E171", "Titanium dioxide"]
  ];
  cases.forEach(([input, canonical]) => {
    const result = classifyIngredient(input, { category: "food" });
    assert.equal(result.canonicalName, canonical, `${input} should resolve to ${canonical}`);
    assert.equal(result.classificationKind, "known_concern");
  });
  ["carrageenan", "sodium benzoate", "potassium sorbate", "TBHQ"].forEach((input) => {
    assert.equal(classifyIngredient(input, { category: "food" }).classificationKind, "known_concern");
  });
  assert.notEqual(classifyIngredient("Red 3", { category: "food" }).canonicalName, classifyIngredient("Red 40", { category: "food" }).canonicalName);
}

function testUnknownAndAllergens() {
  const unknown = classifyIngredient("zxqv mystery crystal flakes", { category: "food" });
  assert.equal(unknown.classificationKind, "unknown");
  assert.equal(unknown.statusLabel, "Needs review");
  assert.match(unknown.rowSubtitle, /not enough data/i);
  assert(!/common ingredient/i.test(unknown.statusLabel));

  const milk = classifyIngredient("whey", { category: "food" });
  assert(milk.allergenSources.includes("milk"));
  const soy = classifyIngredient("soy lecithin", { category: "food" });
  assert(soy.allergenSources.includes("soy"));
}

function testPersonalAlertRegression() {
  const profile = {
    allergies: [{ key: "milk", label: "Milk" }],
    dietPreferences: [],
    avoidedIngredients: [{ key: "allura-red-ac", label: "Red 40 / Allura Red AC", knowledgeId: "allura-red-ac", canonicalName: "Allura Red AC", aliases: ["Red 40", "E129"] }],
    watchlistIngredients: [],
    preferredLanguage: "en",
    unitSystem: "us"
  };
  const product = {
    category: "food",
    ingredients: [
      { name: "Whey", allergenSources: ["milk"] },
      { name: "E129", knowledgeId: "allura-red-ac" }
    ],
    allergens: "milk",
    nutrition: {}
  };
  const alerts = getPersonalAlerts(product, profile);
  assert(alerts.some((item) => item.kind === "allergy"));
  assert(alerts.some((item) => item.kind === "avoid"));
}

const CORPUS = [
  ["tomato sauce", "tomato puree, diced tomatoes, sunflower oil, salt, sugar, garlic powder, onion powder, citric acid, natural flavor"],
  ["cereal", "whole grain corn, sugar, corn flour, corn syrup, salt, red 40, yellow 5, blue 1, natural flavor"],
  ["cookies", "enriched wheat flour, sugar, palm oil, cocoa powder, chocolate chips (sugar, chocolate liquor, cocoa butter, soy lecithin), baking soda, salt, natural flavor"],
  ["chips", "potato, sunflower oil, sea salt, onion powder, garlic powder, paprika, natural flavor"],
  ["candy", "sugar, corn syrup, cocoa butter, milk powder, soy lecithin, red 3, natural flavor"],
  ["ice cream", "milk, cream, sugar, skim milk powder, egg yolk, vanilla extract, guar gum, carrageenan"],
  ["yogurt", "milk, skim milk, sugar, strawberry puree, pectin, cultures, natural flavor"],
  ["frozen meal", "brown rice, chicken broth, carrot, green peas, corn starch, salt, black pepper, spices"],
  ["protein bar", "pea protein isolate, brown rice syrup, peanut butter, cocoa powder, sunflower oil, soy lecithin, natural flavor"],
  ["bread", "whole wheat flour, water, yeast, cane sugar, wheat gluten, salt, canola oil"],
  ["crackers", "enriched wheat flour, canola oil, cheddar cheese, salt, baking soda, paprika, soy lecithin"],
  ["plant milk", "almondmilk, calcium carbonate, sea salt, sunflower lecithin, gellan gum, natural flavor, vitamin a palmitate, vitamin d2"],
  ["juice", "water, apple juice concentrate, grape juice concentrate, citric acid, natural flavor"],
  ["dressing", "canola oil, water, vinegar, sugar, egg yolk, salt, mustard, xanthan gum, spices"],
  ["peanut butter", "peanuts, sugar, palm oil, salt"],
  ["baby puree", "apple puree, banana puree, carrot puree, lemon juice concentrate"]
];

function testMessyCorpus() {
  CORPUS.forEach(([label, ingredients]) => {
    const coverage = evaluateIngredientCoverage(ingredients, { category: "food", sourceProductName: label });
    assert(coverage.coveragePercent >= 85, `${label} coverage was ${coverage.coveragePercent}%: ${coverage.unknownTerms.join(", ")}`);
    assert.equal(coverage.total, coverage.classifications.length);
  });
  const tomato = evaluateIngredientCoverage(CORPUS[0][1], { category: "food" });
  assert.equal(tomato.unknown, 0);
  assert(tomato.vague >= 1);
  assert(tomato.provenanceSummary.local_common_atlas >= 7);
}

function testDetailExplanations() {
  const common = resolveLocalIngredientKnowledge("sunflower seed oil", { category: "food" });
  assert.match(common.summary, /plant-derived oil/i);
  assert.match(common.use, /fat|texture|cooking/i);
  assert.match(common.nutritionRole, /fat and calories/i);
  assert.equal(common.statusLabel, "Common ingredient");
  assert(!/\bsafe\b/i.test(`${common.statusLabel} ${common.statusDescription} ${common.evidenceSummary}`));
}

testAtlasQuality();
testCommonAndVagueCoverage();
testAdditivePriorityAndAliases();
testUnknownAndAllergens();
testPersonalAlertRegression();
testMessyCorpus();
testDetailExplanations();

console.log("Ingredient coverage checks passed.");
