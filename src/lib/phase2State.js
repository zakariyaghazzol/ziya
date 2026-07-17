import { getLongTermGoalTemplate, getWeeklyGoalTemplate } from "../data/restaurantGoalRules";
import { isSupportedLocationContext } from "../data/locationContextTypes";

export const PHASE2_STORAGE_KEY = "ziya-context-layer-v1";
export const PHASE2_STATE_VERSION = 1;

const MAX_ITEMS = Object.freeze({
  weeklyGoals: 20,
  longTermGoals: 20,
  activities: 1000,
  restaurants: 100,
  restaurantMeals: 1000,
  receiptReviews: 200,
  savedPlaces: 100,
  dismissedNudges: 200,
  deletedItems: 1000
});

export const DEFAULT_CONTEXT_SETTINGS = Object.freeze({
  locationEnabled: false,
  notificationsEnabled: false,
  nudgesEnabled: false,
  saveReceiptText: true,
  savePhotosLocally: false,
  locationPermission: "idle",
  lastLocationCheckAt: null,
  updatedAt: null
});

function text(value, max = 180) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function number(value, fallback = null) {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function iso(value, fallback = null) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function validId(value, prefix) {
  const candidate = text(value, 120).replace(/[^a-zA-Z0-9:_-]/g, "-");
  return candidate || createPhase2Id(prefix);
}

function sanitizeNutrition(value) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"].flatMap((key) => {
      const parsed = number(value[key]);
      return parsed === null || parsed < 0 ? [] : [[key, parsed]];
    })
  );
}

function sanitizeWeeklyGoal(goal) {
  if (!goal || typeof goal !== "object") return null;
  const template = getWeeklyGoalTemplate(goal.templateId || goal.id);
  if (!template) return null;
  const target = number(goal.target, template.defaultTarget);
  return {
    id: validId(goal.instanceId || goal.id, "weekly"),
    templateId: template.id,
    label: text(goal.label, 100) || template.label,
    target: Math.max(0.1, target),
    enabled: goal.enabled !== false,
    createdAt: iso(goal.createdAt, new Date().toISOString()),
    updatedAt: iso(goal.updatedAt, new Date().toISOString())
  };
}

function sanitizeLongTermGoal(goal) {
  if (!goal || typeof goal !== "object") return null;
  const template = getLongTermGoalTemplate(goal.templateId || goal.id);
  if (!template) return null;
  const target = number(goal.target, template.defaultTarget);
  const durationDays = number(goal.durationDays, template.defaultDurationDays);
  return {
    id: validId(goal.instanceId || goal.id, "long"),
    templateId: template.id,
    label: text(goal.label, 100) || template.label,
    target: Math.max(0.1, target),
    durationDays: Math.min(365, Math.max(7, durationDays)),
    trackedValue: text(goal.trackedValue, 100),
    enabled: goal.enabled !== false,
    startDate: iso(goal.startDate, new Date().toISOString()),
    createdAt: iso(goal.createdAt, new Date().toISOString()),
    updatedAt: iso(goal.updatedAt, new Date().toISOString())
  };
}

function sanitizeActivity(item) {
  if (!item || typeof item !== "object") return null;
  const type = text(item.type, 80);
  if (!type) return null;
  return {
    id: validId(item.id, "activity"),
    type,
    occurredAt: iso(item.occurredAt, new Date().toISOString()),
    source: ["manual", "location-confirmed", "restaurant", "receipt", "scan"].includes(item.source) ? item.source : "manual",
    placeId: text(item.placeId, 120),
    productId: text(item.productId, 160),
    restaurantMealId: text(item.restaurantMealId, 160),
    value: number(item.value),
    metadata: item.metadata && typeof item.metadata === "object" ? { ...item.metadata } : {}
  };
}

function sanitizeMenuItem(item) {
  if (!item || typeof item !== "object") return null;
  const name = text(item.name, 140);
  if (!name) return null;
  return {
    id: validId(item.id, "menu"),
    name,
    description: text(item.description, 260),
    category: text(item.category, 80) || "meal",
    servingSize: text(item.servingSize, 80) || "1 item",
    nutrition: sanitizeNutrition(item.nutrition),
    ingredients: asArray(item.ingredients).map((entry) => text(entry, 120)).filter(Boolean).slice(0, 80),
    confidence: ["confirmed_menu", "published_nutrition", "user_confirmed", "receipt_match", "estimated_menu", "unknown"].includes(item.confidence)
      ? item.confidence
      : "unknown",
    sourceNote: text(item.sourceNote, 300),
    updatedAt: iso(item.updatedAt, new Date().toISOString())
  };
}

