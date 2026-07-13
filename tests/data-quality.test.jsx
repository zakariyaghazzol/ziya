import assert from "node:assert/strict";
import {
  applyStoredProductOverride,
  calculateDailyTotals,
  completeProductWithUserInput,
  createPlateEntry,
  createReportFromOcr,
  getNutritionLogProfile,
  lookupProductByBarcode,
  normalizeOpenFoodFactsProduct,
  normalizeNutrition,
  parseOpenFoodFactsIngredients
} from "../src/main.jsx";
import { sanitizeIngredientCandidates } from "../src/data/ingredientSanitizer.js";
import {
  PRODUCT_OVERRIDE_STORAGE_KEYS,
  loadOverrideProductSnapshots,
  loadProductHistory,
  saveProductHistory
} from "../src/data/productOverrides.js";
import { createProductSourceRouting, getKnowledgeSourceRoute } from "../src/data/sourceRouter.js";
import { resolveLocalIngredientKnowledge } from "../src/knowledge/ingredientKnowledge.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

globalThis.window = { localStorage: createMemoryStorage() };

function names(result) {
  return result.acceptedIngredients.map((item) => item.normalizedText.toLowerCase());
}

function testIngredientSanitation() {
  const noisy = sanitizeIngredientCandidates(
    "Allura Red AC, tm, o the jm, smucker company, orrville, on 44667 usa usage, artificial yellow &, salt, BHA, BHT, MSG, SLS, E127",
    { category: "food", sourceField: "ingredients_text", detectSection: false }
  );
  const accepted = names(noisy);
  assert(accepted.includes("allura red ac"));
  assert(accepted.includes("salt"));
  assert(accepted.includes("bha"));
  assert(accepted.includes("bht"));
  assert(accepted.includes("msg"));
  assert(accepted.includes("sls"));
  assert(accepted.includes("e127"));
  ["tm", "o the jm", "smucker company", "orrville", "on 44667 usa usage", "artificial yellow &"].forEach((fragment) => {
    assert(noisy.rejectedFragments.some((item) => item.originalText.toLowerCase() === fragment), `${fragment} should be rejected`);
  });

  const rawLabel = sanitizeIngredientCandidates(
    "Front panel copy. Ingredients: salt, Allura Red AC, artificial yellow &. Manufactured by Smucker Company, Orrville OH 44667 USA. Nutrition Facts: Calories 20",
    { category: "food", sourceField: "raw-label-ocr", requireSection: true }
  );
  assert.deepEqual(names(rawLabel), ["salt", "allura red ac"]);
  assert.equal(rawLabel.metadata.sectionDetected, true);

  const missingSection = sanitizeIngredientCandidates("Smucker Company Orrville OH 44667", {
    category: "food",
    sourceField: "raw-label-ocr",
    requireSection: true
  });
  assert.equal(missingSection.acceptedIngredients.length, 0);

  const french = sanitizeIngredientCandidates(
    "sirop de glucose-fructose, huile de palme, arôme naturel, colorant rouge no 3, farine de blé enrichie",
    { category: "food", sourceField: "ingredients_text", detectSection: false }
  );
  assert.deepEqual(names(french), ["high-fructose corn syrup", "palm oil", "natural flavor", "red no. 3", "enriched wheat flour"]);

  const spanish = sanitizeIngredientCandidates(
    "jarabe de maíz de alta fructosa, aceite de palma, colorante rojo no 3, E102",
    { category: "food", sourceField: "ingredients_text", detectSection: false }
  );
  assert(names(spanish).includes("high-fructose corn syrup"));
  assert(names(spanish).includes("e102"));

  const arabic = sanitizeIngredientCandidates("المكونات: سكر، ملح، زيت النخيل", {
    category: "food",
    sourceField: "raw-label-ocr",
    requireSection: true
  });
  assert.equal(arabic.acceptedIngredients.length, 3);
  assert(arabic.acceptedIngredients.every((item) => item.translationConfidence === "high"));

  const unknown = sanitizeIngredientCandidates("mushroom powder", {
    category: "food",
    sourceField: "ingredients_text",
    detectSection: false
  });
  assert.equal(unknown.acceptedIngredients.length, 1);
  assert.equal(resolveLocalIngredientKnowledge("mushroom powder", { category: "food" }).risk, "unknown");

  const brandedNoise = sanitizeIngredientCandidates("Example Crunch, salt", {
    category: "food",
    sourceField: "ingredients_text",
    detectSection: false,
    excludedTerms: ["Example Crunch"]
  });
  assert.deepEqual(names(brandedNoise), ["salt"]);
}

