import { normalizeKnowledgeKey, resolveLocalIngredientKnowledge } from "../knowledge/ingredientKnowledge";
import { sanitizeProductRegion } from "../data/productRegionConfig";
import { sanitizeIngredientDisplayMode } from "../lib/ingredientDisplayName";

export const PROFILE_STORAGE_KEY = "ziya-personal-profile-v1";
const PROFILE_VERSION = 1;

export const COMMON_ALLERGIES = Object.freeze([
  { key: "milk", label: "Milk" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "shellfish", label: "Shellfish" },
  { key: "tree nuts", label: "Tree nuts" },
  { key: "peanuts", label: "Peanuts" },
  { key: "wheat", label: "Wheat" },
  { key: "soy", label: "Soy" },
  { key: "sesame", label: "Sesame" }
]);

export const DIET_PREFERENCES = Object.freeze([
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Kosher" },
  { key: "gluten-free", label: "Gluten-free" },
  { key: "dairy-free", label: "Dairy-free" },
  { key: "low sugar", label: "Low sugar" },
  { key: "low sodium", label: "Low sodium" }
]);

export const PROFILE_LANGUAGES = Object.freeze([
  { key: "auto", label: "Auto" },
  { key: "en", label: "English" },
  { key: "fr", label: "French" },
  { key: "es", label: "Spanish" },
  { key: "ar", label: "Arabic" }
]);

export const PROFILE_UNITS = Object.freeze([
  { key: "us", label: "US" },
  { key: "metric", label: "Metric" }
]);

const ALLERGY_KEY_ALIASES = new Map([
  ["egg", "eggs"],
  ["eggs", "eggs"],
  ["dairy", "milk"],
  ["milk", "milk"],
  ["peanut", "peanuts"],
  ["peanuts", "peanuts"],
  ["tree nut", "tree nuts"],
  ["tree nuts", "tree nuts"],
  ["shell fish", "shellfish"],
  ["shellfish", "shellfish"]
]);

function cleanText(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function titleCase(value) {
  return String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}

function preferenceKey(value) {
  return normalizeKnowledgeKey(value).replace(/\s+/g, " ");
}

export function normalizeAllergyPreference(value) {
  const originalInput = cleanText(typeof value === "object" ? value.originalInput || value.label || value.key : value);
  const rawKey = preferenceKey(typeof value === "object" ? value.key || originalInput : originalInput);
  if (!rawKey) return null;
  const key = ALLERGY_KEY_ALIASES.get(rawKey) || rawKey;
  const common = COMMON_ALLERGIES.find((item) => item.key === key);
  return {
    key,
    label: common?.label || cleanText(typeof value === "object" ? value.label : "") || titleCase(originalInput),
    originalInput: originalInput || common?.label || key
  };
}

function familiarIngredientAlias(knowledge) {
  return knowledge.aliases?.find((alias) => /^red\s+\d+$/i.test(alias))
    || knowledge.aliases?.find((alias) => /^(?:msg|sls|sles|bha|bht)$/i.test(alias))
    || null;
}

export function normalizeIngredientPreference(value) {
  const originalInput = cleanText(typeof value === "object" ? value.originalInput || value.label || value.canonicalName || value.key : value);
  if (!originalInput) return null;
  const knowledge = resolveLocalIngredientKnowledge(originalInput);
  const matched = knowledge.confidence !== "low" && !knowledge.id.startsWith("unknown-");
  const canonicalName = matched ? knowledge.canonicalName : originalInput;
  const familiarAlias = matched ? familiarIngredientAlias(knowledge) : null;
  const label = familiarAlias && preferenceKey(familiarAlias) !== preferenceKey(canonicalName)
    ? `${familiarAlias} / ${canonicalName}`
    : canonicalName;
  return {
    key: matched ? knowledge.id : preferenceKey(originalInput),
    label: cleanText(typeof value === "object" ? value.label : "") || label,
    canonicalName,
    originalInput,
    knowledgeId: matched ? knowledge.id : null
  };
}

function normalizePreferenceArray(values, normalizer) {
  const unique = new Map();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const item = normalizer(value);
    if (item?.key && !unique.has(item.key)) unique.set(item.key, item);
  });
  return [...unique.values()].slice(0, 80);
}

function normalizeDietPreferences(values) {
  const allowed = new Set(DIET_PREFERENCES.map((item) => item.key));
  return [...new Set((Array.isArray(values) ? values : []).map(preferenceKey).filter((value) => allowed.has(value)))];
}

