import { getWeeklyGoalTemplate } from "../data/restaurantGoalRules";

const NUTRIENTS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];
const WEEKLY_RULE_VERSION = 2;

export const WEEKLY_GOAL_STATUSES = Object.freeze(["draft", "active", "paused", "completed", "archived"]);

function number(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  const result = new Date(year, month - 1, day, 0, 0, 0, 0);
  return Number.isFinite(result.getTime()) ? result : null;
}

function parseDate(value, fallback = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date(fallback);
}

function startOfLocalDay(value) {
  const result = parseDate(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function displayDate(value) {
  const date = dateFromKey(value) || parseDate(value);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function getWeekWindow(now = new Date(), weekStartsOn = 1) {
  const current = startOfLocalDay(now);
  const offset = (current.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(current);
  start.setDate(start.getDate() - offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  return {
    start,
    end,
    startKey: dateKey(start),
    endKey: dateKey(lastDay),
    keys: Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(day.getDate() + index);
      return dateKey(day);
    })
  };
}

export function getWeekWindowFromKey(startKey) {
  const start = dateFromKey(startKey);
  return start ? getWeekWindow(start) : getWeekWindow();
}

export function shiftWeekWindow(window, weeks) {
  const start = new Date(window.start);
  start.setDate(start.getDate() + weeks * 7);
  return getWeekWindow(start);
}

function inWindow(value, window) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= window.start.getTime() && time < window.end.getTime();
}

function dayNutrition(day) {
  const values = Object.fromEntries(NUTRIENTS.map((key) => [key, { total: 0, knownCount: 0, missingCount: 0 }]));
  (day?.entries || []).forEach((entry) => {
    NUTRIENTS.forEach((key) => {
      const nutrient = number(entry?.contribution?.[key]);
      if (nutrient === null) values[key].missingCount += 1;
      else {
        values[key].total += nutrient;
        values[key].knownCount += 1;
      }
    });
  });
  return values;
}

function uniqueEvents(items, keyBuilder) {
  const keys = new Set();
  return items.filter((item) => {
    const key = keyBuilder(item);
    if (!key || keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

function evidenceRow({ id, sourceId, sourceType, date, label, detail, value = null, unit = "", missing = false, metadata = {} }) {
  return {
    id,
    sourceId: sourceId || id,
    sourceType,
    dateKey: date,
    occurredAt: metadata.occurredAt || `${date}T12:00:00`,
    label,
    detail,
    value: number(value),
    unit,
    missing: Boolean(missing),
    metadata
  };
}

function activityEvidence(item, { label, detail, value = 1, unit = "entry" }) {
  const key = dateKey(parseDate(item.occurredAt));
  return evidenceRow({
    id: `activity:${item.id}`,
    sourceId: item.id,
    sourceType: "activity",
    date: key,
    label,
    detail,
    value,
    unit,
    metadata: { occurredAt: item.occurredAt, activityType: item.type, source: item.source }
  });
}

function mealEvidence(item, { value = 1, missing = false, detail } = {}) {
  const key = dateKey(parseDate(item.occurredAt));
  return evidenceRow({
    id: `meal:${item.id}`,
    sourceId: item.id,
    sourceType: "restaurant-meal",
    date: key,
    label: item.itemName || item.restaurantName || "Restaurant meal",
    detail: detail || `${item.restaurantName || "Restaurant"} | ${item.servingSize || "Confirmed meal"}`,
    value,
    unit: "meal",
    missing,
    metadata: { occurredAt: item.occurredAt, restaurantId: item.restaurantId, goalFit: item.goalFit }
  });
}

function plateEntryEvidence(entry, key, nutrient, unit) {
  const value = number(entry?.contribution?.[nutrient]);
  const serving = entry?.mode === "servings"
    ? `${formatMetric(entry.amount)} serving${Number(entry.amount) === 1 ? "" : "s"}`
    : `${formatMetric(entry.amount)} ${entry?.mode === "milliliters" ? "ml" : "g"}`;
  return evidenceRow({
    id: `plate:${key}:${entry.id}`,
    sourceId: entry.id,
    sourceType: "plate-entry",
    date: key,
    label: entry?.product?.name || "Food entry",
    detail: `${serving} | ${value === null ? `${nutrient} missing` : `${formatMetric(value)} ${unit}`}`,
    value,
    unit,
    missing: value === null,
    metadata: { occurredAt: entry.addedAt || `${key}T12:00:00`, productId: entry.productId, nutrient }
  });
}

function metricEvidence({ activities, meals, plateDays, dayTotals, plateState }) {
  const fastFoodMeals = meals.filter((item) => item.placeType === "fast_food");
  const unlinkedVisits = activities.filter((item) => item.type === "fast_food_visit" && !item.restaurantMealId);
  const fastFood = [
    ...fastFoodMeals.map((item) => mealEvidence(item)),
    ...unlinkedVisits.map((item) => activityEvidence(item, {
      label: item.metadata?.placeName || "Quick-service visit",
      detail: "Confirmed quick-service visit",
      unit: "meal"
    }))
  ];

  const proteinDays = dayTotals.flatMap(({ key, day, totals }) => {
    if (!(day?.entries || []).length) return [];
    const goal = number(day?.goalsSnapshot?.protein ?? plateState?.goals?.protein);
    const known = totals.protein.knownCount > 0;
    const reached = known && goal !== null && totals.protein.total >= goal;
    return [evidenceRow({
      id: `plate-day:${key}:protein`,
      sourceId: key,
      sourceType: "plate-day",
      date: key,
      label: displayDate(key),
      detail: goal === null
        ? "Protein goal missing for this day"
        : `${formatMetric(totals.protein.total)} of ${formatMetric(goal)} g${totals.protein.missingCount ? " | partial" : ""}`,
      value: reached ? 1 : 0,
      unit: "day",
      missing: !known || totals.protein.missingCount > 0 || goal === null,
      metadata: {
        goal,
        total: totals.protein.total,
        entryIds: (day.entries || []).map((entry) => entry.id),
        missingCount: totals.protein.missingCount
      }
    })];
  });

  const nutritionRows = (nutrient, unit) => plateDays.flatMap(({ key, day }) =>
    (day?.entries || []).map((entry) => plateEntryEvidence(entry, key, nutrient, unit))
  );

  const gym = uniqueEvents(activities.filter((item) => item.type === "gym_visit"), (item) => item.id)
    .map((item) => activityEvidence(item, {
      label: item.metadata?.placeName || "Gym visit",
      detail: item.source === "location-confirmed" ? "Visit confirmed from a place check" : "Visit confirmed manually",
      unit: "visit"
    }));

  const grocery = uniqueEvents(activities.filter((item) => item.type === "grocery_scan"
    || (item.type === "product_scanned" && item.metadata?.context === "grocery")), (item) => item.id)
    .map((item) => activityEvidence(item, {
      label: item.metadata?.productName || "Grocery scan",
      detail: "Product scan confirmed in a grocery context",
      unit: "scan"
    }));

  const restaurantChoices = meals.map((item) => mealEvidence(item, {
    value: item.goalFit === "fits" ? 1 : 0,
    missing: !item.goalFit || item.goalFit === "needs-data",
    detail: item.goalFit === "fits"
      ? `${item.restaurantName || "Restaurant"} | matched current goals`
      : item.goalFit === "needs-data"
        ? `${item.restaurantName || "Restaurant"} | needs more label data`
        : `${item.restaurantName || "Restaurant"} | reviewed choice`
  }));

  return {
    fastFoodVisits: fastFood,
    proteinGoalDays: proteinDays,
    weeklySugar: nutritionRows("sugar", "g"),
    weeklySodium: nutritionRows("sodium", "mg"),
    gymVisits: gym,
    groceryScans: grocery,
    betterRestaurantChoices: restaurantChoices
  };
}

export function buildWeeklyMetrics({ phase2State, plateState, now = new Date(), window: suppliedWindow = null }) {
  const window = suppliedWindow || getWeekWindow(now);
  const activities = uniqueEvents(
    (phase2State?.activities || []).filter((item) => inWindow(item.occurredAt, window)),
    (item) => item.id
  );
  const meals = uniqueEvents(
    (phase2State?.restaurantMeals || []).filter((item) => inWindow(item.occurredAt, window)),
    (item) => item.id
  );
  const plateDays = window.keys.map((key) => ({ key, day: plateState?.days?.[key] || null }));
  const dayTotals = plateDays.map(({ key, day }) => ({ key, day, totals: dayNutrition(day) }));
  const nutrition = {};

  NUTRIENTS.forEach((nutrient) => {
    nutrition[nutrient] = dayTotals.reduce((result, item) => ({
      total: result.total + item.totals[nutrient].total,
      knownCount: result.knownCount + item.totals[nutrient].knownCount,
      missingCount: result.missingCount + item.totals[nutrient].missingCount
    }), { total: 0, knownCount: 0, missingCount: 0 });
  });

  const evidenceByMetric = metricEvidence({ activities, meals, plateDays, dayTotals, plateState });
  const sumKnown = (metric) => evidenceByMetric[metric]
    .filter((item) => item.value !== null)
    .reduce((sum, item) => sum + item.value, 0);

  return {
    window,
    metrics: {
      fastFoodVisits: sumKnown("fastFoodVisits"),
      proteinGoalDays: sumKnown("proteinGoalDays"),
      weeklySugar: nutrition.sugar.total,
      weeklySodium: nutrition.sodium.total,
      gymVisits: sumKnown("gymVisits"),
      groceryScans: sumKnown("groceryScans"),
      betterRestaurantChoices: sumKnown("betterRestaurantChoices")
    },
    nutrition,
    activities,
    meals,
    dayTotals,
    evidenceByMetric
  };
}

function dailyEvidence(window, evidence) {
  return window.keys.map((key) => {
    const rows = evidence.filter((item) => item.dateKey === key);
    const quantified = rows.filter((item) => item.value !== null);
    return {
      dateKey: key,
      label: displayDate(key),
      value: quantified.reduce((sum, item) => sum + item.value, 0),
      evidenceCount: rows.length,
      missingCount: rows.filter((item) => item.missing).length,
      evidenceIds: rows.map((item) => item.id)
    };
  });
}

function goalProgress(goal, template, current, evidence, window) {
  const target = Math.max(0.1, number(goal.target) ?? template.defaultTarget);
  const isLimit = template.direction === "limit" || template.direction === "average-limit";
  const hasEvidence = evidence.length > 0;
  const missingEvidenceCount = evidence.filter((item) => item.missing).length;
  const partial = missingEvidenceCount > 0;
  const progress = Math.min(100, Math.max(0, (current / target) * 100));
  const remaining = Math.max(0, target - current);
  let status = "in-progress";
  let statusLabel = "In progress";
  let summary = `${formatMetric(remaining)} ${template.unit} to go`;
  let nextStep = "Open the evidence to see what has counted so far.";

  if (!hasEvidence) {
    status = "no-data";
    statusLabel = "Not enough data";
    summary = "No confirmed entries yet";
    nextStep = "Confirmed logs, scans, meals, or visits will appear here.";
  } else if (isLimit && current > target) {
    status = "over";
    statusLabel = "Over limit";
    summary = `${formatMetric(current - target)} ${template.unit} over the weekly limit`;
    nextStep = partial ? "Some entries are still missing data, so the known total is partial." : "Review the entries that contributed to this total.";
  } else if (isLimit && partial) {
    status = "partial";
    statusLabel = "Partial data";
    summary = `${formatMetric(current)} ${template.unit} confirmed | partial total`;
    nextStep = "At least one relevant entry is missing the required field.";
  } else if (isLimit && progress >= 80) {
    status = "close";
    statusLabel = "Close to limit";
    summary = `${formatMetric(remaining)} ${template.unit} of room left`;
    nextStep = "Review the confirmed entries before planning another choice.";
  } else if (isLimit) {
    status = "room-left";
    statusLabel = "Room left";
    summary = `${formatMetric(remaining)} ${template.unit} available this week`;
    nextStep = "You can inspect the confirmed entries behind this total.";
  } else if (current >= target) {
    status = "reached";
    statusLabel = "Target reached";
    summary = partial ? "Target reached from known data | partial total" : "Weekly target reached";
    nextStep = partial ? "Some supporting entries still have missing data." : "Review what contributed to this week.";
  } else if (partial) {
    status = "partial";
    statusLabel = "Partial data";
    summary = `${formatMetric(current)} of ${formatMetric(target)} ${template.unit} confirmed`;
    nextStep = "At least one relevant entry is missing the required field.";
  }

  return {
    id: goal.id,
    templateId: template.id,
    label: goal.label || template.label,
    description: template.description,
    unit: template.unit,
    direction: template.direction,
    directionLabel: isLimit ? "Stay at or below" : "Reach at least",
    target,
    current,
    remaining,
    progress,
    reached: hasEvidence && (isLimit ? current <= target && !partial : current >= target),
    partial,
    hasEvidence,
    status,
    statusLabel,
    lifecycleStatus: goal.status || (goal.enabled === false ? "paused" : "active"),
    completeness: !hasEvidence ? "none" : partial ? "partial" : "complete",
    evidenceCount: evidence.length,
    missingEvidenceCount,
    evidenceIds: evidence.map((item) => item.id),
    evidence,
    dailyProgress: dailyEvidence(window, evidence),
    summary,
    nextStep,
    ruleVersion: goal.ruleVersion || WEEKLY_RULE_VERSION
  };
}

function currentGoals(phase2State) {
  return (phase2State?.weeklyGoals || []).filter((goal) => (goal.status || (goal.enabled === false ? "paused" : "active")) === "active");
}

export function buildWeeklyGoalSummary({ phase2State, plateState, now = new Date(), window = null, goals = null }) {
  const base = buildWeeklyMetrics({ phase2State, plateState, now, window });
  const sourceGoals = goals || currentGoals(phase2State);
  const evaluatedGoals = sourceGoals.map((goal) => {
    const template = getWeeklyGoalTemplate(goal.templateId);
    if (!template) return null;
    const current = number(base.metrics[template.metric]) ?? 0;
    return goalProgress(goal, template, current, base.evidenceByMetric[template.metric] || [], base.window);
  }).filter(Boolean);
  const evidenceGoalCount = evaluatedGoals.filter((goal) => goal.hasEvidence).length;
  const partialGoalCount = evaluatedGoals.filter((goal) => goal.partial).length;
  return {
    ...base,
    goals: evaluatedGoals,
    reachedCount: evaluatedGoals.filter((goal) => goal.status === "reached").length,
    onTrackCount: evaluatedGoals.filter((goal) => ["reached", "in-progress", "room-left", "close"].includes(goal.status)).length,
    evidenceGoalCount,
    partialGoalCount,
    summary: evaluatedGoals.length === 0
      ? "Add a weekly goal to connect your confirmed choices."
      : evidenceGoalCount === 0
        ? "No confirmed entries yet. Your first supported log, scan, meal, or visit will appear here."
        : partialGoalCount > 0
          ? `${evidenceGoalCount} goal${evidenceGoalCount === 1 ? " has" : "s have"} confirmed evidence. Some totals are partial.`
          : `${evidenceGoalCount} goal${evidenceGoalCount === 1 ? " has" : "s have"} confirmed evidence this week.`
  };
}

export function createWeeklyGoal(templateId, overrides = {}) {
  const template = getWeeklyGoalTemplate(templateId);
  if (!template) return null;
  const now = overrides.now ? parseDate(overrides.now).toISOString() : new Date().toISOString();
  const status = WEEKLY_GOAL_STATUSES.includes(overrides.status) ? overrides.status : "active";
  return {
    id: overrides.id || `weekly:${template.id}:${Date.now()}`,
    templateId: template.id,
    label: overrides.label || template.label,
    target: Math.max(0.1, number(overrides.target) ?? template.defaultTarget),
    status,
    enabled: status === "active",
    ruleVersion: WEEKLY_RULE_VERSION,
    activatedAt: status === "active" ? (overrides.activatedAt || now) : (overrides.activatedAt || null),
    pausedAt: status === "paused" ? now : null,
    completedAt: status === "completed" ? now : null,
    archivedAt: status === "archived" ? now : null,
    createdAt: overrides.createdAt || now,
    updatedAt: now
  };
}

export function updateWeeklyGoal(goal, updates = {}, now = new Date()) {
  const template = getWeeklyGoalTemplate(updates.templateId || goal?.templateId);
  if (!goal || !template) return goal;
  const updatedAt = parseDate(now).toISOString();
  return {
    ...goal,
    templateId: template.id,
    label: String(updates.label ?? goal.label ?? template.label).trim().slice(0, 100) || template.label,
    target: Math.max(0.1, number(updates.target) ?? number(goal.target) ?? template.defaultTarget),
    ruleVersion: WEEKLY_RULE_VERSION,
    updatedAt
  };
}

export function transitionWeeklyGoal(goal, status, now = new Date()) {
  if (!goal || !WEEKLY_GOAL_STATUSES.includes(status)) return goal;
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

function goalWasTrackedInWindow(goal, window) {
  const createdAt = Date.parse(goal.activatedAt || goal.createdAt);
  if (!Number.isFinite(createdAt) || createdAt >= window.end.getTime()) return false;
  const stoppedAt = Date.parse(goal.status === "archived" ? goal.archivedAt : goal.status === "completed" ? goal.completedAt : goal.status === "paused" ? goal.pausedAt : null);
  if (Number.isFinite(stoppedAt) && stoppedAt <= window.start.getTime()) return false;
  if (goal.status === "draft" && !goal.activatedAt) return false;
  return true;
}

export function createWeeklySnapshot({ phase2State, plateState, window, now = new Date() }) {
  const closedWindow = window || shiftWeekWindow(getWeekWindow(now), -1);
  const goals = (phase2State?.weeklyGoals || []).filter((goal) => goalWasTrackedInWindow(goal, closedWindow));
  const summary = buildWeeklyGoalSummary({ phase2State, plateState, window: closedWindow, goals });
  const capturedAt = parseDate(now).toISOString();
  return {
    id: `weekly-snapshot:${closedWindow.startKey}`,
    weekStartKey: closedWindow.startKey,
    weekEndKey: closedWindow.endKey,
    startAt: closedWindow.start.toISOString(),
    endAt: closedWindow.end.toISOString(),
    capturedAt,
    immutable: true,
    ruleVersion: WEEKLY_RULE_VERSION,
    summary: summary.summary,
    goals: summary.goals.map((goal) => ({ ...goal })),
    goalIds: summary.goals.map((goal) => goal.id),
    evidenceIds: [...new Set(summary.goals.flatMap((goal) => goal.evidenceIds))],
    evidenceGoalCount: summary.evidenceGoalCount,
    partialGoalCount: summary.partialGoalCount,
    reachedCount: summary.reachedCount
  };
}

export function materializeClosedWeeklySnapshots({ phase2State, plateState, now = new Date(), maxWeeks = 52 }) {
  const currentWindow = getWeekWindow(now);
  const existing = new Map((phase2State?.weeklySnapshots || []).map((snapshot) => [snapshot.weekStartKey, snapshot]));
  const goals = phase2State?.weeklyGoals || [];
  const earliestGoalTime = goals.reduce((earliest, goal) => {
    const value = Date.parse(goal.createdAt);
    return Number.isFinite(value) ? Math.min(earliest, value) : earliest;
  }, Number.POSITIVE_INFINITY);
  if (!goals.length || !Number.isFinite(earliestGoalTime)) return [...existing.values()];

  let candidate = shiftWeekWindow(currentWindow, -1);
  let count = 0;
  while (count < maxWeeks && candidate.end.getTime() > earliestGoalTime) {
    if (!existing.has(candidate.startKey)) {
      const snapshot = createWeeklySnapshot({ phase2State, plateState, window: candidate, now });
      if (snapshot.goals.length > 0) existing.set(candidate.startKey, snapshot);
    }
    candidate = shiftWeekWindow(candidate, -1);
    count += 1;
  }
  return [...existing.values()].sort((a, b) => b.weekStartKey.localeCompare(a.weekStartKey));
}

export function summaryFromWeeklySnapshot(snapshot) {
  if (!snapshot) return null;
  const window = getWeekWindowFromKey(snapshot.weekStartKey);
  const goals = Array.isArray(snapshot.goals) ? snapshot.goals.map((goal) => ({ ...goal })) : [];
  return {
    window,
    goals,
    summary: snapshot.summary || (goals.length ? "Saved weekly recap." : "No goals were tracked this week."),
    reachedCount: Number(snapshot.reachedCount) || 0,
    evidenceGoalCount: Number(snapshot.evidenceGoalCount) || goals.filter((goal) => goal.hasEvidence).length,
    partialGoalCount: Number(snapshot.partialGoalCount) || goals.filter((goal) => goal.partial).length,
    isSnapshot: true,
    capturedAt: snapshot.capturedAt
  };
}

export function formatMetric(value) {
  if (!Number.isFinite(Number(value))) return "Missing";
  const numeric = Number(value);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, "");
}