function testProviderParsingAndKnowledge() {
  const parsed = parseOpenFoodFactsIngredients({
    ingredients: [{ text: "salt" }, { text: "Allura Red AC" }, { text: "tm" }],
    ingredients_text: "salt, Allura Red AC, palm oil"
  });
  assert.deepEqual(parsed.ingredients.map((item) => item.name), ["Salt", "Allura Red AC"]);
  assert.equal(parsed.parsing.sourceField, "ingredients");
  assert(parsed.parsing.rejectedFragments.some((item) => item.originalText === "tm"));

  const red3 = resolveLocalIngredientKnowledge("E127", { category: "food" });
  const red40 = resolveLocalIngredientKnowledge("E129", { category: "food" });
  const yellow5 = resolveLocalIngredientKnowledge("tartrazine", { category: "food" });
  assert.equal(red3.canonicalName, "Erythrosine");
  assert.equal(red40.canonicalName, "Allura Red AC");
  assert.notEqual(red3.id, red40.id);
  assert.equal(yellow5.canonicalName, "Tartrazine");
  assert.match(red3.evidenceSummary, /not proof/i);
  assert(!/^red 3 causes cancer in humans/i.test(red3.evidenceSummary));

  assert.equal(resolveLocalIngredientKnowledge("TBHQ", { category: "food" }).type, "Antioxidant preservative");
  assert.match(resolveLocalIngredientKnowledge("sodium benzoate", { category: "food" }).use, /control/i);
  assert.equal(resolveLocalIngredientKnowledge("fragrance", { category: "beauty" }).category, "beauty");
  assert.equal(resolveLocalIngredientKnowledge("polyester", { category: "textile" }).category, "textile");
  assert(getKnowledgeSourceRoute("household").includes("chemical-identity-database"));

  const routes = createProductSourceRouting({
    providerType: "food-provider",
    hasIdentity: true,
    hasCategory: true,
    hasImage: true,
    hasIngredients: true,
    hasNutrition: false,
    hasAllergens: false,
    hasAdditives: true,
    overrideFields: ["nutrition"]
  });
  assert.equal(routes.decisions.ingredients.selected, "provider-ingredient-fields");
  assert.equal(routes.decisions.nutrition.selected, "user-nutrition-override");
}

function testRawReviewAndNutrition() {
  const report = createReportFromOcr({
    category: "food",
    mode: "ingredients",
    productName: "Noisy label",
    brand: "Example",
    ingredientsText: "",
    text: "Marketing copy Ingredients: salt, E129, artificial yellow &. Manufactured by Example Company, 44667 USA. Nutrition Facts: Calories 90",
    allergensText: "milk, wheat",
    nutrition: { basis: "serving", servingSize: "", calories: "90", protein: "-3", carbs: "12", fat: "2" }
  }, "");
  assert.deepEqual(report.ingredients.map((item) => item.name), ["Salt", "Allura Red AC"]);
  assert.equal(report.nutrition.protein, null);
  assert.equal(report.nutrition.fiber, null);
  assert.equal(report.allergens, "milk, wheat");
  assert.equal(getNutritionLogProfile(report), null, "serving-based food needs a serving size");

  const incomplete = createReportFromOcr({
    category: "food",
    mode: "nutrition",
    productName: "Incomplete product",
    brand: "Example",
    ingredientsText: "",
    text: "",
    nutrition: { basis: "serving", calories: "120" }
  }, "");
  assert.equal(incomplete.fieldConfidence.ingredients, "Missing");
  assert.equal(incomplete.fieldConfidence.additives, "Missing");

  const normalized = normalizeNutrition({ calories: -1, protein: "abc", carbs: 12, sodium: "250", servingSize: "" });
  assert.equal(normalized.calories, null);
  assert.equal(normalized.protein, null);
  assert.equal(normalized.carbs, 12);
  assert.equal(normalized.sodium, 250);
  assert.equal(normalized.servingSize, "");
}

