import assert from "node:assert/strict";
import { flattenParsedIngredients, normalizeIngredientName, parseIngredientList } from "../src/lib/ingredientParser.js";
import { classifyIngredient } from "../src/lib/ingredientClassifier.js";

function names(parsed) {
  return flattenParsedIngredients(parsed).map((item) => item.normalizedName);
}

function testBasicSplit() {
  const parsed = parseIngredientList("tomato puree, sunflower oil, salt, sugar");
  assert.deepEqual(names(parsed), ["tomato puree", "sunflower oil", "salt", "sugar"]);
}

function testNestedIngredients() {
  const parsed = parseIngredientList("Chocolate chips (sugar, chocolate liquor, cocoa butter, soy lecithin), enriched wheat flour");
  assert.equal(parsed.directIngredients.length, 2);
  assert.equal(parsed.directIngredients[0].normalizedName, "chocolate chips");
  assert.deepEqual(parsed.directIngredients[0].children.map((item) => item.normalizedName), ["sugar", "chocolate liquor", "cocoa butter", "soy lecithin"]);
  assert.equal(parsed.directIngredients[1].normalizedName, "enriched wheat flour");
  assert(parsed.directIngredients[0].children.every((item) => item.parentName === "chocolate chips"));
}

function testOilAlternatives() {
  const parsed = parseIngredientList("vegetable oil (canola and/or soybean oil)");
  assert.equal(parsed.directIngredients[0].normalizedName, "vegetable oil");
  assert.deepEqual(parsed.directIngredients[0].children.map((item) => item.normalizedName), ["canola oil", "soybean oil"]);
}

function testPercentagePhrase() {
  const parsed = parseIngredientList("contains 2% or less of salt, natural flavor");
  assert.deepEqual(names(parsed), ["salt", "natural flavor"]);
  assert.equal(parsed.containsStatements.length, 0);
}

function testAllergenParentheticals() {
  const parsed = parseIngredientList("whey (milk), lecithin (soy), flour (wheat)");
  assert.deepEqual(parsed.directIngredients.map((item) => item.normalizedName), ["whey", "lecithin", "flour"]);
  assert.deepEqual(parsed.directIngredients.map((item) => item.allergenSources[0]), ["milk", "soy", "wheat"]);
  assert(parsed.directIngredients.every((item) => item.children.length === 0));
}

function testStatements() {
  const contains = parseIngredientList("Contains: wheat, milk, soy");
  assert.equal(contains.directIngredients.length, 0);
  assert.deepEqual(contains.containsStatements[0], {
    rawText: "Contains: wheat, milk, soy",
    type: "contains_statement",
    sources: ["wheat", "milk", "soy"]
  });

  const advisory = parseIngredientList("May contain peanuts and tree nuts.");
  assert.equal(advisory.advisoryStatements[0].type, "advisory_trace");
  assert.deepEqual(advisory.advisoryStatements[0].sources, ["peanuts", "tree nuts"]);

  const facility = parseIngredientList("Made in a facility that also processes milk and tree nuts.");
  assert.equal(facility.advisoryStatements[0].type, "facility_trace");
  assert.deepEqual(facility.advisoryStatements[0].sources, ["milk", "tree nuts"]);
}

function testNormalizationAndAliases() {
  assert.equal(normalizeIngredientName("tomato purée"), "tomato puree");
  assert.equal(normalizeIngredientName("natural flavour"), "natural flavor");
  assert.equal(normalizeIngredientName("mono– and diglycerides"), "mono- and diglycerides");
  assert.equal(classifyIngredient("E129", { category: "food" }).canonicalName, "Allura Red AC");
}

function testGarbageAndHierarchy() {
  const parsed = parseIngredientList("salt, Smucker Company, 123 Main Street, chocolate chips (sugar, cocoa butter)");
  assert(names(parsed).includes("salt"));
  assert(names(parsed).includes("chocolate chips"));
  assert(names(parsed).includes("sugar"));
  assert(parsed.rejectedFragments.some((item) => /company/i.test(item.rawName)));
  assert(parsed.rejectedFragments.some((item) => /street/i.test(item.rawName)));
  assert.equal(parsed.directIngredients.at(-1).children.length, 2);
}

testBasicSplit();
testNestedIngredients();
testOilAlternatives();
testPercentagePhrase();
testAllergenParentheticals();
testStatements();
testNormalizationAndAliases();
testGarbageAndHierarchy();

console.log("Ingredient parser checks passed.");
