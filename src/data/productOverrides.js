const OVERRIDE_STORAGE_KEY = "ziya-product-overrides-v1";
const HISTORY_STORAGE_KEY = "ziya-product-history-v1";
const STORAGE_VERSION = 1;
const MAX_PRODUCT_PHOTO_LENGTH = 1000000;

function getStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function cleanString(value, maxLength = 4000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function sanitizeNutrition(value) {
  if (!value || typeof value !== "object") return null;
  const nutrition = {
    basis: ["serving", "100g", "100ml"].includes(value.basis) ? value.basis : "serving",
    servingSize: cleanString(value.servingSize, 120),
    calories: cleanOptionalNumber(value.calories),
    protein: cleanOptionalNumber(value.protein),
    carbs: cleanOptionalNumber(value.carbs),
    fat: cleanOptionalNumber(value.fat),
    saturatedFat: cleanOptionalNumber(value.saturatedFat),
    fiber: cleanOptionalNumber(value.fiber),
    sugar: cleanOptionalNumber(value.sugar),
    sodium: cleanOptionalNumber(value.sodium)
  };
  return Object.values(nutrition).some((entry) => entry !== null && entry !== "" && entry !== "serving") ? nutrition : null;
}

function sanitizeFields(fields = {}) {
  const category = ["food", "beauty", "household", "medicine", "textile", "unknown"].includes(fields.category) ? fields.category : null;
  const result = {
    category,
    ingredientsText: cleanString(fields.ingredientsText, 12000),
    materialsText: cleanString(fields.materialsText, 12000),
    allergensText: cleanString(fields.allergensText, 1000),
    warningsText: cleanString(fields.warningsText, 4000),
    activeIngredient: cleanString(fields.activeIngredient, 500),
    purpose: cleanString(fields.purpose, 500),
    careText: cleanString(fields.careText, 4000),
    nutrition: sanitizeNutrition(fields.nutrition),
    userPhoto: typeof fields.userPhoto === "string" && fields.userPhoto.length <= MAX_PRODUCT_PHOTO_LENGTH ? fields.userPhoto : ""
  };
  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== null && value !== ""));
}

function sanitizeProductSnapshot(product, { omitUserPhoto = false } = {}) {
  if (!product?.id || !product?.name) return null;
  const snapshot = {
    ...product,
    originalProviderProduct: undefined,
    userProductOverride: undefined,
    userProvidedFields: undefined
  };
  if (omitUserPhoto) snapshot.userPhoto = undefined;
  if (snapshot.userPhoto?.length > MAX_PRODUCT_PHOTO_LENGTH) snapshot.userPhoto = undefined;
  return snapshot;
}

function readOverrideStore() {
  const storage = getStorage();
  if (!storage) return { version: STORAGE_VERSION, records: {} };
  try {
    const parsed = JSON.parse(storage.getItem(OVERRIDE_STORAGE_KEY) || "null");
    if (parsed?.version !== STORAGE_VERSION || !parsed.records || typeof parsed.records !== "object") return { version: STORAGE_VERSION, records: {} };
    return parsed;
  } catch {
    return { version: STORAGE_VERSION, records: {} };
  }
}

function writeOverrideStore(store) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function getProductOverrideKey(productOrIdentity) {
  const barcode = cleanString(productOrIdentity?.barcode, 80).replace(/[^\dA-Za-z]/g, "");
  if (barcode) return `barcode:${barcode}`;
  const id = cleanString(productOrIdentity?.id, 160);
  return id ? `id:${id}` : "";
}

export function getProductOverride(productOrIdentity) {
  const key = getProductOverrideKey(productOrIdentity);
  if (!key) return null;
  const record = readOverrideStore().records[key];
  if (!record || record.version !== STORAGE_VERSION || record.source !== "user-provided") return null;
  const fields = sanitizeFields(record.fields);
  if (!Object.keys(fields).length) return null;
  return { ...record, key, fields };
}

export function saveProductOverride(product, fields, mergedProduct) {
  const key = getProductOverrideKey(product);
  if (!key) return null;
  const store = readOverrideStore();
  const previous = store.records[key];
  const sanitizedFields = sanitizeFields(fields);
  const nextFields = {
    ...(previous?.fields || {}),
    ...sanitizedFields,
    ...(sanitizedFields.nutrition
      ? { nutrition: { ...(previous?.fields?.nutrition || {}), ...sanitizedFields.nutrition } }
      : {})
  };
  const record = {
    version: STORAGE_VERSION,
    key,
    source: "user-provided",
    productId: product.id,
    barcode: product.barcode || "",
    updatedAt: new Date().toISOString(),
    fields: nextFields,
    originalProviderProduct: previous?.originalProviderProduct || sanitizeProductSnapshot(product, { omitUserPhoto: true }),
    mergedProduct: sanitizeProductSnapshot(mergedProduct, { omitUserPhoto: true })
  };
  store.records[key] = record;
  return writeOverrideStore(store) ? record : null;
}

export function clearProductOverride(productOrIdentity) {
  const key = getProductOverrideKey(productOrIdentity);
  if (!key) return false;
  const store = readOverrideStore();
  if (!store.records[key]) return false;
  delete store.records[key];
  return writeOverrideStore(store);
}

export function loadOverrideProductSnapshots() {
  return Object.values(readOverrideStore().records)
    .filter((record) => record?.version === STORAGE_VERSION && record.source === "user-provided")
    .map((record) => {
      const snapshot = sanitizeProductSnapshot(record.mergedProduct);
      return snapshot && record.fields?.userPhoto ? { ...snapshot, userPhoto: record.fields.userPhoto } : snapshot;
    })
    .filter(Boolean);
}

export function loadProductHistory() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) || "null");
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
    return parsed.items
      .filter((item) => item && typeof item.id === "string" && typeof item.productId === "string" && typeof item.date === "string")
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function saveProductHistory(items) {
  const storage = getStorage();
  if (!storage) return false;
  const safeItems = Array.isArray(items)
    ? items.filter((item) => item && typeof item.id === "string" && typeof item.productId === "string" && typeof item.date === "string").slice(0, 100)
    : [];
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items: safeItems }));
    return true;
  } catch {
    return false;
  }
}

export const PRODUCT_OVERRIDE_STORAGE_KEYS = Object.freeze({
  overrides: OVERRIDE_STORAGE_KEY,
  history: HISTORY_STORAGE_KEY
});