function testLocalOverridesAndHistory() {
  window.localStorage.clear();
  const base = normalizeOpenFoodFactsProduct({
    product_name: "Incomplete snack",
    brands: "Example",
    categories: "Snacks",
    image_front_url: "https://images.example.test/snack.png",
    ingredients_text: "salt, palm oil",
    nutriments: {},
    additives_tags: [],
    allergens_tags: []
  }, "1234567890123");
  assert.equal(base.analysisPending, true);

  const corrected = completeProductWithUserInput(base, {
    category: "food",
    ingredientsText: "salt, palm oil, E129, tm, smucker company",
    allergensText: "milk",
    nutrition: {
      basis: "serving",
      servingSize: "30 g",
      calories: 150,
      protein: 3,
      carbs: 18,
      fat: 7,
      sugar: 2,
      sodium: 220
    }
  });
  assert.equal(corrected.overrideApplied, true);
  assert.equal(corrected.dataConfidence, "Manual Review");
  assert.equal(corrected.analysisPending, false);
  assert.equal(corrected.nutrition.fiber, null);
  assert.equal(corrected.ingredients.some((item) => /smucker|\btm\b/i.test(item.name)), false);
  assert(getNutritionLogProfile(corrected));

  const reapplied = applyStoredProductOverride(base);
  assert.equal(reapplied.nutrition.calories, 150);
  assert.equal(reapplied.ingredients.some((item) => item.name === "Allura Red AC"), true);
  assert.equal(reapplied.overrideApplied, true);

  const snapshots = loadOverrideProductSnapshots();
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].nutrition.calories, 150);

  saveProductHistory([{ id: "h-1", productId: corrected.id, date: "Today, just now" }]);
  assert.deepEqual(loadProductHistory(), [{ id: "h-1", productId: corrected.id, date: "Today, just now" }]);
  assert(window.localStorage.getItem(PRODUCT_OVERRIDE_STORAGE_KEYS.overrides));
  assert(window.localStorage.getItem(PRODUCT_OVERRIDE_STORAGE_KEYS.history));
}

function testTodayPlateRegression() {
  const product = {
    id: "plate-food",
    name: "Plate test food",
    brand: "Example",
    category: "food",
    nutrition: {
      basis: "serving",
      servingSize: "30 g",
      calories: 140,
      protein: 4,
      carbs: 20,
      fat: 5,
      fiber: null,
      sugar: 3,
      sodium: 220
    }
  };
  const entry = createPlateEntry(product, 1.5, "servings");
  assert.equal(entry.contribution.calories, 210);
  assert.equal(entry.contribution.protein, 6);
  assert.equal(entry.contribution.fiber, null);
  const totals = calculateDailyTotals([entry]);
  assert.equal(totals.calories.total, 210);
  assert.equal(totals.fiber.total, 0);
  assert.equal(totals.fiber.missingCount, 1);
}

async function testBarcodeRegression() {
  window.localStorage.clear();
  const unknown = await lookupProductByBarcode("0000000000000");
  assert.equal(unknown.status, "not_found");

  const known = await lookupProductByBarcode("3017620422003");
  assert.equal(known.status, "found");
  assert.match(known.product.name, /nutella/i);
  assert(known.product.image, "known barcode should retain a product image");
}

async function run() {
  testIngredientSanitation();
  testProviderParsingAndKnowledge();
  testRawReviewAndNutrition();
  testLocalOverridesAndHistory();
  testTodayPlateRegression();
  await testBarcodeRegression();
  console.log("Data-quality checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
