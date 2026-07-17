import { getLongTermGoalTemplate } from "../data/restaurantGoalRules";
import { resolveLocalIngredientKnowledge } from "../knowledge/ingredientKnowledge";

const DAY_MS = 86400000;
const LONG_TERM_RULE_VERSION = 2;
const SUPPORTED_DURATIONS = Object.freeze([14, 30, 56]);

export const LONG_TERM_GOAL_STATUSES = Object.freeze(["draft", "active", "paused", "completed", "archived"]);

const METRIC_RULES = Object.freeze({
  sodaReduction: { insightType: "frequency", direction: "lower", minimumEvidence: 3, minimumDays: 2 },
  ingredientAvoidance: { insightType: "consistency", direction: "lower", minimumEvidence: 3, minimumDays: 2 },
  groceryQuality: { insightType: "quality", direction: "higher", minimumEvidence: 3, minimumDays: 2 },
  averageProductQuality: { insightType: "quality", direction: "higher", minimumEvidence: 3, minimumDays: 2 },
  proteinConsistency: { insightType: "consistency", direction: "higher", minimumEvidence: 4, minimumDays: 4 },
  fastFoodReduction: { insightType: "frequency", direction: "lower", minimumEvidence: 3, minimumDays: 2 },
  gymRoutine: { insightType: "consistency", direction: "higher", minimumEvidence: 2, minimumDays: 2 },
  sugarySnackReduction: { insightType: "frequency", direction: "lower", minimumEvidence: 3, minimumDays: 2 }
});

function number(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value, fallback = new Date()) {
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : new Date(fallback);
}

