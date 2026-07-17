import { getMenuConfidence } from "../data/restaurantGoalRules";

function number(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function restaurantMealToProduct(meal) {
  const confidence = getMenuConfidence(meal.confidence);
  const nutrition = Object.fromEntries(
    ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"].map((key) => [key, number(meal.nutrition?.[key])])
  );
  return {
    id: `restaurant-product:${meal.id}`,
    barcode: "",
    name: meal.itemName,
    brand: meal.restaurantName,
    category: "food",
    categoryPath: meal.placeType === "fast_food" ? "Quick-service restaurant meal" : "Restaurant meal",
    sourceType: "user-provided",
    sourceLabel: "Meal record",
    confidence: meal.confidence === "user_confirmed" ? "Manual Review" : "Estimated",
    confidenceNote: confidence.description,
    fieldConfidence: {
      identity: "Available",
      image: "Missing",
      nutrition: Object.values(nutrition).some((value) => value !== null) ? "Partial" : "Missing",
      ingredients: meal.ingredients?.length ? "Partial" : "Missing",
      additives: "Missing",
      allergens: "Missing"
    },
    image: "",
    userPhoto: "",
    score: null,
    rating: "Needs label",
    analysisPending: true,
    ingredients: (meal.ingredients || []).map((name) => ({
      name,
      originalLabelText: name,
      risk: "unknown",
      type: "Restaurant ingredient",
      why: "This ingredient was entered or matched from available meal information and still needs label verification.",
      source: meal.confidence
    })),
    nutrition: {
      basis: "serving",
      servingSize: meal.servingSize || "1 item",
      ...nutrition
    },
    allergens: "Not available",
    additives: { count: 0, tags: [], missing: true },
    processing: "Unknown",
    concerns: [],
    positives: [],
    restaurantContext: {
      restaurantId: meal.restaurantId,
      mealId: meal.id,
      placeType: meal.placeType,
      confidence: meal.confidence
    }
  };
}