function sanitizeRestaurant(item) {
  if (!item || typeof item !== "object") return null;
  const name = text(item.name, 140);
  if (!name) return null;
  return {
    id: validId(item.id, "restaurant"),
    name,
    type: isSupportedLocationContext(item.type) ? item.type : "restaurant",
    region: text(item.region, 60),
    source: item.source === "demo" ? "demo" : "user",
    menuItems: asArray(item.menuItems).map(sanitizeMenuItem).filter(Boolean).slice(0, 100),
    createdAt: iso(item.createdAt, new Date().toISOString()),
    updatedAt: iso(item.updatedAt, new Date().toISOString())
  };
}

function sanitizeRestaurantMeal(item) {
  if (!item || typeof item !== "object") return null;
  const itemName = text(item.itemName, 140);
  if (!itemName) return null;
  return {
    id: validId(item.id, "meal"),
    restaurantId: text(item.restaurantId, 120),
    restaurantName: text(item.restaurantName, 140) || "Restaurant",
    placeId: text(item.placeId, 120),
    placeType: isSupportedLocationContext(item.placeType) ? item.placeType : "restaurant",
    itemName,
    servingSize: text(item.servingSize, 80) || "1 item",
    nutrition: sanitizeNutrition(item.nutrition),
    ingredients: asArray(item.ingredients).map((entry) => text(entry, 120)).filter(Boolean).slice(0, 80),
    confidence: ["confirmed_menu", "published_nutrition", "user_confirmed", "receipt_match", "estimated_menu", "unknown"].includes(item.confidence)
      ? item.confidence
      : "unknown",
    sourceNote: text(item.sourceNote, 300),
    goalFit: ["fits", "watch", "needs-data"].includes(item.goalFit) ? item.goalFit : "needs-data",
    occurredAt: iso(item.occurredAt, new Date().toISOString()),
    addedToPlate: Boolean(item.addedToPlate),
    plateEntryId: text(item.plateEntryId, 160),
    receiptReviewId: text(item.receiptReviewId, 160),
    source: ["manual", "receipt", "location"].includes(item.source) ? item.source : "manual"
  };
}

function sanitizeReceiptReview(item) {
  if (!item || typeof item !== "object") return null;
  return {
    id: validId(item.id, "receipt"),
    restaurantName: text(item.restaurantName, 140),
    captureKind: ["receipt", "menu", "order_screen", "nutrition_board", "grocery_receipt", "takeout_bag", "food_photo"].includes(item.captureKind) ? item.captureKind : "receipt",
    originalText: text(item.originalText, 8000),
    photoName: text(item.photoName, 180),
    photoStored: Boolean(item.photoStored),
    status: ["needs-confirmation", "confirmed", "not-confident"].includes(item.status) ? item.status : "needs-confirmation",
    confidence: ["high", "possible", "needs-confirmation", "not-confident"].includes(item.confidence) ? item.confidence : "needs-confirmation",
    items: asArray(item.items).map((entry) => ({
      id: validId(entry.id, "receipt-item"),
      rawText: text(entry.rawText, 180),
      name: text(entry.name, 140),
      quantity: Math.max(0.1, number(entry.quantity, 1)),
      price: number(entry.price),
      menuItemId: text(entry.menuItemId, 120),
      confidence: ["high", "possible", "needs-confirmation", "not-confident"].includes(entry.confidence) ? entry.confidence : "needs-confirmation",
      confirmed: Boolean(entry.confirmed),
      servingSize: text(entry.servingSize, 80) || "1 item",
      nutrition: sanitizeNutrition(entry.nutrition),
      ingredients: asArray(entry.ingredients).map((ingredient) => text(ingredient, 120)).filter(Boolean).slice(0, 80),
      sourceNote: text(entry.sourceNote, 300)
    })).filter((entry) => entry.name).slice(0, 100),
    createdAt: iso(item.createdAt, new Date().toISOString()),
    updatedAt: iso(item.updatedAt, new Date().toISOString())
  };
}

