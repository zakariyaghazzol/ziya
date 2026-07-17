export const MENU_DATA_CONFIDENCE = Object.freeze({
  confirmed_menu: {
    id: "confirmed_menu",
    label: "Confirmed menu data",
    rank: 5,
    description: "The restaurant or a reviewed menu record supplied these details."
  },
  published_nutrition: {
    id: "published_nutrition",
    label: "Restaurant-published nutrition",
    rank: 5,
    description: "Nutrition was entered from restaurant-published information."
  },
  user_confirmed: {
    id: "user_confirmed",
    label: "User-confirmed",
    rank: 4,
    description: "You reviewed and confirmed this meal information."
  },
  receipt_match: {
    id: "receipt_match",
    label: "User receipt match",
    rank: 3,
    description: "A receipt item was matched to a saved menu item and still needs label review."
  },
  estimated_menu: {
    id: "estimated_menu",
    label: "Estimated from menu",
    rank: 2,
    description: "This is an estimate from the available menu description."
  },
  unknown: {
    id: "unknown",
    label: "Unknown / needs verification",
    rank: 0,
    description: "The available record is not complete enough to verify."
  }
});

export const WEEKLY_GOAL_TEMPLATES = Object.freeze([
  {
    id: "fast_food_limit",
    label: "Quick-service meals",
    description: "Keep quick-service meals within a flexible weekly limit.",
    metric: "fastFoodVisits",
    direction: "limit",
    defaultTarget: 2,
    unit: "meals"
  },
  {
    id: "protein_goal_days",
    label: "Protein goal days",
    description: "Reach your existing protein goal on several days this week.",
    metric: "proteinGoalDays",
    direction: "minimum",
    defaultTarget: 5,
    unit: "days"
  },
  {
    id: "weekly_sugar_limit",
    label: "Weekly sugar",
    description: "Track known sugar against a flexible weekly limit.",
    metric: "weeklySugar",
    direction: "limit",
    defaultTarget: 315,
    unit: "g"
  },
  {
    id: "weekly_sodium_limit",
    label: "Weekly sodium",
    description: "Track known sodium against a flexible weekly limit.",
    metric: "weeklySodium",
    direction: "limit",
    defaultTarget: 16100,
    unit: "mg"
  },
  {
    id: "gym_visits",
    label: "Gym visits",
    description: "Count visits you confirm manually or through an optional place check.",
    metric: "gymVisits",
    direction: "minimum",
    defaultTarget: 3,
    unit: "visits"
  },
  {
    id: "grocery_scans",
    label: "Grocery scans",
    description: "Scan products before buying on several grocery trips.",
    metric: "groceryScans",
    direction: "minimum",
    defaultTarget: 3,
    unit: "scans"
  },
  {
    id: "better_restaurant_choices",
    label: "Goal-compatible restaurant choices",
    description: "Choose restaurant meals that fit the goals you are tracking.",
    metric: "betterRestaurantChoices",
    direction: "minimum",
    defaultTarget: 2,
    unit: "meals"
  }
]);

export const LONG_TERM_GOAL_TEMPLATES = Object.freeze([
  {
    id: "reduce_soda",
    label: "Reduce soda",
    description: "Gradually reduce logged soda choices over 30 days.",
    metric: "sodaReduction",
    defaultTarget: 25,
    unit: "%",
    defaultDurationDays: 30
  },
  {
    id: "avoid_ingredient",
    label: "Avoid an ingredient",
    description: "Track a user-chosen ingredient without treating missing labels as proof.",
    metric: "ingredientAvoidance",
    defaultTarget: 14,
    unit: "days",
    defaultDurationDays: 14,
    requiresValue: true
  },
  {
    id: "grocery_quality",
    label: "Improve grocery choices",
    description: "Track the documented scores of products scanned at grocery visits.",
    metric: "groceryQuality",
    defaultTarget: 5,
    unit: "points",
    defaultDurationDays: 30
  },
  {
    id: "protein_consistency",
    label: "Protein consistency",
    description: "Reach your protein goal more consistently over time.",
    metric: "proteinConsistency",
    defaultTarget: 70,
    unit: "% of days",
    defaultDurationDays: 30
  },
  {
    id: "reduce_fast_food",
    label: "Reduce quick-service visits",
    description: "Compare recent confirmed visits with the previous period.",
    metric: "fastFoodReduction",
    defaultTarget: 20,
    unit: "%",
    defaultDurationDays: 56
  },
  {
    id: "gym_routine",
    label: "Build a gym routine",
    description: "Build consistency from confirmed visits rather than perfect weeks.",
    metric: "gymRoutine",
    defaultTarget: 3,
    unit: "visits / week",
    defaultDurationDays: 56
  },
  {
    id: "average_product_quality",
    label: "Improve average product quality",
    description: "Follow the trend in documented scores for scanned products.",
    metric: "averageProductQuality",
    defaultTarget: 5,
    unit: "points",
    defaultDurationDays: 30
  },
  {
    id: "reduce_sugary_snacks",
    label: "Reduce high-sugar snacks",
    description: "Gradually reduce high-sugar snack choices over a month.",
    metric: "sugarySnackReduction",
    defaultTarget: 25,
    unit: "%",
    defaultDurationDays: 30
  }
]);

export function getMenuConfidence(value) {
  return MENU_DATA_CONFIDENCE[value] || MENU_DATA_CONFIDENCE.unknown;
}

export function getWeeklyGoalTemplate(id) {
  return WEEKLY_GOAL_TEMPLATES.find((item) => item.id === id) || null;
}

export function getLongTermGoalTemplate(id) {
  return LONG_TERM_GOAL_TEMPLATES.find((item) => item.id === id) || null;
}