function sanitizeGoals(value) {
  if (!value || typeof value !== "object") return null;
  const nutrients = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];
  const goals = {};
  for (const nutrient of nutrients) {
    const amount = Number(value[nutrient]);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    goals[nutrient] = amount;
  }
  return goals;
}

export function createEmptyProfile() {
  return {
    version: PROFILE_VERSION,
    allergies: [],
    dietPreferences: [],
    avoidedIngredients: [],
    watchlistIngredients: [],
    preferredLanguage: "en",
    productRegion: "global",
    ingredientDisplayMode: "translated",
    unitSystem: "us",
    todayPlateGoals: null,
    updatedAt: null
  };
}

export function sanitizeProfile(value) {
  const profile = value && typeof value === "object" ? value : {};
  return {
    version: PROFILE_VERSION,
    allergies: normalizePreferenceArray(profile.allergies, normalizeAllergyPreference),
    dietPreferences: normalizeDietPreferences(profile.dietPreferences),
    avoidedIngredients: normalizePreferenceArray(profile.avoidedIngredients, normalizeIngredientPreference),
    watchlistIngredients: normalizePreferenceArray(profile.watchlistIngredients, normalizeIngredientPreference),
    preferredLanguage: PROFILE_LANGUAGES.some((item) => item.key === profile.preferredLanguage) ? profile.preferredLanguage : "en",
    productRegion: sanitizeProductRegion(profile.productRegion),
    ingredientDisplayMode: sanitizeIngredientDisplayMode(profile.ingredientDisplayMode),
    unitSystem: PROFILE_UNITS.some((item) => item.key === profile.unitSystem) ? profile.unitSystem : "us",
    todayPlateGoals: sanitizeGoals(profile.todayPlateGoals),
    updatedAt: validDate(profile.updatedAt)
  };
}

export function touchProfile(profile, changes = {}) {
  return sanitizeProfile({ ...profile, ...changes, updatedAt: new Date().toISOString() });
}

export function loadLocalProfile() {
  if (typeof window === "undefined") return createEmptyProfile();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "null");
    return parsed?.version === PROFILE_VERSION ? sanitizeProfile(parsed) : createEmptyProfile();
  } catch {
    return createEmptyProfile();
  }
}

export function saveLocalProfile(profile) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitizeProfile(profile)));
    return true;
  } catch {
    return false;
  }
}

function mergeEntries(localItems, cloudItems, normalizer) {
  const merged = new Map();
  [...(cloudItems || []), ...(localItems || [])].forEach((value) => {
    const item = normalizer(value);
    if (item?.key) merged.set(item.key, item);
  });
  return [...merged.values()];
}

export function mergeProfiles(localValue, cloudValue) {
  const local = sanitizeProfile(localValue);
  const cloud = sanitizeProfile(cloudValue);
  const localTime = local.updatedAt ? Date.parse(local.updatedAt) : 0;
  const cloudTime = cloud.updatedAt ? Date.parse(cloud.updatedAt) : 0;
  const newest = cloudTime > localTime ? cloud : local;
  return sanitizeProfile({
    ...newest,
    allergies: mergeEntries(local.allergies, cloud.allergies, normalizeAllergyPreference),
    dietPreferences: [...new Set([...local.dietPreferences, ...cloud.dietPreferences])],
    avoidedIngredients: mergeEntries(local.avoidedIngredients, cloud.avoidedIngredients, normalizeIngredientPreference),
    watchlistIngredients: mergeEntries(local.watchlistIngredients, cloud.watchlistIngredients, normalizeIngredientPreference),
    todayPlateGoals: newest.todayPlateGoals || local.todayPlateGoals || cloud.todayPlateGoals,
    updatedAt: new Date(Math.max(localTime, cloudTime, Date.now())).toISOString()
  });
}

export function hasMeaningfulProfile(profileValue) {
  const profile = sanitizeProfile(profileValue);
  return Boolean(
    profile.allergies.length
      || profile.dietPreferences.length
      || profile.avoidedIngredients.length
      || profile.watchlistIngredients.length
      || profile.preferredLanguage !== "en"
      || profile.productRegion !== "global"
      || profile.ingredientDisplayMode !== "translated"
      || profile.unitSystem !== "us"
      || profile.todayPlateGoals
  );
}
