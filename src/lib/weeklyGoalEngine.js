import { getWeeklyGoalTemplate } from "../data/restaurantGoalRules";

const DAY_MS = 86400000;
const NUTRIENTS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];

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

function parseDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}

export function getWeekWindow(now = new Date(), weekStartsOn = 1) {
  const current = parseDate(now);
  current.setHours(0, 0, 0, 0);
  const offset = (current.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(current);
  start.setDate(start.getDate() - offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    start,
    end,
    startKey: dateKey(start),
    endKey: dateKey(new Date(end.getTime() - DAY_MS)),
    keys: Array.from({ length: 7 }, (_, index) => dateKey(new Date(start.getTime() + index * DAY_MS)))
  };
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
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

export function buildWeeklyMetrics({ phase2State, plateState, now = new Date() }) {
  const window = getWeekWindow(now);
  const activities = (phase2State?.activities || []).filter((item) => inWindow(item.occurredAt, window));
  const meals = (phase2State?.restaurantMeals || []).filter((item) => inWindow(item.occurredAt, window));
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

  const proteinGoalDays = dayTotals.filter(({ day, totals }) => {
    const goal = number(day?.goalsSnapshot?.protein ?? plateState?.goals?.protein);
    return goal !== null && totals.protein.knownCount > 0 && totals.protein.total >= goal;
  }).length;
  const mealVisits = meals.filter((item) => item.placeType === "fast_food");
  const unlinkedVisitActivities = activities.filter((item) => item.type === "fast_food_visit" && !item.restaurantMealId);
  const fastFoodVisits = uniqueEvents([...mealVisits, ...unlinkedVisitActivities], (item) => `${dateKey(parseDate(item.occurredAt))}:${item.id}`).length;

  return {
    window,
    metrics: {
      fastFoodVisits,
      proteinGoalDays,
      weeklySugar: nutrition.sugar.total,
      weeklySodium: nutrition.sodium.total,
      gymVisits: uniqueEvents(activities.filter((item) => item.type === "gym_visit"), (item) => item.id).length,
      groceryScans: uniqueEvents(activities.filter((item) => item.type === "grocery_scan" || (item.type === "product_scanned" && item.metadata?.context === "grocery")), (item) => item.id).length,
      betterRestaurantChoices: meals.filter((item) => item.goalFit === "fits").length
    },
    nutrition,
    activities,
    meals,
    dayTotals
  };
}

function goalStatus(goal, template, current, partial) {
  const target = Math.max(0.1, number(goal.target) ?? template.defaultTarget);
  const isLimit = template.direction === "limit";
  const progress = isLimit ? Math.min(100, (current / target) * 100) : Math.min(100, (current / target) * 100);
  const remaining = isLimit ? Math.max(0, target - current) : Math.max(0, target - current);
  const reached = isLimit ? current <= target : current >= target;
  let status = "in-progress";
  if (isLimit && current > target) status = "over";
  else if (!isLimit && reached) status = "reached";
  else if (partial) status = "partial";
  return {
    id: goal.id,
    templateId: template.id,
    label: goal.label || template.label,
    description: template.description,
    unit: template.unit,
    direction: template.direction,
    target,
    current,
    remaining,
    progress,
    reached,
    partial,
    status,
    summary: isLimit
      ? current > target
        ? `${formatMetric(current - target)} ${template.unit} over the flexible limit`
        : `${formatMetric(remaining)} ${template.unit} available this week`
      : reached
        ? `Weekly target reached`
        : `${formatMetric(remaining)} ${template.unit} to go`
  };
}

export function buildWeeklyGoalSummary({ phase2State, plateState, now = new Date() }) {
  const base = buildWeeklyMetrics({ phase2State, plateState, now });
  const goals = (phase2State?.weeklyGoals || []).filter((goal) => goal.enabled !== false).map((goal) => {
    const template = getWeeklyGoalTemplate(goal.templateId);
    if (!template) return null;
    const current = number(base.metrics[template.metric]) || 0;
    const partial = template.metric === "weeklySugar"
      ? base.nutrition.sugar.missingCount > 0
      : template.metric === "weeklySodium"
        ? base.nutrition.sodium.missingCount > 0
        : false;
    return goalStatus(goal, template, current, partial);
  }).filter(Boolean);
  return {
    ...base,
    goals,
    reachedCount: goals.filter((goal) => goal.status === "reached").length,
    onTrackCount: goals.filter((goal) => ["reached", "in-progress"].includes(goal.status)).length
  };
}

export function createWeeklyGoal(templateId, overrides = {}) {
  const template = getWeeklyGoalTemplate(templateId);
  if (!template) return null;
  const now = new Date().toISOString();
  return {
    id: overrides.id || `weekly:${template.id}:${Date.now()}`,
    templateId: template.id,
    label: overrides.label || template.label,
    target: Math.max(0.1, number(overrides.target) ?? template.defaultTarget),
    enabled: overrides.enabled !== false,
    createdAt: overrides.createdAt || now,
    updatedAt: now
  };
}

export function formatMetric(value) {
  if (!Number.isFinite(Number(value))) return "0";
  const numeric = Number(value);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, "");
}