function startOfLocalDay(value) {
  const date = parseDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addLocalDays(value, days) {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return date;
}

function dateKey(value) {
  const date = parseDate(value);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function calendarDayDifference(left, right) {
  const a = parseDate(left);
  const b = parseDate(right);
  return Math.floor((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY_MS);
}

function within(value, window) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= window.start.getTime() && time < window.analysisEnd.getTime();
}

function periodDuration(goal, template = null) {
  const requested = Math.round(number(goal && goal.durationDays) ?? (template && template.defaultDurationDays) ?? 30);
  return Math.min(365, Math.max(7, requested));
}

function fullPeriodWindow(goal, index) {
  const template = getLongTermGoalTemplate(goal && goal.templateId);
  const durationDays = periodDuration(goal, template);
  const anchor = startOfLocalDay((goal && (goal.startDate || goal.createdAt)) || new Date());
  const start = addLocalDays(anchor, index * durationDays);
  const end = addLocalDays(start, durationDays);
  return {
    index,
    start,
    end,
    analysisEnd: end,
    startKey: dateKey(start),
    endKey: dateKey(addLocalDays(end, -1)),
    durationDays,
    observedDays: durationDays,
    closed: true
  };
}

function equivalentPreviousEnd(previousStart, currentStart, currentAnalysisEnd, previousEnd) {
  const elapsedDays = Math.max(0, calendarDayDifference(currentStart, currentAnalysisEnd));
  const result = addLocalDays(previousStart, elapsedDays);
  result.setHours(currentAnalysisEnd.getHours(), currentAnalysisEnd.getMinutes(), currentAnalysisEnd.getSeconds(), currentAnalysisEnd.getMilliseconds());
  return result > previousEnd ? new Date(previousEnd) : result;
}

function activePeriodIndex(goal, now) {
  const template = getLongTermGoalTemplate(goal && goal.templateId);
  const anchor = startOfLocalDay((goal && (goal.startDate || goal.createdAt)) || now);
  const elapsed = calendarDayDifference(anchor, startOfLocalDay(now));
  return Math.max(0, Math.floor(elapsed / periodDuration(goal, template)));
}

export function getLongTermPeriodWindows(goal, now = new Date()) {
  const currentIndex = activePeriodIndex(goal, now);
  const current = fullPeriodWindow(goal, currentIndex);
  const actualNow = parseDate(now);
  current.analysisEnd = actualNow < current.start
    ? new Date(current.start)
    : actualNow < current.end ? new Date(actualNow.getTime() + 1) : new Date(current.end);
  current.observedDays = current.analysisEnd <= current.start
    ? 0
    : Math.min(current.durationDays, calendarDayDifference(current.start, current.analysisEnd) + 1);
  current.closed = current.analysisEnd >= current.end;

  const previous = fullPeriodWindow(goal, currentIndex - 1);
  previous.analysisEnd = current.closed
    ? new Date(previous.end)
    : equivalentPreviousEnd(previous.start, current.start, current.analysisEnd, previous.end);
  previous.observedDays = current.observedDays;
  return { current, previous, currentIndex };
}

function formatDateRange(window) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return formatter.format(window.start) + " - " + formatter.format(new Date(window.analysisEnd.getTime() - 1));
}

function normalizeIngredient(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function ingredientIdentity(value) {
  const raw = normalizeIngredient(value);
  if (!raw) return new Set();
  const record = resolveLocalIngredientKnowledge(value, { category: "food" });
  return new Set([raw, normalizeIngredient(record.canonicalName)].concat((record.aliases || []).map(normalizeIngredient)).filter(Boolean));
}

function identitiesMatch(left, right) {
  const leftKeys = ingredientIdentity(left);
  const rightKeys = ingredientIdentity(right);
  for (const key of leftKeys) if (rightKeys.has(key)) return true;
  return false;
}

function evidenceRow(options) {
  const when = parseDate(options.occurredAt);
  return {
    id: options.id,
    sourceId: options.sourceId || options.id,
    sourceType: options.sourceType,
    dateKey: dateKey(when),
    occurredAt: when.toISOString(),
    label: options.label,
    detail: options.detail,
    value: number(options.value),
    unit: options.unit || "",
    missing: Boolean(options.missing),
    confirmed: true,
    metadata: options.metadata || {}
  };
}

function activityEvidence(item, options = {}) {
  return evidenceRow({
    id: "activity:" + item.id,
    sourceId: item.id,
    sourceType: "activity",
    occurredAt: item.occurredAt,
    label: options.label || (item.metadata && (item.metadata.productName || item.metadata.placeName)) || "Confirmed entry",
    detail: options.detail || "Confirmed activity",
    value: options.value === undefined ? 1 : options.value,
    unit: options.unit || "entry",
    missing: options.missing,
    metadata: {
      activityType: item.type,
      productId: item.productId || "",
      source: item.source,
      sourceUpdatedAt: item.updatedAt || item.occurredAt,
      ...(options.metadata || {})
    }
  });
}

function mealEvidence(meal, options = {}) {
  return evidenceRow({
    id: "meal:" + meal.id,
    sourceId: meal.id,
    sourceType: "restaurant-meal",
    occurredAt: meal.occurredAt,
    label: meal.itemName || meal.restaurantName || "Restaurant meal",
    detail: options.detail || ((meal.restaurantName || "Restaurant") + " | " + (meal.servingSize || "Confirmed meal")),
    value: options.value === undefined ? 1 : options.value,
    unit: options.unit || "meal",
    missing: options.missing,
    metadata: {
      restaurantId: meal.restaurantId || "",
      placeType: meal.placeType || "",
      sourceUpdatedAt: meal.updatedAt || meal.occurredAt,
      ...(options.metadata || {})
    }
  });
}

function uniqueEvidence(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.sourceType + ":" + row.sourceId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
}

function deletedEvidenceIds(state) {
  return new Set((state && state.deletedItems || [])
    .filter((item) => item.kind === "activity" || item.kind === "restaurantMeal")
    .map((item) => item.targetId));
}

function currentSourceVersions(state) {
  const versions = new Map();
  (state && state.activities || []).forEach((item) => versions.set("activity:" + item.id, Date.parse(item.updatedAt || item.occurredAt) || 0));
  (state && state.restaurantMeals || []).forEach((item) => versions.set("restaurant-meal:" + item.id, Date.parse(item.updatedAt || item.occurredAt) || 0));
  return versions;
}

function weeklySnapshotEvidence(state, template, window) {
  const weeklyTemplateId = template.metric === "proteinConsistency"
    ? "protein_goal_days"
    : template.metric === "fastFoodReduction"
      ? "fast_food_limit"
      : template.metric === "gymRoutine" ? "gym_visits" : "";
  if (!weeklyTemplateId) return [];
  return (state && state.weeklySnapshots || []).flatMap((snapshot) => (snapshot.goals || [])
    .filter((goal) => goal.templateId === weeklyTemplateId)
    .flatMap((goal) => goal.evidence || []))
    .filter((row) => within(row.occurredAt || (row.dateKey + "T12:00:00"), window))
    .map((row) => ({
      ...row,
      id: row.id || ("weekly:" + row.sourceId),
      sourceType: row.sourceType || "weekly-snapshot",
      confirmed: true,
      metadata: { ...(row.metadata || {}), fromWeeklySnapshot: true }
    }));
}

function periodDateKeys(window) {
  return Array.from({ length: window.observedDays }, (_, index) => dateKey(addLocalDays(window.start, index)));
}
function buildMetricEvidence(template, goal, state, plateState, window) {
  const activities = (state && state.activities || []).filter((item) => within(item.occurredAt, window));
  const meals = (state && state.restaurantMeals || []).filter((item) => within(item.occurredAt, window));
  let rows = [];

  if (template.metric === "sodaReduction") {
    rows = activities.filter((item) => item.type === "soda_logged" || item.type === "food_logged").map((item) => activityEvidence(item, {
      label: item.type === "soda_logged" ? "Logged soda" : "Logged food choice",
      detail: item.type === "soda_logged" ? "Counted as a soda choice" : "Logged food provides comparison context",
      value: item.type === "soda_logged" ? 1 : 0,
      unit: "choice",
      metadata: { metric: "soda" }
    }));
  } else if (template.metric === "fastFoodReduction") {
    rows = meals.map((meal) => mealEvidence(meal, {
      value: meal.placeType === "fast_food" ? 1 : 0,
      detail: meal.placeType === "fast_food" ? "Confirmed quick-service meal" : "Confirmed restaurant meal",
      metadata: { metric: "quick-service" }
    })).concat(activities.filter((item) => item.type === "fast_food_visit" && !item.restaurantMealId).map((item) => activityEvidence(item, {
      label: item.metadata && item.metadata.placeName || "Quick-service visit",
      detail: "Confirmed quick-service visit",
      value: 1,
      unit: "visit",
      metadata: { metric: "quick-service" }
    })));
  } else if (template.metric === "gymRoutine") {
    rows = activities.filter((item) => item.type === "gym_visit").map((item) => activityEvidence(item, {
      label: item.metadata && item.metadata.placeName || "Gym visit",
      detail: item.source === "location-confirmed" ? "Visit confirmed from a place check" : "Visit confirmed manually",
      value: 1,
      unit: "visit",
      metadata: { metric: "gym" }
    }));
  } else if (template.metric === "sugarySnackReduction") {
    rows = activities.filter((item) => item.type === "product_scanned" && /snack|candy|chocolate|cookie|cracker|dessert/i.test(item.metadata && item.metadata.category || "")).map((item) => {
      const sugar = number(item.metadata && item.metadata.sugar);
      return activityEvidence(item, {
        label: item.metadata && item.metadata.productName || "Snack scan",
        detail: sugar === null ? "Sugar value missing" : sugar + " g sugar in available product data",
        value: sugar === null ? null : sugar >= 10 ? 1 : 0,
        unit: "scan",
        missing: sugar === null,
        metadata: { metric: "high-sugar-snack", sugar }
      });
    });
  } else if (template.metric === "groceryQuality" || template.metric === "averageProductQuality") {
    const groceryOnly = template.metric === "groceryQuality";
    rows = activities.filter((item) => item.type === "product_scanned" && (!groceryOnly || item.metadata && item.metadata.context === "grocery")).map((item) => {
      const score = number(item.metadata && item.metadata.score);
      return activityEvidence(item, {
        label: item.metadata && item.metadata.productName || (groceryOnly ? "Grocery product" : "Scanned product"),
        detail: score === null ? "Documented score missing" : "Documented score " + Math.round(score),
        value: score,
        unit: "points",
        missing: score === null,
        metadata: { metric: "product-score" }
      });
    });
  } else if (template.metric === "proteinConsistency") {
    rows = periodDateKeys(window).map((key) => {
      const day = plateState && plateState.days && plateState.days[key];
      const entries = day && day.entries || [];
      const snapshotProtein = day && day.goalsSnapshot && day.goalsSnapshot.protein;
      const currentProtein = plateState && plateState.goals && plateState.goals.protein;
      const goalValue = number(snapshotProtein ?? currentProtein);
      const values = entries.map((entry) => number(entry && entry.contribution && entry.contribution.protein));
      const known = values.filter((value) => value !== null);
      const missingCount = values.length - known.length;
      const total = known.reduce((sum, value) => sum + value, 0);
      const missing = !entries.length || goalValue === null || !known.length || missingCount > 0;
      return evidenceRow({
        id: "plate-day:" + key + ":protein",
        sourceId: key,
        sourceType: "plate-day",
        occurredAt: key + "T12:00:00",
        label: parseDate(key + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        detail: !entries.length ? "No foods logged" : goalValue === null || !known.length ? "Protein data missing" : Math.round(total) + " of " + Math.round(goalValue) + " g" + (missingCount ? " | partial" : ""),
        value: missing ? null : total >= goalValue ? 1 : 0,
        unit: "day",
        missing,
        metadata: { metric: "protein-day", goal: goalValue, total, entryIds: entries.map((entry) => entry.id), missingCount }
      });
    });
  } else if (template.metric === "ingredientAvoidance") {
    const trackedValue = goal.trackedValue;
    const scanRows = activities.filter((item) => item.type === "product_scanned" || item.type === "ingredient_match").map((item) => {
      const ingredients = item.type === "ingredient_match" ? [item.metadata && item.metadata.ingredient] : item.metadata && item.metadata.ingredients;
      const labels = Array.isArray(ingredients) ? ingredients.filter(Boolean) : [];
      const matched = labels.length && labels.some((ingredient) => identitiesMatch(ingredient, trackedValue));
      return activityEvidence(item, {
        label: item.metadata && item.metadata.productName || "Reviewed product label",
        detail: !labels.length ? "Ingredient label missing" : matched ? "Matched " + trackedValue : "No matching ingredient in the available label",
        value: labels.length ? (matched ? 1 : 0) : null,
        unit: "label",
        missing: !labels.length,
        metadata: { metric: "ingredient-label", trackedValue, ingredientCount: labels.length }
      });
    });
    const mealRows = meals.map((meal) => {
      const labels = Array.isArray(meal.ingredients) ? meal.ingredients.filter(Boolean) : [];
      const matched = labels.length && labels.some((ingredient) => identitiesMatch(ingredient, trackedValue));
      return mealEvidence(meal, {
        detail: !labels.length ? "Ingredient label missing" : matched ? "Matched " + trackedValue : "No matching ingredient in the available label",
        value: labels.length ? (matched ? 1 : 0) : null,
        unit: "label",
        missing: !labels.length,
        metadata: { metric: "ingredient-label", trackedValue, ingredientCount: labels.length }
      });
    });
    rows = scanRows.concat(mealRows);
  }

  const deleted = deletedEvidenceIds(state);
  return uniqueEvidence(rows.concat(weeklySnapshotEvidence(state, template, window))).filter((row) => !deleted.has(row.sourceId));
}

function summarizeEvidence(template, goal, window, evidence) {
  const rule = METRIC_RULES[template.metric];
  const known = evidence.filter((item) => !item.missing && item.value !== null);
  const missing = evidence.filter((item) => item.missing || item.value === null);
  const dayCount = new Set(known.map((item) => item.dateKey).filter(Boolean)).size;
  const sampleCount = known.length;
  const meetsThreshold = sampleCount >= rule.minimumEvidence && dayCount >= rule.minimumDays;
  const completenessPercent = evidence.length ? Math.round(sampleCount / evidence.length * 100) : 0;
  const completeness = !evidence.length ? "none" : meetsThreshold && !missing.length ? "complete" : meetsThreshold ? "partial" : "sparse";
  const knownTotal = known.reduce((sum, item) => sum + item.value, 0);
  const observedDays = Math.max(1, window.observedDays || window.durationDays);
  let value = knownTotal;
  let comparisonValue = knownTotal;
  let unit = template.unit;
  let comparisonUnit = template.unit;
  let matchedCount = knownTotal;
  let metricSummary = sampleCount + " confirmed entries";

  if (template.metric === "groceryQuality" || template.metric === "averageProductQuality") {
    value = sampleCount ? knownTotal / sampleCount : null;
    comparisonValue = value;
    unit = "points";
    comparisonUnit = "points";
    matchedCount = sampleCount;
    metricSummary = sampleCount ? sampleCount + " documented product scores" : "No documented product scores";
  } else if (template.metric === "proteinConsistency") {
    value = sampleCount ? knownTotal / sampleCount * 100 : null;
    comparisonValue = value;
    unit = "% of logged days";
    comparisonUnit = "%";
    matchedCount = knownTotal;
    metricSummary = sampleCount ? "Goal reached on " + knownTotal + " of " + sampleCount + " complete days" : "No complete protein days";
  } else if (template.metric === "gymRoutine") {
    value = knownTotal / (observedDays / 7);
    comparisonValue = value;
    unit = "visits / week";
    comparisonUnit = "visits / week";
    matchedCount = knownTotal;
    metricSummary = knownTotal + " confirmed " + (knownTotal === 1 ? "visit" : "visits");
  } else if (template.metric === "ingredientAvoidance") {
    const reviewedDays = new Set(known.map((item) => item.dateKey)).size;
    const violationDays = new Set(known.filter((item) => item.value >= 1).map((item) => item.dateKey)).size;
    value = Math.max(0, reviewedDays - violationDays);
    comparisonValue = sampleCount ? knownTotal / sampleCount * 100 : null;
    unit = "days";
    comparisonUnit = "% labels matched";
    matchedCount = knownTotal;
    metricSummary = sampleCount ? knownTotal + " matching " + (knownTotal === 1 ? "label" : "labels") + " across " + reviewedDays + " reviewed days" : "No reviewed ingredient labels";
  } else if (["sodaReduction", "fastFoodReduction", "sugarySnackReduction"].includes(template.metric)) {
    matchedCount = knownTotal;
    comparisonUnit = template.metric === "fastFoodReduction" ? "visits" : template.metric === "sodaReduction" ? "soda choices" : "high-sugar scans";
    metricSummary = knownTotal + " matching " + (knownTotal === 1 ? "event" : "events") + " from " + sampleCount + " documented choices";
  }

  return {
    value,
    comparisonValue,
    unit,
    comparisonUnit,
    direction: rule.direction,
    insightType: rule.insightType,
    basisKey: template.id + ":" + normalizeIngredient(goal.trackedValue) + ":" + window.durationDays,
    basis: template.metric === "proteinConsistency"
      ? "complete logged days"
      : template.metric === "ingredientAvoidance"
        ? "reviewed ingredient labels"
        : template.metric === "groceryQuality" || template.metric === "averageProductQuality"
          ? "documented product scores"
          : "confirmed logged events",
    evidence,
    evidenceIds: evidence.map((item) => item.id),
    evidenceCount: evidence.length,
    sampleCount,
    missingCount: missing.length,
    dayCount,
    minimumEvidence: rule.minimumEvidence,
    minimumDays: rule.minimumDays,
    meetsThreshold,
    completeness,
    completenessPercent,
    matchedCount,
    metricSummary,
    periodStartKey: window.startKey,
    periodEndKey: window.endKey,
    startAt: window.start.toISOString(),
    endAt: window.analysisEnd.toISOString(),
    dateRange: formatDateRange(window),
    observedDays: window.observedDays,
    closed: window.closed
  };
}

function evaluatePeriod(goal, state, plateState, window) {
  const template = getLongTermGoalTemplate(goal.templateId);
  if (!template) return null;
  return summarizeEvidence(template, goal, window, buildMetricEvidence(template, goal, state, plateState, window));
}
function evaluationFromSnapshot(snapshot, state) {
  const metric = snapshot && snapshot.metric;
  if (!metric) return null;
  const deleted = deletedEvidenceIds(state);
  const versions = currentSourceVersions(state);
  const affected = (snapshot.evidence || []).filter((row) => {
    if (deleted.has(row.sourceId)) return true;
    const currentVersion = versions.get(row.sourceType + ":" + row.sourceId);
    const savedVersion = Date.parse(row.metadata && row.metadata.sourceUpdatedAt) || 0;
    return currentVersion && savedVersion && currentVersion > savedVersion;
  });
  const evidence = (snapshot.evidence || []).filter((row) => !deleted.has(row.sourceId));
  return {
    ...metric,
    evidence,
    evidenceIds: evidence.map((row) => row.id),
    meetsThreshold: affected.length ? false : Boolean(metric.meetsThreshold),
    completeness: affected.length ? "changed" : metric.completeness,
    changedEvidenceCount: affected.length,
    fromSnapshot: true,
    capturedAt: snapshot.capturedAt
  };
}

function comparablePeriods(current, previous) {
  if (!current || !previous) return { ready: false, reason: "minimum-evidence" };
  if (current.changedEvidenceCount || previous.changedEvidenceCount) return { ready: false, reason: "evidence-changed" };
  if (!current.meetsThreshold || !previous.meetsThreshold) return { ready: false, reason: "minimum-evidence" };
  if (current.basisKey !== previous.basisKey) return { ready: false, reason: "metric-changed" };
  const smaller = Math.min(current.sampleCount, previous.sampleCount);
  const larger = Math.max(current.sampleCount, previous.sampleCount);
  if (!larger || smaller / larger < 0.5) return { ready: false, reason: "uneven-evidence" };
  if (Math.abs(current.completenessPercent - previous.completenessPercent) > 35) return { ready: false, reason: "uneven-completeness" };
  return { ready: true, reason: "comparable" };
}

function formatValue(value) {
  if (!Number.isFinite(Number(value))) return "Missing";
  return Number.isInteger(Number(value)) ? String(Number(value)) : Number(value).toFixed(1).replace(/\.0$/, "");
}

function comparisonCopy(template, current, previous, trackedValue) {
  const before = formatValue(previous.comparisonValue);
  const after = formatValue(current.comparisonValue);
  const range = previous.dateRange + " compared with " + current.dateRange;
  if (template.metric === "sodaReduction") return "Logged soda choices changed from " + before + " to " + after + ". " + range + ".";
  if (template.metric === "fastFoodReduction") return "Quick-service visits changed from " + before + " to " + after + ". " + range + ".";
  if (template.metric === "sugarySnackReduction") return "High-sugar snack scans changed from " + before + " to " + after + ". " + range + ".";
  if (template.metric === "groceryQuality" || template.metric === "averageProductQuality") return "The documented average product score changed from " + before + " to " + after + ". " + range + ".";
  if (template.metric === "proteinConsistency") return "Protein-goal consistency changed from " + before + "% to " + after + "%. " + range + ".";
  if (template.metric === "gymRoutine") return "Confirmed gym visits changed from " + before + " to " + after + " per week. " + range + ".";
  if (template.metric === "ingredientAvoidance") return (trackedValue || "Tracked ingredient") + " label matches changed from " + before + "% to " + after + "%. " + range + ".";
  return "The documented result changed from " + before + " to " + after + ". " + range + ".";
}

function statusForComparison(template, current, previous, comparison, lifecycleStatus) {
  if (lifecycleStatus !== "active") return { status: lifecycleStatus, statusLabel: lifecycleStatus.charAt(0).toUpperCase() + lifecycleStatus.slice(1) };
  if (!current.evidenceCount) return { status: "needs-data", statusLabel: "No evidence yet" };
  if (!comparison.ready) return { status: "building", statusLabel: "Comparison not ready" };
  const difference = current.comparisonValue - previous.comparisonValue;
  const improvement = current.direction === "lower" ? -difference : difference;
  const tolerance = ["proteinConsistency", "ingredientAvoidance"].includes(template.metric) ? 5 : template.metric === "gymRoutine" ? 0.25 : ["groceryQuality", "averageProductQuality"].includes(template.metric) ? 1 : 0;
  if (Math.abs(improvement) <= tolerance) return { status: "steady", statusLabel: "About the same" };
  return improvement > 0 ? { status: "improving", statusLabel: "Improving" } : { status: "watch", statusLabel: "Changed direction" };
}

function goalMeasure(template, current, previous, comparison) {
  if (["sodaReduction", "fastFoodReduction", "sugarySnackReduction"].includes(template.metric)) {
    if (!comparison.ready || previous.comparisonValue <= 0) return null;
    return (previous.comparisonValue - current.comparisonValue) / previous.comparisonValue * 100;
  }
  if (["groceryQuality", "averageProductQuality"].includes(template.metric)) return comparison.ready ? current.comparisonValue - previous.comparisonValue : null;
  return current.value;
}

function comparisonNotReadyCopy(reason, current, previous) {
  if (reason === "evidence-changed") return "A saved period references an entry that was corrected or deleted. Start a fresh comparable period before reading a trend.";
  if (reason === "metric-changed") return "The tracking definition changed, so the saved period is not directly comparable.";
  if (reason === "uneven-evidence" || reason === "uneven-completeness") return "The two periods have substantially different evidence coverage, so Ziya will not state a direction yet.";
  const currentNeed = Math.max(0, current.minimumEvidence - current.sampleCount);
  const previousNeed = Math.max(0, previous.minimumEvidence - previous.sampleCount);
  if (currentNeed) return "Current period needs " + currentNeed + " more confirmed " + (currentNeed === 1 ? "entry" : "entries") + " before comparison.";
  if (previousNeed) return "Previous period needs " + previousNeed + " more confirmed " + (previousNeed === 1 ? "entry" : "entries") + " before comparison.";
  return "More comparable confirmed activity is needed before Ziya states a direction.";
}

function findSnapshot(state, goalId, periodStartKey) {
  return (state && state.longTermSnapshots || []).find((snapshot) => snapshot.goalId === goalId && snapshot.periodStartKey === periodStartKey) || null;
}

function calculateGoal(goal, state, plateState, now) {
  const template = getLongTermGoalTemplate(goal.templateId);
  if (!template) return null;
  const stoppedAt = goalStoppedAt(goal);
  const evaluationNow = Number.isFinite(stoppedAt) && stoppedAt < parseDate(now).getTime() ? new Date(stoppedAt) : now;
  const windows = getLongTermPeriodWindows(goal, evaluationNow);
  const currentSaved = windows.current.closed && findSnapshot(state, goal.id, windows.current.startKey);
  const previousSaved = findSnapshot(state, goal.id, windows.previous.startKey);
  const current = currentSaved ? evaluationFromSnapshot(currentSaved, state) : evaluatePeriod(goal, state, plateState, windows.current);
  const previous = previousSaved ? evaluationFromSnapshot(previousSaved, state) : evaluatePeriod(goal, state, plateState, windows.previous);
  const comparison = comparablePeriods(current, previous);
  const target = number(goal.target) ?? template.defaultTarget;
  const measure = goalMeasure(template, current, previous, comparison);
  const lifecycleStatus = LONG_TERM_GOAL_STATUSES.includes(goal.status) ? goal.status : goal.enabled === false ? "paused" : "active";
  const status = statusForComparison(template, current, previous, comparison, lifecycleStatus);
  const insight = comparison.ready ? comparisonCopy(template, current, previous, goal.trackedValue) : "";
  return {
    id: goal.id,
    templateId: template.id,
    label: goal.label || template.label,
    description: template.description,
    trackedValue: goal.trackedValue || "",
    durationDays: periodDuration(goal, template),
    target,
    unit: template.unit,
    value: measure,
    progress: measure === null ? 0 : Math.max(0, Math.min(100, measure / Math.max(0.1, target) * 100)),
    hasData: current.evidenceCount > 0 || previous.evidenceCount > 0,
    comparisonReady: comparison.ready,
    comparisonReason: comparison.reason,
    status: status.status,
    statusLabel: status.statusLabel,
    lifecycleStatus,
    insightType: current.insightType,
    insight,
    detail: insight || current.metricSummary + ". " + comparisonNotReadyCopy(comparison.reason, current, previous),
    nextStep: comparison.ready ? "Open the evidence to review what counted." : "Keep confirming relevant entries in both periods.",
    current,
    previous,
    evidenceCount: current.sampleCount + previous.sampleCount,
    completeness: comparison.ready ? current.completeness === "complete" && previous.completeness === "complete" ? "complete" : "partial" : current.evidenceCount || previous.evidenceCount ? "building" : "none",
    caveat: "This reflects only confirmed activity in Ziya. Selective logging can change the comparison.",
    period: windows,
    updatedAt: goal.updatedAt,
    definition: goal
  };
}

export function buildLongTermGoalSummary({ phase2State, plateState, now = new Date() }) {
  const definitions = phase2State && phase2State.longTermGoals || [];
  const goals = definitions.filter((goal) => (goal.status || (goal.enabled === false ? "paused" : "active")) === "active")
    .map((goal) => calculateGoal(goal, phase2State, plateState, now)).filter(Boolean)
    .sort((left, right) => Number(right.comparisonReady) - Number(left.comparisonReady)
      || Number(right.current.meetsThreshold) - Number(left.current.meetsThreshold)
      || Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  const inactiveGoals = definitions.filter((goal) => (goal.status || (goal.enabled === false ? "paused" : "active")) !== "active")
    .map((goal) => calculateGoal(goal, phase2State, plateState, now)).filter(Boolean);
  const readyInsightCount = goals.filter((goal) => goal.comparisonReady).length;
  return {
    goals,
    featuredGoals: goals.slice(0, 3),
    inactiveGoals,
    readyInsightCount,
    dataReadyCount: goals.filter((goal) => goal.current.meetsThreshold).length,
    comparisonBuildingCount: goals.filter((goal) => !goal.comparisonReady).length,
    summary: readyInsightCount
      ? readyInsightCount + " evidence-backed " + (readyInsightCount === 1 ? "trend is" : "trends are") + " ready."
      : goals.length ? "Your first comparable periods are still building." : "Choose one direction to start a stable baseline."
  };
}
export function createLongTermGoal(templateId, overrides = {}) {
  const template = getLongTermGoalTemplate(templateId);
  if (!template) return null;
  const created = parseDate(overrides.now || new Date()).toISOString();
  const status = LONG_TERM_GOAL_STATUSES.includes(overrides.status) ? overrides.status : overrides.enabled === false ? "paused" : "active";
  return {
    id: overrides.id || ("long:" + template.id + ":" + Date.now()),
    parentGoalId: String(overrides.parentGoalId || ""),
    templateId: template.id,
    label: String(overrides.label || template.label).trim().slice(0, 100) || template.label,
    target: Math.max(0.1, number(overrides.target) ?? template.defaultTarget),
    durationDays: periodDuration({ durationDays: overrides.durationDays }, template),
    trackedValue: String(overrides.trackedValue || "").trim().slice(0, 100),
    status,
    enabled: status === "active",
    ruleVersion: LONG_TERM_RULE_VERSION,
    startDate: parseDate(overrides.startDate || created).toISOString(),
    activatedAt: status === "active" ? parseDate(overrides.activatedAt || created).toISOString() : (overrides.activatedAt || null),
    pausedAt: status === "paused" ? created : null,
    completedAt: status === "completed" ? created : null,
    archivedAt: status === "archived" ? created : null,
    createdAt: parseDate(overrides.createdAt || created).toISOString(),
    updatedAt: created
  };
}

export function updateLongTermGoal(goal, updates = {}, now = new Date()) {
  const template = getLongTermGoalTemplate(updates.templateId || (goal && goal.templateId));
  if (!goal || !template) return goal;
  return {
    ...goal,
    templateId: template.id,
    label: String(updates.label ?? goal.label ?? template.label).trim().slice(0, 100) || template.label,
    target: Math.max(0.1, number(updates.target) ?? number(goal.target) ?? template.defaultTarget),
    durationDays: periodDuration({ durationDays: updates.durationDays ?? goal.durationDays }, template),
    trackedValue: String(updates.trackedValue ?? goal.trackedValue ?? "").trim().slice(0, 100),
    ruleVersion: LONG_TERM_RULE_VERSION,
    updatedAt: parseDate(now).toISOString()
  };
}

export function transitionLongTermGoal(goal, status, now = new Date()) {
  if (!goal || !LONG_TERM_GOAL_STATUSES.includes(status)) return goal;
  const updatedAt = parseDate(now).toISOString();
  return {
    ...goal,
    status,
    enabled: status === "active",
    activatedAt: status === "active" ? updatedAt : goal.activatedAt || null,
    pausedAt: status === "paused" ? updatedAt : goal.pausedAt || null,
    completedAt: status === "completed" ? updatedAt : goal.completedAt || null,
    archivedAt: status === "archived" ? updatedAt : goal.archivedAt || null,
    updatedAt
  };
}

export function restartLongTermGoal(goal, overrides = {}, now = new Date()) {
  if (!goal) return null;
  const restartedAt = parseDate(now).toISOString();
  return createLongTermGoal(goal.templateId, {
    ...goal,
    ...overrides,
    id: overrides.id || ("long:" + goal.templateId + ":" + Date.now()),
    parentGoalId: goal.id,
    status: "active",
    startDate: restartedAt,
    createdAt: restartedAt,
    activatedAt: restartedAt,
    now: restartedAt
  });
}

export function createLongTermSnapshot({ phase2State, plateState, goal, window, now = new Date() }) {
  const template = getLongTermGoalTemplate(goal && goal.templateId);
  if (!template || !window) return null;
  const fullWindow = { ...window, analysisEnd: new Date(window.end), observedDays: window.durationDays, closed: true };
  const metric = evaluatePeriod(goal, phase2State, plateState, fullWindow);
  const metricWithoutEvidence = { ...metric };
  delete metricWithoutEvidence.evidence;
  return {
    id: "long-term-snapshot:" + goal.id + ":" + window.startKey,
    goalId: goal.id,
    parentGoalId: goal.parentGoalId || "",
    templateId: template.id,
    label: goal.label || template.label,
    target: number(goal.target) ?? template.defaultTarget,
    trackedValue: goal.trackedValue || "",
    durationDays: window.durationDays,
    periodStartKey: window.startKey,
    periodEndKey: window.endKey,
    startAt: window.start.toISOString(),
    endAt: window.end.toISOString(),
    capturedAt: parseDate(now).toISOString(),
    immutable: true,
    ruleVersion: LONG_TERM_RULE_VERSION,
    metric: metricWithoutEvidence,
    evidence: metric.evidence.map((item) => ({ ...item }))
  };
}

function goalStoppedAt(goal) {
  if (goal.status === "paused") return Date.parse(goal.pausedAt);
  if (goal.status === "completed") return Date.parse(goal.completedAt);
  if (goal.status === "archived") return Date.parse(goal.archivedAt);
  return Number.NaN;
}

export function materializeClosedLongTermSnapshots({ phase2State, plateState, now = new Date(), maxPeriodsPerGoal = 24 }) {
  const existing = new Map((phase2State && phase2State.longTermSnapshots || []).map((snapshot) => [snapshot.id, snapshot]));
  (phase2State && phase2State.longTermGoals || []).forEach((goal) => {
    const status = goal.status || (goal.enabled === false ? "paused" : "active");
    if (status === "draft") return;
    const currentIndex = activePeriodIndex(goal, now);
    const stoppedAt = goalStoppedAt(goal);
    const firstIndex = Math.max(-1, currentIndex - maxPeriodsPerGoal);
    for (let index = currentIndex - 1; index >= firstIndex; index -= 1) {
      const window = fullPeriodWindow(goal, index);
      if (Number.isFinite(stoppedAt) && index >= 0 && window.end.getTime() > stoppedAt) continue;
      const id = "long-term-snapshot:" + goal.id + ":" + window.startKey;
      if (!existing.has(id)) {
        const snapshot = createLongTermSnapshot({ phase2State, plateState, goal, window, now });
        if (snapshot) existing.set(id, snapshot);
      }
    }
  });
  return [...existing.values()].sort((left, right) => String(right.periodStartKey).localeCompare(String(left.periodStartKey))).slice(0, 240);
}

export function getLongTermGoalHistory(phase2State, goalId) {
  return (phase2State && phase2State.longTermSnapshots || [])
    .filter((snapshot) => snapshot.goalId === goalId)
    .sort((left, right) => String(right.periodStartKey).localeCompare(String(left.periodStartKey)));
}

export function getSupportedLongTermDurations() {
  return [...SUPPORTED_DURATIONS];
}