import {
  loadOverrideProductSnapshots,
  loadProductOverrideRecords,
  mergeProductOverrideRecords
} from "./productOverrides";
import { mergeProfiles, sanitizeProfile } from "../profile/profileStore";
import { mergePhase2States, sanitizePhase2State } from "../lib/phase2State";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function dateValue(value) {
  return Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
}

function newestIso(...values) {
  const timestamp = Math.max(0, ...values.map(dateValue));
  return timestamp ? new Date(timestamp).toISOString() : null;
}

function assertResult(result, label) {
  if (result?.error) throw new Error(`${label}: ${result.error.message}`);
  return result?.data;
}

function isOptionalTableMissing(error) {
  return ["42P01", "PGRST205"].includes(error?.code) || /phase2_state.*(?:not found|does not exist)/i.test(error?.message || "");
}

async function fetchCloudPhase2State(client, userId) {
  const result = await client.from("phase2_state").select("state, updated_at").eq("user_id", userId).maybeSingle();
  if (result.error) {
    if (isOptionalTableMissing(result.error)) return null;
    throw new Error(`Goals and places sync: ${result.error.message}`);
  }
  return result.data?.state
    ? sanitizePhase2State({ ...result.data.state, updatedAt: result.data.updated_at || result.data.state.updatedAt })
    : null;
}

async function upsertCloudPhase2State(client, userId, phase2State) {
  const state = sanitizePhase2State(phase2State);
  const result = await client.from("phase2_state").upsert({
    user_id: userId,
    state,
    updated_at: state.updatedAt || new Date().toISOString()
  }, { onConflict: "user_id" });
  if (result.error && !isOptionalTableMissing(result.error)) throw new Error(`Goals and places sync: ${result.error.message}`);
}

function formatCloudHistoryDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Synced scan";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round((today - target) / 86400000);
  if (dayDifference === 0) return "Today, synced";
  if (dayDifference === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

function inferHistoryTimestamp(item) {
  if (dateValue(item.scannedAt)) return item.scannedAt;
  const timestamp = String(item.id || "").match(/(\d{13})(?!.*\d)/)?.[1];
  return timestamp ? new Date(Number(timestamp)).toISOString() : new Date().toISOString();
}

export function mergePlateStates(localValue, cloudValue) {
  const local = localValue && typeof localValue === "object" ? localValue : { goals: null, days: {} };
  const cloud = cloudValue && typeof cloudValue === "object" ? cloudValue : { goals: null, days: {} };
  const localTime = dateValue(local.updatedAt);
  const cloudTime = dateValue(cloud.updatedAt);
  const newest = cloudTime > localTime ? cloud : local;
  const dayKeys = new Set([...Object.keys(local.days || {}), ...Object.keys(cloud.days || {})]);
  const days = {};

  dayKeys.forEach((dateKey) => {
    const localDay = local.days?.[dateKey] || {};
    const cloudDay = cloud.days?.[dateKey] || {};
    const entries = new Map();
    [...asArray(cloudDay.entries), ...asArray(localDay.entries)].forEach((entry) => {
      if (!entry?.id) return;
      const existing = entries.get(entry.id);
      if (!existing || dateValue(entry.updatedAt || entry.addedAt) >= dateValue(existing.updatedAt || existing.addedAt)) entries.set(entry.id, entry);
    });
    days[dateKey] = {
      goalsSnapshot: localDay.goalsSnapshot || cloudDay.goalsSnapshot || newest.goals || null,
      entries: [...entries.values()].sort((a, b) => dateValue(b.addedAt) - dateValue(a.addedAt))
    };
  });

  return {
    goals: newest.goals || local.goals || cloud.goals || null,
    days,
    updatedAt: newestIso(local.updatedAt, cloud.updatedAt) || new Date().toISOString()
  };
}

export function mergeHistoryItems(localItems, cloudItems) {
  const items = new Map();
  [...asArray(cloudItems), ...asArray(localItems)].forEach((item) => {
    if (!item?.id || !item?.productId) return;
    const existing = items.get(item.id);
    if (!existing || dateValue(item.scannedAt) >= dateValue(existing.scannedAt)) items.set(item.id, item);
  });
  return [...items.values()].sort((a, b) => dateValue(b.scannedAt) - dateValue(a.scannedAt)).slice(0, 100);
}

function cloudPlateState(goalsRow, logRows) {
  const days = {};
  asArray(logRows).forEach((row) => {
    if (!row.local_date || !row.local_entry_id || !row.product_snapshot) return;
    const day = days[row.local_date] || { goalsSnapshot: row.goal_snapshot || goalsRow?.goals || null, entries: [] };
    day.entries.push({
      id: row.local_entry_id,
      productId: row.product_key || row.product_snapshot.id,
      product: row.product_snapshot,
      nutritionBase: row.serving?.nutritionBase || {},
      amount: row.serving?.amount,
      mode: row.serving?.mode,
      contribution: row.nutrients || {},
      addedAt: row.created_at,
      updatedAt: row.updated_at
    });
    days[row.local_date] = day;
  });
  return {
    goals: goalsRow?.goals || null,
    days,
    updatedAt: newestIso(goalsRow?.updated_at, ...asArray(logRows).map((row) => row.updated_at))
  };
}

function cloudHistory(historyRows) {
  return asArray(historyRows).map((row) => ({
    id: row.local_history_id || row.id,
    productId: row.product_snapshot?.id || row.product_key,
    date: formatCloudHistoryDate(row.scanned_at),
    scannedAt: row.scanned_at,
    productSnapshot: row.product_snapshot
  })).filter((item) => item.id && item.productId);
}

function cloudOverrideRecords(rows) {
  return asArray(rows).map((row) => ({
    version: 1,
    key: row.product_key,
    source: "user-provided",
    productId: row.override_data?.productId || row.product_key,
    barcode: row.barcode || "",
    updatedAt: row.updated_at,
    fields: row.override_data?.fields || {},
    mergedProduct: row.override_data?.mergedProduct,
    originalProviderProduct: row.provider_snapshot
  })).filter((record) => record.key && record.mergedProduct);
}

async function fetchCloudBundle(client, userId) {
  const phase2StatePromise = fetchCloudPhase2State(client, userId);
  const results = await Promise.all([
    client.from("profiles").select("*").eq("id", userId).maybeSingle(),
    client.from("profile_preferences").select("*").eq("user_id", userId).maybeSingle(),
    client.from("today_plate_goals").select("*").eq("user_id", userId).maybeSingle(),
    client.from("today_plate_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
    client.from("scan_history").select("*").eq("user_id", userId).order("scanned_at", { ascending: false }).limit(500),
    client.from("product_overrides").select("*").eq("user_id", userId).limit(500)
  ]);
  const profileRow = assertResult(results[0], "Profile sync");
  const preferenceRow = assertResult(results[1], "Preference sync");
  const goalsRow = assertResult(results[2], "Goal sync");
  const logRows = assertResult(results[3], "Today's Plate sync") || [];
  const historyRows = assertResult(results[4], "History sync") || [];
  const overrideRows = assertResult(results[5], "Product correction sync") || [];
  const phase2State = await phase2StatePromise;

  return {
    profile: sanitizeProfile({
      allergies: preferenceRow?.allergies,
      dietPreferences: preferenceRow?.diet_preferences,
      avoidedIngredients: preferenceRow?.avoided_ingredients,
      watchlistIngredients: preferenceRow?.watchlist_ingredients,
      preferredLanguage: profileRow?.preferred_language,
      productRegion: profileRow?.product_region,
      ingredientDisplayMode: profileRow?.ingredient_display_mode,
      unitSystem: profileRow?.unit_system,
      todayPlateGoals: goalsRow?.goals,
      updatedAt: newestIso(profileRow?.updated_at, preferenceRow?.updated_at, goalsRow?.updated_at)
    }),
    plateState: cloudPlateState(goalsRow, logRows),
    phase2State,
    history: cloudHistory(historyRows),
    overrides: cloudOverrideRecords(overrideRows),
    products: historyRows.map((row) => row.product_snapshot).filter((product) => product?.id)
  };
}

function plateRows(userId, plateState) {
  const rows = [];
  Object.entries(plateState.days || {}).forEach(([localDate, day]) => {
    asArray(day.entries).forEach((entry) => {
      rows.push({
        user_id: userId,
        local_entry_id: entry.id,
        local_date: localDate,
        product_key: entry.productId || entry.product?.id || null,
        product_snapshot: entry.product,
        serving: { amount: entry.amount, mode: entry.mode, nutritionBase: entry.nutritionBase },
        nutrients: entry.contribution,
        goal_snapshot: day.goalsSnapshot,
        created_at: entry.addedAt || new Date().toISOString(),
        updated_at: entry.updatedAt || entry.addedAt || new Date().toISOString()
      });
    });
  });
  return rows;
}

function historyRows(userId, history, productIndex) {
  return asArray(history).map((item) => {
    const product = item.productSnapshot || productIndex.get(item.productId);
    if (!product) return null;
    return {
      user_id: userId,
      local_history_id: item.id,
      product_key: item.productId,
      barcode: product.barcode || null,
      product_snapshot: product,
      scanned_at: inferHistoryTimestamp(item)
    };
  }).filter(Boolean);
}

function overrideRows(userId, records) {
  return records.map((record) => ({
    user_id: userId,
    product_key: record.key,
    barcode: record.barcode || null,
    override_data: {
      productId: record.productId,
      fields: record.fields,
      mergedProduct: record.mergedProduct
    },
    provider_snapshot: record.originalProviderProduct,
    updated_at: record.updatedAt
  }));
}

async function upsertCloudBundle(client, userId, bundle, displayName) {
  const updatedAt = bundle.profile.updatedAt || new Date().toISOString();
  const requests = [
    client.from("profiles").upsert({
      id: userId,
      display_name: displayName || null,
      preferred_language: bundle.profile.preferredLanguage,
      product_region: bundle.profile.productRegion,
      ingredient_display_mode: bundle.profile.ingredientDisplayMode,
      unit_system: bundle.profile.unitSystem,
      updated_at: updatedAt
    }, { onConflict: "id" }),
    client.from("profile_preferences").upsert({
      user_id: userId,
      allergies: bundle.profile.allergies,
      diet_preferences: bundle.profile.dietPreferences,
      avoided_ingredients: bundle.profile.avoidedIngredients,
      watchlist_ingredients: bundle.profile.watchlistIngredients,
      updated_at: updatedAt
    }, { onConflict: "user_id" })
  ];

  if (bundle.plateState.goals) {
    requests.push(client.from("today_plate_goals").upsert({
      user_id: userId,
      goals: bundle.plateState.goals,
      updated_at: bundle.plateState.updatedAt || updatedAt
    }, { onConflict: "user_id" }));
  }
  const logs = plateRows(userId, bundle.plateState);
  if (logs.length) requests.push(client.from("today_plate_logs").upsert(logs, { onConflict: "user_id,local_entry_id" }));
  const scans = historyRows(userId, bundle.history, bundle.productIndex);
  if (scans.length) requests.push(client.from("scan_history").upsert(scans, { onConflict: "user_id,local_history_id" }));
  const overrides = overrideRows(userId, loadProductOverrideRecords());
  if (overrides.length) requests.push(client.from("product_overrides").upsert(overrides, { onConflict: "user_id,product_key" }));

  const results = await Promise.all(requests);
  results.forEach((result, index) => assertResult(result, `Cloud write ${index + 1}`));
  await upsertCloudPhase2State(client, userId, bundle.phase2State);
}

export async function syncZiyaData({ client, user, profile, plateState, phase2State, history, productIndex }) {
  if (!client || !user?.id) throw new Error("Sign in before syncing.");
  const cloud = await fetchCloudBundle(client, user.id);
  mergeProductOverrideRecords(cloud.overrides);
  const mergedProfile = mergeProfiles(profile, cloud.profile);
  const mergedPlateState = mergePlateStates(plateState, cloud.plateState);
  const mergedPhase2State = mergePhase2States(phase2State, cloud.phase2State);
  const mergedHistory = mergeHistoryItems(history, cloud.history);
  const mergedProducts = [...new Map([
    ...cloud.products,
    ...loadOverrideProductSnapshots()
  ].filter(Boolean).map((product) => [product.id, product])).values()];
  const mergedProductIndex = new Map(productIndex);
  mergedProducts.forEach((product) => mergedProductIndex.set(product.id, product));

  await upsertCloudBundle(client, user.id, {
    profile: mergedProfile,
    plateState: mergedPlateState,
    phase2State: mergedPhase2State,
    history: mergedHistory,
    productIndex: mergedProductIndex
  }, user.user_metadata?.full_name || user.user_metadata?.name || null);

  return {
    profile: mergedProfile,
    plateState: mergedPlateState,
    phase2State: mergedPhase2State,
    history: mergedHistory,
    products: mergedProducts,
    syncedAt: new Date().toISOString()
  };
}