function sanitizePlace(item) {
  if (!item || typeof item !== "object") return null;
  const name = text(item.name, 140);
  const latitude = number(item.latitude);
  const longitude = number(item.longitude);
  if (!name || latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return {
    id: validId(item.id, "place"),
    name,
    type: isSupportedLocationContext(item.type) ? item.type : "other",
    latitude,
    longitude,
    radiusMeters: Math.min(1000, Math.max(30, number(item.radiusMeters, 150))),
    createdAt: iso(item.createdAt, new Date().toISOString()),
    updatedAt: iso(item.updatedAt, new Date().toISOString())
  };
}

const DELETION_KINDS = new Set(["weeklyGoal", "longTermGoal", "activity", "restaurant", "restaurantMeal", "receiptReview", "savedPlace", "dismissedNudge"]);

function sanitizeDeletedItem(item) {
  if (!item || typeof item !== "object" || !DELETION_KINDS.has(item.kind)) return null;
  const targetId = text(item.targetId, 160);
  if (!targetId) return null;
  return {
    id: validId(item.id || item.kind + ":" + targetId, "deleted"),
    kind: item.kind,
    targetId,
    deletedAt: iso(item.deletedAt, new Date().toISOString())
  };
}

function limited(items, key, sanitizer) {
  return asArray(items).map(sanitizer).filter(Boolean).slice(0, MAX_ITEMS[key]);
}

export function createPhase2Id(prefix = "context") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}:${crypto.randomUUID()}`;
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyPhase2State() {
  const now = new Date().toISOString();
  return {
    version: PHASE2_STATE_VERSION,
    weeklyGoals: [],
    longTermGoals: [],
    activities: [],
    restaurants: [],
    restaurantMeals: [],
    receiptReviews: [],
    savedPlaces: [],
    currentContext: null,
    dismissedNudges: [],
    deletedItems: [],
    settings: { ...DEFAULT_CONTEXT_SETTINGS, updatedAt: now },
    updatedAt: now
  };
}

export function sanitizePhase2State(value) {
  const base = createEmptyPhase2State();
  if (!value || typeof value !== "object") return base;
  const context = value.currentContext && typeof value.currentContext === "object"
    ? {
        placeId: text(value.currentContext.placeId, 120),
        name: text(value.currentContext.name, 140),
        type: isSupportedLocationContext(value.currentContext.type) ? value.currentContext.type : "other",
        distanceMeters: Math.max(0, number(value.currentContext.distanceMeters, 0)),
        detectedAt: iso(value.currentContext.detectedAt, new Date().toISOString()),
        confirmed: Boolean(value.currentContext.confirmed)
      }
    : null;
  return {
    version: PHASE2_STATE_VERSION,
    weeklyGoals: limited(value.weeklyGoals, "weeklyGoals", sanitizeWeeklyGoal),
    longTermGoals: limited(value.longTermGoals, "longTermGoals", sanitizeLongTermGoal),
    activities: limited(value.activities, "activities", sanitizeActivity),
    restaurants: limited(value.restaurants, "restaurants", sanitizeRestaurant),
    restaurantMeals: limited(value.restaurantMeals, "restaurantMeals", sanitizeRestaurantMeal),
    receiptReviews: limited(value.receiptReviews, "receiptReviews", sanitizeReceiptReview),
    savedPlaces: limited(value.savedPlaces, "savedPlaces", sanitizePlace),
    currentContext: context,
    dismissedNudges: asArray(value.dismissedNudges).map((entry) => ({
      id: text(entry.id, 120),
      dismissedAt: iso(entry.dismissedAt, new Date().toISOString())
    })).filter((entry) => entry.id).slice(0, MAX_ITEMS.dismissedNudges),
    deletedItems: limited(value.deletedItems, "deletedItems", sanitizeDeletedItem),
    settings: {
      ...DEFAULT_CONTEXT_SETTINGS,
      ...(value.settings && typeof value.settings === "object" ? value.settings : {}),
      locationEnabled: Boolean(value.settings?.locationEnabled),
      notificationsEnabled: Boolean(value.settings?.notificationsEnabled),
      nudgesEnabled: Boolean(value.settings?.nudgesEnabled),
      saveReceiptText: value.settings?.saveReceiptText !== false,
      savePhotosLocally: Boolean(value.settings?.savePhotosLocally),
      locationPermission: ["idle", "requesting", "granted", "denied", "unavailable"].includes(value.settings?.locationPermission)
        ? value.settings.locationPermission
        : "idle",
      lastLocationCheckAt: iso(value.settings?.lastLocationCheckAt),
      updatedAt: iso(value.settings?.updatedAt, base.settings.updatedAt)
    },
    updatedAt: iso(value.updatedAt, base.updatedAt)
  };
}

export function loadPhase2State() {
  if (typeof window === "undefined") return createEmptyPhase2State();
  try {
    return sanitizePhase2State(JSON.parse(window.localStorage.getItem(PHASE2_STORAGE_KEY) || "null"));
  } catch {
    return createEmptyPhase2State();
  }
}

export function savePhase2State(value) {
  const state = sanitizePhase2State(value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PHASE2_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The context layer remains usable in memory when storage is unavailable.
    }
  }
  return state;
}

function dateValue(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeById(localItems, cloudItems, limit) {
  const values = new Map();
  [...asArray(cloudItems), ...asArray(localItems)].forEach((item) => {
    if (!item?.id) return;
    const existing = values.get(item.id);
    if (!existing || dateValue(item.updatedAt || item.occurredAt || item.createdAt || item.deletedAt || item.dismissedAt) >= dateValue(existing.updatedAt || existing.occurredAt || existing.createdAt || existing.deletedAt || existing.dismissedAt)) {
      values.set(item.id, item);
    }
  });
  return [...values.values()]
    .sort((a, b) => dateValue(b.updatedAt || b.occurredAt || b.createdAt || b.deletedAt || b.dismissedAt) - dateValue(a.updatedAt || a.occurredAt || a.createdAt || a.deletedAt || a.dismissedAt))
    .slice(0, limit);
}

function filterDeleted(items, kind, deletedItems) {
  const tombstones = new Map(deletedItems.filter((item) => item.kind === kind).map((item) => [item.targetId, item]));
  return items.filter((item) => {
    const tombstone = tombstones.get(item.id);
    if (!tombstone) return true;
    return dateValue(item.updatedAt || item.occurredAt || item.createdAt) > dateValue(tombstone.deletedAt);
  });
}

export function createPhase2DeletionPatch(current, kind, targetIds, patch = {}) {
  if (!DELETION_KINDS.has(kind)) return patch;
  const deletedAt = new Date().toISOString();
  const ids = [...new Set(asArray(targetIds).map((id) => text(id, 160)).filter(Boolean))];
  const next = ids.map((targetId) => ({ id: kind + ":" + targetId, kind, targetId, deletedAt }));
  return {
    ...patch,
    deletedItems: mergeById(next, current?.deletedItems, MAX_ITEMS.deletedItems)
  };
}

export function mergePhase2States(localValue, cloudValue) {
  if (!localValue && !cloudValue) return createEmptyPhase2State();
  if (!cloudValue) return sanitizePhase2State(localValue);
  if (!localValue) return sanitizePhase2State(cloudValue);
  const local = sanitizePhase2State(localValue);
  const cloud = sanitizePhase2State(cloudValue);
  const newest = dateValue(cloud.updatedAt) > dateValue(local.updatedAt) ? cloud : local;
  const deletedItems = mergeById(local.deletedItems, cloud.deletedItems, MAX_ITEMS.deletedItems);
  return sanitizePhase2State({
    ...newest,
    weeklyGoals: filterDeleted(mergeById(local.weeklyGoals, cloud.weeklyGoals, MAX_ITEMS.weeklyGoals), "weeklyGoal", deletedItems),
    longTermGoals: filterDeleted(mergeById(local.longTermGoals, cloud.longTermGoals, MAX_ITEMS.longTermGoals), "longTermGoal", deletedItems),
    activities: filterDeleted(mergeById(local.activities, cloud.activities, MAX_ITEMS.activities), "activity", deletedItems),
    restaurants: filterDeleted(mergeById(local.restaurants, cloud.restaurants, MAX_ITEMS.restaurants), "restaurant", deletedItems),
    restaurantMeals: filterDeleted(mergeById(local.restaurantMeals, cloud.restaurantMeals, MAX_ITEMS.restaurantMeals), "restaurantMeal", deletedItems),
    receiptReviews: filterDeleted(mergeById(local.receiptReviews, cloud.receiptReviews, MAX_ITEMS.receiptReviews), "receiptReview", deletedItems),
    savedPlaces: filterDeleted(mergeById(local.savedPlaces, cloud.savedPlaces, MAX_ITEMS.savedPlaces), "savedPlace", deletedItems),
    dismissedNudges: filterDeleted(mergeById(local.dismissedNudges, cloud.dismissedNudges, MAX_ITEMS.dismissedNudges), "dismissedNudge", deletedItems),
    deletedItems,
    settings: dateValue(cloud.settings.updatedAt) > dateValue(local.settings.updatedAt) ? cloud.settings : local.settings,
    updatedAt: new Date(Math.max(dateValue(local.updatedAt), dateValue(cloud.updatedAt), Date.now())).toISOString()
  });
}

export function touchPhase2State(value, patch = {}) {
  const now = new Date().toISOString();
  return sanitizePhase2State({ ...value, ...patch, updatedAt: now });
}
