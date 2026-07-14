import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeHistoryItems, mergePlateStates } from "../src/data/cloudSync.js";
import { loadProductHistory, saveProductHistory } from "../src/data/productOverrides.js";
import { getPersonalAlerts } from "../src/profile/personalAlerts.js";
import {
  PROFILE_STORAGE_KEY,
  createEmptyProfile,
  loadLocalProfile,
  mergeProfiles,
  normalizeAllergyPreference,
  normalizeIngredientPreference,
  saveLocalProfile,
  touchProfile
} from "../src/profile/profileStore.js";

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

function profileWith(changes) {
  return touchProfile({ ...createEmptyProfile(), ...changes });
}

function testPersonalAlerts() {
  const profile = profileWith({
    allergies: [normalizeAllergyPreference("milk")],
    dietPreferences: ["vegetarian", "low sodium"],
    avoidedIngredients: [normalizeIngredientPreference("E129")],
    watchlistIngredients: [normalizeIngredientPreference("carrageenan")]
  });
  const score = 72;
  const product = {
    id: "corrected-food",
    category: "food",
    score,
    overrideApplied: true,
    allergens: "Milk",
    ingredients: [
      { name: "Whey" },
      { name: "Allura Red AC" },
      { name: "Gelatin" },
      { name: "Carrageenan" }
    ],
    additives: { tags: ["en:e129"] },
    nutrition: { sodium: 610 }
  };
  const alerts = getPersonalAlerts(product, profile);

  assert(alerts.some((alert) => alert.kind === "allergy" && alert.title === "Milk"));
  assert(alerts.some((alert) => alert.kind === "avoid" && /red 40/i.test(alert.title)));
  assert(alerts.some((alert) => alert.kind === "preference" && /vegetarian/i.test(alert.title)));
  assert(alerts.some((alert) => alert.kind === "preference" && alert.title === "High sodium"));
  assert(alerts.some((alert) => alert.kind === "watchlist" && /carrageenan/i.test(alert.title)));
  assert.equal(alerts.find((alert) => alert.kind === "watchlist").level, "info");
  assert.equal(product.score, score, "personal alerts must not change the base score");

  const red40 = normalizeIngredientPreference("Red 40");
  const e129 = normalizeIngredientPreference("E129");
  assert.equal(red40.key, e129.key, "E129 and Red 40 should share one knowledge identity");
}

function testMissingDataIsNotSafe() {
  const profile = profileWith({
    allergies: [normalizeAllergyPreference("milk")],
    avoidedIngredients: [normalizeIngredientPreference("Red 40")]
  });
  const alerts = getPersonalAlerts({ id: "partial", category: "food", ingredients: [], allergens: "", nutrition: {} }, profile);
  assert(alerts.some((alert) => alert.kind === "data" && /not enough label data/i.test(alert.message)));
  assert(!alerts.some((alert) => /safe/i.test(`${alert.title} ${alert.message}`)));
}

function testLocalPersistence() {
  window.localStorage.clear();
  const profile = profileWith({
    allergies: [normalizeAllergyPreference("milk")],
    preferredLanguage: "fr",
    productRegion: "fr",
    ingredientDisplayMode: "both",
    unitSystem: "metric"
  });
  assert.equal(saveLocalProfile(profile), true);
  assert(window.localStorage.getItem(PROFILE_STORAGE_KEY));
  const loaded = loadLocalProfile();
  assert.equal(loaded.allergies[0].key, "milk");
  assert.equal(loaded.preferredLanguage, "fr");
  assert.equal(loaded.productRegion, "fr");
  assert.equal(loaded.ingredientDisplayMode, "both");
  assert.equal(loaded.unitSystem, "metric");

  window.localStorage.setItem(PROFILE_STORAGE_KEY, "not json");
  assert.deepEqual(loadLocalProfile().allergies, []);

  const productSnapshot = { id: "food-1", name: "Saved food", brand: "Ziya", category: "food" };
  assert.equal(saveProductHistory([{ id: "scan-1", productId: "food-1", date: "Today", scannedAt: "2026-07-13T12:00:00.000Z", productSnapshot }]), true);
  assert.equal(loadProductHistory()[0].productSnapshot.name, "Saved food");
}

function testConservativeProfileMerge() {
  const local = { ...profileWith({
    allergies: [normalizeAllergyPreference("milk")],
    preferredLanguage: "fr",
    productRegion: "fr",
    ingredientDisplayMode: "original"
  }), updatedAt: "2026-07-13T15:00:00.000Z" };
  const cloud = { ...profileWith({
    allergies: [normalizeAllergyPreference("peanuts")],
    watchlistIngredients: [normalizeIngredientPreference("carrageenan")],
    preferredLanguage: "es"
  }), updatedAt: "2026-07-12T15:00:00.000Z" };
  const merged = mergeProfiles(local, cloud);
  assert.deepEqual(new Set(merged.allergies.map((item) => item.key)), new Set(["milk", "peanuts"]));
  assert.equal(merged.watchlistIngredients.length, 1);
  assert.equal(merged.preferredLanguage, "fr", "newer scalar preference should win");
  assert.equal(merged.productRegion, "fr", "newer region preference should win");
  assert.equal(merged.ingredientDisplayMode, "original", "newer display mode should win");
}

function testDailyAndHistoryMerge() {
  const localEntry = { id: "meal-1", addedAt: "2026-07-13T12:00:00.000Z", updatedAt: "2026-07-13T12:00:00.000Z", contribution: { calories: 100 } };
  const cloudEntry = { ...localEntry, updatedAt: "2026-07-13T13:00:00.000Z", contribution: { calories: 120 } };
  const mergedPlate = mergePlateStates(
    { goals: { calories: 2000 }, days: { "2026-07-13": { entries: [localEntry] } }, updatedAt: "2026-07-13T12:00:00.000Z" },
    { goals: { calories: 2200 }, days: { "2026-07-13": { entries: [cloudEntry] } }, updatedAt: "2026-07-13T13:00:00.000Z" }
  );
  assert.equal(mergedPlate.days["2026-07-13"].entries.length, 1);
  assert.equal(mergedPlate.days["2026-07-13"].entries[0].contribution.calories, 120);
  assert.equal(mergedPlate.goals.calories, 2200);

  const mergedHistory = mergeHistoryItems(
    [{ id: "scan-1", productId: "food-1", scannedAt: "2026-07-13T12:00:00.000Z" }],
    [{ id: "scan-1", productId: "food-1", scannedAt: "2026-07-13T11:00:00.000Z" }, { id: "scan-2", productId: "food-2", scannedAt: "2026-07-13T14:00:00.000Z" }]
  );
  assert.equal(mergedHistory.length, 2);
  assert.equal(mergedHistory[0].id, "scan-2");
}

function testPrivateCloudSchema() {
  const sql = readFileSync("supabase/migrations/202607130001_profile_sync.sql", "utf8");
  ["profiles", "profile_preferences", "today_plate_goals", "today_plate_logs", "scan_history", "product_overrides"].forEach((table) => {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  });
  assert.match(sql, /to authenticated/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert(!/service_role/i.test(sql), "migration must not grant a frontend service-role path");
}

testPersonalAlerts();
testMissingDataIsNotSafe();
testLocalPersistence();
testConservativeProfileMerge();
testDailyAndHistoryMerge();
testPrivateCloudSchema();

console.log("Profile personalization tests passed.");
