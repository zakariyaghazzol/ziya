import { getLongTermGoalTemplate } from "../data/restaurantGoalRules";
import { resolveLocalIngredientKnowledge } from "../knowledge/ingredientKnowledge";
import { buildWeeklyMetrics } from "./weeklyGoalEngine";

const DAY_MS = 86400000;

function number(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function within(value, start, end) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= start && time < end;
}

function activityCount(activities, type, start, end, predicate = () => true) {
  return activities.filter((item) => item.type === type && within(item.occurredAt, start, end) && predicate(item)).length;
}

function reductionMetric(current, previous) {
  if (!previous) return current ? { value: 0, hasBaseline: false } : { value: 100, hasBaseline: false };
  return { value: Math.max(-100, ((previous - current) / previous) * 100), hasBaseline: true };
}

function recentPeriod(now, days) {
  const end = new Date(now).getTime() + 1;
  const start = end - days * DAY_MS;
  const previousStart = start - days * DAY_MS;
  return { start, end, previousStart, previousEnd: start };
}

function normalizeIngredient(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function ingredientIdentity(value) {
  const raw = normalizeIngredient(value);
  if (!raw) return new Set();
  const record = resolveLocalIngredientKnowledge(value, { category: "food" });
  return new Set([
    raw,
    normalizeIngredient(record.canonicalName),
    ...(record.aliases || []).map(normalizeIngredient)
  ].filter(Boolean));
}

function identitiesMatch(left, right) {
  const leftKeys = ingredientIdentity(left);
  const rightKeys = ingredientIdentity(right);
  for (const key of leftKeys) {
    if (rightKeys.has(key)) return true;
  }
  return false;
}

function ingredientAvoidanceStats(state, trackedValue, start, end) {
  const observations = [];
  (state.activities || []).forEach((item) => {
    if (!within(item.occurredAt, start, end)) return;
    const ingredients = item.type === "ingredient_match"
      ? [item.metadata?.ingredient]
      : item.type === "product_scanned"
        ? item.metadata?.ingredients
        : [];
    const labels = Array.isArray(ingredients) ? ingredients.filter(Boolean) : [];
    if (labels.length) observations.push({ occurredAt: item.occurredAt, labels });
  });
  (state.restaurantMeals || []).forEach((meal) => {
    if (!within(meal.occurredAt, start, end) || !meal.ingredients?.length) return;
    observations.push({ occurredAt: meal.occurredAt, labels: meal.ingredients });
  });
  const reviewedDays = new Set();
  const violationDays = new Set();
  let violations = 0;
  observations.forEach((observation) => {
    const day = new Date(observation.occurredAt).toISOString().slice(0, 10);
    reviewedDays.add(day);
    if (observation.labels.some((ingredient) => identitiesMatch(ingredient, trackedValue))) {
      violations += 1;
      violationDays.add(day);
    }
  });
  return {
    observations: observations.length,
    reviewedDays: reviewedDays.size,
    compliantDays: [...reviewedDays].filter((day) => !violationDays.has(day)).length,
    violations
  };
}

function fastFoodEventCount(state, start, end) {
  const meals = (state.restaurantMeals || []).filter((meal) => meal.placeType === "fast_food" && within(meal.occurredAt, start, end));
  const unlinkedVisits = (state.activities || []).filter((item) => item.type === "fast_food_visit" && !item.restaurantMealId && within(item.occurredAt, start, end));
  return meals.length + unlinkedVisits.length;
}

function productScoreAverage(activities, start, end, predicate = () => true) {
  const scores = activities
    .filter((item) => item.type === "product_scanned" && within(item.occurredAt, start, end) && predicate(item))
    .map((item) => number(item.metadata?.score))
    .filter((score) => score !== null);
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
}

function proteinConsistency(plateState, start, end) {
  let trackedDays = 0;
  let reachedDays = 0;
  Object.entries(plateState?.days || {}).forEach(([key, day]) => {
    const time = new Date(`${key}T12:00:00`).getTime();
    if (time < start || time >= end) return;
    const goal = number(day.goalsSnapshot?.protein ?? plateState?.goals?.protein);
    const known = (day.entries || []).map((entry) => number(entry.contribution?.protein)).filter((value) => value !== null);
    if (goal === null || !known.length) return;
    trackedDays += 1;
    if (known.reduce((sum, value) => sum + value, 0) >= goal) reachedDays += 1;
  });
  return { value: trackedDays ? (reachedDays / trackedDays) * 100 : 0, trackedDays, reachedDays };
}

function calculateGoal(goal, state, plateState, now) {
  const template = getLongTermGoalTemplate(goal.templateId);
  if (!template) return null;
  const period = recentPeriod(now, goal.durationDays || template.defaultDurationDays);
  const target = number(goal.target) ?? template.defaultTarget;
  const activities = state.activities || [];
  let value = 0;
  let hasData = false;
  let detail = "More activity is needed before a trend can be calculated.";

  switch (template.metric) {
    case "sodaReduction": {
      const current = activityCount(activities, "soda_logged", period.start, period.end);
      const previous = activityCount(activities, "soda_logged", period.previousStart, period.previousEnd);
      const result = reductionMetric(current, previous);
      value = result.value;
      hasData = current + previous > 0;
      detail = result.hasBaseline ? `${Math.max(0, Math.round(value))}% fewer logged sodas than the previous period.` : "A second period will make the comparison more useful.";
      break;
    }
    case "ingredientAvoidance": {
      const result = ingredientAvoidanceStats(state, goal.trackedValue, period.start, period.end);
      value = result.violations ? 0 : result.compliantDays;
      hasData = result.observations > 0;
      detail = result.violations
        ? `${result.violations} matching label ${result.violations === 1 ? "entry needs" : "entries need"} review.`
        : hasData
          ? `${result.compliantDays} reviewed ${result.compliantDays === 1 ? "day" : "days"} without a matching confirmed entry.`
          : "No reviewed ingredient labels are available for this period.";
      break;
    }
    case "groceryQuality":
    case "averageProductQuality": {
      const groceryOnly = template.metric === "groceryQuality";
      const predicate = groceryOnly ? (item) => item.metadata?.context === "grocery" : () => true;
      const current = productScoreAverage(activities, period.start, period.end, predicate);
      const previous = productScoreAverage(activities, period.previousStart, period.previousEnd, predicate);
      hasData = current !== null;
      value = current !== null && previous !== null ? current - previous : 0;
      detail = current === null ? "No documented product scores in this period." : previous === null ? `Current documented average: ${Math.round(current)}.` : `${value >= 0 ? "+" : ""}${value.toFixed(1)} points versus the previous period.`;
      break;
    }
    case "proteinConsistency": {
      const result = proteinConsistency(plateState, period.start, period.end);
      value = result.value;
      hasData = result.trackedDays > 0;
      detail = hasData ? `Protein goal reached on ${result.reachedDays} of ${result.trackedDays} logged days.` : "Log foods on more days to measure consistency.";
      break;
    }
    case "fastFoodReduction": {
      const current = fastFoodEventCount(state, period.start, period.end);
      const previous = fastFoodEventCount(state, period.previousStart, period.previousEnd);
      const result = reductionMetric(current, previous);
      value = result.value;
      hasData = current + previous > 0;
      detail = result.hasBaseline ? `${Math.max(0, Math.round(value))}% fewer confirmed visits than the previous period.` : "A previous period is needed for comparison.";
      break;
    }
    case "gymRoutine": {
      const visits = activityCount(activities, "gym_visit", period.start, period.end);
      const weeks = Math.max(1, (period.end - period.start) / (7 * DAY_MS));
      value = visits / weeks;
      hasData = visits > 0;
      detail = `${visits} confirmed ${visits === 1 ? "visit" : "visits"} across this period.`;
      break;
    }
    case "sugarySnackReduction": {
      const isSugarySnack = (item) => /snack|candy|chocolate|cookie|cracker|dessert/i.test(item.metadata?.category || "") && number(item.metadata?.sugar) >= 10;
      const current = activityCount(activities, "product_scanned", period.start, period.end, isSugarySnack);
      const previous = activityCount(activities, "product_scanned", period.previousStart, period.previousEnd, isSugarySnack);
      const result = reductionMetric(current, previous);
      value = result.value;
      hasData = current + previous > 0;
      detail = result.hasBaseline ? `${Math.max(0, Math.round(value))}% fewer high-sugar snack scans than the previous period.` : "A previous period is needed for comparison.";
      break;
    }
    default:
      break;
  }

  const progress = hasData ? Math.max(0, Math.min(100, (value / Math.max(0.1, target)) * 100)) : 0;
  return {
    id: goal.id,
    templateId: template.id,
    label: goal.label || template.label,
    description: template.description,
    target,
    unit: template.unit,
    value,
    progress,
    hasData,
    detail,
    status: !hasData ? "needs-data" : value >= target ? "on-track" : "building"
  };
}

export function buildLongTermGoalSummary({ phase2State, plateState, now = new Date() }) {
  const goals = (phase2State?.longTermGoals || [])
    .filter((goal) => goal.enabled !== false)
    .map((goal) => calculateGoal(goal, phase2State, plateState, now))
    .filter(Boolean);
  return {
    goals,
    onTrackCount: goals.filter((goal) => goal.status === "on-track").length,
    dataReadyCount: goals.filter((goal) => goal.hasData).length,
    weeklyReference: buildWeeklyMetrics({ phase2State, plateState, now })
  };
}

export function createLongTermGoal(templateId, overrides = {}) {
  const template = getLongTermGoalTemplate(templateId);
  if (!template) return null;
  const now = new Date().toISOString();
  return {
    id: overrides.id || `long:${template.id}:${Date.now()}`,
    templateId: template.id,
    label: overrides.label || template.label,
    target: Math.max(0.1, number(overrides.target) ?? template.defaultTarget),
    durationDays: Math.min(365, Math.max(7, number(overrides.durationDays) ?? template.defaultDurationDays)),
    trackedValue: String(overrides.trackedValue || "").trim(),
    enabled: overrides.enabled !== false,
    startDate: overrides.startDate || now,
    createdAt: overrides.createdAt || now,
    updatedAt: now
  };
}
