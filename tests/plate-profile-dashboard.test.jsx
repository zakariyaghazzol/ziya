import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PLATE_DEFAULT_GOALS,
  buildMacroChartData,
  calculateDailyTotals,
  createPlateEntry,
  removePlateEntryFromState,
  updatePlateEntryInState
} from "../src/main.jsx";
import { createEmptyProfile, sanitizeProfile } from "../src/profile/profileStore.js";
import { mergePlateStates } from "../src/data/cloudSync.js";

let passed = 0;

function test(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${name}`);
}

function food(overrides = {}) {
  return {
    id: "dashboard-food",
    name: "Dashboard food",
    brand: "Ziya Test",
    category: "food",
    image: "",
    nutrition: {
      basis: "serving",
      servingSize: "30 g",
      calories: 140,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 3,
      sugar: 4,
      sodium: 220
    },
    ...overrides
  };
}

test("Today’s Plate defaults remain stable", () => {
  assert.deepEqual(PLATE_DEFAULT_GOALS, {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 70,
    fiber: 28,
    sugar: 50,
    sodium: 2300
  });
});

test("serving contribution math remains stable", () => {
  const entry = createPlateEntry(food(), 1.5, "servings");
  assert.equal(entry.contribution.calories, 210);
  assert.equal(entry.contribution.protein, 15);
  assert.equal(entry.contribution.sodium, 330);
});

test("missing nutrients remain missing instead of becoming zero", () => {
  const entry = createPlateEntry(food({ nutrition: { ...food().nutrition, protein: null } }), 1, "servings");
  const totals = calculateDailyTotals([entry]);
  const macros = buildMacroChartData(totals, PLATE_DEFAULT_GOALS);
  const protein = macros.find((macro) => macro.nutrient === "protein");
  assert.equal(entry.contribution.protein, null);
  assert.equal(totals.protein.knownCount, 0);
  assert.equal(totals.protein.missingCount, 1);
  assert.equal(protein.total, null);
  assert.equal(protein.progress, 0);
  assert.equal(protein.partial, true);
});

test("macro chart data is derived from existing totals and goals", () => {
  const entry = createPlateEntry(food(), 2, "servings");
  const macros = buildMacroChartData(calculateDailyTotals([entry]), PLATE_DEFAULT_GOALS);
  assert.equal(macros.find((macro) => macro.nutrient === "protein").progress, (20 / 120) * 100);
  assert.equal(macros.find((macro) => macro.nutrient === "carbs").progress, 16);
  assert.equal(macros.find((macro) => macro.nutrient === "fat").progress, (10 / 70) * 100);
});

test("macro chart handles an empty day", () => {
  const macros = buildMacroChartData(calculateDailyTotals([]), PLATE_DEFAULT_GOALS);
  macros.forEach((macro) => {
    assert.equal(macro.total, 0);
    assert.equal(macro.progress, 0);
    assert.equal(macro.partial, false);
  });
});

test("macro chart uses the required nutrient identities", () => {
  const macros = buildMacroChartData(calculateDailyTotals([]), PLATE_DEFAULT_GOALS);
  assert.deepEqual(macros.map((macro) => [macro.nutrient, macro.tone]), [
    ["protein", "protein"],
    ["carbs", "carbs"],
    ["fat", "fat"]
  ]);
  const css = readFileSync("src/styles.css", "utf8");
  ["--macro-protein", "--macro-carbs", "--macro-fat", "--macro-empty"].forEach((token) => assert.match(css, new RegExp(token)));
});

test("food log entry IDs stay stable when another entry is edited", () => {
  const first = createPlateEntry(food({ id: "first" }), 1, "servings");
  const second = createPlateEntry(food({ id: "second", name: "Second food" }), 1, "servings");
  const state = {
    goals: { ...PLATE_DEFAULT_GOALS },
    days: { "2026-07-14": { goalsSnapshot: { ...PLATE_DEFAULT_GOALS }, entries: [first, second] } }
  };
  const updated = updatePlateEntryInState(state, "2026-07-14", first.id, 2);
  assert.equal(updated.days["2026-07-14"].entries[0].id, first.id);
  assert.equal(updated.days["2026-07-14"].entries[1].id, second.id);
  assert.equal(updated.days["2026-07-14"].entries[1].amount, 1);
});

test("removing one food does not corrupt remaining entries", () => {
  const first = createPlateEntry(food({ id: "remove-first" }), 1, "servings");
  const second = createPlateEntry(food({ id: "keep-second", name: "Keep food" }), 1, "servings");
  const state = { days: { "2026-07-14": { entries: [first, second] } } };
  const updated = removePlateEntryFromState(state, "2026-07-14", first.id);
  assert.deepEqual(updated.days["2026-07-14"].entries.map((entry) => entry.id), [second.id]);
});

test("Profile product and display preferences remain intact", () => {
  const profile = sanitizeProfile({
    ...createEmptyProfile(),
    productRegion: "fr",
    ingredientDisplayMode: "both",
    preferredLanguage: "fr",
    unitSystem: "metric"
  });
  assert.equal(profile.productRegion, "fr");
  assert.equal(profile.ingredientDisplayMode, "both");
  assert.equal(profile.preferredLanguage, "fr");
  assert.equal(profile.unitSystem, "metric");
});

test("Profile Label Watch arrays remain intact", () => {
  const profile = sanitizeProfile({
    allergies: ["milk"],
    dietPreferences: ["vegan"],
    avoidedIngredients: ["E129"],
    watchlistIngredients: ["carrageenan"]
  });
  assert.equal(profile.allergies[0].key, "milk");
  assert.deepEqual(profile.dietPreferences, ["vegan"]);
  assert.equal(profile.avoidedIngredients[0].knowledgeId, "allura-red-ac");
  assert.equal(profile.watchlistIngredients[0].knowledgeId, "carrageenan");
});

test("signed-in plate sync shape remains compatible", () => {
  const entry = createPlateEntry(food(), 1, "servings");
  const local = {
    goals: { ...PLATE_DEFAULT_GOALS },
    days: { "2026-07-14": { goalsSnapshot: { ...PLATE_DEFAULT_GOALS }, entries: [entry] } },
    updatedAt: "2026-07-14T12:00:00.000Z"
  };
  const merged = mergePlateStates(local, { goals: null, days: {}, updatedAt: null });
  assert.deepEqual(merged.goals, PLATE_DEFAULT_GOALS);
  assert.equal(merged.days["2026-07-14"].entries[0].id, entry.id);
  assert.equal(merged.days["2026-07-14"].entries[0].contribution.calories, 140);
});

test("dashboard copy avoids medical-certainty wording", () => {
  const source = readFileSync("src/main.jsx", "utf8");
  const start = source.indexOf("function TodayPlateScreen");
  const end = source.indexOf("function ProductListCard", start);
  const dashboardSource = source.slice(start, end).toLowerCase();
  ["allergy-safe", "safe for allergy", "safe to eat", "allergen-free", "no allergen risk", "guaranteed free from"].forEach((phrase) => {
    assert.equal(dashboardSource.includes(phrase), false, `unexpected phrase: ${phrase}`);
  });
});

console.log(`\n${passed} plate/profile dashboard tests passed.`);
