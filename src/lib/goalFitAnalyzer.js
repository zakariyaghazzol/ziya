import { getMenuConfidence } from "../data/restaurantGoalRules";
import { getPersonalAlerts } from "../profile/personalAlerts";

function value(input) {
  if (input && typeof input === "object" && "total" in input) return value(input.total);
  if (input === "" || input === null || input === undefined) return null;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function afterMeal(current, meal) {
  const currentValue = value(current);
  const mealValue = value(meal);
  if (mealValue === null) return null;
  return (currentValue || 0) + mealValue;
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function analyzePreparationDetails(ingredients = []) {
  const oilTerms = ["soybean oil", "canola oil", "corn oil", "sunflower oil", "safflower oil", "cottonseed oil", "grapeseed oil", "vegetable oil", "palm oil", "olive oil", "avocado oil"];
  const normalizedIngredients = ingredients.map(normalized);
  const cookingOils = oilTerms.filter((oil) => normalizedIngredients.some((ingredient) => ingredient.includes(oil)));
  return {
    cookingOils,
    hasIngredientData: normalizedIngredients.length > 0,
    label: cookingOils.length ? "Cooking oil listed" : normalizedIngredients.length ? "Preparation details available" : "Preparation needs verification",
    summary: cookingOils.length
      ? "Available preparation details list " + cookingOils.join(", ") + ". Recipes can change, so verify current restaurant information."
      : normalizedIngredients.length
        ? "No specific cooking oil was identified in the available details. This does not confirm that none is used."
        : "Cooking oil and preparation details are not available for this item."
  };
}

export function analyzeGoalFit({
  nutrition = {},
  dailyTotals = {},
  dailyGoals = {},
  weeklySummary = null,
  placeType = "restaurant",
  confidence = "unknown",
  ingredients = [],
  profile = null
} = {}) {
  const knownNutrition = ["calories", "protein", "sugar", "sodium"].filter((key) => value(nutrition[key]) !== null);
  const reasons = [];
  const cautions = [];
  const confidenceMeta = getMenuConfidence(confidence);
  const personalAlerts = profile ? getPersonalAlerts({
    category: "food",
    ingredients: ingredients.map((name) => ({ name, originalLabelText: name })),
    nutrition,
    allergens: ""
  }, profile) : [];
  personalAlerts.forEach((alert) => {
    if (alert.kind === "allergy") cautions.push(alert.title + ": contains your marked allergen in the available details. Verify restaurant information.");
    else if (alert.kind === "data") cautions.push(alert.message);
    else cautions.push(alert.title + ": " + alert.message);
  });

  if (!knownNutrition.length) {
    return {
      state: "needs-data",
      label: "Needs menu details",
      summary: "Add or confirm nutrition before comparing this meal with your goals.",
      reasons,
      cautions: [...cautions, "Nutrition is not available for this item."].slice(0, 4),
      confidence: confidenceMeta.id,
      confidenceLabel: confidenceMeta.label
    };
  }

  const caloriesAfter = afterMeal(dailyTotals.calories, nutrition.calories);
  const sugarAfter = afterMeal(dailyTotals.sugar, nutrition.sugar);
  const sodiumAfter = afterMeal(dailyTotals.sodium, nutrition.sodium);
  const protein = value(nutrition.protein);
  const caloriesGoal = value(dailyGoals.calories);
  const sugarGoal = value(dailyGoals.sugar);
  const sodiumGoal = value(dailyGoals.sodium);
  const proteinGoal = value(dailyGoals.protein);

  if (caloriesAfter !== null && caloriesGoal !== null) {
    if (caloriesAfter <= caloriesGoal) reasons.push("Fits within your current calorie goal based on known entries.");
    else cautions.push("This would put known calories above today’s goal.");
  }
  if (protein !== null && proteinGoal !== null && protein >= Math.max(10, proteinGoal * 0.15)) {
    reasons.push("Adds a meaningful amount of protein toward today’s goal.");
  }
  if (sugarAfter !== null && sugarGoal !== null && sugarAfter > sugarGoal) {
    cautions.push("Known sugar would move above today’s limit.");
  }
  if (sodiumAfter !== null && sodiumGoal !== null) {
    if (sodiumAfter > sodiumGoal) cautions.push("Known sodium would move above today’s limit.");
    else if (sodiumAfter > sodiumGoal * 0.8) cautions.push("This uses most of the sodium available in today’s goal.");
  }

  if (placeType === "fast_food") {
    const weeklyGoal = weeklySummary?.goals?.find((goal) => goal.templateId === "fast_food_limit");
    if (weeklyGoal) {
      if (weeklyGoal.current < weeklyGoal.target) reasons.push("This can still fit your current quick-service meal limit.");
      else cautions.push("Your flexible quick-service limit is already reached this week.");
    }
  }

  const state = cautions.length > 1 ? "watch" : reasons.length ? "fits" : cautions.length ? "watch" : "needs-data";
  const summary = state === "fits"
    ? "This meal can fit the goals supported by the available data."
    : state === "watch"
      ? "This can still fit your week, with a few values worth balancing later."
      : "More menu details are needed for a useful comparison.";
  return {
    state,
    label: state === "fits" ? "Fits current goals" : state === "watch" ? "Worth balancing" : "Needs menu details",
    summary,
    reasons: reasons.slice(0, 3),
    cautions: cautions.slice(0, 3),
    confidence: confidenceMeta.id,
    confidenceLabel: confidenceMeta.label
  };
}

export function rankMenuItemsForGoals(items = [], context = {}) {
  return items.map((item) => {
    const fit = analyzeGoalFit({ ...context, nutrition: item.nutrition, ingredients: item.ingredients, confidence: item.confidence });
    const known = Object.keys(item.nutrition || {}).filter((key) => value(item.nutrition[key]) !== null).length;
    const fitWeight = fit.state === "fits" ? 30 : fit.state === "watch" ? 10 : 0;
    const proteinWeight = Math.min(12, (value(item.nutrition?.protein) || 0) / 3);
    const cautionPenalty = fit.cautions.length * 7;
    return { item, fit, rank: fitWeight + known + proteinWeight - cautionPenalty };
  }).sort((a, b) => b.rank - a.rank);
}
