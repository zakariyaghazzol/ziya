import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  enrichIngredientKnowledge,
  normalizeIngredientLabel,
  normalizeProductTextForAnalysis,
  resolveLocalIngredientKnowledge
} from "./knowledge/ingredientKnowledge";
import { sanitizeIngredientCandidates } from "./data/ingredientSanitizer";
import { PRODUCT_REGIONS, getPreferredProductLanguages, getProductMarketLabel, getProductRegionConfig, productMatchesRegion } from "./data/productRegionConfig";
import { classifyIngredient } from "./lib/ingredientClassifier";
import { INGREDIENT_DISPLAY_MODES, getIngredientDisplayName } from "./lib/ingredientDisplayName";
import {
  OPEN_FOOD_FACTS_SEARCH_FIELDS,
  buildOpenFoodFactsSearchParams,
  createRegionSearchCacheKey,
  getCachedRegionSearch,
  setCachedRegionSearch
} from "./lib/productRegionSearch";
import { getSearchResultMetadata, rankAndDedupeSearchResults } from "./lib/searchResultDedupe";
import { createProductSourceRouting, getKnowledgeSourceRoute } from "./data/sourceRouter";
import {
  getProductOverride,
  loadOverrideProductSnapshots,
  loadProductHistory,
  saveProductHistory,
  saveProductOverride
} from "./data/productOverrides";
import { syncZiyaData } from "./data/cloudSync";
import {
  COMMON_ALLERGIES,
  DIET_PREFERENCES,
  PROFILE_LANGUAGES,
  PROFILE_UNITS,
  loadLocalProfile,
  normalizeAllergyPreference,
  normalizeIngredientPreference,
  saveLocalProfile,
  touchProfile
} from "./profile/profileStore";
import { getPersonalAlerts } from "./profile/personalAlerts";
import {
  isSupabaseConfigured,
  sendMagicLink,
  signInWithGoogle,
  signOutOfSupabase,
  supabase
} from "./lib/supabaseClient";
import {
  AlertTriangle,
  Apple,
  Baby,
  Barcode,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Copy,
  Droplets,
  Flashlight,
  FlaskConical,
  HeartPulse,
  Home,
  Info,
  Leaf,
  Languages,
  LogIn,
  LogOut,
  Mail,
  Minus,
  Pencil,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trash2,
  User,
  Utensils,
  Volume2,
  X,
  Zap,
  RefreshCw
} from "lucide-react";
import "./styles.css";

const riskMeta = {
  common: { label: "Common ingredient", className: "risk-safe" },
  safe: { label: "Low concern", className: "risk-safe" },
  moderate: { label: "Moderate concern", className: "risk-moderate" },
  harmful: { label: "Higher concern", className: "risk-harmful" },
  unknown: { label: "Needs review", className: "risk-unknown" }
};

const categoryMeta = {
  food: {
    label: "Food",
    shortLabel: "Food",
    icon: Apple,
    accent: "#2f9f6b",
    tone: "green"
  },
  beauty: {
    label: "Beauty / Personal Care",
    shortLabel: "Beauty",
    icon: Sparkles,
    accent: "#7a63d8",
    tone: "violet"
  },
  household: {
    label: "Household",
    shortLabel: "Home",
    icon: Home,
    accent: "#258a98",
    tone: "teal"
  },
  medicine: {
    label: "Medicine",
    shortLabel: "Medicine",
    icon: Pill,
    accent: "#3977c8",
    tone: "blue"
  },
  textile: {
    label: "Textiles / Fabric",
    shortLabel: "Fabric",
    icon: ShoppingBag,
    accent: "#8b7448",
    tone: "gold"
  },
  unknown: {
    label: "Product",
    shortLabel: "Product",
    icon: ShoppingBag,
    accent: "#6b7771",
    tone: "gray"
  }
};

function productArt(label, brand, palette, type = "box") {
  const colors = {
    popcorn: ["#f7d66f", "#fff6d7", "#c77f2c"],
    green: ["#8fd7a4", "#f0fff4", "#287a4e"],
    protein: ["#6d8fd6", "#eff4ff", "#294c9a"],
    peanut: ["#c88b4c", "#fff2dc", "#72451f"],
    soda: ["#d85c5c", "#fff1f1", "#8f2626"],
    beauty: ["#b7a6f5", "#f6f2ff", "#5f4bb0"],
    lotion: ["#9ed6c2", "#f0fff8", "#25785e"],
    deodorant: ["#83c7da", "#f0fbff", "#216b7a"],
    household: ["#77c6d1", "#effcff", "#1b7380"],
    cleaner: ["#f0b66c", "#fff6e8", "#965c15"],
    medicine: ["#8eb6ee", "#f0f6ff", "#2f68b6"],
    textile: ["#d8c69a", "#fff8e9", "#7b6438"],
    scrubber: ["#97d9c6", "#effff9", "#287966"],
    placeholder: ["#d8e3dc", "#f7faf7", "#607369"]
  }[palette] || ["#a8d9bd", "#f5fff8", "#24774f"];

  const [main, soft, dark] = colors;
  const title = escapeSvg(label);
  const subtitle = escapeSvg(brand);
  const initials = escapeSvg(getBrandInitials(brand || label));
  const shape =
    type === "bottle"
      ? `<rect x="108" y="48" width="56" height="26" rx="10" fill="${dark}"/><rect x="86" y="68" width="100" height="156" rx="26" fill="${main}"/><rect x="104" y="104" width="64" height="70" rx="14" fill="${soft}"/>`
      : type === "pill"
        ? `<rect x="86" y="54" width="100" height="170" rx="24" fill="${main}"/><rect x="106" y="32" width="60" height="32" rx="10" fill="${dark}"/><rect x="104" y="96" width="64" height="74" rx="14" fill="${soft}"/><circle cx="116" cy="194" r="9" fill="${soft}"/><circle cx="146" cy="194" r="9" fill="${soft}"/>`
        : type === "fabric"
          ? `<path d="M82 68h116l22 38-32 17v104H92V123l-32-17 22-38z" fill="${main}"/><path d="M103 72c8 18 66 18 74 0" fill="none" stroke="${soft}" stroke-width="10" stroke-linecap="round"/><path d="M102 150h76" stroke="${soft}" stroke-width="10" stroke-linecap="round" opacity=".72"/>`
          : type === "scrubber"
            ? `<circle cx="138" cy="132" r="78" fill="${main}"/><circle cx="138" cy="132" r="52" fill="${soft}"/><path d="M92 132h92M138 86v92M106 100l64 64M170 100l-64 64" stroke="${dark}" stroke-width="8" opacity=".35" stroke-linecap="round"/>`
            : `<rect x="62" y="50" width="150" height="174" rx="28" fill="${main}"/><rect x="82" y="84" width="110" height="92" rx="18" fill="${soft}"/><circle cx="100" cy="196" r="10" fill="${soft}"/><circle cx="130" cy="196" r="10" fill="${soft}"/><circle cx="160" cy="196" r="10" fill="${soft}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><rect width="280" height="280" rx="36" fill="${soft}"/><circle cx="226" cy="50" r="42" fill="${main}" opacity=".35"/><circle cx="44" cy="232" r="58" fill="${main}" opacity=".25"/><rect x="20" y="20" width="52" height="36" rx="18" fill="white" opacity=".86"/><text x="46" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="${dark}">${initials}</text>${shape}<text x="140" y="246" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${dark}">${title}</text><text x="140" y="268" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${dark}" opacity=".75">${subtitle}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getBrandInitials(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("") || "LL";
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 28);
}

const confidenceMeta = {
  Verified: {
    label: "Verified",
    className: "confidence-verified",
    detail: "Product image, ingredients, and label fields came from a product database or confirmed label capture."
  },
  Partial: {
    label: "Partial",
    className: "confidence-partial",
    detail: "The product was found, but some fields are demo data or missing."
  },
  Estimated: {
    label: "Estimated",
    className: "confidence-estimated",
    detail: "Some nutrition or material data was matched from a secondary source."
  },
  "Manual Review": {
    label: "Manual Review",
    className: "confidence-manual",
    detail: "Review pasted or demo OCR data before relying on this report."
  },
  "Demo Data": {
    label: "Demo Data",
    className: "confidence-demo",
    detail: "This report is using sample data for the MVP demo."
  },
  "User Photo": {
    label: "User Photo",
    className: "confidence-photo",
    detail: "The product image was added locally by the user."
  },
  Placeholder: {
    label: "Placeholder",
    className: "confidence-placeholder",
    detail: "No product image was available, so Ziya generated a clean placeholder."
  }
};

// Developer-only provider map for future real integrations. This intentionally
// stays out of the user-facing UI so the app feels like a scanner, not a roadmap.
const productProviderPlan = Object.freeze({
  food: ["open-food-facts", "paid-upc-metadata", "usda-nutrition-fallback", "ocr-label-extraction"],
  beauty: ["open-beauty-facts", "paid-upc-metadata", "internal-ingredient-scoring", "ocr-label-extraction"],
  household: ["paid-upc-metadata", "internal-chemical-scoring", "pubchem-reference", "ocr-label-extraction"],
  medicine: ["dailymed", "openfda", "paid-upc-metadata", "ocr-label-extraction"],
  textile: ["paid-upc-metadata", "internal-material-scoring", "certification-reference", "ocr-label-extraction"],
  general: ["barcode-lookup", "go-upc", "gs1-style-product-data", "manual-review"]
});

function getProviderPlan(category) {
  return productProviderPlan[category] || productProviderPlan.general;
}

const products = [
  {
    id: "pop-secret",
    barcode: "0023807019876",
    name: "Movie Theater Butter Microwave Popcorn",
    brand: "Pop Secret",
    category: "food",
    image: productArt("Movie Butter", "Pop Secret", "popcorn"),
    score: 24,
    scoring: { nutrition: 7, ingredients: 15, processing: 2 },
    rating: "Bad",
    processing: "Ultra-processed",
    allergens: "Contains milk",
    positives: ["No sugar", "Quick serving size", "Whole grain base"],
    concerns: ["Additives", "Saturated fat", "Sodium", "Calories"],
    nutrition: {
      calories: 170,
      protein: 2,
      carbs: 18,
      fat: 11,
      sugar: 0,
      sodium: 330,
      saturatedFat: 5,
      fiber: 3
    },
    ingredients: [
      { name: "Popcorn", risk: "safe", type: "Whole grain" },
      { name: "Palm oil", risk: "moderate", type: "Refined oil" },
      { name: "Salt", risk: "safe", type: "Seasoning" },
      { name: "Artificial flavor", risk: "harmful", type: "Flavor additive" },
      { name: "Annatto color", risk: "moderate", type: "Color additive" }
    ],
    breakdown: [
      { label: "Nutrition", value: "Weak", detail: "High sodium and saturated fat" },
      { label: "Ingredients", value: "1 harmful", detail: "Artificial flavor flagged" },
      { label: "Processing", value: "High", detail: "Ultra-processed snack" },
      { label: "Allergens", value: "Milk", detail: "Review label before use" }
    ],
    alternatives: ["skinny-pop", "peanut-butter"],
    actionIngredients: ["Artificial flavor", "Palm oil"],
    dailyAdvice:
      "Okay occasionally, but it is high in sodium and saturated fat. If you eat it today, balance it with lower-sodium meals."
  },
  {
    id: "skinny-pop",
    barcode: "0852513008001",
    name: "Original Popcorn",
    brand: "Skinny Pop",
    category: "food",
    image: productArt("Original Popcorn", "Skinny Pop", "green"),
    score: 51,
    scoring: { nutrition: 28, ingredients: 15, processing: 8 },
    rating: "Moderate",
    processing: "Processed",
    allergens: "No major allergen flagged",
    positives: ["Simple ingredient list", "No sugar", "Moderate calories"],
    concerns: ["Sodium", "Snack oil"],
    nutrition: {
      calories: 150,
      protein: 2,
      carbs: 15,
      fat: 10,
      sugar: 0,
      sodium: 75,
      saturatedFat: 1,
      fiber: 3
    },
    ingredients: [
      { name: "Popcorn", risk: "safe", type: "Whole grain" },
      { name: "Sunflower oil", risk: "safe", type: "Plant oil" },
      { name: "Salt", risk: "safe", type: "Seasoning" }
    ],
    breakdown: [
      { label: "Nutrition", value: "Fair", detail: "Moderate calories" },
      { label: "Ingredients", value: "Simple", detail: "No harmful flags" },
      { label: "Processing", value: "Processed", detail: "Packaged snack" },
      { label: "Allergens", value: "Low", detail: "Check package" }
    ],
    alternatives: ["peanut-butter"]
  },
  {
    id: "protein-bar",
    barcode: "1234567890123",
    name: "Chocolate Protein Bar",
    brand: "PeakFuel",
    category: "food",
    image: productArt("Protein Bar", "PeakFuel", "protein", "box"),
    score: 72,
    scoring: { nutrition: 42, ingredients: 22, processing: 8 },
    rating: "Good",
    processing: "Processed",
    allergens: "Contains milk and almonds",
    positives: ["Good protein", "Low sugar", "Good fiber"],
    concerns: ["Sugar alcohol", "Processed protein blend"],
    nutrition: {
      calories: 220,
      protein: 20,
      carbs: 22,
      fat: 8,
      sugar: 3,
      sodium: 180,
      saturatedFat: 2,
      fiber: 8
    },
    ingredients: [
      { name: "Milk protein isolate", risk: "safe", type: "Protein" },
      { name: "Almonds", risk: "safe", type: "Nut" },
      { name: "Cocoa", risk: "safe", type: "Flavor" },
      { name: "Natural flavor", risk: "moderate", type: "Flavor additive" }
    ],
    breakdown: [
      { label: "Nutrition", value: "Good", detail: "High protein and fiber" },
      { label: "Ingredients", value: "1 moderate", detail: "Natural flavor" },
      { label: "Processing", value: "Medium", detail: "Protein bar format" },
      { label: "Allergens", value: "Milk, nuts", detail: "Review label" }
    ],
    alternatives: ["peanut-butter"]
  },
  {
    id: "peanut-butter",
    barcode: "1111111111111",
    name: "Creamy Peanut Butter",
    brand: "Simply Spoon",
    category: "food",
    image: productArt("Peanut Butter", "Simply Spoon", "peanut", "bottle"),
    score: 84,
    scoring: { nutrition: 43, ingredients: 26, processing: 15 },
    rating: "Good",
    processing: "Minimally processed",
    allergens: "Contains peanuts",
    positives: ["Simple ingredients", "Good protein", "No added sugar"],
    concerns: ["Calorie dense"],
    nutrition: {
      calories: 190,
      protein: 8,
      carbs: 7,
      fat: 16,
      sugar: 1,
      sodium: 65,
      saturatedFat: 2,
      fiber: 3
    },
    ingredients: [
      { name: "Peanuts", risk: "safe", type: "Legume" },
      { name: "Salt", risk: "safe", type: "Seasoning" }
    ],
    breakdown: [
      { label: "Nutrition", value: "Strong", detail: "Protein and healthy fats" },
      { label: "Ingredients", value: "Simple", detail: "Two ingredients" },
      { label: "Processing", value: "Low", detail: "Minimally processed" },
      { label: "Allergens", value: "Peanut", detail: "Avoid if allergic" }
    ],
    alternatives: []
  },
  {
    id: "soda",
    barcode: "2222222222222",
    name: "Cherry Soda",
    brand: "FizzUp",
    category: "food",
    image: productArt("Cherry Soda", "FizzUp", "soda", "bottle"),
    score: 31,
    scoring: { nutrition: 10, ingredients: 19, processing: 2 },
    rating: "Bad",
    processing: "Ultra-processed",
    allergens: "No major allergen flagged",
    positives: ["No saturated fat"],
    concerns: ["Added sugar", "Red 40", "Low nutrition"],
    nutrition: {
      calories: 150,
      protein: 0,
      carbs: 39,
      fat: 0,
      sugar: 39,
      sodium: 45,
      saturatedFat: 0,
      fiber: 0
    },
    ingredients: [
      { name: "Carbonated water", risk: "safe", type: "Base" },
      { name: "High fructose corn syrup", risk: "moderate", type: "Sweetener" },
      { name: "Red 40", risk: "harmful", type: "Artificial food dye" },
      { name: "Artificial flavor", risk: "harmful", type: "Flavor additive" }
    ],
    breakdown: [
      { label: "Nutrition", value: "Weak", detail: "High added sugar" },
      { label: "Ingredients", value: "2 harmful", detail: "Dye and flavor flags" },
      { label: "Processing", value: "High", detail: "Ultra-processed drink" },
      { label: "Allergens", value: "Low", detail: "Check package" }
    ],
    alternatives: ["skinny-pop"]
  },
  {
    id: "shampoo",
    barcode: "3333333333333",
    name: "Daily Moisture Shampoo",
    brand: "LumaCare",
    category: "beauty",
    image: productArt("Moisture Shampoo", "LumaCare", "beauty", "bottle"),
    score: 64,
    rating: "Moderate",
    positives: ["No parabens", "No formaldehyde releasers", "Gentle conditioning agents"],
    concerns: ["Fragrance", "Preservatives", "Possible irritants"],
    ingredients: [
      { name: "Water", risk: "safe", type: "Solvent" },
      { name: "Sodium laureth sulfate", risk: "moderate", type: "Surfactant" },
      { name: "Cocamidopropyl betaine", risk: "moderate", type: "Surfactant" },
      { name: "Fragrance", risk: "moderate", type: "Fragrance blend" },
      { name: "Methylisothiazolinone", risk: "harmful", type: "Preservative" }
    ],
    breakdown: [
      { label: "Fragrance", value: "Moderate", detail: "May bother sensitive users" },
      { label: "Preservatives", value: "Flagged", detail: "One higher-concern preservative" },
      { label: "Irritants", value: "2 flagged", detail: "Surfactants and preservative" },
      { label: "Allergens", value: "Possible", detail: "Review if sensitive" }
    ],
    alternatives: ["lotion", "deodorant"],
    actionIngredients: ["Fragrance", "Methylisothiazolinone"]
  },
  {
    id: "lotion",
    barcode: "4444444444444",
    name: "Fragrance-Free Daily Lotion",
    brand: "KindSkin",
    category: "beauty",
    image: productArt("Daily Lotion", "KindSkin", "lotion", "bottle"),
    score: 88,
    rating: "Good",
    positives: ["Fragrance-free", "Short ingredient list", "Low allergen profile"],
    concerns: ["Preservatives are present"],
    ingredients: [
      { name: "Water", risk: "safe", type: "Solvent" },
      { name: "Glycerin", risk: "safe", type: "Humectant" },
      { name: "Shea butter", risk: "safe", type: "Emollient" },
      { name: "Phenoxyethanol", risk: "moderate", type: "Preservative" }
    ],
    breakdown: [
      { label: "Fragrance", value: "None", detail: "Fragrance-free" },
      { label: "Preservatives", value: "Low", detail: "Common low-level preservative" },
      { label: "Irritants", value: "Low", detail: "No major irritants flagged" },
      { label: "Allergens", value: "Low", detail: "Review for shea sensitivity" }
    ],
    alternatives: []
  },
  {
    id: "deodorant",
    barcode: "5555555555555",
    name: "Fresh Sport Deodorant",
    brand: "ClearDay",
    category: "beauty",
    image: productArt("Sport Deodorant", "ClearDay", "deodorant", "bottle"),
    score: 56,
    rating: "Moderate",
    positives: ["No formaldehyde releasers"],
    concerns: ["Fragrance", "Possible allergens", "Frequent-use product"],
    ingredients: [
      { name: "Propylene glycol", risk: "moderate", type: "Humectant" },
      { name: "Fragrance", risk: "moderate", type: "Fragrance blend" },
      { name: "Aloe", risk: "safe", type: "Botanical" }
    ],
    breakdown: [
      { label: "Fragrance", value: "Moderate", detail: "Flagged for sensitivity" },
      { label: "Preservatives", value: "Low", detail: "No major flags" },
      { label: "Irritants", value: "Possible", detail: "Frequent underarm use" },
      { label: "Allergens", value: "Possible", detail: "Scent blend not fully disclosed" }
    ],
    alternatives: ["lotion"]
  },
  {
    id: "detergent",
    barcode: "6666666666666",
    name: "Fresh Scent Laundry Detergent",
    brand: "BrightWash",
    category: "household",
    image: productArt("Fresh Scent", "BrightWash", "household", "bottle"),
    score: 58,
    rating: "Moderate",
    positives: ["Clear warning label", "Effective surfactant system"],
    concerns: ["Fragrance blend", "Skin irritants", "Eye irritation warning"],
    safetyNotes: [
      "Avoid eye contact",
      "Keep away from children",
      "Do not ingest",
      "Do not mix with bleach unless the label says safe"
    ],
    ingredients: [
      { name: "Water", risk: "safe", type: "Solvent" },
      { name: "Sodium laureth sulfate", risk: "moderate", type: "Surfactant" },
      { name: "Fragrance", risk: "moderate", type: "Fragrance blend" },
      { name: "Methylisothiazolinone", risk: "harmful", type: "Preservative" }
    ],
    breakdown: [
      { label: "Chemical caution", value: "Moderate", detail: "Fragrance and preservative flags" },
      { label: "Skin/eyes", value: "High", detail: "Eye irritation warning" },
      { label: "Eco concern", value: "Moderate", detail: "Surfactant and fragrance profile" },
      { label: "Child/pet", value: "Caution", detail: "Store safely" }
    ],
    alternatives: ["free-detergent", "dish-soap"],
    actionIngredients: ["Fragrance", "Methylisothiazolinone"]
  },
  {
    id: "free-detergent",
    barcode: "7777777777777",
    name: "Free & Clear Laundry Detergent",
    brand: "BrightWash",
    category: "household",
    image: productArt("Free & Clear", "BrightWash", "green", "bottle"),
    score: 81,
    rating: "Good",
    positives: ["Fragrance-free", "Lower irritant profile", "Clear warning label"],
    concerns: ["Eye contact warning"],
    safetyNotes: ["Avoid eye contact", "Keep away from children", "Do not ingest"],
    ingredients: [
      { name: "Water", risk: "safe", type: "Solvent" },
      { name: "C10-16 alcohol ethoxylate", risk: "moderate", type: "Surfactant" },
      { name: "Sodium citrate", risk: "safe", type: "Builder" }
    ],
    breakdown: [
      { label: "Chemical caution", value: "Low", detail: "No fragrance blend" },
      { label: "Skin/eyes", value: "Moderate", detail: "Avoid eye contact" },
      { label: "Eco concern", value: "Lower", detail: "Simpler formula" },
      { label: "Child/pet", value: "Caution", detail: "Store safely" }
    ],
    alternatives: []
  },
  {
    id: "dish-soap",
    barcode: "8888888888888",
    name: "Lemon Dish Soap",
    brand: "ClearSink",
    category: "household",
    image: productArt("Lemon Dish Soap", "ClearSink", "household", "bottle"),
    score: 69,
    rating: "Moderate",
    positives: ["No bleach", "No ammonia", "Biodegradable surfactant claim"],
    concerns: ["Fragrance", "Skin dryness for some users"],
    safetyNotes: ["Avoid eye contact", "Rinse hands if irritation occurs", "Do not ingest"],
    ingredients: [
      { name: "Water", risk: "safe", type: "Solvent" },
      { name: "Cocamidopropyl betaine", risk: "moderate", type: "Surfactant" },
      { name: "Fragrance", risk: "moderate", type: "Fragrance blend" }
    ],
    breakdown: [
      { label: "Chemical caution", value: "Moderate", detail: "Fragrance flag" },
      { label: "Skin/eyes", value: "Moderate", detail: "May dry hands" },
      { label: "Eco concern", value: "Low", detail: "No major flag shown" },
      { label: "Child/pet", value: "Caution", detail: "Store safely" }
    ],
    alternatives: ["free-detergent"]
  },
  {
    id: "cleaner",
    barcode: "9999999999999",
    name: "All-Purpose Cleaner",
    brand: "SparkHome",
    category: "household",
    image: productArt("All-Purpose", "SparkHome", "cleaner", "bottle"),
    score: 47,
    rating: "Bad",
    positives: ["Clear label warnings"],
    concerns: ["Fragrance", "Harsh cleaner", "Do-not-mix warning"],
    safetyNotes: [
      "Avoid eye contact",
      "Use in a ventilated area",
      "Do not mix with bleach or ammonia unless the label says safe"
    ],
    ingredients: [
      { name: "Sodium hypochlorite", risk: "harmful", type: "Bleach cleaner" },
      { name: "Fragrance", risk: "moderate", type: "Fragrance blend" }
    ],
    breakdown: [
      { label: "Chemical caution", value: "High", detail: "Bleach cleaner" },
      { label: "Skin/eyes", value: "High", detail: "Irritation warning" },
      { label: "Eco concern", value: "Moderate", detail: "Use as directed" },
      { label: "Child/pet", value: "High", detail: "Store securely" }
    ],
    alternatives: ["dish-soap"]
  },
  {
    id: "ibuprofen",
    barcode: "0101010101010",
    name: "Ibuprofen 200mg",
    brand: "HealthWay",
    category: "medicine",
    image: productArt("Ibuprofen", "HealthWay", "medicine", "pill"),
    rating: "Label Summary",
    summaryStatus: "Not Health Scored",
    activeIngredient: "Ibuprofen 200mg",
    purpose: "Pain reliever / fever reducer",
    warnings: [
      "Follow dosage label",
      "Avoid duplicate NSAID use",
      "Ask a doctor if allergic to NSAIDs",
      "Ask a doctor if taking blood thinners",
      "Ask a doctor or pharmacist if pregnant or unsure"
    ],
    inactiveIngredients: ["Carnauba wax", "Corn starch", "Hypromellose", "Iron oxide", "Povidone"],
    ingredients: [
      { name: "Ibuprofen", risk: "moderate", type: "Active drug ingredient" },
      { name: "Corn starch", risk: "safe", type: "Inactive ingredient" },
      { name: "Povidone", risk: "safe", type: "Inactive ingredient" }
    ],
    breakdown: [
      { label: "Active ingredient", value: "Ibuprofen 200mg", detail: "NSAID pain reliever" },
      { label: "Purpose", value: "Pain / fever", detail: "Follow label directions" },
      { label: "Duplicate warning", value: "NSAIDs", detail: "Avoid overlapping products" },
      { label: "Advice", value: "Ask if unsure", detail: "Doctor or pharmacist" }
    ],
    alternatives: ["allergy-med", "cough-syrup"]
  },
  {
    id: "allergy-med",
    barcode: "0202020202020",
    name: "Cetirizine Allergy Tablets",
    brand: "HealthWay",
    category: "medicine",
    image: productArt("Allergy Tablets", "HealthWay", "medicine", "pill"),
    rating: "Label Summary",
    summaryStatus: "Not Health Scored",
    activeIngredient: "Cetirizine HCl 10mg",
    purpose: "Antihistamine",
    warnings: [
      "Follow dosage label",
      "May cause drowsiness",
      "Ask a doctor or pharmacist before combining with other allergy medicine"
    ],
    inactiveIngredients: ["Lactose monohydrate", "Magnesium stearate", "Cellulose"],
    ingredients: [
      { name: "Cetirizine HCl", risk: "moderate", type: "Active drug ingredient" },
      { name: "Lactose monohydrate", risk: "safe", type: "Inactive ingredient" }
    ],
    breakdown: [
      { label: "Active ingredient", value: "Cetirizine 10mg", detail: "Antihistamine" },
      { label: "Purpose", value: "Allergy", detail: "Temporary symptom relief" },
      { label: "Warning", value: "Drowsiness", detail: "Review label" },
      { label: "Advice", value: "Ask if unsure", detail: "Doctor or pharmacist" }
    ],
    alternatives: []
  },
  {
    id: "cough-syrup",
    barcode: "0303030303030",
    name: "Cold & Cough Syrup",
    brand: "NightRelief",
    category: "medicine",
    image: productArt("Cough Syrup", "NightRelief", "medicine", "bottle"),
    rating: "Label Summary",
    summaryStatus: "Not Health Scored",
    activeIngredient: "Dextromethorphan HBr 10mg",
    purpose: "Cough suppressant",
    warnings: [
      "Follow dosage label",
      "Avoid duplicate cough/cold products",
      "Ask a doctor or pharmacist if taking other medicine"
    ],
    inactiveIngredients: ["Glycerin", "Flavor", "Sorbitol", "FD&C Red 40"],
    ingredients: [
      { name: "Dextromethorphan HBr", risk: "moderate", type: "Active drug ingredient" },
      { name: "Red 40", risk: "harmful", type: "Color additive" },
      { name: "Fragrance", risk: "moderate", type: "Flavor blend" }
    ],
    breakdown: [
      { label: "Active ingredient", value: "Dextromethorphan", detail: "Cough suppressant" },
      { label: "Purpose", value: "Cough", detail: "Follow label directions" },
      { label: "Duplicate warning", value: "Cold meds", detail: "Avoid overlap" },
      { label: "Advice", value: "Ask if unsure", detail: "Doctor or pharmacist" }
    ],
    alternatives: []
  },
  {
    id: "cotton-shirt",
    barcode: "0404040404040",
    name: "Classic Cotton T-Shirt",
    brand: "SoftThread",
    category: "textile",
    image: productArt("Cotton Shirt", "SoftThread", "textile", "fabric"),
    rating: "Material Summary",
    summaryStatus: "Low Concern",
    dataConfidence: "Partial",
    materialSummary: "100% cotton",
    concernLevel: "Low",
    treatmentNotes: "Dye and finish details not provided by the mock product source.",
    sensitiveSkinNotes: "Usually comfortable for sensitive skin after washing, but review dyes and finishes.",
    washBeforeUse: true,
    positives: ["Natural fiber", "Breathable", "Wash-before-use note"],
    concerns: ["Dye details missing", "Finishing treatment unknown"],
    ingredients: [
      { name: "Cotton", risk: "safe", type: "Natural fiber" }
    ],
    materials: [
      { name: "Cotton", percent: 100, risk: "safe", type: "Natural fiber" }
    ],
    breakdown: [
      { label: "Material", value: "Cotton", detail: "Natural fiber" },
      { label: "Concern", value: "Low", detail: "Wash before first wear" },
      { label: "Treatments", value: "Unknown", detail: "Dye and finish missing" },
      { label: "Skin", value: "Gentle", detail: "Usually breathable" }
    ],
    alternatives: ["organic-towel"]
  },
  {
    id: "polyester-shirt",
    barcode: "0505050505050",
    name: "Performance Polyester Shirt",
    brand: "MoveDry",
    category: "textile",
    image: productArt("Poly Shirt", "MoveDry", "textile", "fabric"),
    rating: "Material Summary",
    summaryStatus: "Moderate Concern",
    dataConfidence: "Estimated",
    materialSummary: "92% polyester, 8% spandex",
    concernLevel: "Moderate",
    treatmentNotes: "Moisture-wicking finish claimed; finishing chemistry not available in mock data.",
    sensitiveSkinNotes: "May feel less breathable for some users. Wash before first wear and avoid if tight synthetic fabric bothers your skin.",
    washBeforeUse: true,
    positives: ["Durable", "Stretch blend", "Quick-dry use case"],
    concerns: ["Synthetic blend", "Treatment details missing", "Odor retention possible"],
    ingredients: [
      { name: "Polyester", risk: "moderate", type: "Synthetic fiber" },
      { name: "Spandex", risk: "moderate", type: "Elastic synthetic fiber" }
    ],
    materials: [
      { name: "Polyester", percent: 92, risk: "moderate", type: "Synthetic fiber" },
      { name: "Spandex", percent: 8, risk: "moderate", type: "Elastic synthetic fiber" }
    ],
    breakdown: [
      { label: "Material", value: "Synthetic", detail: "Polyester/spandex blend" },
      { label: "Concern", value: "Moderate", detail: "Skin comfort depends on user" },
      { label: "Treatments", value: "Possible", detail: "Wicking finish claimed" },
      { label: "Skin", value: "Review", detail: "Sensitive users may prefer cotton" }
    ],
    alternatives: ["cotton-shirt", "organic-towel"]
  },
  {
    id: "organic-towel",
    barcode: "0606060606060",
    name: "Organic Cotton Bath Towel",
    brand: "PureLoop",
    category: "textile",
    image: productArt("Organic Towel", "PureLoop", "textile", "fabric"),
    rating: "Material Summary",
    summaryStatus: "Low Concern",
    dataConfidence: "Verified",
    materialSummary: "100% organic cotton",
    concernLevel: "Low",
    treatmentNotes: "Mock source includes organic cotton claim and low-dye finish.",
    sensitiveSkinNotes: "Good option for sensitive skin when washed before use.",
    washBeforeUse: true,
    positives: ["Organic cotton", "Low-dye finish", "Sensitive-skin friendly"],
    concerns: ["Verify certification on package"],
    ingredients: [
      { name: "Organic cotton", risk: "safe", type: "Certified natural fiber" }
    ],
    materials: [
      { name: "Organic cotton", percent: 100, risk: "safe", type: "Certified natural fiber" }
    ],
    breakdown: [
      { label: "Material", value: "Organic cotton", detail: "Natural fiber" },
      { label: "Concern", value: "Low", detail: "Lower-residue preference" },
      { label: "Treatments", value: "Low dye", detail: "Mock label claim" },
      { label: "Skin", value: "Gentle", detail: "Wash before use" }
    ],
    alternatives: []
  },
  {
    id: "body-scrubber",
    barcode: "0707070707070",
    name: "Nylon Body Scrubber",
    brand: "BathCloud",
    category: "textile",
    placeholderPalette: "scrubber",
    placeholderType: "scrubber",
    rating: "Material Summary",
    summaryStatus: "Moderate Concern",
    dataConfidence: "Partial",
    materialSummary: "Nylon mesh",
    concernLevel: "Moderate",
    treatmentNotes: "Product image missing from mock barcode source; placeholder generated from brand and category.",
    sensitiveSkinNotes: "Can be abrasive for some users. Replace often and let it dry fully between uses.",
    washBeforeUse: true,
    positives: ["Image fallback shown", "Clear care note"],
    concerns: ["Synthetic nylon", "Can be abrasive", "Replace regularly"],
    ingredients: [
      { name: "Nylon", risk: "moderate", type: "Synthetic fiber" }
    ],
    materials: [
      { name: "Nylon", percent: 100, risk: "moderate", type: "Synthetic fiber" }
    ],
    breakdown: [
      { label: "Material", value: "Nylon", detail: "Synthetic mesh" },
      { label: "Concern", value: "Moderate", detail: "Abrasive for some users" },
      { label: "Treatments", value: "Unknown", detail: "No finishing data" },
      { label: "Skin", value: "Caution", detail: "Use gently" }
    ],
    alternatives: ["organic-towel", "cotton-shirt"]
  }
];

const categoryExamples = {
  food: ["Ice Cream", "Peanut Butter", "Cereal", "Protein Bars", "Drinks", "Chips"],
  beauty: ["Shampoo", "Lotion", "Deodorant", "Soap", "Sunscreen", "Toothpaste"],
  household: ["Laundry Detergent", "Dish Soap", "All-Purpose Cleaner", "Air Freshener", "Fabric Softener"],
  medicine: ["Pain Relief", "Allergy", "Cold & Flu", "Vitamins", "Cough Syrup"],
  textile: ["Cotton Shirts", "Polyester Shirts", "Towels", "Body Scrubbers", "Bedding", "Baby Textiles"]
};

const recommendationPairs = [
  { bad: "pop-secret", good: "skinny-pop" },
  { bad: "detergent", good: "free-detergent" },
  { bad: "shampoo", good: "lotion" },
  { bad: "polyester-shirt", good: "organic-towel" }
];

const historySeed = [
  { id: "h1", productId: "pop-secret", date: "Today, 2:14 PM" },
  { id: "h2", productId: "shampoo", date: "Today, 11:02 AM" },
  { id: "h3", productId: "detergent", date: "Yesterday, 5:38 PM" },
  { id: "h4", productId: "ibuprofen", date: "Yesterday, 9:21 AM" },
  { id: "h5", productId: "organic-towel", date: "Yesterday, 8:06 AM" }
];

function normalizeBarcode(value) {
  return String(value || "").replace(/[^\dA-Za-z]/g, "");
}

const ZXING_ENHANCED_VARIANTS = Object.freeze([
  "enlarged",
  "grayscale-contrast",
  "light-threshold",
  "taller",
  "shorter-center"
]);
const RECENT_BARCODE_TTL_MS = 6500;
const ENHANCED_VARIANT_INTERVAL = 4;
const CAMERA_SETTLE_MS = 900;

const OPEN_FOOD_FACTS_PRODUCT_FIELDS = OPEN_FOOD_FACTS_SEARCH_FIELDS.join(",");

async function lookupProductByBarcode(rawBarcode, { catalog = products } = {}) {
  const barcode = normalizeBarcode(rawBarcode);
  if (!barcode) {
    return { status: "empty", barcode, product: null, confidence: "Manual Review" };
  }
  if (/^0+$/.test(barcode)) {
    return {
      status: "not_found",
      barcode,
      product: null,
      confidence: "Manual Review",
      source: "manual-fallback"
    };
  }

  const realFoodResult = await lookupOpenFoodFactsFood(barcode);
  if (realFoodResult.product && isCompleteFoodProduct(realFoodResult.product)) {
    const product = applyStoredProductOverride(realFoodResult.product);
    return {
      status: "found",
      barcode,
      product,
      confidence: getConfidence(product),
      source: "food-provider"
    };
  }

  const generalBarcodeResult = await lookupUpcItemDbProduct(barcode);
  if (generalBarcodeResult.product) {
    const foodProduct = realFoodResult.product;
    const identityProduct = generalBarcodeResult.product;
    let product = identityProduct;
    if (foodProduct?.category === "food" && ["food", "unknown"].includes(identityProduct.category)) {
      product = mergeFoodProductWithBarcodeIdentity(foodProduct, identityProduct);
    } else if (foodProduct) {
      product = {
        ...identityProduct,
        name: identityProduct.name || foodProduct.name,
        brand: identityProduct.brand === "Unknown brand" ? foodProduct.brand : identityProduct.brand,
        image: identityProduct.image || foodProduct.image,
        category: identityProduct.category === "unknown" ? foodProduct.category : identityProduct.category
      };
    }
    product = applyStoredProductOverride(product);
    return {
      status: "found",
      barcode,
      product,
      confidence: getConfidence(product),
      source: "barcode-provider"
    };
  }

  if (realFoodResult.product) {
    const product = applyStoredProductOverride(realFoodResult.product);
    return {
      status: "found",
      barcode,
      product,
      confidence: getConfidence(product),
      source: "food-provider"
    };
  }

  const demoResult = await lookupDemoProductByBarcode(barcode, catalog);
  if (demoResult.product) {
    const product = applyStoredProductOverride(demoResult.product);
    return {
      status: "found",
      barcode,
      product,
      confidence: getConfidence(product),
      source: "demo-cache"
    };
  }

  return {
    status: "not_found",
    barcode,
    product: null,
    confidence: "Manual Review",
    source: "manual-fallback"
  };
}

async function lookupOpenFoodFactsFood(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OPEN_FOOD_FACTS_PRODUCT_FIELDS}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      return { product: null, error: "request-failed" };
    }
    const payload = await response.json();
    if (Number(payload.status) !== 1 || !payload.product) {
      return { product: null, error: "not-found" };
    }
    return { product: normalizeOpenFoodFactsProduct(payload.product, barcode), error: null };
  } catch (error) {
    console.warn("Food barcode lookup failed", error);
    return { product: null, error: "network" };
  }
}

async function lookupUpcItemDbProduct(barcode) {
  try {
    const response = await fetch("/api/upc/lookup", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ upc: barcode })
    });
    if (!response.ok) return { product: null, error: "request-failed" };
    const payload = await response.json();
    const item = asArray(payload.items)[0];
    if (!item) return { product: null, error: "not-found" };
    return { product: normalizeUpcItemDbProduct(item, barcode), error: null };
  } catch (error) {
    console.warn("General barcode lookup failed", error);
    return { product: null, error: "network" };
  }
}

async function searchFoodProductsByName(rawQuery, {
  limit = 8,
  regionId = "global",
  preferredLanguage = "auto",
  globalFallback = false
} = {}) {
  const query = cleanText(rawQuery);
  if (query.length < 2) return { products: [], hasStrongRegionMatch: false, fallbackAvailable: false, regionId: globalFallback ? "global" : regionId, fromCache: false };
  try {
    const searchRegion = globalFallback ? "global" : regionId;
    const cacheKey = createRegionSearchCacheKey({ query, regionId: searchRegion, preferredLanguage, globalFallback, limit });
    let rawProducts = getCachedRegionSearch(cacheKey);
    const fromCache = Boolean(rawProducts);
    if (!rawProducts) {
      const params = buildOpenFoodFactsSearchParams(query, { regionId: searchRegion, preferredLanguage, globalFallback, limit });
      const response = await fetchFoodSearch(params);
      if (!response?.ok) return { products: [], hasStrongRegionMatch: false, fallbackAvailable: searchRegion !== "global", regionId: searchRegion, fromCache: false };
      const payload = await response.json();
      rawProducts = asArray(payload.products);
      setCachedRegionSearch(cacheKey, rawProducts);
    }
    const ranked = rankAndDedupeSearchResults(rawProducts, {
      query,
      regionId: searchRegion,
      preferredLanguage,
      strictRegion: searchRegion !== "global",
      limit
    });
    const normalizedProducts = ranked.products
      .map((product) => normalizeOpenFoodFactsProduct(product, normalizeBarcode(product.code), { regionId: searchRegion, preferredLanguage }))
      .map((product) => applyStoredProductOverride(product))
      .filter((product) => product.name && product.brand)
      .slice(0, limit);
    return { ...ranked, products: normalizedProducts, regionId: searchRegion, fromCache };
  } catch (error) {
    console.warn("Food name lookup failed", error);
    return { products: [], hasStrongRegionMatch: false, fallbackAvailable: regionId !== "global", regionId: globalFallback ? "global" : regionId, fromCache: false };
  }
}

async function fetchFoodSearch(params) {
  const query = params.toString();
  const searchUrls = [
    `https://world.openfoodfacts.org/cgi/search.pl?${query}`,
    `/food-name-search?${query}`
  ];
  let lastResponse = null;
  for (const url of searchUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        }
      });
      if (response.ok) return response;
      lastResponse = response;
    } catch {
      // Browser CORS blocks the legacy text-search endpoint; local dev proxy handles it.
    }
  }
  return lastResponse || new Response(null, { status: 502 });
}

async function lookupDemoProductByBarcode(barcode, catalog) {
  return {
    product: catalog.find((product) => product.barcode === barcode) || null
  };
}

function getLocalizedProductField(product, field, languages = []) {
  for (const language of languages) {
    const value = cleanText(product?.[`${field}_${language}`]);
    if (value) return { value, language, field: `${field}_${language}` };
  }
  const value = cleanText(product?.[field]);
  return value ? { value, language: cleanText(product?.lang) || "unknown", field } : null;
}

function getOpenFoodFactsMarketMetadata(rawProduct, regionId = "global") {
  const selectedMarket = regionId !== "global" && productMatchesRegion(rawProduct, regionId)
    ? getProductRegionConfig(regionId).label
    : "";
  return {
    quantity: cleanText(rawProduct.quantity),
    countries: cleanText(rawProduct.countries),
    countriesTags: asArray(rawProduct.countries_tags),
    marketLabel: selectedMarket || getProductMarketLabel(rawProduct),
    sourceLanguage: cleanText(rawProduct.lang),
    languagesTags: asArray(rawProduct.languages_tags),
    completeness: toNumber(rawProduct.completeness),
    uniqueScans: toNumber(rawProduct.unique_scans_n),
    lastModified: toNumber(rawProduct.last_modified_t)
  };
}

function normalizeOpenFoodFactsProduct(rawProduct, barcode, { regionId = "global", preferredLanguage = "auto" } = {}) {
  const preferredLanguages = getPreferredProductLanguages(regionId, preferredLanguage);
  const nameField = getLocalizedProductField(rawProduct, "product_name", preferredLanguages);
  const originalName = nameField?.value || cleanText(rawProduct.generic_name) || `Food product ${barcode}`;
  const normalizedName = normalizeProductTextForAnalysis(originalName);
  const name = normalizedName.translated && normalizedName.translationConfidence === "high" ? normalizedName.englishText : originalName;
  const brand = cleanText(String(rawProduct.brands || "").split(",")[0]) || "Unknown brand";
  const image = pickOpenFoodFactsImage(rawProduct);
  const ingredientResult = parseOpenFoodFactsIngredients(rawProduct, { regionId, preferredLanguage });
  const ingredients = ingredientResult.ingredients;
  const nutrition = mapOpenFoodFactsNutrition(rawProduct);
  const categoryPath = cleanText(rawProduct.categories || asArray(rawProduct.categories_tags).join(" "));
  const normalizedCategoryPath = normalizeProductTextForAnalysis(categoryPath).englishText;
  const inferredCategory = inferCategoryFromProductText([normalizedName.englishText, brand, normalizedCategoryPath, ingredients.slice(0, 6).map((item) => item.name).join(" ")].join(" "));
  const hasFoodEvidence = inferredCategory === "food" || ingredients.length > 0 || hasCoreFoodNutrition(nutrition);
  const marketMetadata = getOpenFoodFactsMarketMetadata(rawProduct, regionId);
  if (!["food", "unknown"].includes(inferredCategory) || (inferredCategory === "unknown" && !hasFoodEvidence)) {
    const partialProduct = createPartialIdentityProduct({
      id: `food-${barcode}`,
      barcode,
      name,
      originalName: name !== originalName ? originalName : undefined,
      analysisName: normalizedName.englishText,
      translationConfidence: normalizedName.translationConfidence,
      brand,
      category: inferredCategory === "unknown" ? "unknown" : inferredCategory,
      image,
      description: cleanText(rawProduct.generic_name),
      categoryPath,
      sourceType: "food-provider",
      ...marketMetadata
    });
    return {
      ...partialProduct,
      ingredientParsing: ingredientResult.parsing,
      sourceRouting: createProductSourceRouting({
        providerType: "food-provider",
        hasIdentity: Boolean(name && brand !== "Unknown brand"),
        hasCategory: inferredCategory !== "unknown",
        hasImage: Boolean(image),
        hasIngredients: ingredients.length > 0,
        hasNutrition: hasCoreFoodNutrition(nutrition),
        hasAllergens: Boolean(rawProduct.allergens || asArray(rawProduct.allergens_tags).length),
        hasAdditives: asArray(rawProduct.additives_tags).length > 0
      })
    };
  }

  const processing = mapOpenFoodFactsProcessing(rawProduct.nova_group);
  const counts = getRiskCounts(ingredients);
  const unclassifiedCount = ingredients.filter((ingredient) => ingredient.classificationKind === "unknown").length;
  const nutritionFlags = getNutritionFlags(nutrition);
  const additivesCount = toNumber(rawProduct.additives_n);
  const hasAdditives = additivesCount > 0 || asArray(rawProduct.additives_tags).length > 0 || asArray(rawProduct.additives_original_tags).length > 0;
  const hasAdditiveData = rawProduct.additives_n !== undefined || asArray(rawProduct.additives_tags).length > 0 || asArray(rawProduct.additives_original_tags).length > 0;
  const allergens = formatAllergens(rawProduct.allergens || asArray(rawProduct.allergens_tags).join(", "));
  const hasIngredients = ingredients.length > 0;
  const hasNutrition = hasCoreFoodNutrition(nutrition);
  const analysisReady = hasIngredients && hasNutrition;
  const concerns = [
    ...(hasAdditives ? ["Additives listed"] : []),
    ...(unclassifiedCount > 0 ? [`${unclassifiedCount} ${unclassifiedCount === 1 ? "ingredient needs" : "ingredients need"} review`] : []),
    ...nutritionFlags.concerns,
    ...(processing === "Ultra-processed" ? ["Ultra-processed"] : []),
    ...ingredients
      .filter((ingredient) => ingredient.risk === "harmful")
      .slice(0, 2)
      .map((ingredient) => ingredient.name)
  ].slice(0, 5);
  const positives = [
    ...(hasNumber(nutrition.sugar) && nutrition.sugar <= 5 ? ["Low sugar"] : []),
    ...(hasNumber(nutrition.protein) && nutrition.protein >= 10 ? ["Good protein"] : []),
    ...(hasNumber(nutrition.fiber) && nutrition.fiber >= 3 ? ["Some fiber"] : []),
    ...(ingredients.length > 0 && ingredients.length <= 6 ? ["Short ingredient list"] : []),
    ...(concerns.length || counts.unknown > 0 ? [] : ["No major flags found"])
  ].slice(0, 4);
  const baseProduct = {
    id: `food-${barcode}`,
    barcode,
    name,
    originalName: name !== originalName ? originalName : undefined,
    analysisName: normalizedName.englishText,
    translationConfidence: normalizedName.translationConfidence,
    brand,
    category: "food",
    image,
    ...marketMetadata,
    sourceType: "food-provider",
    dataConfidence: getOpenFoodFactsConfidence({ image, ingredients, nutrition }),
    nutritionConfidence: getNutritionConfidence(nutrition),
    ingredientParsing: ingredientResult.parsing,
    sourceRouting: createProductSourceRouting({
      providerType: "food-provider",
      hasIdentity: Boolean(name && brand !== "Unknown brand"),
      hasCategory: true,
      hasImage: Boolean(image),
      hasIngredients,
      hasNutrition,
      hasAllergens: Boolean(allergens),
      hasAdditives: hasAdditiveData
    }),
    fieldConfidence: {
      identity: name && brand !== "Unknown brand" ? "Verified" : "Partial",
      image: image ? "Verified" : "Missing",
      ingredients: hasIngredients ? "Verified" : "Missing",
      nutrition: hasNutrition ? "Verified" : "Missing",
      additives: hasAdditiveData ? "Verified" : "Missing",
      allergens: allergens ? "Verified" : "Missing"
    },
    processing,
    allergens,
    additives: {
      count: additivesCount || asArray(rawProduct.additives_tags).length,
      tags: asArray(rawProduct.additives_tags)
    },
    ingredients,
    concerns: concerns.length ? concerns : ["Review full label"],
    positives: positives.length ? positives : [ingredients.length ? "Ingredient list available" : "Product identified"],
    nutrition,
    alternatives: ["skinny-pop", "protein-bar", "peanut-butter"]
  };

  if (!analysisReady) {
    const missing = [
      ...(!hasIngredients ? ["Ingredient list needed"] : []),
      ...(!hasNutrition ? ["Nutrition label needed"] : [])
    ];
    return {
      ...baseProduct,
      score: null,
      scoring: null,
      analysisPending: true,
      summaryStatus: "Needs label",
      rating: "Partial match",
      concerns: [...new Set([...missing, ...concerns])].slice(0, 5),
      positives: image ? ["Product image found"] : ["Product identity found"],
      breakdown: [
        { label: "Product", value: "Found", detail: "Name and brand matched" },
        { label: "Ingredients", value: hasIngredients ? "Available" : "Missing", detail: hasIngredients ? "Ready to review" : "Add the ingredient label" },
        { label: "Nutrition", value: hasNutrition ? "Available" : "Missing", detail: hasNutrition ? "Core values returned" : "Add nutrition facts" },
        { label: "Category", value: "Food", detail: categoryPath || "Food catalog match" }
      ]
    };
  }

  const scoring = scoreFoodProduct(baseProduct);
  return {
    ...baseProduct,
    score: scoring.total,
    scoring,
    rating: getRatingFromScore(scoring.total),
    breakdown: [
      {
        label: "Ingredients",
        value: `${counts.moderate} moderate`,
        detail: `${counts.harmful} higher concern`
      },
      {
        label: "Processing",
        value: processing,
        detail: rawProduct.nova_group ? `NOVA ${rawProduct.nova_group}` : "Not listed"
      },
      {
        label: "Nutrition",
        value: nutritionFlags.label,
        detail: nutritionFlags.detail
      },
      {
        label: "Allergens",
        value: allergens || "Not listed",
        detail: allergens ? "Review label" : "No allergen text returned"
      }
    ]
  };
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function firstNumber(...values) {
  for (const value of values) {
    const number = toNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function roundNutrient(value, digits = 1) {
  if (!hasNumber(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pickOpenFoodFactsImage(product) {
  const selectedFront =
    product.selected_images?.front?.display?.en ||
    product.selected_images?.front?.display?.["en:"] ||
    product.selected_images?.front?.small?.en ||
    product.selected_images?.front?.thumb?.en;
  return (
    product.image_front_url ||
    product.image_url ||
    product.image_front_small_url ||
    selectedFront ||
    product.image_front_thumb_url ||
    ""
  );
}

function parseOpenFoodFactsIngredients(product, { regionId = "global", preferredLanguage = "auto" } = {}) {
  const region = getProductRegionConfig(regionId);
  const preferredLanguages = region.id === "global"
    ? getPreferredProductLanguages(regionId, preferredLanguage)
    : region.preferredLanguages;
  const localizedSources = preferredLanguages.map((language) => ({
    field: `ingredients_text_${language}`,
    language,
    value: product[`ingredients_text_${language}`]
  }));
  const remainingLocalizedSources = ["en", "fr", "es", "ar"]
    .filter((language) => !preferredLanguages.includes(language))
    .map((language) => ({ field: `ingredients_text_${language}`, language, value: product[`ingredients_text_${language}`] }));
  const rawTextSource = { field: "ingredients_text", language: cleanText(product.lang) || "unknown", value: product.ingredients_text };
  const ingredientArraySource = { field: "ingredients", language: cleanText(product.lang) || "unknown", value: asArray(product.ingredients) };
  const sources = region.id === "global"
    ? [ingredientArraySource, ...localizedSources, rawTextSource, ...remainingLocalizedSources, { field: "ingredients_tags", language: "taxonomy", value: asArray(product.ingredients_tags) }]
    : [...localizedSources, rawTextSource, ingredientArraySource, ...remainingLocalizedSources, { field: "ingredients_tags", language: "taxonomy", value: asArray(product.ingredients_tags) }];
  let selected = null;
  let selectedSource = null;

  for (const source of sources) {
    if (!source.value || (Array.isArray(source.value) && !source.value.length)) continue;
    const sanitation = sanitizeIngredientCandidates(source.value, {
      category: "food",
      sourceField: source.field,
      detectSection: false,
      excludedTerms: [product.product_name, product.product_name_en, product.generic_name, ...String(product.brands || "").split(",")]
    });
    if (!selected) {
      selected = sanitation;
      selectedSource = source;
    }
    if (sanitation.acceptedIngredients.length) {
      selected = sanitation;
      selectedSource = source;
      break;
    }
  }

  const sanitation = selected || sanitizeIngredientCandidates([], { category: "food", sourceField: "ingredients" });
  const ingredients = sanitation.acceptedIngredients.slice(0, 48).map((candidate) => ({
    ...createIngredientRecordFromLabel(candidate.normalizedText || candidate.originalText, "food", candidate),
    originalLabelText: candidate.originalText,
    normalizedLabelText: candidate.normalizedText,
    ingredientSourceField: candidate.sourceField,
    parseConfidence: candidate.confidence,
    parseReason: candidate.reasonAccepted
  }));

  return {
    ingredients,
    parsing: {
      ...sanitation.metadata,
      selectedLanguage: selectedSource?.language || "unknown",
      selectedSourceField: selectedSource?.field || "ingredients",
      acceptedIngredients: sanitation.acceptedIngredients,
      rejectedFragments: sanitation.rejectedFragments,
      warnings: sanitation.warnings
    }
  };
}

function mapOpenFoodFactsIngredients(product) {
  return parseOpenFoodFactsIngredients(product).ingredients;
}

function mapOpenFoodFactsNutrition(product) {
  const nutriments = product.nutriments || {};
  const hasServingBasis = hasNumber(toNumber(nutriments["energy-kcal_serving"]))
    && ["proteins_serving", "carbohydrates_serving", "fat_serving"].some((key) => hasNumber(toNumber(nutriments[key])));
  const hasPer100MlBasis = hasNumber(toNumber(nutriments["energy-kcal_100ml"]))
    && ["proteins_100ml", "carbohydrates_100ml", "fat_100ml"].some((key) => hasNumber(toNumber(nutriments[key])));
  const basis = hasServingBasis ? "serving" : hasPer100MlBasis ? "100ml" : "100g";
  const suffix = basis === "serving" ? "serving" : basis === "100ml" ? "100ml" : "100g";
  const valueFor = (name) => toNumber(nutriments[`${name}_${suffix}`]);
  const energyKcal = valueFor("energy-kcal");
  const energyKj = valueFor("energy-kj");
  const calories = hasNumber(energyKcal) ? energyKcal : hasNumber(energyKj) ? energyKj / 4.184 : null;
  const sodiumGrams = valueFor("sodium");
  const saltGrams = valueFor("salt");
  const sodiumMg = hasNumber(sodiumGrams) ? sodiumGrams * 1000 : hasNumber(saltGrams) ? saltGrams * 400 : null;
  return {
    servingSize: cleanText(product.serving_size) || (basis === "100ml" ? "Per 100 ml" : basis === "100g" ? "Per 100 g" : "1 serving"),
    basis,
    calories: roundNutrient(calories, 0),
    protein: roundNutrient(valueFor("proteins"), 1),
    carbs: roundNutrient(valueFor("carbohydrates"), 1),
    fat: roundNutrient(valueFor("fat"), 1),
    sugar: roundNutrient(valueFor("sugars"), 1),
    sodium: roundNutrient(sodiumMg, 0),
    saturatedFat: roundNutrient(valueFor("saturated-fat"), 1),
    fiber: roundNutrient(valueFor("fiber"), 1)
  };
}

function mapOpenFoodFactsProcessing(novaGroup) {
  const nova = Number(novaGroup);
  if (nova === 1) return "Minimally processed";
  if (nova === 2 || nova === 3) return "Processed";
  if (nova === 4) return "Ultra-processed";
  return "Unknown";
}

function hasCoreFoodNutrition(nutrition = {}) {
  return hasNumber(nutrition.calories) && [nutrition.protein, nutrition.carbs, nutrition.fat].some(hasNumber);
}

function getOpenFoodFactsConfidence({ image, ingredients, nutrition }) {
  const hasImage = Boolean(image);
  const hasIngredients = ingredients.length > 0;
  const hasNutrition = hasCoreFoodNutrition(nutrition);
  return hasImage && hasIngredients && hasNutrition ? "Verified" : "Partial";
}

function getNutritionConfidence(nutrition) {
  return [nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].every(hasNumber) ? "Verified" : "Partial";
}

function getNutritionFlags(nutrition) {
  const concerns = [];
  if (hasNumber(nutrition.sugar) && nutrition.sugar > 20) concerns.push("High sugar");
  if (hasNumber(nutrition.sodium) && nutrition.sodium > 300) concerns.push("High sodium");
  if (hasNumber(nutrition.saturatedFat) && nutrition.saturatedFat > 4) concerns.push("Saturated fat");
  if (hasNumber(nutrition.calories) && nutrition.calories > 350) concerns.push("Calories");
  if (concerns.length >= 2) return { label: "Needs review", detail: concerns.slice(0, 2).join(", "), concerns };
  if (concerns.length === 1) return { label: "Mixed", detail: concerns[0], concerns };
  if ([nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].some(hasNumber)) {
    return { label: "Good", detail: "No major nutrition flags", concerns };
  }
  return { label: "Missing", detail: "Nutrition fields missing", concerns: ["Nutrition missing"] };
}

function formatAllergens(value) {
  const cleaned = cleanText(value)
    .replace(/en:/g, "")
    .split(",")
    .map((item) => cleanText(item.replace(/-/g, " ")))
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return cleaned;
}

function getRatingFromScore(score) {
  if (score >= 90) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 11) return "Bad";
  if (score <= 10) return "Very Bad";
  return "Bad";
}

function isCompleteFoodProduct(product) {
  return Boolean(
    product?.category === "food" &&
    product?.name &&
    !product.name.startsWith("Food product") &&
    product.brand &&
    product.brand !== "Unknown brand" &&
    product.image
  );
}

function mergeFoodProductWithBarcodeIdentity(foodProduct, identityProduct) {
  const image = foodProduct.image || identityProduct.image;
  const name = foodProduct.name?.startsWith("Food product") ? identityProduct.name : foodProduct.name;
  const brand = foodProduct.brand === "Unknown brand" ? identityProduct.brand : foodProduct.brand;
  return {
    ...foodProduct,
    name,
    brand,
    image,
    description: foodProduct.description || identityProduct.description,
    barcode: foodProduct.barcode || identityProduct.barcode,
    sourceRouting: createProductSourceRouting({
      providerType: "food-and-barcode-provider",
      hasIdentity: Boolean(name && brand !== "Unknown brand"),
      hasCategory: true,
      hasImage: Boolean(image),
      hasIngredients: Boolean(foodProduct.ingredients?.length),
      hasNutrition: hasCoreFoodNutrition(foodProduct.nutrition || {}),
      hasAllergens: Boolean(foodProduct.allergens),
      hasAdditives: foodProduct.fieldConfidence?.additives !== "Missing"
    }),
    dataConfidence: getOpenFoodFactsConfidence({
      image,
      ingredients: foodProduct.ingredients || [],
      nutrition: foodProduct.nutrition || {}
    })
  };
}

function normalizeUpcItemDbProduct(item, barcode) {
  const name = cleanText(item.title || item.model) || `Barcode product ${barcode}`;
  const brand = cleanText(item.brand) || "Unknown brand";
  const categoryPath = cleanText(item.category);
  const category = inferCategoryFromProductText([name, brand, categoryPath, item.description].join(" "));
  const image = asArray(item.images).find(Boolean) || "";
  return createPartialIdentityProduct({
    id: `upc-${normalizeBarcode(item.ean || item.upc || item.gtin || barcode)}`,
    barcode: normalizeBarcode(item.ean || item.upc || item.gtin || barcode),
    name,
    brand,
    category,
    image,
    sourceType: "barcode-provider",
    description: cleanText(item.description),
    categoryPath
  });
}

function createPartialIdentityProduct({
  id,
  barcode,
  name,
  brand,
  category = "unknown",
  image = "",
  sourceType,
  description = "",
  categoryPath = "",
  ...metadata
}) {
  const resolvedCategory = categoryMeta[category] ? category : "unknown";
  const product = {
    id,
    barcode,
    name,
    brand,
    category: resolvedCategory,
    image,
    sourceType,
    dataConfidence: "Partial",
    description,
    ...metadata,
    analysisPending: true,
    summaryStatus: "Needs label",
    rating: "Partial match",
    concerns: ["Scan or paste the label to complete analysis"],
    positives: ["Product identity found"],
    ingredients: [],
    fieldConfidence: {
      identity: name && brand !== "Unknown brand" ? "Verified" : "Partial",
      image: image ? "Verified" : "Missing",
      ingredients: "Missing",
      nutrition: "Missing",
      additives: "Missing",
      allergens: "Missing"
    },
    sourceRouting: createProductSourceRouting({
      providerType: sourceType,
      hasIdentity: Boolean(name && brand !== "Unknown brand"),
      hasCategory: resolvedCategory !== "unknown",
      hasImage: Boolean(image),
      hasIngredients: false,
      hasNutrition: false,
      hasAllergens: false,
      hasAdditives: false
    }),
    breakdown: [
      { label: "Product", value: "Found", detail: "Identity and image matched" },
      { label: "Label", value: "Needed", detail: "Ingredients and nutrition not returned" },
      { label: "Confidence", value: "Partial", detail: "Complete by scanning the label" },
      { label: "Category", value: categoryMeta[resolvedCategory]?.shortLabel || "Product", detail: categoryPath || "Category not confirmed" }
    ],
    alternatives: []
  };

  if (resolvedCategory === "medicine") {
    return {
      ...product,
      fieldConfidence: {
        ...product.fieldConfidence,
        activeIngredient: "Missing",
        warnings: "Missing",
        inactiveIngredients: "Missing"
      },
      rating: "Label Summary",
      summaryStatus: "Needs medicine label",
      activeIngredient: "Scan label to confirm",
      purpose: "Review product label",
      warnings: ["Scan or paste the label to complete analysis", "Follow the product label", "Ask a doctor or pharmacist if unsure"],
      inactiveIngredients: []
    };
  }

  if (resolvedCategory === "textile") {
    return {
      ...product,
      fieldConfidence: {
        ...product.fieldConfidence,
        materials: "Missing",
        care: "Missing"
      },
      rating: "Material Summary",
      summaryStatus: "Scan label to confirm",
      materialSummary: "Material label needed",
      concernLevel: "Unknown",
      treatmentNotes: "Scan or paste the label to complete material analysis.",
      sensitiveSkinNotes: "Review the material and care label before use.",
      washBeforeUse: true,
      materials: []
    };
  }

  if (resolvedCategory === "household") {
    return {
      ...product,
      fieldConfidence: {
        ...product.fieldConfidence,
        cautions: "Missing"
      },
      safetyNotes: ["Scan or paste the label to complete analysis", "Review the product label before use"]
    };
  }

  return product;
}

function inferCategoryFromProductText(value) {
  const lower = cleanText(value).toLowerCase();
  if (!lower) return "unknown";
  if (/(medicine|drug facts|ibuprofen|acetaminophen|naproxen|antihistamine|supplement facts|vitamin supplement|cough syrup|allergy relief|pain reliever|fever reducer|otc medicine)/.test(lower)) return "medicine";
  if (/(shirt|towel|fabric|textile|cotton|polyester|nylon|spandex|apparel|clothing|garment|bedding)/.test(lower)) return "textile";
  if (/(laundry detergent|dish soap|dishwashing|all-purpose cleaner|surface cleaner|glass cleaner|disinfect|bleach|ammonia|air freshener|fabric softener|cleaning wipes|household cleaner|surfactant|hypochlorite)/.test(lower)) return "household";
  if (/(shampoo|conditioner|lotion|deodorant|cosmetic|sunscreen|toothpaste|skin care|skincare|beauty|body wash|face wash|moisturizer|makeup|hand soap|bar soap|body scrub|personal care|parfum|fragrance|glycerin|sulfate)/.test(lower)) return "beauty";
  if (/(food|snack|cereal|popcorn|peanut butter|ice cream|chips|cracker|cookie|candy|chocolate|cocoa|wheat flour|corn syrup|milk powder|vegetable oil|soda|juice|beverage|drink|sauce|spread|dessert|dairy|confectionery|bakery|bread|pasta|rice|condiment|frozen meal|protein bar|nutrition bar|grocery)/.test(lower)) return "food";
  return "unknown";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getScoreClass(score) {
  if (score >= 70) return "score-good";
  if (score >= 50) return "score-mid";
  return "score-bad";
}

function getScoreLabel(product) {
  if (product.analysisPending) return "Needs Label";
  if (product.category === "medicine") return "Not Health Scored";
  if (product.category === "textile") return product.summaryStatus || "Material Summary";
  return `${product.score}/100`;
}

function getProductImage(product) {
  return (
    product.userPhoto ||
    product.image ||
    getProductPlaceholder(product)
  );
}

function getProductPlaceholder(product) {
  return productArt(
    product.name,
    product.brand || categoryMeta[product.category]?.shortLabel || "Product",
    product.placeholderPalette || product.category || "placeholder",
    product.placeholderType || (product.category === "textile" ? "fabric" : "box")
  );
}

function getImageStatus(product) {
  if (product.userPhoto) return "User Photo";
  if (product.image?.startsWith("data:image/svg+xml")) return "Demo Data";
  if (product.image) return "Verified";
  return "Placeholder";
}

function getConfidence(product) {
  if (product.dataConfidence) return product.dataConfidence;
  if (product.sourceType === "verified") return "Verified";
  return "Demo Data";
}

function ProductImage({ product, alt, className = "", ...props }) {
  const [failed, setFailed] = useState(false);
  const imageKey = `${product.id}-${product.image || ""}-${product.userPhoto || ""}`;

  useEffect(() => {
    setFailed(false);
  }, [imageKey]);

  return (
    <img
      loading="lazy"
      decoding="async"
      {...props}
      className={`product-image ${className}`.trim()}
      src={failed ? getProductPlaceholder(product) : getProductImage(product)}
      alt={alt || product.name}
      onError={() => setFailed(true)}
    />
  );
}

function getRecommendationReason(product, role) {
  if (role === "bad") return product.concerns?.[0] || "More flags";
  if (product.category === "food") return product.positives?.[0] || "Simpler nutrition";
  if (product.category === "beauty") return product.positives?.[0] || "Gentler formula";
  if (product.category === "household") return product.positives?.[0] || "Lower caution";
  if (product.category === "textile") return product.positives?.[0] || "Better material profile";
  return "Better fit";
}

function getRiskCounts(ingredients = [], { forScoring = false } = {}) {
  return ingredients.reduce(
    (acc, ingredient) => {
      const selectedRisk = forScoring ? ingredient.scoreRisk || ingredient.risk : ingredient.risk;
      const risk = selectedRisk === "common"
        ? "safe"
        : ["safe", "moderate", "harmful", "unknown"].includes(selectedRisk)
          ? selectedRisk
          : "unknown";
      acc[risk] += 1;
      return acc;
    },
    { safe: 0, moderate: 0, harmful: 0, unknown: 0 }
  );
}

function scoreFoodProduct(input) {
  const n = input.nutrition || {};
  let nutrition = 50;
  if (hasNumber(n.sugar) && n.sugar > 20) nutrition -= 14;
  if (hasNumber(n.sodium) && n.sodium > 300) nutrition -= 10;
  if (hasNumber(n.saturatedFat) && n.saturatedFat > 4) nutrition -= 9;
  if (hasNumber(n.calories) && n.calories > 350) nutrition -= 6;
  if (hasNumber(n.fiber) && n.fiber < 2) nutrition -= 5;
  if (hasNumber(n.protein) && n.protein < 3) nutrition -= 4;
  if (hasNumber(n.protein) && n.protein >= 10) nutrition += 6;
  if (hasNumber(n.fiber) && n.fiber >= 5) nutrition += 5;
  if (hasNumber(n.sugar) && n.sugar <= 5) nutrition += 4;
  if (![n.calories, n.protein, n.carbs, n.fat, n.sugar, n.sodium].some(hasNumber)) nutrition -= 8;
  nutrition = clamp(nutrition, 0, 50);

  const counts = getRiskCounts(input.ingredients || [], { forScoring: true });
  const ingredientPenalty = Math.min(counts.moderate * 5 + counts.harmful * 12, 28);
  const simplicityBonus = (input.ingredients || []).length <= 5 ? 4 : 0;
  const ingredients = clamp(35 - ingredientPenalty + simplicityBonus, 0, 35);

  const processingMap = {
    "Minimally processed": 15,
    Processed: 8,
    "Ultra-processed": 2,
    Unknown: 7
  };
  const processing = processingMap[input.processing] ?? 7;
  return {
    total: Math.round(nutrition + ingredients + processing),
    nutrition,
    ingredients,
    processing
  };
}

function createIngredientRecordFromLabel(label, category, parsedCandidate) {
  const knowledge = classifyIngredient(parsedCandidate ? {
    rawName: parsedCandidate.originalText || label,
    normalizedName: parsedCandidate.normalizedText || label,
    parentName: parsedCandidate.parentName || null,
    allergenSources: parsedCandidate.allergenSources || [],
    qualifiers: parsedCandidate.qualifiers || [],
    sourceSegment: parsedCandidate.sourceSegment || "direct",
    sourceField: parsedCandidate.sourceField,
    children: []
  } : label, { category });
  const displayName = ["common", "vague"].includes(knowledge.classificationKind)
    ? knowledge.displayName
    : knowledge.canonicalName;
  return {
    name: displayName,
    displayName: knowledge.displayName || displayName,
    canonicalName: knowledge.canonicalName,
    recognizedName: knowledge.recognizedName || knowledge.displayName || knowledge.canonicalName,
    originalLabelText: parsedCandidate?.originalText || (knowledge.originalLabelText && knowledge.originalLabelText !== knowledge.canonicalName ? knowledge.originalLabelText : undefined),
    risk: knowledge.risk,
    scoreRisk: knowledge.scoreRisk || knowledge.risk,
    type: knowledge.type,
    statusLabel: knowledge.statusLabel,
    rowSubtitle: knowledge.rowSubtitle,
    classificationKind: knowledge.classificationKind,
    knowledgeId: knowledge.id || knowledge.canonicalName?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    knowledgeConfidence: knowledge.knowledgeConfidence || knowledge.confidence,
    knowledgeSourceRoute: getKnowledgeSourceRoute(category),
    ingredientProvenance: knowledge.provenance,
    allergenSources: knowledge.allergenSources,
    allergenSignalType: knowledge.allergenSignalType,
    processingMarkers: knowledge.processingMarkers,
    vagueTerm: knowledge.vagueTerm,
    plainDescription: knowledge.plainDescription,
    whyUsed: knowledge.whyUsed,
    nutritionRole: knowledge.nutritionRole,
    statusDescription: knowledge.statusDescription,
    translated: parsedCandidate?.translated ?? knowledge.translated,
    translationConfidence: parsedCandidate?.translationConfidence || knowledge.translationConfidence
  };
}

function upgradeLegacyIngredientRecord(ingredient, category) {
  if (!ingredient) return ingredient;
  const upgraded = createIngredientRecordFromLabel(
    ingredient.normalizedLabelText || ingredient.originalLabelText || ingredient.name,
    category,
    {
      originalText: ingredient.originalLabelText || ingredient.name,
      normalizedText: ingredient.normalizedLabelText || ingredient.name,
      sourceField: ingredient.ingredientSourceField,
      allergenSources: ingredient.allergenSources || [],
      sourceSegment: ingredient.allergenSignalType || "direct"
    }
  );
  return { ...ingredient, ...upgraded };
}

function scoreBeautyProduct(input) {
  const counts = getRiskCounts(input.ingredients || [], { forScoring: true });
  let score = 88;
  score -= Math.min(counts.moderate * 6 + counts.harmful * 14, 42);
  if ((input.ingredients || []).some((ingredient) => ingredient.name.toLowerCase().includes("fragrance"))) score -= 8;
  if ((input.ingredients || []).length <= 6) score += 5;
  if (input.positives?.some((positive) => positive.toLowerCase().includes("fragrance-free"))) score += 8;
  return clamp(Math.round(score), 0, 100);
}

function scoreHouseholdProduct(input) {
  const counts = getRiskCounts(input.ingredients || [], { forScoring: true });
  let score = 86;
  score -= Math.min(counts.moderate * 7 + counts.harmful * 16, 46);
  if (input.concerns?.some((concern) => concern.toLowerCase().includes("eye"))) score -= 6;
  if (input.concerns?.some((concern) => concern.toLowerCase().includes("fragrance"))) score -= 6;
  if (input.safetyNotes?.some((note) => note.toLowerCase().includes("do not mix"))) score -= 7;
  if (input.positives?.some((positive) => positive.toLowerCase().includes("fragrance-free"))) score += 8;
  return clamp(Math.round(score), 0, 100);
}

function createManualReport({
  text,
  category,
  userPhoto,
  productName = "Manual Ingredient Analysis",
  brand = "Pasted label",
  nutrition: rawNutrition,
  nutritionConfidence,
  confidence = "Manual Review",
  allergens = "",
  ingredientSourceField = "user-entered ingredients",
  requireIngredientSection = false,
  providedFields
}) {
  const knowledgeCategory = category === "not-sure" ? undefined : category;
  const sanitation = sanitizeIngredientCandidates(text, {
    category: knowledgeCategory,
    sourceField: ingredientSourceField,
    requireSection: requireIngredientSection,
    detectSection: requireIngredientSection || /(?:ingredients?|ingr[eé]dients?|ingredientes?|المكونات)\s*[:：]/i.test(String(text || "")),
    excludedTerms: [productName, brand]
  });
  const ingredients = sanitation.acceptedIngredients.map((candidate) => ({
    ...createIngredientRecordFromLabel(candidate.normalizedText || candidate.originalText, knowledgeCategory, candidate),
    originalLabelText: candidate.originalText,
    normalizedLabelText: candidate.normalizedText,
    ingredientSourceField: candidate.sourceField,
    parseConfidence: candidate.confidence,
    parseReason: candidate.reasonAccepted
  }));

  const selectedCategory = category === "not-sure" ? inferCategory(ingredients) : category;
  const nutrition = selectedCategory === "food" ? normalizeNutrition(rawNutrition) : undefined;
  const hasNutrition = selectedCategory === "food" && hasCoreFoodNutrition(nutrition);
  const normalizedAllergens = formatAllergens(allergens);
  const baseProduct = {
    id: `manual-${Date.now()}`,
    name: productName,
    brand,
    category: selectedCategory,
    userPhoto,
    image: undefined,
    dataConfidence: confidence,
    fieldConfidence: {
      identity: "Manual Review",
      image: userPhoto ? "Manual Review" : "Missing",
      ingredients: ingredients.length ? "Manual Review" : "Missing",
      nutrition: hasNutrition ? "Manual Review" : "Missing",
      additives: ingredients.length ? "Manual Review" : "Missing",
      allergens: normalizedAllergens ? "Manual Review" : "Missing"
    },
    rating: "Quick Analysis",
    positives: ["Manual fallback used", "Ingredient risks grouped simply"],
    concerns: buildManualConcerns(ingredients, selectedCategory, hasNutrition),
    ingredients,
    ingredientParsing: {
      ...sanitation.metadata,
      acceptedIngredients: sanitation.acceptedIngredients,
      rejectedFragments: sanitation.rejectedFragments,
      warnings: sanitation.warnings
    },
    sourceRouting: createProductSourceRouting({
      providerType: "user-provided",
      hasIdentity: Boolean(productName),
      hasCategory: selectedCategory !== "unknown",
      hasImage: Boolean(userPhoto),
      hasIngredients: ingredients.length > 0,
      hasNutrition,
      hasAllergens: Boolean(normalizedAllergens),
      hasAdditives: ingredients.some((ingredient) => /additive|color|preservative|sweetener|emulsifier/i.test(ingredient.type || "")),
      overrideFields: ["category", "ingredients", ...(hasNutrition ? ["nutrition"] : []), ...(normalizedAllergens ? ["allergens"] : [])]
    }),
    userProvidedFields: providedFields || {
      category: selectedCategory,
      ingredientsText: String(text || "").trim(),
      allergensText: normalizedAllergens,
      nutrition,
      userPhoto
    },
    breakdown: buildManualBreakdown(ingredients, selectedCategory),
    alternatives: selectedCategory === "medicine" ? [] : ["skinny-pop", "lotion", "free-detergent"],
    processing: selectedCategory === "food" ? "Unknown" : undefined,
    nutrition: selectedCategory === "food" ? nutrition : undefined,
    allergens: selectedCategory === "food" ? normalizedAllergens : undefined,
    nutritionConfidence: selectedCategory === "food" ? nutritionConfidence || (hasNutrition ? "Manual Review" : "Partial") : undefined,
    safetyNotes:
      selectedCategory === "household"
        ? ["Review the product label before use", "Avoid eye contact", "Keep away from children and pets"]
        : undefined
  };

  if (selectedCategory === "medicine") {
    return {
      ...baseProduct,
      rating: "Label Summary",
      summaryStatus: "Not Health Scored",
      activeIngredient: ingredients[0]?.name || "Review active ingredient label",
      purpose: "Review product label",
      warnings: [
        "Follow dosage label",
        "Avoid duplicate active ingredients",
        "Ask a doctor or pharmacist if unsure"
      ],
      inactiveIngredients: ingredients.slice(1).map((ingredient) => ingredient.name)
    };
  }

  if (selectedCategory === "textile") {
    const materials = ingredients.map((ingredient) => ({
      ...ingredient,
      percent: ingredient.name.toLowerCase().includes("spandex") ? 8 : ingredients.length === 1 ? 100 : Math.floor(100 / ingredients.length)
    }));
    const hasSynthetic = materials.some((material) => ["moderate", "harmful"].includes(material.risk));
    const hasUnknownMaterial = materials.some((material) => material.risk === "unknown");
    return {
      ...baseProduct,
      image: undefined,
      rating: "Material Summary",
      summaryStatus: hasUnknownMaterial ? "Needs review" : hasSynthetic ? "Moderate Concern" : "Low Concern",
      materialSummary: materials.map((material) => material.name).join(", "),
      concernLevel: hasUnknownMaterial ? "Unknown" : hasSynthetic ? "Moderate" : "Low",
      treatmentNotes: "Treatment and certification details were not found in the pasted or reviewed label text.",
      sensitiveSkinNotes: "Wash before first use and review dyes, finishes, and skin-contact notes.",
      washBeforeUse: true,
      materials,
      alternatives: ["organic-towel", "cotton-shirt"],
      positives: ["Manual material analysis", "Wash-before-use reminder"],
      concerns: buildManualConcerns(ingredients, selectedCategory),
      breakdown: buildManualBreakdown(ingredients, selectedCategory)
    };
  }

  if (selectedCategory === "unknown" || (selectedCategory === "food" && (!hasNutrition || !ingredients.length))) {
    return {
      ...baseProduct,
      score: null,
      analysisPending: true,
      summaryStatus: "Needs label",
      rating: "Partial match",
      concerns: [
        ...(selectedCategory === "food" && !hasNutrition ? ["Nutrition label needed"] : []),
        ...(selectedCategory === "food" && !ingredients.length ? ["Ingredient list needed"] : []),
        ...(selectedCategory === "unknown" ? ["Product category needs confirmation"] : []),
        ...baseProduct.concerns
      ].slice(0, 4),
      positives: ingredients.length ? ["Ingredient list added"] : ["Manual review started"]
    };
  }

  const score =
    selectedCategory === "food"
      ? scoreFoodProduct(baseProduct).total
      : selectedCategory === "beauty"
        ? scoreBeautyProduct(baseProduct)
        : scoreHouseholdProduct(baseProduct);

  return {
    ...baseProduct,
    score,
    rating: getRatingFromScore(score)
  };
}

const NUTRITION_FIELD_NAMES = ["calories", "protein", "carbs", "fat", "saturatedFat", "fiber", "sugar", "sodium"];

function hasSuppliedNutritionInput(nutrition) {
  if (!nutrition || typeof nutrition !== "object") return false;
  return Boolean(
    cleanText(nutrition.servingSize)
      || NUTRITION_FIELD_NAMES.some((field) => nutrition[field] !== null && nutrition[field] !== undefined && nutrition[field] !== "")
      || ["100g", "100ml"].includes(nutrition.basis)
  );
}

function mergeNutritionFields(providerNutrition, overrideNutrition) {
  const base = normalizeNutrition(providerNutrition || {});
  if (!overrideNutrition || typeof overrideNutrition !== "object") return base;
  const supplied = normalizeNutrition(overrideNutrition);
  const merged = { ...base };
  if (["serving", "100g", "100ml"].includes(overrideNutrition.basis)) merged.basis = supplied.basis;
  if (cleanText(overrideNutrition.servingSize)) merged.servingSize = supplied.servingSize;
  NUTRITION_FIELD_NAMES.forEach((field) => {
    if (overrideNutrition[field] !== null && overrideNutrition[field] !== undefined && overrideNutrition[field] !== "") {
      merged[field] = supplied[field];
    }
  });
  return merged;
}

function ingredientLabelsForMerge(product) {
  return asArray(product?.ingredients)
    .map((ingredient) => ingredient.originalLabelText || ingredient.name)
    .filter(Boolean)
    .join(", ");
}

function getOverrideFieldsFromCompleted(completed) {
  if (completed?.userProvidedFields) return completed.userProvidedFields;
  return {
    category: completed?.category,
    ingredientsText: ingredientLabelsForMerge(completed),
    materialsText: completed?.category === "textile" ? ingredientLabelsForMerge(completed) : "",
    allergensText: completed?.allergens || "",
    nutrition: completed?.nutrition,
    userPhoto: completed?.userPhoto || ""
  };
}

function refreshMergedProductAnalysis(product) {
  const ingredients = asArray(product.ingredients);
  const counts = getRiskCounts(ingredients);
  const providerConcerns = asArray(product.concerns).filter((item) => !/(?:scan or paste|label needed|list needed|category needs confirmation)/i.test(item));
  const providerPositives = asArray(product.positives).filter((item) => !/(?:manual fallback|manual review started|product identity found)/i.test(item));

  if (product.category === "medicine") {
    return {
      ...product,
      score: null,
      scoring: null,
      analysisPending: !product.activeIngredient || /scan label|review active/i.test(product.activeIngredient),
      rating: "Label Summary",
      summaryStatus: "Not Health Scored"
    };
  }

  if (product.category === "textile") {
    const materials = product.materials?.length ? product.materials : ingredients;
    return {
      ...product,
      ingredients: materials,
      materials,
      score: null,
      scoring: null,
      analysisPending: !materials.length,
      rating: "Material Summary",
      summaryStatus: materials.length ? product.summaryStatus || "Material Summary" : "Needs label",
      materialSummary: materials.length ? materials.map((material) => material.name).join(", ") : "Material label needed"
    };
  }

  if (product.category === "unknown") {
    return {
      ...product,
      score: null,
      scoring: null,
      analysisPending: true,
      summaryStatus: "Needs label",
      rating: "Partial match"
    };
  }

  if (product.category === "food") {
    const nutrition = normalizeNutrition(product.nutrition || {});
    const hasIngredients = ingredients.length > 0;
    const hasNutrition = hasCoreFoodNutrition(nutrition);
    const nutritionFlags = getNutritionFlags(nutrition);
    const concerns = [
      ...providerConcerns,
      ...((product.additives?.count || product.additives?.tags?.length) ? ["Additives listed"] : []),
      ...(counts.unknown ? [`${counts.unknown} ${counts.unknown === 1 ? "ingredient needs" : "ingredients need"} review`] : []),
      ...ingredients.filter((ingredient) => ingredient.risk === "harmful").slice(0, 2).map((ingredient) => ingredient.name),
      ...nutritionFlags.concerns,
      ...(product.processing === "Ultra-processed" ? ["Ultra-processed"] : [])
    ];
    const positives = [
      ...providerPositives,
      ...(hasNumber(nutrition.sugar) && nutrition.sugar <= 5 ? ["Low sugar"] : []),
      ...(hasNumber(nutrition.protein) && nutrition.protein >= 10 ? ["Good protein"] : []),
      ...(hasNumber(nutrition.fiber) && nutrition.fiber >= 3 ? ["Some fiber"] : []),
      ...(ingredients.length > 0 && ingredients.length <= 6 ? ["Short ingredient list"] : [])
    ];
    if (!hasIngredients || !hasNutrition) {
      return {
        ...product,
        nutrition,
        score: null,
        scoring: null,
        analysisPending: true,
        summaryStatus: "Needs label",
        rating: "Partial match",
        concerns: [...new Set([
          ...(!hasIngredients ? ["Ingredient list needed"] : []),
          ...(!hasNutrition ? ["Nutrition label needed"] : []),
          ...concerns
        ])].slice(0, 5),
        positives: [...new Set(positives.length ? positives : ["Product identity found"])].slice(0, 4)
      };
    }
    const scoring = scoreFoodProduct({ ...product, ingredients, nutrition });
    return {
      ...product,
      nutrition,
      score: scoring.total,
      scoring,
      analysisPending: false,
      summaryStatus: undefined,
      rating: getRatingFromScore(scoring.total),
      concerns: [...new Set(concerns.length ? concerns : ["Review full label"])].slice(0, 5),
      positives: [...new Set(positives.length ? positives : ["Ingredient and nutrition data available"])].slice(0, 4)
    };
  }

  if (!ingredients.length) {
    return {
      ...product,
      score: null,
      scoring: null,
      analysisPending: true,
      summaryStatus: "Needs label",
      rating: "Partial match"
    };
  }

  const score = product.category === "beauty" ? scoreBeautyProduct(product) : scoreHouseholdProduct(product);
  return {
    ...product,
    score,
    scoring: null,
    analysisPending: false,
    summaryStatus: undefined,
    rating: getRatingFromScore(score)
  };
}

function mergeProductWithOverrideRecord(product, overrideRecord, completedProduct) {
  if (!product || !overrideRecord?.fields) return product;
  const fields = overrideRecord.fields;
  const category = fields.category && fields.category !== "unknown"
    ? fields.category
    : product.category || completedProduct?.category || "unknown";
  const hasIngredientOverride = Boolean(fields.ingredientsText || fields.materialsText);
  const hasNutritionOverride = hasSuppliedNutritionInput(fields.nutrition);
  const canReuseProviderIngredients = product.category === category;
  const ingredientText = fields.materialsText || fields.ingredientsText || (canReuseProviderIngredients ? ingredientLabelsForMerge(product) : "");
  const nutrition = category === "food" ? mergeNutritionFields(product.nutrition, hasNutritionOverride ? fields.nutrition : null) : undefined;
  const completed = completedProduct || createManualReport({
    text: ingredientText,
    category,
    userPhoto: fields.userPhoto || product.userPhoto,
    productName: product.name,
    brand: product.brand,
    nutrition,
    nutritionConfidence: "Manual Review",
    allergens: fields.allergensText || product.allergens,
    ingredientSourceField: hasIngredientOverride ? "user-entered ingredients" : "provider ingredient fields",
    providedFields: fields
  });
  const fieldConfidence = { ...(product.fieldConfidence || {}) };
  if (hasIngredientOverride) {
    fieldConfidence.ingredients = completed.ingredients?.length ? "Manual Review" : "Missing";
    fieldConfidence.additives = completed.ingredients?.length ? "Manual Review" : fieldConfidence.additives || "Missing";
  }
  if (hasNutritionOverride) fieldConfidence.nutrition = hasCoreFoodNutrition(nutrition) ? "Manual Review" : "Missing";
  if (fields.allergensText) fieldConfidence.allergens = "Manual Review";
  if (fields.userPhoto) fieldConfidence.image = "Manual Review";
  if (fields.category) fieldConfidence.category = "Manual Review";
  if (category === "medicine") {
    if (fields.activeIngredient) fieldConfidence.activeIngredient = "Manual Review";
    if (fields.warningsText) fieldConfidence.warnings = "Manual Review";
    if (fields.ingredientsText) fieldConfidence.inactiveIngredients = "Manual Review";
  }
  if (category === "textile") {
    if (fields.materialsText) fieldConfidence.materials = "Manual Review";
    if (fields.careText) fieldConfidence.care = "Manual Review";
  }
  if (category === "household" && fields.warningsText) fieldConfidence.cautions = "Manual Review";

  const overrideFactNames = [
    ...(fields.category ? ["category"] : []),
    ...(hasIngredientOverride ? ["ingredients", "additives"] : []),
    ...(hasNutritionOverride ? ["nutrition"] : []),
    ...(fields.allergensText ? ["allergens"] : []),
    ...(fields.userPhoto ? ["image"] : [])
  ];
  const originalProviderProduct = product.originalProviderProduct || overrideRecord.originalProviderProduct || product;
  const analysisFieldsChanged = category !== product.category || hasIngredientOverride || hasNutritionOverride || Boolean(fields.warningsText);
  const merged = {
    ...product,
    ...completed,
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    category,
    image: product.image,
    userPhoto: fields.userPhoto || completed.userPhoto || product.userPhoto,
    description: product.description,
    sourceType: product.sourceType,
    dataConfidence: "Manual Review",
    nutrition,
    ingredients: hasIngredientOverride
      ? completed.ingredients
      : canReuseProviderIngredients && product.ingredients?.length
        ? product.ingredients
        : completed.ingredients,
    allergens: fields.allergensText ? formatAllergens(fields.allergensText) : product.allergens || completed.allergens,
    concerns: analysisFieldsChanged ? completed.concerns : product.concerns || completed.concerns,
    positives: analysisFieldsChanged ? completed.positives : product.positives || completed.positives,
    activeIngredient: fields.activeIngredient || (hasIngredientOverride ? completed.activeIngredient : product.activeIngredient || completed.activeIngredient),
    purpose: fields.purpose || product.purpose || completed.purpose,
    warnings: fields.warningsText ? splitLabelText(fields.warningsText) : product.warnings || completed.warnings,
    safetyNotes: fields.warningsText ? completed.safetyNotes : product.safetyNotes || completed.safetyNotes,
    treatmentNotes: fields.careText || product.treatmentNotes || completed.treatmentNotes,
    originalProviderProduct,
    userProductOverride: {
      source: "user-provided",
      fields,
      updatedAt: overrideRecord.updatedAt || new Date().toISOString()
    },
    overrideApplied: true,
    overrideUpdatedAt: overrideRecord.updatedAt || new Date().toISOString(),
    fieldConfidence,
    sourceRouting: createProductSourceRouting({
      providerType: product.sourceType,
      hasIdentity: Boolean(product.name && product.brand),
      hasCategory: category !== "unknown",
      hasImage: Boolean(fields.userPhoto || product.image),
      hasIngredients: Boolean((hasIngredientOverride || !canReuseProviderIngredients ? completed.ingredients : product.ingredients)?.length),
      hasNutrition: category === "food" && hasCoreFoodNutrition(nutrition),
      hasAllergens: Boolean(fields.allergensText || product.allergens),
      hasAdditives: fieldConfidence.additives !== "Missing",
      overrideFields: overrideFactNames
    })
  };
  return refreshMergedProductAnalysis(merged);
}

function applyStoredProductOverride(product) {
  const override = getProductOverride(product);
  return override ? mergeProductWithOverrideRecord(product, override) : product;
}

function completeProductWithUserInput(product, fields, completedProduct) {
  if (!product) return completedProduct;
  const temporaryRecord = {
    source: "user-provided",
    fields,
    originalProviderProduct: product.originalProviderProduct || product,
    updatedAt: new Date().toISOString()
  };
  let merged = mergeProductWithOverrideRecord(product, temporaryRecord, completedProduct);
  const savedRecord = saveProductOverride(product, fields, merged);
  if (savedRecord) {
    merged = {
      ...merged,
      originalProviderProduct: savedRecord.originalProviderProduct || merged.originalProviderProduct,
      userProductOverride: {
        source: savedRecord.source,
        fields: savedRecord.fields,
        updatedAt: savedRecord.updatedAt
      },
      overrideUpdatedAt: savedRecord.updatedAt
    };
  }
  return merged;
}

function mergeProductLabelCompletion(product, completed) {
  if (!product) return completed;
  return completeProductWithUserInput(product, getOverrideFieldsFromCompleted(completed), completed);
}

function inferCategory(ingredients) {
  return inferCategoryFromProductText(ingredients.map((ingredient) => ingredient.name).join(" "));
}

function buildManualConcerns(ingredients, category, hasNutrition = false) {
  const counts = getRiskCounts(ingredients);
  const reviewCount = counts.moderate + counts.harmful;
  const knowledgeNote = counts.unknown ? `${counts.unknown} ${counts.unknown === 1 ? "ingredient needs" : "ingredients need"} source review` : `${reviewCount} flagged ingredients`;
  if (category === "unknown") return ["Category not confirmed", knowledgeNote, "Add the product label"];
  if (category === "medicine") return ["Review active ingredient", "Check duplicate ingredients", "Follow dosage label"];
  if (category === "textile") return ["Material blend", counts.unknown ? knowledgeNote : `${reviewCount} material notes`, "Wash before use"];
  if (category === "household") return ["Chemical caution", knowledgeNote, "Review warning label"];
  if (category === "beauty") return ["Possible irritants", knowledgeNote, "Sensitivity depends on user"];
  return ["Ingredient flags", ...(hasNutrition ? [] : ["Nutrition label needed"]), "Processing not confirmed"];
}

function buildManualBreakdown(ingredients, category) {
  const counts = getRiskCounts(ingredients);
  if (category === "unknown") {
    return [
      { label: "Ingredients", value: `${ingredients.length}`, detail: "Entered manually" },
      { label: "Category", value: "Unknown", detail: "Confirm the product type" },
      { label: "Label", value: "Needed", detail: "Add category-specific details" }
    ];
  }
  if (category === "medicine") {
    return [
      { label: "Active ingredient", value: ingredients[0]?.name || "Review label", detail: "Manual label summary" },
      { label: "Purpose", value: "Check label", detail: "Medicine is context-dependent" },
      { label: "Duplicate warning", value: "Review", detail: "Avoid overlapping active ingredients" },
      { label: "Advice", value: "Ask if unsure", detail: "Doctor or pharmacist" }
    ];
  }
  if (category === "textile") {
    return [
      { label: "Materials", value: `${ingredients.length}`, detail: "Parsed from label text" },
      { label: "Concern", value: counts.moderate + counts.harmful ? "Moderate" : "Low", detail: "Based on material mix" },
      { label: "Treatments", value: "Unknown", detail: "Confirm dye and finish claims" },
      { label: "Skin", value: "Review", detail: "Wash before first use" }
    ];
  }
  return [
    { label: "Safe", value: `${counts.safe}`, detail: "Low concern for typical use" },
    { label: "Moderate", value: `${counts.moderate}`, detail: "Depends on amount, frequency, sensitivity, or product type" },
    { label: "Harmful", value: `${counts.harmful}`, detail: "Higher concern flag" },
    { label: category === "food" ? "Nutrition" : "Label", value: "Manual", detail: "Use barcode data when available" }
  ];
}

function createOcrDraft(category, mode) {
  const samples = {
    food: {
      productName: "Demo Food Label",
      brand: "Scanned product",
      text:
        "Ingredients: whole grain popcorn, palm oil, salt, artificial flavor, annatto color. Nutrition Facts: Serving size 3 tbsp. Calories 170. Protein 2g. Carbs 18g. Fat 11g. Sugar 0g. Sodium 330mg. Saturated fat 5g.",
      ingredientsText: "whole grain popcorn, palm oil, salt, artificial flavor, annatto color",
      nutrition: { basis: "serving", servingSize: "3 tbsp", calories: 170, protein: 2, carbs: 18, fat: 11, sugar: 0, sodium: 330, saturatedFat: 5, fiber: 3 },
      allergensText: ""
    },
    beauty: {
      productName: "Demo Personal Care Label",
      brand: "Scanned product",
      text:
        "Ingredients: water, sodium laureth sulfate, cocamidopropyl betaine, fragrance, methylisothiazolinone. Warnings: avoid eye contact.",
      ingredientsText: "water, sodium laureth sulfate, cocamidopropyl betaine, fragrance, methylisothiazolinone"
    },
    household: {
      productName: "Demo Cleaner Label",
      brand: "Scanned product",
      text:
        "Ingredients: water, surfactants, fragrance, methylisothiazolinone. Warnings: avoid eye contact, keep away from children, do not ingest.",
      ingredientsText: "water, sodium laureth sulfate, fragrance, methylisothiazolinone"
    },
    medicine: {
      productName: "Demo Medicine Label",
      brand: "Scanned product",
      text:
        "Active ingredient: Ibuprofen 200mg. Purpose: pain reliever/fever reducer. Warnings: follow dosage label, avoid duplicate NSAID use, ask a doctor or pharmacist if unsure. Inactive ingredients: corn starch, povidone.",
      ingredientsText: "Ibuprofen, corn starch, povidone",
      activeIngredient: "Ibuprofen 200mg",
      purpose: "Pain reliever / fever reducer",
      warningsText: "Follow dosage label; Avoid duplicate NSAID use; Ask a doctor or pharmacist if unsure"
    },
    textile: {
      productName: "Demo Fabric Label",
      brand: "Scanned product",
      text:
        "Materials: 92% polyester, 8% spandex. Care: wash before wear. Finish: moisture wicking. Sensitive skin: review synthetic blend.",
      ingredientsText: "polyester, spandex",
      materialsText: "92% polyester, 8% spandex"
    }
  };
  const draft = samples[category] || samples.food;
  return {
    category,
    mode,
    ...draft,
    confidence: "Manual Review",
    nutritionEstimated: category === "food" && mode !== "nutrition"
  };
}

function createBlankLabelDraft(category, mode, product) {
  const base = {
    category,
    mode,
    productName: product?.name || "",
    brand: product?.brand === "Unknown brand" ? "" : product?.brand || "",
    text: "",
    ingredientsText: "",
    allergensText: "",
    confidence: "Manual Review",
    nutritionEstimated: false
  };

  if (category === "food") {
    return {
      ...base,
      nutrition: {
        basis: "serving",
        servingSize: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        sugar: "",
        sodium: "",
        saturatedFat: "",
        fiber: ""
      }
    };
  }

  if (category === "medicine") {
    return { ...base, activeIngredient: "", purpose: "", warningsText: "" };
  }

  if (category === "textile") {
    return { ...base, materialsText: "", careText: "" };
  }

  return { ...base, warningsText: "" };
}

function createReportFromOcr(review, capturedPhoto) {
  const nutrition = review.category === "food" ? normalizeNutrition(review.nutrition) : undefined;
  const hasDedicatedIngredientField = Boolean(
    review.category === "textile"
      ? (review.materialsText || review.ingredientsText || "").trim()
      : (review.ingredientsText || "").trim()
  );
  const labelText =
    review.category === "textile"
      ? review.materialsText || review.ingredientsText || review.text
      : review.ingredientsText || review.text;
  const report = createManualReport({
    text: labelText,
    category: review.category,
    userPhoto: capturedPhoto,
    productName: review.productName || "Label Analysis",
    brand: review.brand || "Scanned product",
    nutrition,
    nutritionConfidence: review.nutritionEstimated ? "Estimated" : "Manual Review",
    confidence: "Manual Review",
    allergens: review.allergensText,
    ingredientSourceField: hasDedicatedIngredientField ? "user-entered ingredients" : "raw-label-ocr",
    requireIngredientSection: !hasDedicatedIngredientField,
    providedFields: {
      category: review.category,
      ingredientsText: review.category === "textile" ? "" : review.ingredientsText || "",
      materialsText: review.category === "textile" ? review.materialsText || review.ingredientsText || "" : "",
      allergensText: review.allergensText || "",
      warningsText: review.warningsText || "",
      activeIngredient: review.activeIngredient || "",
      purpose: review.purpose || "",
      careText: review.careText || "",
      nutrition,
      userPhoto: capturedPhoto || ""
    }
  });

  if (review.category === "medicine") {
    return {
      ...report,
      activeIngredient: review.activeIngredient || report.activeIngredient,
      purpose: review.purpose || report.purpose,
      warnings: splitLabelText(review.warningsText) || report.warnings
    };
  }

  if (review.category === "household" && review.warningsText) {
    return {
      ...report,
      safetyNotes: splitLabelText(review.warningsText) || report.safetyNotes,
      concerns: [...new Set([...(report.concerns || []), "Review caution notes"])]
    };
  }

  if (review.category === "beauty" && review.warningsText) {
    return {
      ...report,
      concerns: [...new Set([...(report.concerns || []), review.warningsText.split(/[;\n]/)[0].trim()].filter(Boolean))]
    };
  }

  if (review.category === "textile" && review.careText) {
    return {
      ...report,
      treatmentNotes: review.careText
    };
  }

  return report;
}

function normalizeNutrition(nutrition = {}) {
  const nonNegativeNumber = (value) => {
    const number = toNumber(value);
    return hasNumber(number) && number >= 0 ? number : null;
  };
  return {
    servingSize: cleanText(nutrition.servingSize),
    basis: ["serving", "100g", "100ml"].includes(nutrition.basis) ? nutrition.basis : "serving",
    calories: nonNegativeNumber(nutrition.calories),
    protein: nonNegativeNumber(nutrition.protein),
    carbs: nonNegativeNumber(nutrition.carbs),
    fat: nonNegativeNumber(nutrition.fat),
    sugar: nonNegativeNumber(nutrition.sugar),
    sodium: nonNegativeNumber(nutrition.sodium),
    saturatedFat: nonNegativeNumber(nutrition.saturatedFat),
    fiber: nonNegativeNumber(nutrition.fiber)
  };
}

const PLATE_STORAGE_KEY = "ziya-todays-plate-v1";
const PLATE_NUTRIENTS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];
const PLATE_DEFAULT_GOALS = Object.freeze({
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 70,
  fiber: 28,
  sugar: 50,
  sodium: 2300
});
const PLATE_NUTRIENT_META = Object.freeze({
  calories: { label: "Calories", unit: "kcal", tone: "calories", goalWord: "goal" },
  protein: { label: "Protein", unit: "g", tone: "protein", goalWord: "goal" },
  carbs: { label: "Carbohydrates", shortLabel: "Carbs", unit: "g", tone: "carbs", goalWord: "goal" },
  fat: { label: "Fat", unit: "g", tone: "fat", goalWord: "goal" },
  fiber: { label: "Fiber", unit: "g", tone: "fiber", goalWord: "goal" },
  sugar: { label: "Sugar", unit: "g", tone: "sugar", goalWord: "limit" },
  sodium: { label: "Sodium", unit: "mg", tone: "sodium", goalWord: "limit" }
});

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromLocalKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, Math.max(0, month - 1), day || 1, 12);
}

function shiftLocalDateKey(key, days) {
  const date = dateFromLocalKey(key);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

function formatPlateDate(key) {
  const todayKey = getLocalDateKey();
  if (key === todayKey) return "Today";
  return dateFromLocalKey(key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function sanitizePlateGoals(input) {
  if (!input || typeof input !== "object") return null;
  const next = {};
  for (const nutrient of PLATE_NUTRIENTS) {
    const value = toNumber(input[nutrient]);
    if (!hasNumber(value) || value <= 0) return null;
    next[nutrient] = value;
  }
  return next;
}

function sanitizePlateEntry(entry) {
  if (!entry || typeof entry !== "object" || !entry.id || !entry.product?.name) return null;
  const nutritionBase = normalizeNutrition(entry.nutritionBase || {});
  const amount = toNumber(entry.amount);
  if (!hasNumber(amount) || amount <= 0) return null;
  return {
    ...entry,
    amount,
    mode: ["servings", "grams", "milliliters"].includes(entry.mode) ? entry.mode : "servings",
    nutritionBase,
    contribution: normalizeNutrition(entry.contribution || {})
  };
}

function loadPlateState() {
  const empty = { goals: null, days: {}, updatedAt: null };
  if (typeof window === "undefined") return empty;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PLATE_STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return empty;
    const days = {};
    Object.entries(parsed.days || {}).forEach(([key, day]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !day || typeof day !== "object") return;
      days[key] = {
        goalsSnapshot: sanitizePlateGoals(day.goalsSnapshot),
        entries: asArray(day.entries).map(sanitizePlateEntry).filter(Boolean)
      };
    });
    return {
      goals: sanitizePlateGoals(parsed.goals),
      days,
      updatedAt: Number.isFinite(Date.parse(parsed.updatedAt)) ? parsed.updatedAt : null
    };
  } catch {
    return empty;
  }
}

function getNutritionLogProfile(product) {
  if (product?.category !== "food" || !hasCoreFoodNutrition(product.nutrition || {})) return null;
  const basis = product.nutrition?.basis || "serving";
  const servingSize = cleanText(product.nutrition?.servingSize);
  if (basis === "100g") {
    const grams = parseServingMeasure(servingSize, "g");
    return { mode: "grams", amount: grams || 100, step: 10, unit: "g", label: grams ? servingSize : "Per 100 g" };
  }
  if (basis === "100ml") {
    const milliliters = parseServingMeasure(servingSize, "ml");
    return { mode: "milliliters", amount: milliliters || 100, step: 10, unit: "ml", label: milliliters ? servingSize : "Per 100 ml" };
  }
  if (!servingSize || /^(?:not available|missing|unknown)$/i.test(servingSize)) return null;
  return { mode: "servings", amount: 1, step: 0.5, unit: "serving", label: servingSize };
}

function parseServingMeasure(value, unit) {
  if (!value) return null;
  const pattern = unit === "ml" ? /(\d+(?:\.\d+)?)\s*ml\b/i : /(\d+(?:\.\d+)?)\s*g\b/i;
  const amount = toNumber(String(value).match(pattern)?.[1]);
  return hasNumber(amount) && amount > 0 ? amount : null;
}

function normalizeNutritionForServing(product, amount, mode) {
  const nutrition = normalizeNutrition(product.nutrition || {});
  const numericAmount = toNumber(amount);
  if (!hasNumber(numericAmount) || numericAmount <= 0) return null;
  const scale = mode === "servings" ? numericAmount : numericAmount / 100;
  const result = { servingSize: nutrition.servingSize, basis: nutrition.basis };
  PLATE_NUTRIENTS.forEach((nutrient) => {
    result[nutrient] = hasNumber(nutrition[nutrient]) ? nutrition[nutrient] * scale : null;
  });
  result.saturatedFat = hasNumber(nutrition.saturatedFat) ? nutrition.saturatedFat * scale : null;
  return result;
}

function calculateDailyTotals(entries = []) {
  const totals = {};
  PLATE_NUTRIENTS.forEach((nutrient) => {
    const known = entries.filter((entry) => hasNumber(entry.contribution?.[nutrient]));
    totals[nutrient] = {
      total: known.reduce((sum, entry) => sum + entry.contribution[nutrient], 0),
      knownCount: known.length,
      missingCount: entries.length - known.length
    };
  });
  return totals;
}

function formatNutrientValue(value, nutrient) {
  if (!hasNumber(value)) return "Missing";
  const digits = Number.isInteger(value) ? 0 : nutrient === "calories" || nutrient === "sodium" ? 1 : 2;
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function createPlateEntry(product, amount, mode) {
  const contribution = normalizeNutritionForServing(product, amount, mode);
  if (!contribution) return null;
  return {
    id: `plate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: product.id,
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      image: product.image,
      userPhoto: product.userPhoto?.length < 250000 ? product.userPhoto : undefined
    },
    nutritionBase: normalizeNutrition(product.nutrition),
    amount,
    mode,
    contribution,
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function updatePlateEntryInState(state, dateKey, entryId, amount) {
  const day = state.days[dateKey];
  const numericAmount = toNumber(amount);
  if (!day || !hasNumber(numericAmount) || numericAmount <= 0) return state;
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: {
        ...day,
        entries: day.entries.map((entry) => {
          if (entry.id !== entryId) return entry;
          const product = { ...entry.product, nutrition: entry.nutritionBase };
          const contribution = normalizeNutritionForServing(product, numericAmount, entry.mode);
          return contribution ? { ...entry, amount: numericAmount, contribution, updatedAt: new Date().toISOString() } : entry;
        })
      }
    }
  };
}

function removePlateEntryFromState(state, dateKey, entryId) {
  const day = state.days[dateKey];
  if (!day) return state;
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: { ...day, entries: day.entries.filter((entry) => entry.id !== entryId) }
    }
  };
}

function splitLabelText(text) {
  if (!text) return null;
  return text
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const SYNC_CONSENT_PREFIX = "ziya-sync-consent-v1:";

function getSyncConsent(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${SYNC_CONSENT_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

function setSyncConsent(userId, value) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${SYNC_CONSENT_PREFIX}${userId}`, value);
  } catch {
    // Consent remains session-only when storage is unavailable.
  }
}

function loadPersistedProductSnapshots() {
  const snapshots = [
    ...loadOverrideProductSnapshots(),
    ...loadProductHistory().map((item) => item.productSnapshot).filter(Boolean)
  ];
  return [...new Map(snapshots.map((product) => [product.id, product])).values()];
}

function App() {
  const [activeTab, setActiveTab] = useState("scan");
  const [selectedProductId, setSelectedProductId] = useState("pop-secret");
  const [dynamicProducts, setDynamicProducts] = useState(loadPersistedProductSnapshots);
  const [scanHistory, setScanHistory] = useState(loadProductHistory);
  const [barcode, setBarcode] = useState("");
  const [barcodeMiss, setBarcodeMiss] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [query, setQuery] = useState("");
  const [realSearchResults, setRealSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [searchMeta, setSearchMeta] = useState({ regionId: "global", hasStrongRegionMatch: false, fallbackAvailable: false, fromCache: false });
  const [manualText, setManualText] = useState("Palm oil, salt, artificial flavor, annatto color");
  const [manualCategory, setManualCategory] = useState("food");
  const [capturedPhoto, setCapturedPhoto] = useState("");
  const [ocrReview, setOcrReview] = useState(null);
  const [labelCompletionReview, setLabelCompletionReview] = useState(null);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [plateState, setPlateState] = useState(loadPlateState);
  const [todayKey, setTodayKey] = useState(getLocalDateKey);
  const [servingProduct, setServingProduct] = useState(null);
  const [plateEntryTarget, setPlateEntryTarget] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [messageTone, setMessageTone] = useState("Polite");
  const [platform, setPlatform] = useState("Instagram");
  const [copied, setCopied] = useState(false);
  const [personalProfile, setPersonalProfile] = useState(loadLocalProfile);
  const [authSession, setAuthSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authMessage, setAuthMessage] = useState("");
  const [syncStatus, setSyncStatus] = useState("Local only");
  const [syncConsentPending, setSyncConsentPending] = useState(false);
  const syncRunUserRef = useRef("");
  const searchRequestRef = useRef(0);

  const productIndex = useMemo(() => {
    const map = new Map(products.map((product) => [product.id, product]));
    dynamicProducts.forEach((product) => map.set(product.id, product));
    return map;
  }, [dynamicProducts]);

  const selectedProduct = productIndex.get(selectedProductId) || products[0];
  const realProducts = useMemo(
    () => dynamicProducts.filter((product) => ["food-provider", "barcode-provider"].includes(product.sourceType)),
    [dynamicProducts]
  );

  useEffect(() => {
    document.body.classList.toggle("scan-lock", activeTab === "scan");
    return () => document.body.classList.remove("scan-lock");
  }, [activeTab]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PLATE_STORAGE_KEY, JSON.stringify(plateState));
    } catch {
      // Today’s Plate stays usable for the session when storage is unavailable.
    }
  }, [plateState]);

  useEffect(() => {
    saveProductHistory(scanHistory);
  }, [scanHistory]);

  useEffect(() => {
    saveLocalProfile(personalProfile);
  }, [personalProfile]);

  useEffect(() => {
    searchRequestRef.current += 1;
    setRealSearchResults([]);
    setSearchMeta({ regionId: personalProfile.productRegion, hasStrongRegionMatch: false, fallbackAvailable: false, fromCache: false });
    setSearchStatus((current) => current === "idle" ? "idle" : "ready");
  }, [personalProfile.productRegion]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setSyncStatus("Local only");
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        setAuthSession(data?.session || null);
        setAuthReady(true);
        if (error) setAuthMessage("Sign-in status is unavailable right now.");
      })
      .catch(() => {
        if (!mounted) return;
        setAuthReady(true);
        setAuthMessage("Sign-in status is unavailable right now. Local mode is still ready.");
      });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setAuthSession(session || null);
      setAuthReady(true);
      if (event === "SIGNED_OUT") {
        syncRunUserRef.current = "";
        setSyncConsentPending(false);
        setSyncStatus("Local only");
      }
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = authSession?.user?.id;
    if (!userId) return;
    const consent = getSyncConsent(userId);
    if (consent === "accepted" && syncRunUserRef.current !== userId) {
      syncRunUserRef.current = userId;
      void performCloudSync();
    } else if (!consent) {
      setSyncConsentPending(true);
      setSyncStatus("Sync paused");
    } else {
      setSyncStatus("Sync paused");
    }
  }, [authSession?.user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextKey = getLocalDateKey();
      setTodayKey((current) => current === nextKey ? current : nextKey);
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const dailyLog = plateState.days[todayKey]?.entries || [];
  const plateTotals = calculateDailyTotals(dailyLog);
  const dailyTotals = Object.fromEntries(PLATE_NUTRIENTS.map((nutrient) => [nutrient, plateTotals[nutrient].total]));

  function openProduct(productId) {
    setSelectedProductId(productId);
    setActiveTab("report");
    setExpandedSection(null);
    setActionOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function upsertDynamicProduct(product) {
    setDynamicProducts((items) => [
      product,
      ...items.filter((item) => item.id !== product.id)
    ]);
  }

  function upsertDynamicProducts(nextProducts) {
    setDynamicProducts((items) => {
      const nextMap = new Map(items.map((item) => [item.id, item]));
      nextProducts.forEach((product) => nextMap.set(product.id, product));
      return Array.from(nextMap.values()).sort((a, b) => {
        const aReal = ["food-provider", "barcode-provider"].includes(a.sourceType) ? 0 : 1;
        const bReal = ["food-provider", "barcode-provider"].includes(b.sourceType) ? 0 : 1;
        return aReal - bReal;
      });
    });
  }

  function updatePersonalProfile(update) {
    setPersonalProfile((current) => {
      const next = typeof update === "function" ? update(current) : { ...current, ...update };
      return touchProfile(next);
    });
    if (authSession?.user) setSyncStatus("Sync paused");
  }

  async function requestMagicLink(email) {
    const normalizedEmail = cleanText(email).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setAuthMessage("Enter a valid email address.");
      return false;
    }
    setAuthMessage("Sending sign-in link…");
    let error;
    try {
      ({ error } = await sendMagicLink(normalizedEmail));
    } catch (requestError) {
      error = requestError;
    }
    if (error) {
      setAuthMessage("We couldn’t send the sign-in link. Try again shortly.");
      return false;
    }
    setAuthMessage("Check your email for a secure sign-in link.");
    return true;
  }

  async function requestGoogleSignIn() {
    setAuthMessage("Opening Google sign-in…");
    let error;
    try {
      ({ error } = await signInWithGoogle());
    } catch (requestError) {
      error = requestError;
    }
    if (error) setAuthMessage("Google sign-in is unavailable right now.");
  }

  async function signOutAccount() {
    let error;
    try {
      ({ error } = await signOutOfSupabase());
    } catch (requestError) {
      error = requestError;
    }
    if (error) {
      setAuthMessage("Sign-out failed. Try again.");
      return;
    }
    setAuthMessage("Signed out. Your local data is still here.");
  }

  async function performCloudSync() {
    if (!supabase || !authSession?.user) {
      setSyncStatus("Local only");
      return false;
    }
    setSyncStatus("Syncing");
    setAuthMessage("");
    try {
      const result = await syncZiyaData({
        client: supabase,
        user: authSession.user,
        profile: personalProfile,
        plateState,
        history: scanHistory,
        productIndex
      });
      setPersonalProfile(result.profile);
      setPlateState(result.plateState);
      setScanHistory(result.history);
      upsertDynamicProducts(result.products);
      setSyncStatus("Synced");
      setSyncConsentPending(false);
      setSyncConsent(authSession.user.id, "accepted");
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Ziya sync failed", error);
      setSyncStatus("Sync failed");
      setAuthMessage("Cloud sync is unavailable. Your local data is unchanged.");
      return false;
    }
  }

  function pauseCloudSync() {
    if (authSession?.user?.id) setSyncConsent(authSession.user.id, "declined");
    setSyncConsentPending(false);
    setSyncStatus("Sync paused");
  }

  function recordHistoryProduct(product) {
    if (authSession?.user) setSyncStatus("Sync paused");
    setScanHistory((items) => {
      if (items[0]?.productId === product.id && items[0]?.date === "Today, just now") return items;
      const scannedAt = new Date().toISOString();
      return [
        { id: `h-${product.id}-${Date.now()}`, productId: product.id, date: "Today, just now", scannedAt, productSnapshot: product },
        ...items.filter((item) => item.productId !== product.id)
      ];
    });
  }

  function updateSearchQuery(value) {
    setQuery(value);
    if (!value.trim()) {
      setRealSearchResults([]);
      setLastSearchTerm("");
      setSearchStatus("idle");
      setSearchMeta({ regionId: personalProfile.productRegion, hasStrongRegionMatch: false, fallbackAvailable: false, fromCache: false });
      return;
    }
    setSearchStatus("ready");
  }

  async function runProductSearch(nextQuery = query, { globalFallback = false } = {}) {
    const searchTerm = cleanText(nextQuery);
    if (searchTerm.length < 2) {
      setRealSearchResults([]);
      setLastSearchTerm("");
      setSearchStatus("idle");
      return;
    }
    setSearchStatus("searching");
    setLastSearchTerm(searchTerm);
    const requestId = ++searchRequestRef.current;
    const result = await searchFoodProductsByName(searchTerm, {
      regionId: personalProfile.productRegion,
      preferredLanguage: personalProfile.preferredLanguage,
      globalFallback
    });
    if (requestId !== searchRequestRef.current) return;
    setRealSearchResults(result.products);
    setSearchMeta({
      regionId: result.regionId,
      hasStrongRegionMatch: result.hasStrongRegionMatch,
      fallbackAvailable: result.fallbackAvailable,
      fromCache: result.fromCache
    });
    if (result.products.length) upsertDynamicProducts(result.products);
    setSearchStatus("done");
  }

  function lookupBarcode(nextBarcode) {
    const lookupValue = normalizeBarcode(nextBarcode ?? barcode);
    if (!lookupValue) {
      setBarcodeMiss(true);
      return;
    }
    setBarcode(lookupValue);
    setIsScanning(true);
    setBarcodeMiss(false);
    window.setTimeout(async () => {
      const result = await lookupProductByBarcode(lookupValue);
      setIsScanning(false);
      if (result.status === "found" && result.product) {
        upsertDynamicProduct(result.product);
        recordHistoryProduct(result.product);
        setBarcodeMiss(false);
        openProduct(result.product.id);
        return;
      }
      setBarcodeMiss(true);
    }, 420);
  }

  function analyzeManual() {
    const report = createManualReport({ text: manualText, category: manualCategory, userPhoto: capturedPhoto });
    upsertDynamicProduct(report);
    recordHistoryProduct(report);
    setSelectedProductId(report.id);
    setActiveTab("report");
    setExpandedSection(null);
    setBarcodeMiss(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function simulateOcr(mode) {
    const category =
      mode === "materials"
        ? "textile"
        : mode === "nutrition"
          ? "food"
          : manualCategory === "not-sure"
            ? "food"
            : manualCategory;
    setOcrReview(createOcrDraft(category, mode));
    setTimeout(() => document.getElementById("ocr-review")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  function applyOcrReview() {
    if (!ocrReview) return;
    const report = createReportFromOcr(ocrReview, capturedPhoto);
    upsertDynamicProduct(report);
    recordHistoryProduct(report);
    setSelectedProductId(report.id);
    setActiveTab("report");
    setExpandedSection(null);
    setBarcodeMiss(false);
    setOcrReview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePhotoSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCapturedPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function addToDailyLog(product) {
    if (!getNutritionLogProfile(product)) return;
    setServingProduct(product);
  }

  function openLabelCompletion(mode = "label") {
    const category = selectedProduct.category === "unknown" ? "unknown" : selectedProduct.category;
    const draftMode = mode === "paste"
      ? "ingredients"
      : category === "food"
        ? "nutrition"
        : category === "textile"
          ? "materials"
          : "ingredients";
    setLabelCompletionReview(createBlankLabelDraft(category, draftMode, selectedProduct));
  }

  function applyLabelCompletion() {
    if (!labelCompletionReview) return;
    const completed = createReportFromOcr(
      labelCompletionReview,
      labelCompletionReview.userPhoto || selectedProduct.userPhoto || ""
    );
    const report = mergeProductLabelCompletion(selectedProduct, completed);
    upsertDynamicProduct(report);
    recordHistoryProduct(report);
    setSelectedProductId(report.id);
    setExpandedSection(null);
    setLabelCompletionReview(null);
  }

  function addCompletionPhoto(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLabelCompletionReview((current) => current ? { ...current, userPhoto: String(reader.result || "") } : current);
    };
    reader.readAsDataURL(file);
  }

  function savePlateGoals(goals) {
    const validated = sanitizePlateGoals(goals);
    if (!validated) return false;
    const key = getLocalDateKey();
    const updatedAt = new Date().toISOString();
    setPlateState((current) => ({
      ...current,
      goals: validated,
      days: {
        ...current.days,
        [key]: {
          goalsSnapshot: validated,
          entries: current.days[key]?.entries || []
        }
      },
      updatedAt
    }));
    updatePersonalProfile((current) => ({ ...current, todayPlateGoals: validated }));
    return true;
  }

  function addPlateServing(product, amount, mode) {
    const entry = createPlateEntry(product, amount, mode);
    if (!entry) return false;
    if (authSession?.user) setSyncStatus("Sync paused");
    const key = getLocalDateKey();
    setPlateState((current) => ({
      ...current,
      days: {
        ...current.days,
        [key]: {
          goalsSnapshot: current.days[key]?.goalsSnapshot || current.goals || { ...PLATE_DEFAULT_GOALS },
          entries: [entry, ...(current.days[key]?.entries || [])]
        }
      },
      updatedAt: new Date().toISOString()
    }));
    setServingProduct(null);
    return true;
  }

  function updatePlateEntry(dateKey, entryId, amount) {
    if (authSession?.user) setSyncStatus("Sync paused");
    setPlateState((current) => ({
      ...updatePlateEntryInState(current, dateKey, entryId, amount),
      updatedAt: new Date().toISOString()
    }));
  }

  function removePlateEntry(dateKey, entryId) {
    if (authSession?.user) setSyncStatus("Sync paused");
    setPlateState((current) => ({
      ...removePlateEntryFromState(current, dateKey, entryId),
      updatedAt: new Date().toISOString()
    }));
    setPlateEntryTarget(null);
  }

  function renderActiveView() {
    if (activeTab === "history") {
      return (
        <HistoryScreen
          history={scanHistory}
          productIndex={productIndex}
          onOpenProduct={openProduct}
          plateState={plateState}
          onSaveGoals={savePlateGoals}
          onOpenPlateEntry={setPlateEntryTarget}
        />
      );
    }
    if (activeTab === "search") {
      return (
        <SearchScreen
          query={query}
          setQuery={updateSearchQuery}
          results={realSearchResults}
          status={searchStatus}
          lastSearchTerm={lastSearchTerm}
          searchMeta={searchMeta}
          selectedRegionId={personalProfile.productRegion}
          onSearch={runProductSearch}
          onGlobalFallback={() => runProductSearch(query, { globalFallback: true })}
          onOpenProduct={openProduct}
        />
      );
    }
    if (activeTab === "recs") {
      return <RecommendationsScreen productIndex={productIndex} history={scanHistory} onOpenProduct={openProduct} />;
    }
    if (activeTab === "top") {
      return <TopScreen productIndex={productIndex} realProducts={realProducts} onOpenProduct={openProduct} onOpenProfile={() => setActiveTab("profile")} />;
    }
    if (activeTab === "profile") {
      return (
        <ProfileScreen
          profile={personalProfile}
          onChange={updatePersonalProfile}
          onBack={() => setActiveTab("top")}
          dailyTotals={dailyTotals}
          dailyLog={dailyLog}
          goals={plateState.goals}
          onSaveGoals={savePlateGoals}
          account={{
            configured: isSupabaseConfigured,
            ready: authReady,
            session: authSession,
            message: authMessage,
            syncStatus,
            syncConsentPending,
            onMagicLink: requestMagicLink,
            onGoogle: requestGoogleSignIn,
            onSignOut: signOutAccount,
            onSync: performCloudSync,
            onPauseSync: pauseCloudSync
          }}
        />
      );
    }
    if (activeTab === "report") {
      return (
        <ReportScreen
          product={selectedProduct}
          productIndex={productIndex}
          expandedSection={expandedSection}
          setExpandedSection={setExpandedSection}
          onIngredientClick={setActiveIngredient}
          onOpenProduct={openProduct}
          onAddToDailyLog={addToDailyLog}
          dailyTotals={dailyTotals}
          dailyLog={dailyLog}
          actionOpen={actionOpen}
          setActionOpen={setActionOpen}
          platform={platform}
          setPlatform={setPlatform}
          messageTone={messageTone}
          setMessageTone={setMessageTone}
          copied={copied}
          setCopied={setCopied}
          onCompleteLabel={openLabelCompletion}
          personalProfile={personalProfile}
        />
      );
    }
    return (
      <ScanScreen
        barcode={barcode}
        setBarcode={setBarcode}
        barcodeMiss={barcodeMiss}
        isScanning={isScanning}
        lookupBarcode={lookupBarcode}
        manualText={manualText}
        setManualText={setManualText}
        manualCategory={manualCategory}
        setManualCategory={setManualCategory}
        analyzeManual={analyzeManual}
        capturedPhoto={capturedPhoto}
        onPhotoSelected={handlePhotoSelected}
        ocrReview={ocrReview}
        setOcrReview={setOcrReview}
        simulateOcr={simulateOcr}
        applyOcrReview={applyOcrReview}
        onOpenProduct={openProduct}
        goSearch={() => setActiveTab("search")}
        clearBarcodeMiss={() => setBarcodeMiss(false)}
        productIndex={productIndex}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
        onIngredientClick={setActiveIngredient}
        onAddToDailyLog={addToDailyLog}
        dailyTotals={dailyTotals}
        dailyLog={dailyLog}
        actionOpen={actionOpen}
        setActionOpen={setActionOpen}
        platform={platform}
        setPlatform={setPlatform}
        messageTone={messageTone}
        setMessageTone={setMessageTone}
        copied={copied}
        setCopied={setCopied}
        setManualProduct={upsertDynamicProduct}
        onRecordHistory={recordHistoryProduct}
        personalProfile={personalProfile}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className={`app-frame ${activeTab === "scan" ? "scan-frame-active" : ""}`}>
        <main className={`screen ${activeTab === "scan" ? "scanner-screen-frame" : ""}`}>{renderActiveView()}</main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeIngredient && (
          <IngredientSheet ingredient={activeIngredient} onClose={() => setActiveIngredient(null)} />
        )}
        {labelCompletionReview && (
          <LabelCompletionSheet
            review={labelCompletionReview}
            setReview={setLabelCompletionReview}
            onApply={applyLabelCompletion}
            onPhotoSelected={addCompletionPhoto}
            onClose={() => setLabelCompletionReview(null)}
          />
        )}
        {servingProduct && (
          <ServingSheet
            key={servingProduct.id}
            product={servingProduct}
            onClose={() => setServingProduct(null)}
            onAdd={addPlateServing}
          />
        )}
        {plateEntryTarget && (
          <FoodContributionSheet
            key={`${plateEntryTarget.dateKey}-${plateEntryTarget.entryId}`}
            target={plateEntryTarget}
            plateState={plateState}
            onClose={() => setPlateEntryTarget(null)}
            onUpdate={updatePlateEntry}
            onRemove={removePlateEntry}
          />
        )}
      </div>
    </div>
  );
}

function ScanScreen({
  barcode,
  setBarcode,
  barcodeMiss,
  manualText,
  setManualText,
  manualCategory,
  setManualCategory,
  capturedPhoto,
  onPhotoSelected,
  ocrReview,
  setOcrReview,
  clearBarcodeMiss,
  productIndex,
  expandedSection,
  setExpandedSection,
  onIngredientClick,
  onOpenProduct,
  onAddToDailyLog,
  dailyTotals,
  dailyLog,
  actionOpen,
  setActionOpen,
  platform,
  setPlatform,
  messageTone,
  setMessageTone,
  copied,
  setCopied,
  setManualProduct,
  onRecordHistory,
  personalProfile
}) {
  const [cameraStatus, setCameraStatus] = useState("requesting");
  const [cameraMessage, setCameraMessage] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [sheetMode, setSheetMode] = useState(null);
  const [sheetState, setSheetState] = useState("peek");
  const [sheetProduct, setSheetProduct] = useState(null);
  const [activeFallback, setActiveFallback] = useState(null);
  const [labelPhoto, setLabelPhoto] = useState("");
  const [cameraEngine, setCameraEngine] = useState("none");
  const [barcodePhotoLoading, setBarcodePhotoLoading] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsVersion, setDiagnosticsVersion] = useState(0);
  const [debugCropCaptures, setDebugCropCaptures] = useState([]);
  const scannerLiveRef = useRef(null);
  const scanFrameRef = useRef(null);
  const videoRef = useRef(null);
  const html5ContainerRef = useRef(null);
  const streamRef = useRef(null);
  const html5ScannerRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const zxingCanvasRef = useRef(null);
  const zxingContextRef = useRef(null);
  const zxingVariantCanvasesRef = useRef(new Map());
  const zxingFrameIndexRef = useRef(0);
  const zxingTimerRef = useRef(null);
  const zxingFallbackTimerRef = useRef(null);
  const cameraTimerRef = useRef(null);
  const cameraRequestRef = useRef(0);
  const cameraReadyAtRef = useRef(0);
  const recentBarcodesRef = useRef(new Map());
  const activeBarcodeRef = useRef("");
  const lookupInFlightRef = useRef(false);
  const currentLookupBarcodeRef = useRef("");
  const queuedBarcodeRef = useRef(null);
  const pendingLookupResultRef = useRef(null);
  const sheetStateRef = useRef("peek");
  const sheetModeRef = useRef(null);
  const lastDiagnosticRenderRef = useRef(0);
  const lastDecoderCropSignatureRef = useRef("");
  const mountedRef = useRef(true);
  const dragStartY = useRef(null);
  const debugEnabled = useMemo(
    () => new URLSearchParams(window.location.search).get("scannerDebug") === "1",
    []
  );
  const diagnosticsRef = useRef({
    userAgent: navigator.userAgent,
    secureContext: window.isSecureContext,
    mediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
    streamStarted: false,
    cameraStreamStatus: "idle",
    video: { readyState: 0, width: 0, height: 0, paused: true },
    trackSettings: null,
    cameraCapabilities: {
      focusModes: [],
      exposureModes: [],
      whiteBalanceModes: [],
      zoom: null,
      torch: false
    },
    optionalConstraintResults: {},
    cameraConstraintAttempts: [],
    barcodeDetector: "BarcodeDetector" in window,
    barcodeDetectorFormats: [],
    html5QrcodeLoaded: false,
    zxingLoaded: false,
    activeDecoder: "none",
    decodedFrameCount: 0,
    frames: { html5Qrcode: 0, zxing: 0 },
    decoderAttempts: { html5Qrcode: 0, zxingOriginal: 0, zxingEnhanced: 0 },
    enhancedDecoderAttempts: 0,
    successfulDecoder: "",
    successfulImageVariant: "",
    cameraReadyAt: null,
    timeToSuccessfulDecodeMs: null,
    queuedBarcode: "",
    visibleScanFrame: null,
    decoderCrop: null,
    decoderCrops: { html5Qrcode: null, zxing: null },
    capturedDecoderFrames: [],
    lastDecodedValue: "",
    lastError: "",
    lastScannerError: ""
  });

  const sheetProductIndex = useMemo(() => {
    const map = new Map(productIndex);
    if (sheetProduct) map.set(sheetProduct.id, sheetProduct);
    return map;
  }, [productIndex, sheetProduct]);

  function updateDiagnostics(patch, eventName) {
    const normalizedPatch = patch.lastError === undefined
      ? patch
      : { ...patch, lastScannerError: patch.lastError };
    diagnosticsRef.current = {
      ...diagnosticsRef.current,
      ...normalizedPatch
    };
    window.__ZIYA_SCANNER_DIAGNOSTICS__ = diagnosticsRef.current;
    if (debugEnabled && mountedRef.current) {
      if (eventName) console.debug(`[Ziya scanner] ${eventName}`, diagnosticsRef.current);
      setDiagnosticsVersion((value) => value + 1);
    }
  }

  function recordDecoderFrame(engine, { enhanced = false, variant = "original" } = {}) {
    const frames = diagnosticsRef.current.frames || (diagnosticsRef.current.frames = { html5Qrcode: 0, zxing: 0 });
    const decoderAttempts = diagnosticsRef.current.decoderAttempts || (diagnosticsRef.current.decoderAttempts = {
      html5Qrcode: 0,
      zxingOriginal: 0,
      zxingEnhanced: 0
    });
    if (!enhanced) {
      frames[engine] = (frames[engine] || 0) + 1;
      diagnosticsRef.current.decodedFrameCount += 1;
    }
    const attemptKey = engine === "html5Qrcode" ? "html5Qrcode" : enhanced ? "zxingEnhanced" : "zxingOriginal";
    decoderAttempts[attemptKey] = (decoderAttempts[attemptKey] || 0) + 1;
    if (enhanced) diagnosticsRef.current.enhancedDecoderAttempts = (diagnosticsRef.current.enhancedDecoderAttempts || 0) + 1;
    diagnosticsRef.current.lastAttempt = { engine, variant, enhanced };
    diagnosticsRef.current.visibleScanFrame = getVisibleScanFrameRect();
    window.__ZIYA_SCANNER_DIAGNOSTICS__ = diagnosticsRef.current;
    if (debugEnabled && mountedRef.current && Date.now() - lastDiagnosticRenderRef.current > 1000) {
      lastDiagnosticRenderRef.current = Date.now();
      setDiagnosticsVersion((value) => value + 1);
    }
  }

  function getTrackSettings(track) {
    const settings = track?.getSettings?.() || {};
    return {
      deviceId: settings.deviceId || null,
      groupId: settings.groupId || null,
      width: settings.width || null,
      height: settings.height || null,
      frameRate: settings.frameRate || null,
      aspectRatio: settings.aspectRatio || null,
      facingMode: settings.facingMode || null,
      resizeMode: settings.resizeMode || null
    };
  }

  function getTrackCapabilitiesSummary(track) {
    const capabilities = track?.getCapabilities?.() || {};
    const range = (value) => value && typeof value === "object"
      ? { min: value.min ?? null, max: value.max ?? null, step: value.step ?? null }
      : null;
    return {
      focusModes: capabilities.focusMode ? Array.from(capabilities.focusMode) : [],
      exposureModes: capabilities.exposureMode ? Array.from(capabilities.exposureMode) : [],
      whiteBalanceModes: capabilities.whiteBalanceMode ? Array.from(capabilities.whiteBalanceMode) : [],
      zoom: range(capabilities.zoom),
      torch: Boolean(capabilities.torch)
    };
  }

  async function applyOptionalCameraEnhancements(track) {
    if (!track?.applyConstraints) return;
    const capabilities = track.getCapabilities?.() || {};
    const summary = getTrackCapabilitiesSummary(track);
    updateDiagnostics({ cameraCapabilities: summary });
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    if (track.readyState !== "live") return;

    const optionalConstraints = [];
    if (summary.focusModes.includes("continuous")) optionalConstraints.push(["continuousFocus", { focusMode: "continuous" }]);
    if (summary.exposureModes.includes("continuous")) optionalConstraints.push(["continuousExposure", { exposureMode: "continuous" }]);
    if (summary.whiteBalanceModes.includes("continuous")) optionalConstraints.push(["continuousWhiteBalance", { whiteBalanceMode: "continuous" }]);
    if (summary.zoom) {
      const currentZoom = track.getSettings?.().zoom ?? summary.zoom.min ?? 1;
      const conservativeZoom = Math.min(summary.zoom.max ?? currentZoom, Math.max(summary.zoom.min ?? 1, 1.1));
      if (Number.isFinite(conservativeZoom) && conservativeZoom > currentZoom + 0.01) {
        optionalConstraints.push(["conservativeZoom", { zoom: conservativeZoom }]);
      }
    }

    const results = {};
    for (const [name, constraint] of optionalConstraints) {
      try {
        await track.applyConstraints({ advanced: [constraint] });
        results[name] = "applied";
      } catch (error) {
        results[name] = `rejected: ${error?.name || "constraint error"}`;
      }
    }
    updateDiagnostics({
      optionalConstraintResults: results,
      trackSettings: getTrackSettings(track),
      cameraCapabilities: getTrackCapabilitiesSummary(track)
    }, "optional camera tuning complete");
  }

  function roundRect(rect) {
    if (!rect) return null;
    return Object.fromEntries(
      Object.entries(rect).map(([key, value]) => [key, typeof value === "number" ? Math.round(value * 100) / 100 : value])
    );
  }

  function getVisibleScanFrameRect() {
    const scanner = scannerLiveRef.current;
    const frame = scanFrameRef.current;
    if (!scanner || !frame) return null;
    const scannerRect = scanner.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    return roundRect({
      x: frameRect.left - scannerRect.left,
      y: frameRect.top - scannerRect.top,
      width: frameRect.width,
      height: frameRect.height,
      viewportWidth: scannerRect.width,
      viewportHeight: scannerRect.height
    });
  }

  function mapVisibleFrameToSurface(surfaceWidth, surfaceHeight) {
    const frame = getVisibleScanFrameRect();
    if (!frame || !surfaceWidth || !surfaceHeight) return null;
    const scale = Math.max(frame.viewportWidth / surfaceWidth, frame.viewportHeight / surfaceHeight);
    const renderedWidth = surfaceWidth * scale;
    const renderedHeight = surfaceHeight * scale;
    const offsetX = (frame.viewportWidth - renderedWidth) / 2;
    const offsetY = (frame.viewportHeight - renderedHeight) / 2;
    const x = Math.max(0, Math.min(surfaceWidth, (frame.x - offsetX) / scale));
    const y = Math.max(0, Math.min(surfaceHeight, (frame.y - offsetY) / scale));
    const width = Math.max(1, Math.min(surfaceWidth - x, frame.width / scale));
    const height = Math.max(1, Math.min(surfaceHeight - y, frame.height / scale));
    return roundRect({ x, y, width, height, surfaceWidth, surfaceHeight, scale, offsetX, offsetY });
  }

  function getVisibleVideoSourceCrop(video = videoRef.current) {
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
    return mapVisibleFrameToSurface(video.videoWidth, video.videoHeight);
  }

  function syncGeometryDiagnostics() {
    const visibleScanFrame = getVisibleScanFrameRect();
    const visibleSourceCrop = getVisibleVideoSourceCrop();
    updateDiagnostics({ visibleScanFrame, visibleSourceCrop });
  }

  function syncVideoDiagnostics(video, engine) {
    if (!video) return;
    const track = video.srcObject?.getVideoTracks?.()[0] || streamRef.current?.getVideoTracks?.()[0];
    const streamStarted = Boolean(track && track.readyState === "live");
    if (streamStarted && !cameraReadyAtRef.current) cameraReadyAtRef.current = Date.now();
    updateDiagnostics({
      streamStarted,
      cameraStreamStatus: streamStarted ? "live" : track?.readyState || "no live track",
      video: {
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight,
        paused: video.paused
      },
      trackSettings: getTrackSettings(track),
      cameraCapabilities: getTrackCapabilitiesSummary(track),
      visibleScanFrame: getVisibleScanFrameRect(),
      visibleSourceCrop: getVisibleVideoSourceCrop(video),
      activeDecoder: engine,
      cameraReadyAt: cameraReadyAtRef.current ? new Date(cameraReadyAtRef.current).toISOString() : null,
      lastError: ""
    }, `${engine} camera ready`);
  }

  async function inspectNativeBarcodeDetector() {
    const exists = "BarcodeDetector" in window;
    let formats = [];
    if (exists && typeof window.BarcodeDetector.getSupportedFormats === "function") {
      try {
        formats = await window.BarcodeDetector.getSupportedFormats();
      } catch (error) {
        updateDiagnostics({ lastError: `BarcodeDetector formats: ${String(error?.message || error)}` });
      }
    }
    updateDiagnostics({ barcodeDetector: exists, barcodeDetectorFormats: formats }, "native detector checked");
  }

  function stopZxingDetection() {
    if (zxingFallbackTimerRef.current) {
      window.clearTimeout(zxingFallbackTimerRef.current);
      zxingFallbackTimerRef.current = null;
    }
    if (zxingTimerRef.current) {
      window.clearTimeout(zxingTimerRef.current);
      zxingTimerRef.current = null;
    }
    zxingReaderRef.current = null;
    zxingCanvasRef.current = null;
    zxingContextRef.current = null;
    zxingVariantCanvasesRef.current.clear();
    zxingFrameIndexRef.current = 0;
  }

  function getHtml5DecoderName(scanner = html5ScannerRef.current) {
    const decoderName = scanner?.qrcode?.primaryDecoder?.createDebugData?.()?.decoderName || "unknown";
    return decoderName === "BarcodeDetector"
      ? "native BarcodeDetector via html5-qrcode"
      : `html5-qrcode ${decoderName}`;
  }

  function getHtml5SuccessfulDecoderName(scanner = html5ScannerRef.current) {
    if (scanner?.qrcode?.secondaryDecoder && scanner.qrcode.wasPrimaryDecoderUsedInLastDecode === false) {
      return "html5-qrcode zxing-js fallback";
    }
    return getHtml5DecoderName(scanner);
  }

  function createHtml5Qrbox(viewWidth, viewHeight) {
    const visibleScanFrame = getVisibleScanFrameRect();
    const mappedCrop = mapVisibleFrameToSurface(viewWidth, viewHeight);
    const requestedWidth = Math.round(mappedCrop?.width || viewWidth * 0.3);
    const requestedHeight = Math.round(mappedCrop?.height || viewHeight * 0.18);
    const width = Math.max(50, Math.min(requestedWidth, Math.floor(viewWidth)));
    const height = Math.max(50, Math.min(requestedHeight, Math.floor(viewHeight)));
    const decoderCrop = roundRect({
      engine: "html5-qrcode",
      coordinateSpace: "decoder video client pixels",
      x: (viewWidth - width) / 2,
      y: (viewHeight - height) / 2,
      width,
      height,
      surfaceWidth: viewWidth,
      surfaceHeight: viewHeight,
      mappedVisibleX: mappedCrop?.x ?? null,
      mappedVisibleY: mappedCrop?.y ?? null,
      alignmentDeltaX: mappedCrop ? (viewWidth - width) / 2 - mappedCrop.x : null,
      alignmentDeltaY: mappedCrop ? (viewHeight - height) / 2 - mappedCrop.y : null
    });
    updateDiagnostics({
      visibleScanFrame,
      decoderCrop,
      decoderCrops: {
        ...diagnosticsRef.current.decoderCrops,
        html5Qrcode: decoderCrop
      }
    }, "html5-qrcode crop aligned");
    return { width, height };
  }

  function pauseHtml5Detection() {
    try {
      if (html5ScannerRef.current?.isScanning) html5ScannerRef.current.pause(false);
    } catch {
      // A decoder may already be stopping after a successful scan.
    }
  }

  async function stopHtml5Detection() {
    const scanner = html5ScannerRef.current;
    html5ScannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {
      // Camera tracks are also released directly below.
    }
    try {
      scanner.clear();
    } catch {
      // The library may have already cleared its mount element.
    }
  }

  function pauseDetection() {
    pauseHtml5Detection();
    stopZxingDetection();
  }

  function releaseCamera() {
    cameraRequestRef.current += 1;
    if (cameraTimerRef.current) {
      window.clearTimeout(cameraTimerRef.current);
      cameraTimerRef.current = null;
    }
    pauseDetection();
    void stopHtml5Detection();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    lookupInFlightRef.current = false;
    currentLookupBarcodeRef.current = "";
    queuedBarcodeRef.current = null;
    pendingLookupResultRef.current = null;
    activeBarcodeRef.current = "";
    recentBarcodesRef.current.clear();
    if (videoRef.current) videoRef.current.srcObject = null;
    updateDiagnostics({
      streamStarted: false,
      cameraStreamStatus: "stopped",
      activeDecoder: "none",
      video: { readyState: 0, width: 0, height: 0, paused: true }
    });
  }

  useEffect(() => {
    mountedRef.current = true;
    window.__ZIYA_SCANNER_DIAGNOSTICS__ = diagnosticsRef.current;
    startCamera();
    return () => {
      mountedRef.current = false;
      releaseCamera();
      delete window.__ZIYA_SCANNER_DIAGNOSTICS__;
    };
  }, []);

  useEffect(() => {
    if (activeFallback !== "photo" || !capturedPhoto || !sheetProduct || sheetProduct.userPhoto === capturedPhoto) return;
    const updatedProduct = {
      ...sheetProduct,
      userPhoto: capturedPhoto,
      fieldConfidence: {
        ...(sheetProduct.fieldConfidence || {}),
        image: "Manual Review"
      }
    };
    setSheetProduct(updatedProduct);
    setManualProduct(updatedProduct);
  }, [activeFallback, capturedPhoto, sheetProduct]);

  function isPlausibleScannerBarcode(value) {
    return value.length >= 4 && value.length <= 64 && /^[\dA-Za-z]+$/.test(value);
  }

  function handleDecodedBarcode(rawValue, { decoder = "scanner", variant = "original" } = {}) {
    const decodedValue = normalizeBarcode(rawValue);
    const now = Date.now();
    if (!isPlausibleScannerBarcode(decodedValue)) return;
    const elapsedToDecode = cameraReadyAtRef.current ? now - cameraReadyAtRef.current : null;
    updateDiagnostics({
      lastDecodedValue: decodedValue,
      successfulDecoder: decoder,
      successfulImageVariant: variant,
      timeToSuccessfulDecodeMs: diagnosticsRef.current.timeToSuccessfulDecodeMs ?? elapsedToDecode,
      lastError: ""
    }, "barcode decoded");

    for (const [value, detectedAt] of recentBarcodesRef.current) {
      if (now - detectedAt > RECENT_BARCODE_TTL_MS) recentBarcodesRef.current.delete(value);
    }
    const duplicate =
      activeBarcodeRef.current === decodedValue
      || currentLookupBarcodeRef.current === decodedValue
      || now - (recentBarcodesRef.current.get(decodedValue) || 0) < RECENT_BARCODE_TTL_MS;
    if (duplicate) return;

    recentBarcodesRef.current.set(decodedValue, now);
    setBarcode(decodedValue);
    const candidate = { barcode: decodedValue, decoder, variant, detectedAt: now, source: "scanner" };
    if (lookupInFlightRef.current || sheetStateRef.current === "full") {
      queuedBarcodeRef.current = candidate;
      updateDiagnostics({ queuedBarcode: decodedValue }, "barcode queued");
      return;
    }
    void runBarcodeLookup(decodedValue, candidate);
  }

  function getProductBarcodeFormats(module) {
    const formats = module.Html5QrcodeSupportedFormats;
    return [formats.EAN_13, formats.EAN_8, formats.UPC_A, formats.UPC_E, formats.CODE_128];
  }

  function getCameraConstraintProfiles() {
    return [
      {
        name: "rear 1920x1080 preferred",
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      },
      {
        name: "rear 1280x720 preferred",
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      { name: "rear browser default", videoConstraints: null }
    ];
  }

  async function startHtml5Attempt(requestId, profile) {
    const module = await import("html5-qrcode");
    updateDiagnostics({ html5QrcodeLoaded: true }, "html5-qrcode loaded");
    if (cameraRequestRef.current !== requestId) return false;

    const scanner = new module.Html5Qrcode("ziya-html5-reader", {
      formatsToSupport: getProductBarcodeFormats(module),
      useBarCodeDetectorIfSupported: true,
      verbose: false
    });
    html5ScannerRef.current = scanner;
    await scanner.start(
      { facingMode: { ideal: "environment" } },
      {
        fps: 6,
        qrbox: createHtml5Qrbox,
        aspectRatio: 16 / 9,
        disableFlip: true,
        ...(profile.videoConstraints ? { videoConstraints: profile.videoConstraints } : {})
      },
      (decodedText) => {
        recordDecoderFrame("html5Qrcode", { variant: "original" });
        handleDecodedBarcode(decodedText, { decoder: getHtml5SuccessfulDecoderName(scanner), variant: "original" });
      },
      () => recordDecoderFrame("html5Qrcode", { variant: "original" })
    );

    if (cameraRequestRef.current !== requestId) {
      await stopHtml5Detection();
      return false;
    }
    const video = html5ContainerRef.current?.querySelector("video");
    if (video) {
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      await video.play().catch(() => undefined);
      streamRef.current = video.srcObject;
      if (videoRef.current && video.srcObject) {
        videoRef.current.srcObject = video.srcObject;
        await videoRef.current.play().catch(() => undefined);
      }
    }
    if (cameraTimerRef.current) {
      window.clearTimeout(cameraTimerRef.current);
      cameraTimerRef.current = null;
    }
    setCameraEngine("html5");
    setCameraStatus("active");
    setCameraMessage("Camera active - scan barcode or enter it manually.");
    const decoderName = getHtml5DecoderName(scanner);
    updateDiagnostics({
      html5PrimaryDecoder: decoderName,
      activeDecoder: decoderName,
      activeCameraProfile: profile.name
    });
    syncVideoDiagnostics(videoRef.current || video, decoderName);
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (track) void applyOptionalCameraEnhancements(track);
    scheduleZxingFallback();
    return true;
  }

  async function startHtml5Detection(requestId) {
    const attempts = [];
    let lastError = null;
    for (const profile of getCameraConstraintProfiles()) {
      try {
        const started = await startHtml5Attempt(requestId, profile);
        attempts.push({ profile: profile.name, status: started ? "started" : "cancelled" });
        updateDiagnostics({ cameraConstraintAttempts: attempts });
        return started;
      } catch (error) {
        lastError = error;
        attempts.push({
          profile: profile.name,
          status: "failed",
          error: `${error?.name || "CameraError"}: ${String(error?.message || error)}`
        });
        updateDiagnostics({ cameraConstraintAttempts: attempts });
        await stopHtml5Detection();
        if (html5ContainerRef.current) html5ContainerRef.current.innerHTML = "";
        if (["NotAllowedError", "PermissionDeniedError", "NotReadableError"].includes(error?.name)) throw error;
      }
    }
    updateDiagnostics({ lastError: `html5-qrcode start: ${String(lastError?.message || lastError)}` }, "html5-qrcode failed");
    return false;
  }

  function getReusableVariantCanvas(name, width, height) {
    let entry = zxingVariantCanvasesRef.current.get(name);
    if (!entry) {
      const canvas = document.createElement("canvas");
      entry = { canvas, context: canvas.getContext("2d", { willReadFrequently: true }) };
      zxingVariantCanvasesRef.current.set(name, entry);
    }
    if (entry.canvas.width !== width) entry.canvas.width = width;
    if (entry.canvas.height !== height) entry.canvas.height = height;
    return entry;
  }

  function prepareZxingVariant(name, { video, baseCanvas, sourceX, sourceY, cropWidth, cropHeight }) {
    let width = cropWidth;
    let height = cropHeight;
    let drawSource = baseCanvas;
    let sourceRect = null;
    let filter = "none";
    let pixelTransform = null;

    if (name === "enlarged") {
      width = Math.round(cropWidth * 1.35);
      height = Math.round(cropHeight * 1.35);
    } else if (name === "grayscale-contrast") {
      filter = "grayscale(1) contrast(1.28)";
      pixelTransform = "grayscale-contrast";
    } else if (name === "light-threshold") {
      pixelTransform = "light-threshold";
    } else if (name === "taller") {
      height = Math.min(video.videoHeight, Math.round(cropHeight * 1.18));
      const y = Math.max(0, Math.min(video.videoHeight - height, Math.round(sourceY + (cropHeight - height) / 2)));
      drawSource = video;
      sourceRect = { x: sourceX, y, width: cropWidth, height };
    } else if (name === "shorter-center") {
      height = Math.max(50, Math.round(cropHeight * 0.82));
      const y = Math.max(0, Math.min(video.videoHeight - height, Math.round(sourceY + (cropHeight - height) / 2)));
      drawSource = video;
      sourceRect = { x: sourceX, y, width: cropWidth, height };
    }

    const { canvas, context } = getReusableVariantCanvas(name, width, height);
    context.save();
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    const supportsCanvasFilter = "filter" in context;
    if (supportsCanvasFilter) context.filter = filter;
    if (sourceRect) {
      context.drawImage(
        drawSource,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        width,
        height
      );
    } else {
      context.drawImage(drawSource, 0, 0, baseCanvas.width, baseCanvas.height, 0, 0, width, height);
    }
    if (pixelTransform === "light-threshold" || (pixelTransform === "grayscale-contrast" && !supportsCanvasFilter)) {
      const imageData = context.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      for (let index = 0; index < pixels.length; index += 4) {
        const luminance = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
        const value = pixelTransform === "light-threshold"
          ? luminance >= 136 ? 255 : 0
          : Math.max(0, Math.min(255, 128 + (luminance - 128) * 1.28));
        pixels[index] = value;
        pixels[index + 1] = value;
        pixels[index + 2] = value;
      }
      context.putImageData(imageData, 0, 0);
    }
    context.restore();
    return canvas;
  }

  function tryZxingDecode(reader, canvas, variant, enhanced) {
    recordDecoderFrame("zxing", { variant, enhanced });
    try {
      return reader.decodeFromCanvas(canvas) || null;
    } catch (error) {
      if (!["NotFoundException", "ChecksumException", "FormatException"].includes(error?.name)) {
        updateDiagnostics({ lastError: `ZXing ${variant}: ${String(error?.message || error)}` });
      }
      return null;
    }
  }

  function scheduleZxingFallback(delay = 2400) {
    if (zxingFallbackTimerRef.current) window.clearTimeout(zxingFallbackTimerRef.current);
    zxingFallbackTimerRef.current = window.setTimeout(() => {
      zxingFallbackTimerRef.current = null;
      if (streamRef.current) void startZxingDetection();
    }, delay);
  }

  async function startZxingDetection() {
    if (!videoRef.current || !streamRef.current || zxingReaderRef.current) return false;
    try {
      const { BrowserMultiFormatOneDReader } = await import("@zxing/browser");
      if (!videoRef.current || !streamRef.current) return false;
      const reader = new BrowserMultiFormatOneDReader(undefined, {
        delayBetweenScanAttempts: 160,
        delayBetweenScanSuccess: 1200
      });
      zxingReaderRef.current = reader;
      zxingCanvasRef.current = document.createElement("canvas");
      zxingContextRef.current = zxingCanvasRef.current.getContext("2d", { willReadFrequently: true });
      const alongsideHtml5 = Boolean(html5ScannerRef.current?.isScanning);
      const activeDecoder = alongsideHtml5
        ? `${getHtml5DecoderName()} + cropped ZXing`
        : "cropped ZXing";
      updateDiagnostics({ zxingLoaded: true, activeDecoder, lastError: "" }, "ZXing fallback loaded");

      const scanFrame = () => {
        const video = videoRef.current;
        const canvas = zxingCanvasRef.current;
        if (!video || !canvas || !zxingReaderRef.current) return;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          const crop = getVisibleVideoSourceCrop(video);
          if (!crop) {
            zxingTimerRef.current = window.setTimeout(scanFrame, 160);
            return;
          }
          const sourceX = Math.max(0, Math.floor(crop.x));
          const sourceY = Math.max(0, Math.floor(crop.y));
          const cropWidth = Math.max(1, Math.min(video.videoWidth - sourceX, Math.round(crop.width)));
          const cropHeight = Math.max(1, Math.min(video.videoHeight - sourceY, Math.round(crop.height)));
          if (canvas.width !== cropWidth) canvas.width = cropWidth;
          if (canvas.height !== cropHeight) canvas.height = cropHeight;
          const context = zxingContextRef.current;
          if (!context) {
            zxingTimerRef.current = window.setTimeout(scanFrame, 160);
            return;
          }
          context.drawImage(video, sourceX, sourceY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          const decoderCrop = roundRect({
            engine: "cropped ZXing",
            coordinateSpace: "video source pixels",
            x: sourceX,
            y: sourceY,
            width: cropWidth,
            height: cropHeight,
            surfaceWidth: video.videoWidth,
            surfaceHeight: video.videoHeight
          });
          const cropSignature = `${sourceX}:${sourceY}:${cropWidth}:${cropHeight}:${video.videoWidth}:${video.videoHeight}`;
          if (lastDecoderCropSignatureRef.current !== cropSignature) {
            lastDecoderCropSignatureRef.current = cropSignature;
            updateDiagnostics({
              visibleScanFrame: getVisibleScanFrameRect(),
              decoderCrop,
              decoderCrops: {
                ...diagnosticsRef.current.decoderCrops,
                zxing: decoderCrop
              }
            }, "ZXing crop aligned");
          }
          zxingFrameIndexRef.current += 1;
          const rawResult = tryZxingDecode(zxingReaderRef.current, canvas, "original", false);
          if (rawResult) {
            handleDecodedBarcode(rawResult.getText(), { decoder: "cropped ZXing", variant: "original" });
          } else if (
            zxingFrameIndexRef.current % ENHANCED_VARIANT_INTERVAL === 0
            && Date.now() - cameraReadyAtRef.current >= CAMERA_SETTLE_MS
          ) {
            const variantIndex = (Math.floor(zxingFrameIndexRef.current / ENHANCED_VARIANT_INTERVAL) - 1) % ZXING_ENHANCED_VARIANTS.length;
            const variant = ZXING_ENHANCED_VARIANTS[variantIndex];
            const variantCanvas = prepareZxingVariant(variant, {
              video,
              baseCanvas: canvas,
              sourceX,
              sourceY,
              cropWidth,
              cropHeight
            });
            const enhancedResult = tryZxingDecode(zxingReaderRef.current, variantCanvas, variant, true);
            if (enhancedResult) {
              handleDecodedBarcode(enhancedResult.getText(), { decoder: "cropped ZXing", variant });
            }
          }
        }
        zxingTimerRef.current = window.setTimeout(scanFrame, 160);
      };
      scanFrame();
      setCameraMessage("Camera active - scan barcode or enter it manually.");
      return true;
    } catch (error) {
      stopZxingDetection();
      updateDiagnostics({ lastError: `ZXing load: ${String(error?.message || error)}` }, "ZXing fallback failed");
      setCameraMessage("Camera active - enter barcode manually if needed.");
      return false;
    }
  }

  async function getCameraStream() {
    const attempts = [...(diagnosticsRef.current.cameraConstraintAttempts || [])];
    let lastError = null;
    for (const profile of getCameraConstraintProfiles()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: profile.videoConstraints || { facingMode: { ideal: "environment" } }
        });
        attempts.push({ profile: `fallback ${profile.name}`, status: "started" });
        updateDiagnostics({ cameraConstraintAttempts: attempts });
        return stream;
      } catch (error) {
        lastError = error;
        attempts.push({
          profile: `fallback ${profile.name}`,
          status: "failed",
          error: `${error?.name || "CameraError"}: ${String(error?.message || error)}`
        });
        updateDiagnostics({ cameraConstraintAttempts: attempts });
        if (!["OverconstrainedError", "ConstraintNotSatisfiedError", "TypeError"].includes(error?.name)) throw error;
      }
    }
    throw lastError || new Error("No camera constraint profile could start.");
  }

  async function startFallbackCamera(requestId) {
    const stream = await getCameraStream();
    if (cameraRequestRef.current !== requestId) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      await video.play().catch(() => undefined);
    }
    if (cameraTimerRef.current) {
      window.clearTimeout(cameraTimerRef.current);
      cameraTimerRef.current = null;
    }
    setCameraEngine("zxing");
    setCameraStatus("active");
    setCameraMessage("Camera active - scan barcode or enter it manually.");
    syncVideoDiagnostics(video, "zxing-crop");
    const track = stream.getVideoTracks?.()[0];
    if (track) void applyOptionalCameraEnhancements(track);
    await startZxingDetection();
    return true;
  }

  async function startCamera() {
    clearBarcodeMiss();
    setActiveFallback(null);
    releaseCamera();
    const requestId = cameraRequestRef.current;
    setFlashOn(false);
    setCameraEngine("none");
    setCameraStatus("requesting");
    setCameraMessage("Requesting camera permission...");
    setDebugCropCaptures([]);
    cameraReadyAtRef.current = 0;
    lastDecoderCropSignatureRef.current = "";
    updateDiagnostics({
      secureContext: window.isSecureContext,
      mediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
      streamStarted: false,
      cameraStreamStatus: "requesting permission",
      html5QrcodeLoaded: false,
      zxingLoaded: false,
      activeDecoder: "none",
      activeCameraProfile: "",
      decodedFrameCount: 0,
      frames: { html5Qrcode: 0, zxing: 0 },
      decoderAttempts: { html5Qrcode: 0, zxingOriginal: 0, zxingEnhanced: 0 },
      enhancedDecoderAttempts: 0,
      successfulDecoder: "",
      successfulImageVariant: "",
      cameraReadyAt: null,
      timeToSuccessfulDecodeMs: null,
      queuedBarcode: "",
      cameraCapabilities: {
        focusModes: [],
        exposureModes: [],
        whiteBalanceModes: [],
        zoom: null,
        torch: false
      },
      optionalConstraintResults: {},
      cameraConstraintAttempts: [],
      visibleScanFrame: getVisibleScanFrameRect(),
      decoderCrop: null,
      decoderCrops: { html5Qrcode: null, zxing: null },
      capturedDecoderFrames: [],
      lastError: ""
    }, "camera requested");
    await inspectNativeBarcodeDetector();

    if (!window.isSecureContext) {
      setCameraStatus("unavailable");
      setCameraMessage("Camera access needs HTTPS or localhost. Manual barcode lookup is ready.");
      updateDiagnostics({ cameraStreamStatus: "blocked by insecure context" });
      openFallback("barcode");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      setCameraMessage("This browser cannot open the camera. Manual barcode lookup is ready.");
      updateDiagnostics({ cameraStreamStatus: "getUserMedia unavailable" });
      openFallback("barcode");
      return;
    }

    cameraTimerRef.current = window.setTimeout(() => {
      if (cameraRequestRef.current !== requestId) return;
      setCameraStatus("unavailable");
      setCameraMessage("Camera access is taking longer than expected. Manual lookup is ready.");
      updateDiagnostics({
        cameraStreamStatus: "startup timed out",
        lastError: "Camera permission or startup timed out after 7 seconds."
      }, "camera timeout");
      openFallback("barcode");
    }, 7000);

    try {
      const html5Started = await startHtml5Detection(requestId);
      if (!html5Started && cameraRequestRef.current === requestId) await startFallbackCamera(requestId);
    } catch (error) {
      if (cameraRequestRef.current !== requestId) return;
      if (cameraTimerRef.current) {
        window.clearTimeout(cameraTimerRef.current);
        cameraTimerRef.current = null;
      }
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setCameraStatus(denied ? "denied" : "unavailable");
      setCameraEngine("none");
      updateDiagnostics({
        cameraStreamStatus: denied ? "permission denied" : "unavailable",
        lastError: `${error?.name || "CameraError"}: ${String(error?.message || error)}`
      }, "camera failed");
      setCameraMessage(
        denied
          ? "Camera permission denied. You can still use manual barcode lookup."
          : "Camera unavailable. Camera scanning requires browser permission and may require HTTPS or localhost."
      );
      openFallback("barcode");
    }
  }

  async function decodeBarcodePhoto(file) {
    if (!file) return;
    setBarcodePhotoLoading(true);
    let fileScanner = null;
    try {
      const module = await import("html5-qrcode");
      updateDiagnostics({ html5QrcodeLoaded: true, lastError: "" }, "barcode photo decoder loaded");
      fileScanner = new module.Html5Qrcode("ziya-barcode-file-reader", {
        formatsToSupport: getProductBarcodeFormats(module),
        useBarCodeDetectorIfSupported: true,
        verbose: false
      });
      const decodedValue = await fileScanner.scanFile(file, false);
      updateDiagnostics({ lastDecodedValue: decodedValue, lastError: "" }, "barcode decoded from photo");
      handleDecodedBarcode(decodedValue, { decoder: "barcode photo", variant: "still image" });
    } catch (error) {
      updateDiagnostics({ lastError: `Barcode photo: ${String(error?.message || error)}` }, "barcode photo failed");
      setCameraMessage("Couldn't read that photo - enter the barcode manually.");
      openFallback("barcode");
    } finally {
      try {
        fileScanner?.clear();
      } catch {
        // The file decoder may already have cleared its temporary canvas.
      }
      setBarcodePhotoLoading(false);
    }
  }

  function createVisibleCropCanvas() {
    const video = videoRef.current;
    const crop = getVisibleVideoSourceCrop(video);
    if (!video || !crop) return null;
    const sourceX = Math.max(0, Math.floor(crop.x));
    const sourceY = Math.max(0, Math.floor(crop.y));
    const width = Math.max(1, Math.min(video.videoWidth - sourceX, Math.round(crop.width)));
    const height = Math.max(1, Math.min(video.videoHeight - sourceY, Math.round(crop.height)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d", { willReadFrequently: true })?.drawImage(
      video,
      sourceX,
      sourceY,
      width,
      height,
      0,
      0,
      width,
      height
    );
    return canvas;
  }

  function captureDecoderFrames() {
    syncGeometryDiagnostics();
    const sources = [
      {
        engine: getHtml5DecoderName(),
        canvas: html5ScannerRef.current?.canvasElement,
        crop: diagnosticsRef.current.decoderCrops?.html5Qrcode
      },
      {
        engine: "cropped ZXing",
        canvas: zxingCanvasRef.current,
        crop: diagnosticsRef.current.decoderCrops?.zxing
      }
    ].filter((source) => source.canvas?.width > 0 && source.canvas?.height > 0);

    if (!sources.length) {
      const canvas = createVisibleCropCanvas();
      if (canvas) {
        sources.push({
          engine: "visible frame preview",
          canvas,
          crop: getVisibleVideoSourceCrop()
        });
      }
    }

    try {
      const capturedAt = new Date().toISOString();
      const captures = sources.map((source, index) => ({
        engine: source.engine,
        src: source.canvas.toDataURL("image/png"),
        width: source.canvas.width,
        height: source.canvas.height,
        crop: source.crop,
        downloadName: `ziya-decoder-crop-${index + 1}.png`
      }));
      if (!captures.length) throw new Error("No live decoder frame is available yet.");
      setDebugCropCaptures(captures);
      updateDiagnostics({
        capturedDecoderFrames: captures.map(({ engine, width, height, crop }) => ({
          engine,
          width,
          height,
          crop,
          capturedAt
        })),
        lastError: ""
      }, "decoder crop captured");
    } catch (error) {
      updateDiagnostics({ lastError: `Capture decoder frame: ${String(error?.message || error)}` }, "decoder crop capture failed");
    }
  }

  function toggleDiagnostics() {
    if (!diagnosticsOpen) syncGeometryDiagnostics();
    setDiagnosticsOpen((value) => !value);
  }

  async function toggleFlash() {
    const track = streamRef.current?.getVideoTracks?.()[0];
    const capabilities = track?.getCapabilities?.();
    if (!track || !capabilities?.torch) {
      setFlashOn(false);
      setCameraMessage("Flash is not available on this camera.");
      return;
    }
    const nextFlash = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: nextFlash }] });
      setFlashOn(nextFlash);
    } catch {
      setFlashOn(false);
      setCameraMessage("Flash is not available on this camera.");
    }
  }

  function updateSheetState(nextState) {
    const resolved = typeof nextState === "function" ? nextState(sheetStateRef.current) : nextState;
    sheetStateRef.current = resolved;
    setSheetState(resolved);
    if (resolved !== "full") window.setTimeout(flushPendingContinuousScan, 0);
  }

  function applyLookupResult(lookupValue, result) {
    activeBarcodeRef.current = lookupValue;
    setBarcode(lookupValue);
    setCameraMessage("");
    setExpandedSection(null);
    setActionOpen(false);
    if (result.status === "found" && result.product) {
      updateDiagnostics({
        productDataQuality: {
          ingredientSourceField: result.product.ingredientParsing?.sourceField || null,
          acceptedIngredients: result.product.ingredientParsing?.acceptedIngredients || [],
          rejectedFragments: result.product.ingredientParsing?.rejectedFragments || [],
          normalizationWarnings: result.product.ingredientParsing?.warnings || [],
          sourcePriority: result.product.ingredientParsing?.sourcePriority || null,
          sourceRouting: result.product.sourceRouting || null,
          localOverrideApplied: Boolean(result.product.overrideApplied),
          mergedProductFields: result.product.userProductOverride?.fields
            ? Object.keys(result.product.userProductOverride.fields)
            : []
        }
      }, "product data routed");
      setManualProduct(result.product);
      onRecordHistory(result.product);
      setSheetProduct(result.product);
      setManualCategory(result.product.category === "unknown" ? "not-sure" : result.product.category);
      sheetModeRef.current = "product";
      setSheetMode("product");
      updateSheetState("peek");
      setActiveFallback(null);
      return;
    }
    setSheetProduct(null);
    sheetModeRef.current = "not-found";
    setSheetMode("not-found");
    updateSheetState("mid");
    setActiveFallback("barcode");
  }

  function flushPendingContinuousScan() {
    if (lookupInFlightRef.current || sheetStateRef.current === "full") return;
    const queued = queuedBarcodeRef.current;
    if (queued) {
      queuedBarcodeRef.current = null;
      pendingLookupResultRef.current = null;
      updateDiagnostics({ queuedBarcode: "" });
      void runBarcodeLookup(queued.barcode, queued);
      return;
    }
    const pending = pendingLookupResultRef.current;
    if (pending) {
      pendingLookupResultRef.current = null;
      applyLookupResult(pending.barcode, pending.result);
    }
  }

  async function runBarcodeLookup(nextBarcode, request = { source: "manual" }) {
    const lookupValue = normalizeBarcode(nextBarcode ?? barcode);
    const lookupRequest = {
      source: request?.source || "manual",
      decoder: request?.decoder || "manual barcode",
      variant: request?.variant || "manual",
      detectedAt: request?.detectedAt || Date.now(),
      barcode: lookupValue
    };
    setBarcode(lookupValue);
    if (!lookupValue) {
      setLookupLoading(false);
      applyLookupResult("", { status: "not_found", product: null });
      return;
    }
    if (lookupInFlightRef.current) {
      if (currentLookupBarcodeRef.current !== lookupValue) {
        queuedBarcodeRef.current = lookupRequest;
        updateDiagnostics({ queuedBarcode: lookupValue }, "barcode queued during lookup");
      }
      return;
    }

    lookupInFlightRef.current = true;
    currentLookupBarcodeRef.current = lookupValue;
    setLookupLoading(true);
    clearBarcodeMiss();
    if (!sheetModeRef.current) setCameraMessage("Looking up product...");

    try {
      let result;
      try {
        result = await lookupProductByBarcode(lookupValue);
      } catch {
        result = { status: "not_found", barcode: lookupValue, product: null };
      }
      if (!mountedRef.current) return;
      const hasNewerQueuedBarcode = queuedBarcodeRef.current?.barcode && queuedBarcodeRef.current.barcode !== lookupValue;
      if (lookupRequest.source === "scanner" && hasNewerQueuedBarcode) return;
      if (lookupRequest.source === "scanner" && sheetStateRef.current === "full") {
        pendingLookupResultRef.current = { barcode: lookupValue, result };
        return;
      }
      applyLookupResult(lookupValue, result);
    } finally {
      lookupInFlightRef.current = false;
      currentLookupBarcodeRef.current = "";
      if (mountedRef.current) {
        setLookupLoading(false);
        if (sheetStateRef.current !== "full") window.setTimeout(flushPendingContinuousScan, 0);
      }
    }
  }

  function openFallback(mode) {
    sheetModeRef.current = "fallback";
    setSheetMode("fallback");
    updateSheetState(mode === "paste" || mode === "label" ? "full" : "mid");
    setActiveFallback(mode);
    if (mode === "photo") {
      window.setTimeout(() => document.getElementById("product-photo")?.click(), 20);
    }
    if (mode === "label") {
      const productCategory = sheetProduct?.category;
      const category = productCategory && productCategory !== "unknown" ? productCategory : manualCategory === "not-sure" ? "unknown" : manualCategory;
      setOcrReview(createBlankLabelDraft(category, "ingredients", sheetProduct));
    }
    if (mode === "paste") {
      window.setTimeout(() => document.getElementById("ingredient-paste")?.focus(), 40);
    }
  }

  function useSampleProduct() {
    const sample = products.find((product) => product.id === "pop-secret") || products[0];
    setSheetProduct(sample);
    sheetModeRef.current = "product";
    setSheetMode("product");
    updateSheetState("peek");
    setActiveFallback(null);
  }

  function analyzeManualInSheet() {
    const completed = createManualReport({
      text: manualText,
      category: manualCategory,
      userPhoto: sheetProduct?.userPhoto || capturedPhoto,
      productName: sheetProduct?.name,
      brand: sheetProduct?.brand,
      nutrition: sheetProduct?.nutrition,
      nutritionConfidence: sheetProduct?.nutritionConfidence,
      providedFields: {
        category: manualCategory === "not-sure" ? "unknown" : manualCategory,
        ingredientsText: manualText,
        userPhoto: sheetProduct?.userPhoto || capturedPhoto || ""
      }
    });
    const report = mergeProductLabelCompletion(sheetProduct, completed);
    setManualProduct(report);
    onRecordHistory(report);
    setSheetProduct(report);
    sheetModeRef.current = "product";
    setSheetMode("product");
    updateSheetState("full");
    setActiveFallback(null);
    setExpandedSection(null);
  }

  function applyOcrInSheet() {
    if (!ocrReview) return;
    const completed = createReportFromOcr(ocrReview, sheetProduct?.userPhoto || capturedPhoto);
    const report = mergeProductLabelCompletion(sheetProduct, completed);
    setManualProduct(report);
    onRecordHistory(report);
    setSheetProduct(report);
    sheetModeRef.current = "product";
    setSheetMode("product");
    updateSheetState("full");
    setActiveFallback(null);
    setOcrReview(null);
    setExpandedSection(null);
  }

  function handleLabelPhotoSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLabelPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
    const productCategory = sheetProduct?.category;
    const category = productCategory && productCategory !== "unknown" ? productCategory : manualCategory === "not-sure" ? "unknown" : manualCategory;
    setOcrReview(
      createBlankLabelDraft(
        category,
        category === "food" ? "nutrition" : category === "textile" ? "materials" : "ingredients",
        sheetProduct
      )
    );
    setActiveFallback("label");
    sheetModeRef.current = "fallback";
    setSheetMode("fallback");
    updateSheetState("full");
  }

  function finishProductPhoto() {
    if (!sheetProduct || !capturedPhoto) return;
    const report = completeProductWithUserInput(
      sheetProduct,
      { category: sheetProduct.category, userPhoto: capturedPhoto },
      { ...sheetProduct, userPhoto: capturedPhoto }
    );
    setManualProduct(report);
    onRecordHistory(report);
    setSheetProduct(report);
    sheetModeRef.current = "product";
    setSheetMode("product");
    updateSheetState("full");
    setActiveFallback(null);
  }

  function expandSheet() {
    updateSheetState((current) => (current === "peek" ? "mid" : "full"));
  }

  function resumeDetection() {
    if (cameraStatus !== "active") {
      setCameraMessage(
        cameraStatus === "denied"
          ? "Camera permission denied. Manual barcode lookup is ready."
          : "Camera unavailable. Manual barcode lookup is ready."
      );
      return;
    }
    setCameraMessage("Camera active - scan barcode or enter it manually.");
    if (cameraEngine === "html5" && html5ScannerRef.current?.isScanning) {
      try {
        html5ScannerRef.current.resume();
        scheduleZxingFallback();
        return;
      } catch {
        // The scanner may already be running.
      }
    }
    if (cameraEngine === "zxing" && streamRef.current) void startZxingDetection();
  }

  function dismissSheet() {
    sheetModeRef.current = null;
    activeBarcodeRef.current = "";
    setSheetMode(null);
    setSheetProduct(null);
    updateSheetState("peek");
    setActiveFallback(null);
    setExpandedSection(null);
    resumeDetection();
  }

  function collapseSheet() {
    if (sheetState === "full") {
      updateSheetState(sheetMode === "product" ? "peek" : "mid");
      return;
    }
    if (sheetState === "mid" && sheetMode === "product") {
      updateSheetState("peek");
      return;
    }
    dismissSheet();
  }

  function handleSheetPointerDown(event) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleSheetPointerUp(event) {
    if (dragStartY.current == null) return;
    const delta = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (Math.abs(delta) > 38) event.currentTarget.dataset.dragged = "true";
    if (delta < -38) expandSheet();
    if (delta > 38) collapseSheet();
  }

  return (
    <div className="scanner-live" ref={scannerLiveRef}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cameraStatus === "active" ? "scanner-video is-active" : "scanner-video"}
      />
      <div
        id="ziya-html5-reader"
        ref={html5ContainerRef}
        className="scanner-html5-reader"
      />
      <div className="scanner-fallback-bg" />
      <div className="scanner-shade" />
      {sheetMode === "product" && sheetState === "peek" && (
        <button className="scanner-sheet-dismiss-layer" onClick={dismissSheet} aria-label="Dismiss scan result" />
      )}

      <div className="scanner-top-controls">
        <button className={`glass-circle ${flashOn ? "is-on" : ""}`} onClick={toggleFlash} aria-label="Toggle flashlight">
          <Flashlight size={21} />
        </button>
        <button className={`glass-circle ${soundOn ? "is-on" : ""}`} onClick={() => setSoundOn((value) => !value)} aria-label="Toggle sound">
          <Volume2 size={22} />
        </button>
      </div>

      <div className="scan-corners" ref={scanFrameRef}>
        <span />
        <span />
        <span />
        <span />
        {cameraStatus === "active" && <i />}
      </div>

      <div className="scanner-center">
        <p>
          {cameraStatus === "requesting"
            ? "Requesting camera"
            : cameraStatus === "active"
              ? "Align the barcode"
              : cameraStatus === "denied"
                ? "Camera permission denied"
                : "Camera unavailable"}
        </p>
        {cameraMessage && !sheetMode && <small>{cameraMessage}</small>}
      </div>

      <button className="scanner-cant-scan" onClick={() => openFallback("barcode")}>
        Can't scan?
      </button>

      <input
        id="product-photo"
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          setActiveFallback("photo");
          onPhotoSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <input
        id="label-photo"
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          handleLabelPhotoSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <input
        id="barcode-photo"
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          void decodeBarcodePhoto(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div id="ziya-barcode-file-reader" className="barcode-file-reader" aria-hidden="true" />

      {debugEnabled && (
        <ScannerDiagnosticsPanel
          diagnostics={diagnosticsRef.current}
          version={diagnosticsVersion}
          open={diagnosticsOpen}
          onToggle={toggleDiagnostics}
          onCapture={captureDecoderFrames}
          captures={debugCropCaptures}
        />
      )}

      <ScannerBottomSheet
        mode={sheetMode}
        sheetState={sheetState}
        setSheetState={updateSheetState}
        product={sheetProduct}
        productIndex={sheetProductIndex}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
        onIngredientClick={onIngredientClick}
        onOpenProduct={onOpenProduct}
        onAddToDailyLog={onAddToDailyLog}
        dailyTotals={dailyTotals}
        dailyLog={dailyLog}
        actionOpen={actionOpen}
        setActionOpen={setActionOpen}
        platform={platform}
        setPlatform={setPlatform}
        messageTone={messageTone}
        setMessageTone={setMessageTone}
        copied={copied}
        setCopied={setCopied}
        onPointerDown={handleSheetPointerDown}
        onPointerUp={handleSheetPointerUp}
        barcode={barcode}
        setBarcode={setBarcode}
        lookupLoading={lookupLoading}
        onLookup={runBarcodeLookup}
        barcodePhotoLoading={barcodePhotoLoading}
        onBarcodePhoto={() => document.getElementById("barcode-photo")?.click()}
        activeFallback={activeFallback}
        openFallback={openFallback}
        manualText={manualText}
        setManualText={setManualText}
        manualCategory={manualCategory}
        setManualCategory={setManualCategory}
        analyzeManual={analyzeManualInSheet}
        capturedPhoto={capturedPhoto}
        labelPhoto={labelPhoto}
        ocrReview={ocrReview}
        setOcrReview={setOcrReview}
        applyOcrReview={applyOcrInSheet}
        finishProductPhoto={finishProductPhoto}
        useSampleProduct={useSampleProduct}
        personalProfile={personalProfile}
      />
    </div>
  );
}

function ScannerDiagnosticsPanel({ diagnostics, version, open, onToggle, onCapture, captures }) {
  return (
    <aside className={`scanner-diagnostics ${open ? "is-open" : ""}`} data-version={version}>
      <button
        className="scanner-diagnostics-toggle"
        aria-expanded={open}
        aria-controls="scanner-diagnostics-body"
        onClick={onToggle}
      >
        {open ? "Close diagnostics" : "Scanner diagnostics"}
      </button>
      {open && (
        <div id="scanner-diagnostics-body" className="scanner-diagnostics-body">
          <strong>Developer scanner snapshot</strong>
          <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
          <div className="scanner-diagnostics-actions">
            <button onClick={onCapture}>Capture decoder frame</button>
            <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(diagnostics, null, 2))}>
              Copy diagnostics
            </button>
          </div>
          {captures.map((capture) => (
            <figure className="scanner-debug-crop" key={`${capture.engine}-${capture.width}-${capture.height}`}>
              <figcaption>{capture.engine} - {capture.width} x {capture.height}</figcaption>
              <img src={capture.src} alt={`Exact crop sent to ${capture.engine}`} />
              <a href={capture.src} download={capture.downloadName}>Save crop image</a>
            </figure>
          ))}
          <p className="scanner-diagnostics-comparison">
            Try the same barcode in the official <a href="https://scanapp.org/" target="_blank" rel="noreferrer">ScanApp demo</a> on this phone and browser. If it scans there but not here, compare the crop above. If both fail, test better light, focus, or a still barcode photo.
          </p>
        </div>
      )}
    </aside>
  );
}

function ScannerBottomSheet({
  mode,
  sheetState,
  setSheetState,
  product,
  productIndex,
  expandedSection,
  setExpandedSection,
  onIngredientClick,
  onOpenProduct,
  onAddToDailyLog,
  dailyTotals,
  dailyLog,
  actionOpen,
  setActionOpen,
  platform,
  setPlatform,
  messageTone,
  setMessageTone,
  copied,
  setCopied,
  onPointerDown,
  onPointerUp,
  barcode,
  setBarcode,
  lookupLoading,
  onLookup,
  barcodePhotoLoading,
  onBarcodePhoto,
  activeFallback,
  openFallback,
  manualText,
  setManualText,
  manualCategory,
  setManualCategory,
  analyzeManual,
  capturedPhoto,
  labelPhoto,
  ocrReview,
  setOcrReview,
  applyOcrReview,
  finishProductPhoto,
  useSampleProduct,
  personalProfile
}) {
  if (!mode) return null;
  const isProduct = mode === "product" && product;
  const canPeek = isProduct;

  function toggleSheet(event) {
    if (event?.currentTarget?.dataset.dragged === "true") {
      delete event.currentTarget.dataset.dragged;
      return;
    }
    if (sheetState === "peek") setSheetState("mid");
    else if (sheetState === "mid") setSheetState("full");
    else setSheetState(canPeek ? "peek" : "mid");
  }

  return (
    <section
      key={`${mode}-${product?.id || "empty"}`}
      className={`scanner-sheet scanner-sheet-${sheetState} scanner-sheet-${mode}`}
      data-sheet-state={sheetState}
    >
      <button
        className="sheet-grabber"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={toggleSheet}
        aria-label={sheetState === "full" ? "Collapse scan result" : "Expand scan result"}
      >
        <span />
      </button>

      {isProduct && sheetState === "full" && (
        <button className="sheet-collapse-button" onClick={() => setSheetState("peek")} aria-label="Return to compact result">
          <ChevronDown size={20} />
        </button>
      )}

      {isProduct && sheetState !== "full" && (
        <>
          <ScannerResultBar product={product} onExpand={toggleSheet} />
          {sheetState === "mid" && <ScannerMiniDetails product={product} onExpand={() => setSheetState("full")} />}
        </>
      )}

      {isProduct && sheetState === "full" && (
        <div className="scanner-sheet-scroll">
          <ReportScreen
            product={product}
            productIndex={productIndex}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
            onIngredientClick={onIngredientClick}
            onOpenProduct={onOpenProduct}
            onAddToDailyLog={onAddToDailyLog}
            dailyTotals={dailyTotals}
            dailyLog={dailyLog}
            actionOpen={actionOpen}
            setActionOpen={setActionOpen}
            platform={platform}
            setPlatform={setPlatform}
            messageTone={messageTone}
            setMessageTone={setMessageTone}
            copied={copied}
            setCopied={setCopied}
            onCompleteLabel={openFallback}
            personalProfile={personalProfile}
          />
        </div>
      )}

      {mode === "not-found" && (
        <ScannerFallbackSheet
          title="We couldn't find this product"
          copy="You can still analyze the label or try a sample."
          barcode={barcode}
          setBarcode={setBarcode}
          lookupLoading={lookupLoading}
          onLookup={onLookup}
          barcodePhotoLoading={barcodePhotoLoading}
          onBarcodePhoto={onBarcodePhoto}
          activeFallback={activeFallback}
          openFallback={openFallback}
          manualText={manualText}
          setManualText={setManualText}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
          analyzeManual={analyzeManual}
          capturedPhoto={capturedPhoto}
          labelPhoto={labelPhoto}
          ocrReview={ocrReview}
          setOcrReview={setOcrReview}
          applyOcrReview={applyOcrReview}
          finishProductPhoto={finishProductPhoto}
          hasMatchedProduct={Boolean(product)}
          useSampleProduct={useSampleProduct}
        />
      )}

      {mode === "fallback" && (
        <ScannerFallbackSheet
          title="Can't scan?"
          copy="Choose another way to identify this product."
          barcode={barcode}
          setBarcode={setBarcode}
          lookupLoading={lookupLoading}
          onLookup={onLookup}
          barcodePhotoLoading={barcodePhotoLoading}
          onBarcodePhoto={onBarcodePhoto}
          activeFallback={activeFallback}
          openFallback={openFallback}
          manualText={manualText}
          setManualText={setManualText}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
          analyzeManual={analyzeManual}
          capturedPhoto={capturedPhoto}
          labelPhoto={labelPhoto}
          ocrReview={ocrReview}
          setOcrReview={setOcrReview}
          applyOcrReview={applyOcrReview}
          finishProductPhoto={finishProductPhoto}
          hasMatchedProduct={Boolean(product)}
          useSampleProduct={useSampleProduct}
        />
      )}
    </section>
  );
}

function ScannerResultBar({ product, onExpand }) {
  const isSummary = product.analysisPending || product.category === "medicine" || product.category === "textile";
  const primaryStatus = product.analysisPending
    ? "Needs label"
    : product.category === "medicine"
      ? "Label summary"
      : product.category === "textile"
        ? "Material summary"
        : `${product.score}/100`;
  const secondaryStatus = product.analysisPending
    ? "Partial"
    : product.category === "medicine"
      ? "Not health scored"
      : product.category === "textile"
        ? product.summaryStatus || product.rating
        : product.rating;
  return (
    <button className="scanner-result-bar" onClick={onExpand} aria-label={`Open report for ${product.name}`}>
      <ProductImage product={product} alt={product.name} />
      <div className="scanner-result-identity">
        <strong>{product.name}</strong>
        <span>{product.brand}</span>
      </div>
      <div className={`scanner-result-score ${isSummary ? "neutral" : getScoreClass(product.score)}`}>
        <i aria-hidden="true" />
        <div>
          <strong>{primaryStatus}</strong>
          <small>{secondaryStatus}</small>
        </div>
      </div>
    </button>
  );
}

function ScannerMiniDetails({ product, onExpand }) {
  const lines = product.category === "medicine" ? product.warnings : product.concerns;
  return (
    <div className="scanner-mini-details">
      <span className="scanner-mini-heading">Why this result</span>
      <div className="simple-list">
        {lines?.slice(0, 2).map((item) => (
          <div className="simple-row" key={item}>
            <span className={`status-dot ${product.analysisPending ? "yellow" : "red"}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button className="scanner-expand-button" onClick={onExpand}>View full report</button>
    </div>
  );
}

function ScannerFallbackSheet({
  title,
  copy,
  barcode,
  setBarcode,
  lookupLoading,
  onLookup,
  barcodePhotoLoading,
  onBarcodePhoto,
  activeFallback,
  openFallback,
  manualText,
  setManualText,
  manualCategory,
  setManualCategory,
  analyzeManual,
  capturedPhoto,
  labelPhoto,
  ocrReview,
  setOcrReview,
  applyOcrReview,
  finishProductPhoto,
  hasMatchedProduct,
  useSampleProduct
}) {
  function handleBarcodeSubmit(event) {
    event.preventDefault();
    onLookup(barcode);
  }

  return (
    <div className="scanner-fallback-sheet">
      <div className="sheet-title">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="fallback-tabs" role="tablist" aria-label="Product lookup options">
        {[
          ["barcode", "Barcode"],
          ["label", "Label"],
          ["paste", "Ingredients"],
          ["photo", "Photo"]
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={activeFallback === value}
            className={activeFallback === value ? "active" : ""}
            onClick={() => openFallback(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeFallback === "barcode" && (
        <div className="scanner-fallback-panel">
          <div className="fallback-panel-copy">
            <strong>Enter barcode</strong>
            <span>Use the digits printed below the bars.</span>
          </div>
          <form className="inline-form" onSubmit={handleBarcodeSubmit}>
            <input
              id={`barcode-input-${title.replace(/\W+/g, "-").toLowerCase()}`}
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Try 3017620422003"
              inputMode="numeric"
              autoComplete="off"
            />
            <button type="submit" disabled={lookupLoading}>{lookupLoading ? "Checking" : "Lookup"}</button>
          </form>
          <button className="barcode-photo-button" onClick={onBarcodePhoto} disabled={barcodePhotoLoading}>
            <Camera size={17} />
            {barcodePhotoLoading ? "Reading photo" : "Scan a barcode photo"}
          </button>
        </div>
      )}

      {activeFallback === "paste" && (
        <div className="scanner-fallback-panel">
          <ManualIngredientPanel
            manualText={manualText}
            setManualText={setManualText}
            manualCategory={manualCategory}
            setManualCategory={setManualCategory}
            analyzeManual={analyzeManual}
          />
        </div>
      )}

      {activeFallback === "label" && (
        <div className="scanner-fallback-panel">
          <div className="fallback-panel-copy">
            <strong>Add label photo</strong>
            <span>Complete missing ingredients, nutrition, or warnings.</span>
          </div>
          <button className="primary-button fallback-primary-action" onClick={() => document.getElementById("label-photo")?.click()}>
            <Camera size={17} />
            {labelPhoto ? "Replace label photo" : "Take or upload label"}
          </button>
          {labelPhoto && <img className="scanner-photo-preview" src={labelPhoto} alt="Label selected for review" />}
          {ocrReview && <OcrReviewPanel review={ocrReview} setReview={setOcrReview} applyOcrReview={applyOcrReview} />}
        </div>
      )}

      {activeFallback === "photo" && (
        <div className="scanner-fallback-panel">
          <div className="fallback-panel-copy">
            <strong>Add a product photo</strong>
            <span>Use the front of the package in this report.</span>
          </div>
          {!capturedPhoto && (
            <button className="primary-button fallback-primary-action" onClick={() => document.getElementById("product-photo")?.click()}>
              <Camera size={17} />
              Take or upload photo
            </button>
          )}
          {capturedPhoto && <img className="scanner-photo-preview" src={capturedPhoto} alt="User-selected product" />}
          {capturedPhoto && finishProductPhoto && hasMatchedProduct && (
            <button className="primary-button full" onClick={finishProductPhoto}>
              <Check size={17} />
              Use this photo
            </button>
          )}
          {capturedPhoto && !hasMatchedProduct && (
            <span className="photo-ready-note">Photo ready. Add label details or ingredients to build the report.</span>
          )}
        </div>
      )}

      <button className="fallback-sample-link" onClick={useSampleProduct}>Try a demo product</button>
    </div>
  );
}

function ManualIngredientPanel({
  manualText,
  setManualText,
  manualCategory,
  setManualCategory,
  analyzeManual
}) {
  return (
    <div className="manual-inline-panel">
      <div className="fallback-panel-copy">
        <strong>Paste ingredients</strong>
        <span>Choose the product type, then paste the label.</span>
      </div>
      <textarea
        id="ingredient-paste"
        value={manualText}
        onChange={(event) => setManualText(event.target.value)}
        placeholder="Paste an ingredient list here"
      />
      <div className="chip-selector">
        {[
          ["food", "Food"],
          ["beauty", "Beauty"],
          ["household", "Household"],
          ["medicine", "Medicine"],
          ["textile", "Fabric"],
          ["not-sure", "Not Sure"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={manualCategory === value ? "selected" : ""}
            onClick={() => setManualCategory(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <button className="primary-button full" onClick={analyzeManual} disabled={!manualText.trim()}>
        <Sparkles size={18} />
        Analyze
      </button>
    </div>
  );
}

function LabelCompletionSheet({ review, setReview, onApply, onPhotoSelected, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="ingredient-sheet label-completion-sheet" role="dialog" aria-modal="true" aria-label="Complete product label" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <span className="eyebrow">Manual review</span>
            <h2>Help complete this product</h2>
          </div>
          <button onClick={onClose} aria-label="Close label completion"><X size={20} /></button>
        </div>
        <label className="label-photo-action">
          <Camera size={18} />
          <span>{review.userPhoto ? "Replace product photo" : "Add product photo"}</span>
          <input type="file" accept="image/*" capture="environment" onChange={(event) => onPhotoSelected(event.target.files?.[0])} />
        </label>
        {review.userPhoto && <img className="label-photo-preview" src={review.userPhoto} alt="User-provided product" />}
        <OcrReviewPanel review={review} setReview={setReview} applyOcrReview={onApply} />
      </div>
    </div>
  );
}

function OcrReviewPanel({ review, setReview, applyOcrReview }) {
  function updateField(field, value) {
    setReview((current) => ({ ...current, [field]: value }));
  }

  function updateNutrition(field, value) {
    setReview((current) => ({
      ...current,
      nutrition: { ...(current.nutrition || {}), [field]: value }
    }));
  }

  const primaryLabelText =
    review.category === "textile"
      ? review.materialsText || review.ingredientsText || ""
      : review.ingredientsText || "";
  const hasNutritionInput = review.category === "food" && [
    review.nutrition?.servingSize,
    ...NUTRITION_FIELD_NAMES.map((field) => review.nutrition?.[field])
  ].some((value) => value !== null && value !== undefined && String(value).trim() !== "");
  const invalidNutritionFields = review.category === "food"
    ? NUTRITION_FIELD_NAMES.filter((field) => {
        const value = review.nutrition?.[field];
        return value !== null && value !== undefined && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0);
      })
    : [];
  const hasReviewData = Boolean(
    review.category
      || primaryLabelText.trim()
      || review.activeIngredient?.trim()
      || review.warningsText?.trim()
      || review.careText?.trim()
      || review.allergensText?.trim()
      || review.userPhoto
      || hasNutritionInput
  );

  return (
    <section id="ocr-review" className="card ocr-review-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Label review</span>
          <h2>Confirm label text</h2>
        </div>
        <ConfidenceBadge status="Manual Review" />
      </div>
      <p className="review-note">Enter or confirm what the label shows. Your report stays in manual review until the details are checked.</p>
      <div className="review-grid">
        <label>
          <span>Product name</span>
          <input value={review.productName || ""} onChange={(event) => updateField("productName", event.target.value)} />
        </label>
        <label>
          <span>Brand</span>
          <input value={review.brand || ""} onChange={(event) => updateField("brand", event.target.value)} />
        </label>
      </div>
      <div className="chip-selector">
        {[
          ["food", "Food"],
          ["beauty", "Beauty"],
          ["household", "Household"],
          ["medicine", "Medicine"],
          ["textile", "Fabric"],
          ["unknown", "Not Sure"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={review.category === value ? "selected" : ""}
            onClick={() =>
              setReview((current) =>
                ({
                  ...createBlankLabelDraft(value, current.mode, {
                    name: current.productName,
                    brand: current.brand
                  }),
                  userPhoto: current.userPhoto || ""
                })
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
      <label className="full-label">
        <span>{review.category === "textile" ? "Materials" : review.category === "medicine" ? "Active/inactive ingredients" : "Ingredients"}</span>
        <textarea
          value={primaryLabelText}
          onChange={(event) => updateField(review.category === "textile" ? "materialsText" : "ingredientsText", event.target.value)}
        />
      </label>
      {review.category === "food" && (
        <>
          <label className="full-label nutrition-serving-field">
            <span>Nutrition basis</span>
            <select value={review.nutrition?.basis || "serving"} onChange={(event) => updateNutrition("basis", event.target.value)}>
              <option value="serving">Per serving</option>
              <option value="100g">Per 100 g</option>
              <option value="100ml">Per 100 ml</option>
            </select>
          </label>
          <label className="full-label nutrition-serving-field">
            <span>Serving size</span>
            <input
              value={review.nutrition?.servingSize ?? ""}
              placeholder="Example: 2 tbsp (37g)"
              onChange={(event) => updateNutrition("servingSize", event.target.value)}
            />
          </label>
          <div className="nutrition-editor">
            {[
              ["calories", "Calories", "200"],
              ["protein", "Protein (g)", "8"],
              ["carbs", "Carbs (g)", "24"],
              ["fat", "Fat (g)", "9"],
              ["saturatedFat", "Saturated fat (g)", "3"],
              ["fiber", "Fiber (g)", "4"],
              ["sugar", "Sugar (g)", "6"],
              ["sodium", "Sodium (mg)", "180"]
            ].map(([field, label, example]) => (
              <label key={field}>
                <span>{label}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={review.nutrition?.[field] ?? ""}
                  placeholder={`Example: ${example}`}
                  onChange={(event) => updateNutrition(field, event.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="full-label">
            <span>Allergens</span>
            <textarea
              value={review.allergensText || ""}
              placeholder="Example: milk, wheat, soy"
              onChange={(event) => updateField("allergensText", event.target.value)}
            />
          </label>
        </>
      )}
      {review.category === "medicine" && (
        <div className="review-grid medicine-review">
          <label>
            <span>Active ingredient</span>
            <input value={review.activeIngredient || ""} onChange={(event) => updateField("activeIngredient", event.target.value)} />
          </label>
          <label>
            <span>Purpose</span>
            <input value={review.purpose || ""} onChange={(event) => updateField("purpose", event.target.value)} />
          </label>
          <label className="full-label">
            <span>Warnings</span>
            <textarea value={review.warningsText || ""} onChange={(event) => updateField("warningsText", event.target.value)} />
          </label>
        </div>
      )}
      {(review.category === "beauty" || review.category === "household") && (
        <label className="full-label">
          <span>{review.category === "household" ? "Caution notes" : "Sensitivity notes"}</span>
          <textarea
            value={review.warningsText || ""}
            placeholder={review.category === "household" ? "Avoid eye contact, keep away from children..." : "Fragrance, allergens, sensitive skin notes..."}
            onChange={(event) => updateField("warningsText", event.target.value)}
          />
        </label>
      )}
      {review.category === "textile" && (
        <label className="full-label">
          <span>Care notes</span>
          <textarea
            value={review.careText || "Wash before first use. Review dyes and finishing treatments."}
            onChange={(event) => updateField("careText", event.target.value)}
          />
        </label>
      )}
      <details className="raw-ocr-details">
        <summary>Full label text</summary>
        <textarea value={review.text || ""} onChange={(event) => updateField("text", event.target.value)} />
      </details>
      {invalidNutritionFields.length > 0 && (
        <p className="review-validation" role="alert">Nutrition values must be zero or greater.</p>
      )}
      <button
        className="primary-button full"
        onClick={applyOcrReview}
        disabled={!hasReviewData || invalidNutritionFields.length > 0}
      >
        <Check size={18} />
        Confirm and Analyze
      </button>
    </section>
  );
}

const featuredSampleIds = [
  "pop-secret",
  "skinny-pop",
  "shampoo",
  "detergent",
  "ibuprofen",
  "cotton-shirt",
  "polyester-shirt",
  "body-scrubber"
];

function SearchScreen({ query, setQuery, results, status, lastSearchTerm, searchMeta, selectedRegionId, onSearch, onGlobalFallback, onOpenProduct }) {
  const samples = featuredSampleIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean)
    .slice(0, 5);
  const showIntro = !query.trim();
  const selectedRegion = getProductRegionConfig(selectedRegionId);
  const showingGlobalFallback = selectedRegion.id !== "global" && searchMeta.regionId === "global";

  return (
    <div className="stack">
      <Header eyebrow="Search" title="Search" />
      <form
        className="search-box"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(query);
        }}
      >
        <Search size={20} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search food products"
        />
        <button type="submit" aria-label="Submit search">
          <ChevronRight size={20} />
        </button>
      </form>
      <div className="search-region-context">
        <span>{showingGlobalFallback ? "Showing global results" : `Product region: ${selectedRegion.label}`}</span>
      </div>
      {status === "searching" ? (
        <EmptyState title="Searching products" copy="Looking for matching food labels and images." />
      ) : showIntro ? (
        <>
          <EmptyState title="Search by product name" copy="Find food products, nutrition, and ingredient details." />
          <SampleDisclosure title="Try a sample">
            {samples.map((product) => (
              <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
            ))}
          </SampleDisclosure>
        </>
      ) : (
        <section className="stack small-gap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Results</span>
              <h2>{lastSearchTerm ? `Results for ${lastSearchTerm}` : "Search results"}</h2>
            </div>
          </div>
          {results.length ? (
            <>
              {results.map((product) => (
                <ProductListCard key={product.id} product={product} showMarketMeta onClick={() => onOpenProduct(product.id)} />
              ))}
              {searchMeta.fallbackAvailable && !searchMeta.hasStrongRegionMatch && selectedRegion.id !== "global" && !showingGlobalFallback && (
                <div className="search-global-fallback">
                  <span>No strong match found in your selected region.</span>
                  <button type="button" onClick={onGlobalFallback}>Search global results</button>
                </div>
              )}
            </>
          ) : status === "ready" ? (
            <EmptyState title="Ready to search" copy="Press Enter to look up matching products." />
          ) : (
            <>
              <EmptyState
                title={searchMeta.fallbackAvailable && selectedRegion.id !== "global" ? "No strong regional match" : "No products found"}
                copy={searchMeta.fallbackAvailable && selectedRegion.id !== "global" ? "Try global results or scan the barcode." : "Try another product name or scan a barcode."}
              />
              {searchMeta.fallbackAvailable && selectedRegion.id !== "global" && !showingGlobalFallback && (
                <button className="search-global-button" type="button" onClick={onGlobalFallback}>Search global results</button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function TopScreen({ productIndex, realProducts, onOpenProduct, onOpenProfile }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const shownProducts = featuredSampleIds
    .map((id) => productIndex.get(id))
    .filter(Boolean)
    .filter((product) => selectedCategory === "all" || product.category === selectedCategory)
    .slice(0, 6);
  const shownRealProducts = realProducts
    .filter((product) => selectedCategory === "all" || product.category === selectedCategory)
    .slice(0, 6);
  const categoryFilters = [
    ["all", "All"],
    ["food", "Food"],
    ["beauty", "Beauty"],
    ["household", "Home"],
    ["medicine", "Medicine"],
    ["textile", "Fabric"]
  ];
  return (
    <div className="stack">
      <Header
        eyebrow="Top"
        title="Popular picks"
        action={(
          <button className="header-icon-button" onClick={onOpenProfile} aria-label="Open profile">
            <User size={21} />
          </button>
        )}
      />
      <div className="filter-tabs" role="group" aria-label="Product category">
        {categoryFilters.map(([value, label]) => (
          <button key={value} className={selectedCategory === value ? "active" : ""} onClick={() => setSelectedCategory(value)}>
            {label}
          </button>
        ))}
      </div>
      {shownRealProducts.length > 0 ? (
        <section className="stack small-gap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Your lookups</span>
              <h2>Recently found</h2>
            </div>
          </div>
          {shownRealProducts.map((product) => (
            <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
          ))}
        </section>
      ) : (
        <EmptyState title="No products here yet" copy="Scan or search to build your real product list." />
      )}
      <SampleDisclosure title="Try sample products">
        {shownProducts.map((product) => (
          <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
        ))}
        {!shownProducts.length && <EmptyState title="No sample in this category" copy="Choose another category." compact />}
      </SampleDisclosure>
    </div>
  );
}

function SampleDisclosure({ title, children }) {
  return (
    <details className="sample-disclosure">
      <summary>
        <span>
          <Sparkles size={17} />
          <strong>{title}</strong>
          <small>Optional demo</small>
        </span>
        <ChevronDown size={19} />
      </summary>
      <div className="sample-disclosure-body stack small-gap">{children}</div>
    </details>
  );
}

function getMissingProductFields(product) {
  const missing = [];
  const fieldMissing = (field) => product.fieldConfidence?.[field] === "Missing";
  const add = (label) => {
    if (!missing.includes(label)) missing.push(label);
  };

  if (!product.image && !product.userPhoto) add("Product photo");

  if (product.category === "unknown") {
    add("Product type");
    add("Product label");
  } else if (product.category === "food") {
    if (!product.ingredients?.length || fieldMissing("ingredients")) add("Ingredients");
    if (!hasCoreFoodNutrition(product.nutrition) || fieldMissing("nutrition")) add("Nutrition facts");
    if (
      hasCoreFoodNutrition(product.nutrition)
      && (product.nutrition?.basis || "serving") === "serving"
      && !cleanText(product.nutrition?.servingSize)
    ) add("Serving size");
    if (fieldMissing("additives")) add("Additives");
    if (fieldMissing("allergens")) add("Allergens");
  } else if (product.category === "medicine") {
    if (!product.activeIngredient || /scan label|review active/i.test(product.activeIngredient)) add("Active ingredient");
    if (!product.warnings?.length || fieldMissing("warnings")) add("Warnings");
    if (!product.inactiveIngredients?.length || fieldMissing("inactiveIngredients")) add("Inactive ingredients");
  } else if (product.category === "textile") {
    if (!(product.materials?.length || product.ingredients?.length) || fieldMissing("materials")) add("Materials");
    if (!product.treatmentNotes || /scan or paste|not found/i.test(product.treatmentNotes) || fieldMissing("care")) add("Care or treatment notes");
  } else {
    if (!product.ingredients?.length || fieldMissing("ingredients")) add("Ingredients");
    if (product.category === "household" && (product.analysisPending || fieldMissing("cautions"))) add("Warning label");
  }

  return missing;
}

function getProductFieldCompleteness(product) {
  const confidence = product.fieldConfidence || {};
  const available = (field, fallback) => {
    if (confidence[field] === "Missing") return "Missing";
    if (confidence[field] === "Partial") return "Partial";
    return fallback ? "Available" : "Missing";
  };
  const fields = [
    {
      label: "Product identity",
      status: product.name && !/^barcode product|^food product/i.test(product.name) ? available("identity", true) : "Partial"
    },
    { label: "Product image", status: product.image || product.userPhoto ? "Available" : "Missing" },
    {
      label: "Category",
      status: product.category === "unknown" ? "Needs label" : product.analysisPending && product.sourceType === "barcode-provider" ? "Inferred" : "Available"
    }
  ];

  if (product.category === "textile") {
    fields.push({ label: "Materials", status: available("materials", Boolean(product.materials?.length || product.ingredients?.length)) });
    fields.push({ label: "Care details", status: available("care", Boolean(product.treatmentNotes)) });
  } else if (product.category === "medicine") {
    fields.push({ label: "Active ingredient", status: available("activeIngredient", Boolean(product.activeIngredient)) });
    fields.push({ label: "Warnings", status: available("warnings", Boolean(product.warnings?.length)) });
  } else {
    fields.push({ label: "Ingredients", status: available("ingredients", Boolean(product.ingredients?.length)) });
    if (product.category === "food") {
      fields.push({ label: "Nutrition", status: available("nutrition", hasCoreFoodNutrition(product.nutrition)) });
      if ((product.nutrition?.basis || "serving") === "serving") {
        fields.push({ label: "Serving size", status: cleanText(product.nutrition?.servingSize) ? "Available" : "Needs label" });
      }
      fields.push({
        label: "Additives / allergens",
        status: confidence.additives === "Missing" || confidence.allergens === "Missing" ? "Missing" : "Available"
      });
    } else if (product.category === "household") {
      fields.push({ label: "Warning label", status: available("cautions", Boolean(product.safetyNotes?.length)) });
    }
  }
  return fields.slice(0, 6);
}

function LabelCompletionPanel({ product, onCompleteLabel }) {
  const missingFields = getMissingProductFields(product);
  if (!missingFields.length) return null;
  const fields = getProductFieldCompleteness(product);
  const onlyImageMissing = missingFields.length === 1 && missingFields[0] === "Product photo";
  const onlyIngredientsMissing = missingFields.every((field) => ["Ingredients", "Additives", "Allergens"].includes(field));
  const actionMode = onlyImageMissing ? "photo" : onlyIngredientsMissing ? "paste" : "label";
  const actionLabel = onlyImageMissing
    ? "Add product photo"
    : missingFields.includes("Nutrition facts")
      ? "Add nutrition facts"
      : missingFields.includes("Serving size")
        ? "Add serving size"
        : missingFields.includes("Product type")
          ? "Confirm category"
          : missingFields.includes("Allergens") && !missingFields.includes("Ingredients")
            ? "Add allergens"
            : "Add ingredient list";
  const content = (
    <>
      <div className="label-completion-heading">
        <span className="label-completion-icon"><Pencil size={18} /></span>
        <div>
          <span className="eyebrow">Needs label</span>
          <h2>Help complete this product</h2>
          <p>Keep the product match and add only what is missing.</p>
        </div>
        <ChevronRight size={19} />
      </div>
      <div className="field-completeness" aria-label="Product data completeness">
        {fields.map((field) => (
          <span key={field.label}>
            <small>{field.label}</small>
            <strong className={`field-status-${field.status.toLowerCase().replace(/\s+/g, "-")}`}>{field.status}</strong>
          </span>
        ))}
      </div>
      <span className="label-completion-cta">
        <Pencil size={16} />
        {actionLabel}
      </span>
    </>
  );
  if (!onCompleteLabel) return <section className="label-completion-card">{content}</section>;
  return (
    <button className="label-completion-card is-action" onClick={() => onCompleteLabel(actionMode)}>
      {content}
    </button>
  );
}

function PersonalAlerts({ alerts }) {
  if (!alerts?.length) return null;
  const alertIcons = {
    allergy: AlertTriangle,
    avoid: Minus,
    preference: ShieldCheck,
    watchlist: Bell,
    data: Info
  };
  return (
    <section className="card personal-alerts-card" aria-labelledby="personal-alerts-title">
      <div className="personal-alerts-heading">
        <div>
          <span className="eyebrow">For you</span>
          <h2 id="personal-alerts-title">Personal alerts</h2>
        </div>
        <span>{alerts.length}</span>
      </div>
      <div className="personal-alert-list">
        {alerts.map((alert) => {
          const AlertIcon = alertIcons[alert.kind] || Info;
          return (
            <div className={`personal-alert-row personal-alert-${alert.kind}`} key={`${alert.kind}-${alert.title}`}>
              <i><AlertIcon size={17} /></i>
              <div>
                <span>{alert.label}</span>
                <strong>{alert.title}</strong>
                <small>{alert.message}</small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReportScreen({
  product,
  productIndex,
  expandedSection,
  setExpandedSection,
  onIngredientClick,
  onOpenProduct,
  onAddToDailyLog,
  dailyTotals,
  dailyLog,
  actionOpen,
  setActionOpen,
  platform,
  setPlatform,
  messageTone,
  setMessageTone,
  copied,
  setCopied,
  onCompleteLabel,
  personalProfile
}) {
  const meta = categoryMeta[product.category];
  const Icon = meta.icon;
  const ingredients = useMemo(
    () => (product.ingredients || []).map((ingredient) => upgradeLegacyIngredientRecord(ingredient, product.category)),
    [product.category, product.ingredients]
  );
  const intelligenceProduct = useMemo(
    () => ({ ...product, ingredients }),
    [ingredients, product]
  );
  const counts = getRiskCounts(ingredients);
  const isMedicine = product.category === "medicine";
  const isTextile = product.category === "textile";
  const isSummary = isMedicine || isTextile || product.analysisPending;
  const scoreClass = isSummary ? "score-neutral" : getScoreClass(product.score);
  const confidenceStatus = getConfidence(product);
  const imageStatus = getImageStatus(product);
  const showImageStatus = imageStatus !== confidenceStatus && ["Placeholder", "User Photo"].includes(imageStatus);
  const concerns = product.concerns || [];
  const positives = product.positives || [];
  const additives = getProductAdditives(intelligenceProduct);
  const allergens = getAllergenGroups(product.allergens);
  const nutritionCount = getAvailableNutritionRows(product.nutrition).length;
  const unclassifiedIngredientCount = ingredients.filter((ingredient) => ingredient.classificationKind === "unknown").length;
  const ingredientSubtitle = ingredients.length
    ? `${ingredients.length} ingredients · ${counts.moderate + counts.harmful} flagged${unclassifiedIngredientCount ? ` · ${unclassifiedIngredientCount} need review` : ""}`
    : "Needs label";
  const personalAlerts = useMemo(
    () => getPersonalAlerts(intelligenceProduct, personalProfile),
    [intelligenceProduct, personalProfile]
  );

  return (
    <div className="stack report-screen">
      <section className="report-hero">
        <ProductImage product={product} alt={product.name} />
        <div className="report-copy">
          <div className={`category-pill ${meta.tone}`}>
            <Icon size={14} />
            {meta.label}
          </div>
          <h1>{product.name}</h1>
          <p>{product.brand}</p>
          <div className="data-badges">
            <ConfidenceBadge status={confidenceStatus} />
            {showImageStatus && <ConfidenceBadge status={imageStatus} />}
            {product.overrideApplied && <span className="label-info-badge">Updated with your label info</span>}
          </div>
          <div className={`score-block ${scoreClass}`}>
            <span className="score-status-dot" />
            <div>
              <strong>
                {product.analysisPending ? "Needs Label" : isMedicine ? "Label Summary" : isTextile ? "Material Summary" : `${product.score}/100`}
              </strong>
              <span>{product.analysisPending ? product.summaryStatus || "Scan label to score" : isSummary ? product.summaryStatus : product.rating}</span>
            </div>
          </div>
        </div>
      </section>

      <PersonalAlerts alerts={personalAlerts} />

      {product.category === "food" && (
        <PlateReportAction
          product={product}
          alreadyAdded={dailyLog?.some((entry) => entry.productId === product.id)}
          onAdd={() => onAddToDailyLog(product)}
        />
      )}

      {isMedicine ? (
        <>
          <MedicineSummary product={product} />
          <LabelCompletionPanel product={product} onCompleteLabel={onCompleteLabel} />
          <section className="note-card">
            This is a label summary, not medical advice. Follow the product label and ask a doctor or pharmacist if unsure.
          </section>
        </>
      ) : (
        <>
          <ExpandableSection
            id="concerns"
            title={isTextile ? "Material notes" : "Main concerns"}
            subtitle={`${concerns.length} ${concerns.length === 1 ? "concern" : "concerns"}`}
            icon={AlertTriangle}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <ReportFactList items={concerns} tone="red" kind="concern" />
          </ExpandableSection>

          <ExpandableSection
            id="positives"
            title="Positives"
            subtitle={`${product.positives?.length || 0} ${product.positives?.length === 1 ? "positive" : "positives"}`}
            icon={Check}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <ReportFactList items={positives} tone="green" kind="positive" />
          </ExpandableSection>

          <ExpandableSection
            id="ingredients"
            title={isTextile ? "Materials" : "Ingredients"}
            subtitle={isTextile ? `${ingredients.length} materials listed` : ingredientSubtitle}
            icon={Info}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            {ingredients.length ? (
              <IngredientRows ingredients={ingredients} category={product.category} displayMode={personalProfile?.ingredientDisplayMode} onIngredientClick={onIngredientClick} />
            ) : (
              <MissingReportData copy={isTextile ? "Add the material tag to complete this summary." : "Add the ingredient label to complete this report."} />
            )}
          </ExpandableSection>

          <LabelCompletionPanel product={product} onCompleteLabel={onCompleteLabel} />

          {isTextile ? <TextileSummary product={product} /> : null}

          {product.category === "food" && (
            <>
              <ExpandableSection
                id="nutrition"
                title="Nutrition"
                subtitle={nutritionCount ? "Tap for details" : "Needs label"}
                icon={Utensils}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              >
                <FoodNutrition product={product} embedded />
              </ExpandableSection>

              <ExpandableSection
                id="additives"
                title="Additives"
                subtitle={additives.length ? `${additives.length} listed` : product.fieldConfidence?.additives === "Missing" ? "Needs label" : "None listed"}
                icon={FlaskConical}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              >
                {additives.length ? (
                  <IngredientRows ingredients={additives} category={product.category} displayMode={personalProfile?.ingredientDisplayMode} onIngredientClick={onIngredientClick} additive />
                ) : (
                  <MissingReportData copy={product.fieldConfidence?.additives === "Missing" ? "Add the ingredient label to review additives." : "No additives are listed in the available product data."} />
                )}
              </ExpandableSection>

              <ExpandableSection
                id="processing"
                title="Processing"
                subtitle={product.processing || "Not evaluated"}
                icon={Zap}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              >
                <ProcessingDetails product={intelligenceProduct} />
              </ExpandableSection>

              <ExpandableSection
                id="allergens"
                title="Allergens"
                subtitle={getAllergenSubtitle(allergens, product.allergens)}
                icon={ShieldCheck}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              >
                <AllergenDetails groups={allergens} rawValue={product.allergens} />
              </ExpandableSection>

              {!product.analysisPending && (
                <ExpandableSection
                  id="evaluation"
                  title="How this was evaluated"
                  subtitle="4 evaluation areas"
                  icon={FlaskConical}
                  expandedSection={expandedSection}
                  setExpandedSection={setExpandedSection}
                >
                  <EvaluationSummary product={intelligenceProduct} />
                </ExpandableSection>
              )}
            </>
          )}

          {product.category === "household" && (
            <ExpandableSection
              id="safety"
              title="Safety notes"
              subtitle={`${product.safetyNotes?.length || 0} label cautions`}
              icon={ShieldCheck}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <div className="simple-list">
                {product.safetyNotes?.map((note) => (
                  <div className="simple-row" key={note}>
                    <span className="status-dot yellow" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          <Alternatives
            product={product}
            productIndex={productIndex}
            onOpenProduct={onOpenProduct}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          />
        </>
      )}
    </div>
  );
}

function ReportFactList({ items, tone, kind }) {
  if (!items.length) return <MissingReportData copy={kind === "positive" ? "No verified positives are available." : "No concerns are listed in the available data."} />;
  return (
    <div className="report-row-list">
      {items.map((item) => (
        <div className="report-fact-row" key={item}>
          <span className={`status-dot ${tone}`} />
          <div>
            <strong>{item}</strong>
            <span>{getFactExplanation(item, kind)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getFactExplanation(item, kind) {
  const text = item.toLowerCase();
  if (kind === "positive") {
    if (text.includes("sugar")) return "Lower sugar in the available serving data.";
    if (text.includes("protein")) return "A useful amount of protein per serving.";
    if (text.includes("fiber")) return "Provides fiber in the available nutrition data.";
    if (text.includes("ingredient")) return "The available ingredient list is comparatively short.";
    return "A favorable feature in the available product data.";
  }
  if (text.includes("additive")) return "The label lists additives that may merit a closer look.";
  if (text.includes("ultra") || text.includes("processing")) return "The formulation appears highly processed.";
  if (text.includes("sodium")) return "Sodium is elevated for the available serving data.";
  if (text.includes("sugar")) return "Sugar is elevated for the available serving data.";
  if (text.includes("saturated")) return "Saturated fat is elevated for the available serving data.";
  return "Flagged for review based on the available product data.";
}

function MissingReportData({ copy }) {
  return <p className="report-missing">{copy}</p>;
}

function IngredientRows({ ingredients, category, onIngredientClick, additive = false, displayMode = "translated" }) {
  return (
    <div className="report-row-list ingredient-row-list">
      {ingredients.map((ingredient, index) => {
        const display = getIngredientDisplayName(ingredient, displayMode);
        const risk = riskMeta[ingredient.risk] || riskMeta.unknown;
        const statusLabel = ingredient.statusLabel || risk.label;
        const statusTone = ingredient.risk === "harmful"
          ? "red"
          : ingredient.risk === "moderate" || ingredient.risk === "unknown" || ingredient.processingMarkers?.length
            ? "yellow"
            : "green";
        return (
          <button
            className="ingredient-report-row"
            key={`${ingredient.canonicalName || ingredient.name}-${ingredient.type || index}`}
            onClick={() => onIngredientClick({ ...ingredient, productCategory: category, ingredientDisplayMode: displayMode })}
          >
            <span className={`status-dot ${statusTone}`} />
            <span className="ingredient-report-copy">
              <strong>{display.primaryName}</strong>
              <small>{[display.secondaryText, ingredient.type || (additive ? "Listed additive" : "Purpose not available")].filter(Boolean).join(" · ")}</small>
            </span>
            <span className={`ingredient-risk-label ${risk.className}`}>{statusLabel}</span>
            <ChevronRight size={17} />
          </button>
        );
      })}
    </div>
  );
}

function normalizeListedName(value) {
  const cleaned = cleanText(value).replace(/^[a-z]{2}:/i, "").replace(/_/g, " ").replace(/-/g, " ");
  if (/^e\s*\d+/i.test(cleaned)) return cleaned.replace(/^e\s*/i, "E").toUpperCase();
  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProductAdditives(product) {
  const ingredientAdditives = (product.ingredients || []).filter((ingredient) =>
    /additive|preservative|color|flavo[u]?r|emulsifier|stabili[sz]er|sweetener/i.test(`${ingredient.type || ""} ${ingredient.name}`)
  );
  const tagAdditives = (product.additives?.tags || []).map((tag) => {
    const name = normalizeListedName(tag);
    const matchingIngredient = (product.ingredients || []).find((ingredient) => {
      const ingredientName = ingredient.name.toLowerCase();
      const tagName = name.toLowerCase();
      return ingredientName === tagName || ingredientName.includes(tagName) || tagName.includes(ingredientName);
    });
    return matchingIngredient || createIngredientRecordFromLabel(name, "food");
  });
  const unique = new Map();
  [...ingredientAdditives, ...tagAdditives].forEach((item) => unique.set(item.name.toLowerCase(), item));
  return [...unique.values()];
}

function getAvailableNutritionRows(nutrition = {}) {
  const definitions = [
    ["Serving size", "servingSize", ""],
    ["Calories", "calories", ""],
    ["Protein", "protein", "g"],
    ["Carbohydrates", "carbs", "g"],
    ["Fat", "fat", "g"],
    ["Saturated fat", "saturatedFat", "g"],
    ["Sugar", "sugar", "g"],
    ["Fiber", "fiber", "g"],
    ["Sodium", "sodium", "mg"]
  ];
  return definitions
    .filter(([, key]) => key === "servingSize" ? Boolean(cleanText(nutrition[key])) : hasNumber(nutrition[key]))
    .map(([label, key, unit]) => ({ label, value: `${nutrition[key]}${unit}` }));
}

function getAllergenGroups(value) {
  const raw = cleanText(value);
  if (!raw || /no major|not listed|unknown|none/i.test(raw)) return { contains: [], mayContain: [] };
  const normalized = raw.replace(/^contains\s+/i, "");
  const parts = normalized.split(/\bmay contain\b/i);
  const parse = (text) => text
    .split(/,|\band\b|;/i)
    .map((item) => cleanText(item).replace(/^[:\s-]+/, ""))
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  return { contains: parse(parts[0] || ""), mayContain: parse(parts[1] || "") };
}

function getAllergenSubtitle(groups, rawValue) {
  const listed = [...groups.contains, ...groups.mayContain];
  if (listed.length) return listed.slice(0, 3).join(", ");
  return rawValue ? "No major allergens listed" : "Needs label";
}

function AllergenDetails({ groups, rawValue }) {
  if (!groups.contains.length && !groups.mayContain.length) {
    return <MissingReportData copy={rawValue ? "No major allergens are listed in the available data. Review the physical label to confirm." : "The allergen statement is not available. Review the physical label before use."} />;
  }
  return (
    <div className="allergen-groups">
      {groups.contains.length > 0 && <AllergenGroup title="Contains" items={groups.contains} />}
      {groups.mayContain.length > 0 && <AllergenGroup title="May contain" items={groups.mayContain} />}
      <p>Review the physical label for the most current allergen statement.</p>
    </div>
  );
}

function AllergenGroup({ title, items }) {
  return (
    <div>
      <strong>{title}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function ProcessingDetails({ product }) {
  const processing = product.processing;
  if (!processing || /unknown/i.test(processing)) return <MissingReportData copy="Processing could not be evaluated from the available label data." />;
  const reasons = [];
  if (/ultra/i.test(processing)) reasons.push("The available product data classifies the formulation as highly processed.");
  if ((product.additives?.count || 0) > 0) reasons.push("The label lists formulated additives.");
  if ((product.ingredients || []).length > 10) reasons.push("The available ingredient list is relatively long.");
  if (!reasons.length) reasons.push("This classification comes from the available formulation and label data.");
  const nova = product.breakdown?.find((item) => item.label === "Processing")?.detail?.match(/NOVA\s+\d/i)?.[0];
  return (
    <div className="processing-details">
      <strong>{processing}</strong>
      <p>This product appears {processing.toLowerCase()} because:</p>
      <ul>{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      {nova && <span>{nova} · a secondary processing classification</span>}
      <small>Processing describes formulation, not a medical diagnosis.</small>
    </div>
  );
}

function getEvaluationState(product, area) {
  const counts = getRiskCounts(product.ingredients || []);
  if (area === "nutrition") {
    if (!hasCoreFoodNutrition(product.nutrition)) return "Needs data";
    const value = product.scoring?.nutrition;
    if (!hasNumber(value)) return "Not evaluated";
    if (value >= 42) return "Excellent";
    if (value >= 34) return "Good";
    if (value >= 24) return "Moderate";
    return "Poor";
  }
  if (area === "ingredients") {
    if (!product.ingredients?.length) return "Needs data";
    if (counts.unknown > 0) return "Needs data";
    if (counts.harmful > 0) return "Poor";
    if (counts.moderate > 1) return "Moderate";
    return counts.moderate ? "Good" : "Excellent";
  }
  if (area === "processing") {
    if (!product.processing || /unknown/i.test(product.processing)) return "Needs data";
    if (/ultra/i.test(product.processing)) return "Poor";
    if (/minimal/i.test(product.processing)) return "Excellent";
    return "Moderate";
  }
  const additives = getProductAdditives(product);
  if (product.fieldConfidence?.additives === "Missing") return "Needs data";
  if (additives.some((item) => item.risk === "harmful")) return "Poor";
  if (additives.some((item) => item.risk === "moderate" || item.risk === "unknown")) return "Moderate";
  return additives.length ? "Good" : "Excellent";
}

function EvaluationSummary({ product }) {
  const rows = [
    ["Nutrition", getEvaluationState(product, "nutrition")],
    ["Ingredient quality", getEvaluationState(product, "ingredients")],
    ["Processing", getEvaluationState(product, "processing")],
    ["Additives", getEvaluationState(product, "additives")]
  ];
  return (
    <div className="evaluation-summary">
      {rows.map(([label, value]) => (
        <div key={label}><span>{label}</span><strong className={`evaluation-${value.toLowerCase().replace(/\s+/g, "-")}`}>{value}</strong></div>
      ))}
      <details className="methodology-note">
        <summary>Methodology</summary>
        <p>Ziya considers available nutrition, ingredient concerns, additives, and processing. These signals support comparison; they are not absolute scientific or medical judgments.</p>
      </details>
    </div>
  );
}

function ConfidenceBadge({ status }) {
  const meta = confidenceMeta[status] || confidenceMeta.Partial;
  return <span className={`confidence-badge ${meta.className}`}>{meta.label}</span>;
}

function TextileSummary({ product }) {
  return (
    <section className="card textile-card">
      <div className="summary-grid">
        <div>
          <span>Detected materials</span>
          <strong>{product.materialSummary}</strong>
        </div>
        <div>
          <span>Concern level</span>
          <strong>{product.concernLevel}</strong>
        </div>
      </div>
      <div className="duplicate-warning textile-warning">
        <ShieldCheck size={18} />
        {product.washBeforeUse ? "Wash before first use. " : ""}
        {product.sensitiveSkinNotes}
      </div>
      <div className="inactive-list">
        <span>Treatment notes</span>
        <p>{product.treatmentNotes}</p>
      </div>
      <div className="material-bars">
        {product.materials?.map((material) => (
          <div key={material.name}>
            <span>{material.name}</span>
            <strong>{material.percent}%</strong>
            <em>
              <i style={{ width: `${material.percent}%` }} />
            </em>
          </div>
        ))}
      </div>
    </section>
  );
}

function MedicineSummary({ product }) {
  return (
    <section className="card medicine-card">
      <div className="summary-grid">
        <div>
          <span>Active ingredient</span>
          <strong>{product.activeIngredient}</strong>
        </div>
        <div>
          <span>Purpose</span>
          <strong>{product.purpose}</strong>
        </div>
      </div>
      <div className="duplicate-warning">
        <AlertTriangle size={18} />
        Avoid duplicate active ingredients unless the label or a clinician says it is safe.
      </div>
      <div className="medicine-warning-list">
        <span>Warnings</span>
        <div className="simple-list">
          {product.warnings?.map((warning) => (
            <div className="simple-row" key={warning}>
              <span className="status-dot yellow" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="inactive-list">
        <span>Inactive ingredients</span>
        <p>{product.inactiveIngredients?.join(", ")}</p>
      </div>
    </section>
  );
}

function FoodNutrition({ product, embedded = false }) {
  const n = product.nutrition || {};
  const rows = getAvailableNutritionRows(n);
  return (
    <section className={`${embedded ? "nutrition-card-embedded" : "card nutrition-card"}`}>
      {product.nutritionConfidence === "Estimated" && (
        <p className="estimate-note">Nutrition is estimated from a fallback nutrition search. Confirm the label when available.</p>
      )}
      {rows.length ? (
        <div className="nutrition-row-list">
          {rows.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <MissingReportData copy="Nutrition facts are not available. Add the label to complete this section." />
      )}
    </section>
  );
}

function PlateReportAction({ product, alreadyAdded, onAdd }) {
  const profile = getNutritionLogProfile(product);
  const canLog = Boolean(profile);
  return (
    <button className={`plate-report-action ${canLog ? "" : "is-disabled"}`} onClick={onAdd} disabled={!canLog}>
      <span className="plate-action-icon"><Utensils size={18} /></span>
      <span>
        <strong>{canLog ? (alreadyAdded ? "Add another serving" : "Add to Today’s Plate") : "Nutrition label needed"}</strong>
        <small>{canLog ? profile.label : "Add nutrition facts first"}</small>
      </span>
      {canLog && <ChevronRight size={19} />}
    </button>
  );
}

const comparableTypePatterns = {
  popcorn: /popcorn/i,
  crackers: /cracker|cheddar square/i,
  cereal: /cereal|granola/i,
  bars: /protein bar|snack bar|energy bar|granola bar/i,
  spreads: /peanut butter|hazelnut spread|nut butter|seed butter/i,
  soda: /soda|soft drink|cola/i,
  shampoo: /shampoo/i,
  lotion: /lotion|moisturizer/i,
  deodorant: /deodorant|antiperspirant/i,
  detergent: /laundry detergent/i,
  dishSoap: /dish soap|dishwashing liquid/i,
  cleaner: /all purpose cleaner|all-purpose cleaner|surface cleaner/i,
  shirt: /shirt|tee|t-shirt/i,
  towel: /towel/i
};

function getComparableTypes(product) {
  const text = `${product.name || ""} ${product.categoryPath || ""} ${product.description || ""}`;
  return Object.entries(comparableTypePatterns).filter(([, pattern]) => pattern.test(text)).map(([type]) => type);
}

function getAlternativeReason(source, candidate, sharedType) {
  const typeLabels = {
    popcorn: "popcorn snack",
    crackers: "savory cracker",
    cereal: "cereal",
    bars: "snack bar",
    spreads: "spread",
    soda: "soft drink",
    shampoo: "shampoo",
    lotion: "moisturizer",
    deodorant: "deodorant",
    detergent: "laundry detergent",
    dishSoap: "dish soap",
    cleaner: "surface cleaner",
    shirt: "shirt",
    towel: "towel"
  };
  const improvements = [];
  if (hasNumber(candidate.score) && hasNumber(source.score) && candidate.score > source.score) improvements.push("better overall evaluation");
  if ((candidate.ingredients?.length || Infinity) < (source.ingredients?.length || 0)) improvements.push("shorter ingredient list");
  if (getProductAdditives(candidate).length < getProductAdditives(source).length) improvements.push("fewer listed additives");
  if (/minimal/i.test(candidate.processing || "") && !/minimal/i.test(source.processing || "")) improvements.push("less processing");
  return `Similar ${typeLabels[sharedType] || "product"} · ${improvements[0] || "more complete product data"}`;
}

function getComparableAlternatives(product, productIndex) {
  if (!productIndex || ["medicine", "unknown"].includes(product.category)) return [];
  const sourceTypes = getComparableTypes(product);
  if (!sourceTypes.length) return [];
  const preferred = new Set(product.alternatives || []);
  const verifiedSampleIds = new Set(["pop-secret", "skinny-pop"]);
  return [...productIndex.values()]
    .filter((candidate) =>
      candidate.id !== product.id
      && candidate.category === product.category
      && !candidate.analysisPending
      && (["food-provider", "barcode-provider"].includes(candidate.sourceType) || verifiedSampleIds.has(candidate.id))
    )
    .map((candidate) => {
      const candidateTypes = getComparableTypes(candidate);
      const sharedType = sourceTypes.find((type) => candidateTypes.includes(type));
      if (!sharedType) return null;
      const scoreImprovement = hasNumber(candidate.score) && hasNumber(product.score) && candidate.score > product.score;
      const additiveImprovement = getProductAdditives(candidate).length < getProductAdditives(product).length;
      const ingredientImprovement = candidate.ingredients?.length > 0 && candidate.ingredients.length < (product.ingredients?.length || Infinity);
      const processingImprovement = /minimal/i.test(candidate.processing || "") && !/minimal/i.test(product.processing || "");
      if (!scoreImprovement && !additiveImprovement && !ingredientImprovement && !processingImprovement) return null;
      const completeness = [candidate.image, candidate.ingredients?.length, hasCoreFoodNutrition(candidate.nutrition)].filter(Boolean).length;
      return {
        product: candidate,
        sharedType,
        rank: (preferred.has(candidate.id) ? 3 : 0) + (scoreImprovement ? 3 : 0) + (additiveImprovement ? 2 : 0) + completeness
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3);
}

function Alternatives({ product, productIndex, onOpenProduct, expandedSection, setExpandedSection }) {
  const alternatives = getComparableAlternatives(product, productIndex);
  return (
    <ExpandableSection
      id="alternatives"
      title="Better alternatives"
      subtitle={alternatives.length ? `${alternatives.length} similar ${alternatives.length === 1 ? "product" : "products"}` : "No strong matches yet"}
      icon={Leaf}
      expandedSection={expandedSection}
      setExpandedSection={setExpandedSection}
    >
      {alternatives.length ? (
        <div className="alternative-list report-alternatives">
          {alternatives.map(({ product: alternative, sharedType }) => (
            <button key={alternative.id} onClick={() => onOpenProduct(alternative.id)}>
              <ProductImage product={alternative} alt={alternative.name} />
              <div>
                <strong>{alternative.name}</strong>
                <span>{alternative.brand}</span>
                <small>{getAlternativeReason(product, alternative, sharedType)}</small>
              </div>
              <em>{getScoreLabel(alternative)}</em>
            </button>
          ))}
        </div>
      ) : (
        <MissingReportData copy="No strong comparable alternatives found yet." />
      )}
    </ExpandableSection>
  );
}

function TakeAction({
  product,
  flaggedIngredients,
  open,
  setOpen,
  platform,
  setPlatform,
  tone,
  setTone,
  copied,
  setCopied
}) {
  if (product.category === "medicine" || product.analysisPending) return null;
  const message = buildActionMessage(product, flaggedIngredients, platform, tone);
  return (
    <section className="card take-action">
      <button className="take-action-toggle" onClick={() => setOpen(!open)}>
        <div>
          <span className="eyebrow">Optional</span>
          <h2>Brand feedback</h2>
          <p>Create a respectful note about flagged ingredients.</p>
        </div>
        {open ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
      </button>
      {open && (
        <div className="action-body">
          <div className="flagged-line">
            <span>Flagged</span>
            <strong>{flaggedIngredients.join(", ") || "No major flagged ingredients"}</strong>
          </div>
          <div className="chip-selector">
            {["Instagram", "Email", "X", "Facebook"].map((item) => (
              <button key={item} className={platform === item ? "selected" : ""} onClick={() => setPlatform(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="chip-selector">
            {["Polite", "Firm", "Short", "Detailed"].map((item) => (
              <button key={item} className={tone === item ? "selected" : ""} onClick={() => setTone(item)}>
                {item}
              </button>
            ))}
          </div>
          <textarea value={message} readOnly />
          <div className="action-buttons">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                } catch {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }
              }}
            >
              <Copy size={16} />
              {copied ? "Copied" : "Copy Message"}
            </button>
            <button>
              <ChevronRight size={16} />
              Open Platform
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function buildActionMessage(product, flaggedIngredients, platform, tone) {
  const ingredients = flaggedIngredients.length ? flaggedIngredients.join(" and ") : "a few flagged ingredients";
  if (platform === "Email") {
    return `Subject: Request to Reformulate ${product.name}\n\nHello,\n\nI recently reviewed the ingredient label for ${product.name} and noticed it contains ${ingredients}. I would appreciate seeing a cleaner version of this product with safer alternatives. Would your company consider reformulating this item or offering an alternative without these ingredients?\n\nThank you.`;
  }
  if (tone === "Short") {
    return `@${product.brand.replace(/\s/g, "")} I like ${product.name}, but I am concerned about ${ingredients}. Would you consider a version with safer alternatives?`;
  }
  if (tone === "Firm") {
    return `@${product.brand.replace(/\s/g, "")} I use ingredient labels to choose products, and ${product.name} contains ${ingredients}. Please consider reformulating this with safer alternatives and clearer ingredient information.`;
  }
  if (tone === "Detailed") {
    return `@${product.brand.replace(/\s/g, "")} I recently reviewed ${product.name} and noticed ${ingredients} on the label. I like the idea of this product, but I would prefer a version with fewer flagged ingredients and clearer alternatives. Can you explain why these ingredients are used, and would your team consider reformulating?`;
  }
  return `@${product.brand.replace(/\s/g, "")} I like this product, but I'm concerned about the use of ${ingredients}. Would you consider reformulating this with safer alternatives?`;
}

function RecommendationsScreen({ productIndex, history, onOpenProduct }) {
  const scannedProducts = history
    .map((item) => productIndex.get(item.productId))
    .filter((product) => product && ["food-provider", "barcode-provider"].includes(product.sourceType));
  const realPairs = scannedProducts
    .map((product) => {
      const alternative = (product.alternatives || []).map((id) => productIndex.get(id)).find(Boolean);
      return alternative ? { bad: product, good: alternative, key: `${product.id}-${alternative.id}` } : null;
    })
    .filter(Boolean)
    .slice(0, 3);
  const samplePairs = recommendationPairs
    .map((pair) => ({ bad: productIndex.get(pair.bad), good: productIndex.get(pair.good), key: `${pair.bad}-${pair.good}` }))
    .filter((pair) => pair.bad && pair.good);
  return (
    <div className="stack">
      <Header eyebrow="Recommendations" title="Better swaps" />
      {realPairs.length > 0 && (
        <section className="stack small-gap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">From your scans</span>
              <h2>Real product swaps</h2>
            </div>
          </div>
          {realPairs.map(({ bad, good, key }) => (
            <section className="comparison-card" key={key}>
              <RecommendationTile product={bad} icon="bad" role="bad" onOpenProduct={onOpenProduct} />
              <div className="swap-divider">
                <Zap size={16} />
              </div>
              <RecommendationTile product={good} icon="good" role="good" onOpenProduct={onOpenProduct} />
            </section>
          ))}
        </section>
      )}
      {!realPairs.length && (
        <EmptyState title="No recommendations yet" copy="Scan a product to compare it with a better fit." />
      )}
      {samplePairs.length > 0 && (
        <SampleDisclosure title="Try sample swaps">
          {samplePairs.map(({ bad, good, key }) => (
            <section className="comparison-card" key={key}>
              <RecommendationTile product={bad} icon="bad" role="bad" onOpenProduct={onOpenProduct} />
              <div className="swap-divider">
                <Zap size={16} />
              </div>
              <RecommendationTile product={good} icon="good" role="good" onOpenProduct={onOpenProduct} />
            </section>
          ))}
        </SampleDisclosure>
      )}
    </div>
  );
}

function RecommendationTile({ product, icon, role, onOpenProduct }) {
  return (
    <button className="recommendation-tile" onClick={() => onOpenProduct(product.id)}>
      <div className={`rec-icon ${icon}`}>{icon === "bad" ? <X size={18} /> : <Check size={18} />}</div>
      <ProductImage product={product} alt={product.name} />
      <strong>{product.name}</strong>
      <span>{product.brand}</span>
      <em>{getScoreLabel(product)}</em>
      <p>{getRecommendationReason(product, role)}</p>
    </button>
  );
}

function HistoryScreen({ history, productIndex, onOpenProduct, plateState, onSaveGoals, onOpenPlateEntry }) {
  const [view, setView] = useState("today");
  const today = history.filter((item) => item.date.startsWith("Today"));
  const yesterday = history.filter((item) => item.date.startsWith("Yesterday"));
  const earlier = history.filter((item) => !item.date.startsWith("Today") && !item.date.startsWith("Yesterday"));
  return (
    <div className="stack history-plate-screen">
      <div className="history-mode-toggle" role="tablist" aria-label="Today’s Plate and scan history">
        <button role="tab" aria-selected={view === "today"} className={view === "today" ? "active" : ""} onClick={() => setView("today")}>Today</button>
        <button role="tab" aria-selected={view === "history"} className={view === "history" ? "active" : ""} onClick={() => setView("history")}>History</button>
      </div>
      {view === "today" ? (
        <TodayPlateScreen plateState={plateState} onSaveGoals={onSaveGoals} onOpenPlateEntry={onOpenPlateEntry} />
      ) : (
        <>
          <Header eyebrow="History" title="Recently scanned" />
          {!history.length ? (
            <EmptyState title="No scans yet" copy="Products you scan will appear here with their image and result." />
          ) : (
            <>
              {today.length > 0 && <HistoryGroup title="Today" items={today} productIndex={productIndex} onOpenProduct={onOpenProduct} />}
              {yesterday.length > 0 && <HistoryGroup title="Yesterday" items={yesterday} productIndex={productIndex} onOpenProduct={onOpenProduct} />}
              {earlier.length > 0 && <HistoryGroup title="Earlier" items={earlier} productIndex={productIndex} onOpenProduct={onOpenProduct} />}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TodayPlateScreen({ plateState, onSaveGoals, onOpenPlateEntry }) {
  const todayKey = getLocalDateKey();
  const [dateKey, setDateKey] = useState(todayKey);
  const [editingGoals, setEditingGoals] = useState(false);
  const [activeNutrient, setActiveNutrient] = useState(null);
  const day = plateState.days[dateKey];
  const isToday = dateKey === todayKey;
  const goals = day?.goalsSnapshot || (isToday ? plateState.goals : null);
  const entries = day?.entries || [];
  const totals = calculateDailyTotals(entries);

  useEffect(() => {
    setDateKey(todayKey);
  }, [todayKey]);

  if (isToday && (!plateState.goals || editingGoals)) {
    return (
      <div className="stack plate-content">
        <Header eyebrow="Today’s Plate" title={editingGoals ? "Edit daily goals" : "Set your daily goals"} subtitle={editingGoals ? "Update the nutrition targets you want to track." : "Choose the nutrition targets you want to track."} />
        <GoalSetupCard
          initialGoals={plateState.goals || PLATE_DEFAULT_GOALS}
          onCancel={editingGoals ? () => setEditingGoals(false) : null}
          onSave={(nextGoals) => {
            if (onSaveGoals(nextGoals)) setEditingGoals(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="stack plate-content">
      <Header eyebrow="Today’s Plate" title="Today’s Plate" subtitle="Your nutrition progress for today" />
      <PlateDateControl dateKey={dateKey} todayKey={todayKey} setDateKey={setDateKey} />
      {!goals ? (
        <EmptyState title="No foods were logged on this day" copy="Use the previous arrow to review another day." />
      ) : (
        <>
          <CalorieProgress total={totals.calories} goal={goals.calories} onOpen={() => setActiveNutrient("calories")} />
          <section className="card plate-nutrient-card">
            <div className="section-heading plate-section-heading">
              <div><span className="eyebrow">Daily progress</span><h2>Macros</h2></div>
              <Target size={20} />
            </div>
            <div className="plate-progress-list">
              {["protein", "carbs", "fat"].map((nutrient) => (
                <NutrientProgress key={nutrient} nutrient={nutrient} total={totals[nutrient]} goal={goals[nutrient]} onOpen={() => setActiveNutrient(nutrient)} />
              ))}
            </div>
          </section>
          <section className="card plate-nutrient-card">
            <div className="section-heading plate-section-heading">
              <div><span className="eyebrow">Also tracking</span><h2>Fiber, sugar, sodium</h2></div>
            </div>
            <div className="plate-progress-list">
              {["fiber", "sugar", "sodium"].map((nutrient) => (
                <NutrientProgress key={nutrient} nutrient={nutrient} total={totals[nutrient]} goal={goals[nutrient]} onOpen={() => setActiveNutrient(nutrient)} />
              ))}
            </div>
          </section>
          <section className="card plate-foods-card">
            <div className="section-heading plate-section-heading">
              <div><span className="eyebrow">{formatPlateDate(dateKey)}</span><h2>{isToday ? "Foods today" : "Foods logged"}</h2></div>
              <span className="plate-food-count">{entries.length}</span>
            </div>
            {entries.length ? (
              <div className="plate-food-list">
                {entries.map((entry) => (
                  <DailyFoodRow key={entry.id} entry={entry} onClick={() => onOpenPlateEntry({ dateKey, entryId: entry.id })} />
                ))}
              </div>
            ) : (
              <div className="plate-empty"><Utensils size={20} /><strong>Nothing added yet</strong><span>Scan or search for a food, then add a serving to Today’s Plate.</span></div>
            )}
          </section>
          {isToday && <button className="plate-edit-goals" onClick={() => setEditingGoals(true)}><Pencil size={16} />Edit goals</button>}
        </>
      )}
      {activeNutrient && (
        <NutrientDetailSheet nutrient={activeNutrient} total={totals[activeNutrient]} goal={goals?.[activeNutrient]} entries={entries} onClose={() => setActiveNutrient(null)} />
      )}
    </div>
  );
}

function PlateDateControl({ dateKey, todayKey, setDateKey }) {
  return (
    <div className="plate-date-control">
      <button aria-label="Previous day" onClick={() => setDateKey(shiftLocalDateKey(dateKey, -1))}><ChevronLeft size={20} /></button>
      <div><CalendarDays size={17} /><strong>{formatPlateDate(dateKey)}</strong><span>{dateFromLocalKey(dateKey).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></div>
      <button aria-label="Next day" disabled={dateKey >= todayKey} onClick={() => setDateKey(shiftLocalDateKey(dateKey, 1))}><ChevronRight size={20} /></button>
    </div>
  );
}

function GoalSetupCard({ initialGoals, onSave, onCancel }) {
  const [values, setValues] = useState(() => Object.fromEntries(PLATE_NUTRIENTS.map((nutrient) => [nutrient, String(initialGoals[nutrient])] )));
  const [error, setError] = useState("");
  const maximums = { calories: 10000, protein: 1000, carbs: 1500, fat: 500, fiber: 250, sugar: 500, sodium: 20000 };

  function submit(event) {
    event.preventDefault();
    const goals = Object.fromEntries(PLATE_NUTRIENTS.map((nutrient) => [nutrient, toNumber(values[nutrient])]));
    const invalid = PLATE_NUTRIENTS.find((nutrient) => !hasNumber(goals[nutrient]) || goals[nutrient] <= 0 || goals[nutrient] > maximums[nutrient]);
    if (invalid) {
      setError(`Enter a valid ${PLATE_NUTRIENT_META[invalid].label.toLowerCase()} target.`);
      return;
    }
    setError("");
    onSave(goals);
  }

  return (
    <form className="card plate-goal-card" onSubmit={submit}>
      <div className="plate-goal-note">Starter values are editable defaults, not personalized medical recommendations.</div>
      <div className="plate-goal-grid">
        {PLATE_NUTRIENTS.map((nutrient) => {
          const meta = PLATE_NUTRIENT_META[nutrient];
          return (
            <label key={nutrient}>
              <span><i className={`nutrient-dot nutrient-${meta.tone}`} />{meta.label}</span>
              <span className="plate-goal-input"><input type="number" inputMode="decimal" min="0.1" max={maximums[nutrient]} step="any" value={values[nutrient]} onChange={(event) => setValues((current) => ({ ...current, [nutrient]: event.target.value }))} required /><em>{meta.unit}</em></span>
            </label>
          );
        })}
      </div>
      {error && <p className="plate-form-error" role="alert">{error}</p>}
      <div className="plate-goal-actions">
        {onCancel && <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="primary-button"><Check size={18} />Save goals</button>
      </div>
    </form>
  );
}

function CalorieProgress({ total, goal, onOpen }) {
  const consumed = total.total;
  const progress = goal > 0 ? clamp((consumed / goal) * 100, 0, 100) : 0;
  const remaining = goal - consumed;
  return (
    <button className="card plate-calorie-card" onClick={onOpen} aria-label="View calorie contributions">
      <div className="plate-calorie-ring" style={{ "--progress": `${progress * 3.6}deg` }} role="img" aria-label={`${formatNutrientValue(consumed, "calories")} of ${formatNutrientValue(goal, "calories")} kilocalories`}>
        <div><strong>{formatNutrientValue(consumed, "calories")}</strong><span>of {formatNutrientValue(goal, "calories")} kcal</span></div>
      </div>
      <div className="plate-calorie-copy">
        <span>Calories</span>
        <strong>{remaining >= 0 ? `${formatNutrientValue(remaining, "calories")} kcal remaining` : `${formatNutrientValue(Math.abs(remaining), "calories")} kcal over goal`}</strong>
        {total.missingCount > 0 && <small>Partial total · {total.missingCount} {total.missingCount === 1 ? "food is" : "foods are"} missing calorie data</small>}
      </div>
    </button>
  );
}

function NutrientProgress({ nutrient, total, goal, onOpen }) {
  const meta = PLATE_NUTRIENT_META[nutrient];
  const progress = goal > 0 ? clamp((total.total / goal) * 100, 0, 100) : 0;
  const remaining = Math.max(0, goal - total.total);
  const over = Math.max(0, total.total - goal);
  const progressCopy = over > 0 ? `${formatNutrientValue(over, nutrient)} ${meta.unit} over ${meta.goalWord}` : `${formatNutrientValue(remaining, nutrient)} ${meta.unit} remaining`;
  return (
    <button className="plate-progress-row" onClick={onOpen} aria-label={`View ${meta.label} contributions`}>
      <span className="plate-progress-copy"><strong>{meta.label}</strong><small>{formatNutrientValue(total.total, nutrient)} {meta.unit} of {formatNutrientValue(goal, nutrient)} {meta.unit} {meta.goalWord}</small></span>
      <span className="plate-progress-track" aria-hidden="true"><i className={`nutrient-${meta.tone}`} style={{ width: `${progress}%` }} /></span>
      <span className="plate-progress-meta"><small>{progressCopy}</small>{total.missingCount > 0 && <em>Partial total</em>}</span>
      <ChevronRight size={17} />
    </button>
  );
}

function DailyFoodRow({ entry, onClick }) {
  return (
    <button className="plate-food-row" onClick={onClick}>
      <ProductImage product={entry.product} alt={entry.product.name} />
      <span><strong>{entry.product.name}</strong><small>{formatPlateServing(entry)}</small></span>
      <span className="plate-food-calories">{hasNumber(entry.contribution.calories) ? `${formatNutrientValue(entry.contribution.calories, "calories")} kcal` : "Calories missing"}</span>
      <ChevronRight size={17} />
    </button>
  );
}

function formatPlateServing(entry) {
  if (entry.mode === "grams") return `${formatNutrientValue(entry.amount, "protein")} g`;
  if (entry.mode === "milliliters") return `${formatNutrientValue(entry.amount, "protein")} ml`;
  return `${formatNutrientValue(entry.amount, "protein")} ${entry.amount === 1 ? "serving" : "servings"}${entry.nutritionBase?.servingSize && !/^1 serving$/i.test(entry.nutritionBase.servingSize) ? ` · ${entry.nutritionBase.servingSize}` : ""}`;
}

function NutrientDetailSheet({ nutrient, total, goal, entries, onClose }) {
  const meta = PLATE_NUTRIENT_META[nutrient];
  const contributors = entries.filter((entry) => hasNumber(entry.contribution?.[nutrient]));
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="ingredient-sheet plate-detail-sheet" role="dialog" aria-modal="true" aria-label={`${meta.label} contributions`} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header"><div><span className="eyebrow">Today’s Plate</span><h2 className="nutrient-sheet-title"><i className={`nutrient-dot nutrient-${meta.tone}`} />{meta.label}</h2></div><button onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        <div className="plate-detail-total"><strong>{formatNutrientValue(total.total, nutrient)} {meta.unit}</strong><span>of {formatNutrientValue(goal, nutrient)} {meta.unit} {meta.goalWord}</span></div>
        <div className="plate-contributor-list">
          {contributors.map((entry) => <div key={entry.id}><span>{entry.product.name}</span><strong>{formatNutrientValue(entry.contribution[nutrient], nutrient)} {meta.unit}</strong></div>)}
        </div>
        {total.missingCount > 0 && <p className="plate-partial-note">{total.missingCount === 1 ? "One logged food does" : `${total.missingCount} logged foods do`} not include {meta.label.toLowerCase()} information.</p>}
      </section>
    </div>
  );
}

function HistoryGroup({ title, items, productIndex, onOpenProduct }) {
  return (
    <section className="stack small-gap">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      {items.map((item) => {
        const product = productIndex.get(item.productId);
        if (!product) return null;
        return (
          <ProductListCard
            key={item.id}
            product={product}
            meta={item.date}
            onClick={() => onOpenProduct(product.id)}
          />
        );
      })}
    </section>
  );
}

function ProfileScreen({ profile, onChange, onBack, dailyTotals, dailyLog, goals, onSaveGoals, account }) {
  const [customAllergy, setCustomAllergy] = useState("");
  const [editingGoals, setEditingGoals] = useState(false);

  function toggleAllergy(item) {
    const normalized = normalizeAllergyPreference(item);
    if (!normalized) return;
    onChange((current) => {
      const exists = current.allergies.some((entry) => entry.key === normalized.key);
      return {
        ...current,
        allergies: exists
          ? current.allergies.filter((entry) => entry.key !== normalized.key)
          : [...current.allergies, normalized]
      };
    });
  }

  function addCustomAllergy(event) {
    event.preventDefault();
    const normalized = normalizeAllergyPreference(customAllergy);
    if (!normalized) return;
    onChange((current) => ({
      ...current,
      allergies: [...current.allergies.filter((entry) => entry.key !== normalized.key), normalized]
    }));
    setCustomAllergy("");
  }

  function toggleDietPreference(key) {
    onChange((current) => ({
      ...current,
      dietPreferences: current.dietPreferences.includes(key)
        ? current.dietPreferences.filter((item) => item !== key)
        : [...current.dietPreferences, key]
    }));
  }

  function updateIngredientList(field, value, remove = false) {
    const normalized = normalizeIngredientPreference(value);
    if (!normalized) return;
    onChange((current) => ({
      ...current,
      [field]: remove
        ? current[field].filter((item) => item.key !== normalized.key)
        : [...current[field].filter((item) => item.key !== normalized.key), normalized]
    }));
  }

  const selectedCommonAllergies = new Set(profile.allergies.map((item) => item.key));
  const customAllergies = profile.allergies.filter((item) => !COMMON_ALLERGIES.some((common) => common.key === item.key));
  const effectiveGoals = goals || profile.todayPlateGoals;
  const calorieGoal = effectiveGoals?.calories;

  return (
    <div className="stack profile-screen">
      <Header
        eyebrow="Profile"
        title="Your Ziya"
        action={(
          <button className="header-icon-button" onClick={onBack} aria-label="Back to Top">
            <ChevronLeft size={22} />
          </button>
        )}
      />

      <AccountProfileCard account={account} />

      <section className="card profile-section-card">
        <div className="profile-section-heading">
          <span><AlertTriangle size={18} /></span>
          <div><h2>Allergies</h2><p>Products with a clear match get a high-priority personal alert.</p></div>
        </div>
        <div className="profile-choice-grid" role="group" aria-label="Common allergies">
          {COMMON_ALLERGIES.map((item) => (
            <button
              key={item.key}
              className={selectedCommonAllergies.has(item.key) ? "selected" : ""}
              aria-pressed={selectedCommonAllergies.has(item.key)}
              onClick={() => toggleAllergy(item)}
            >
              {selectedCommonAllergies.has(item.key) && <Check size={15} />}
              {item.label}
            </button>
          ))}
        </div>
        {customAllergies.length > 0 && (
          <div className="profile-tag-list" aria-label="Custom allergies">
            {customAllergies.map((item) => (
              <button key={item.key} onClick={() => toggleAllergy(item)} aria-label={`Remove ${item.label}`}>
                {item.label}<X size={14} />
              </button>
            ))}
          </div>
        )}
        <form className="profile-add-form" onSubmit={addCustomAllergy}>
          <input value={customAllergy} onChange={(event) => setCustomAllergy(event.target.value)} placeholder="Add another allergy" maxLength={80} aria-label="Custom allergy" />
          <button type="submit" aria-label="Add allergy"><Plus size={18} /></button>
        </form>
      </section>

      <section className="card profile-section-card">
        <div className="profile-section-heading">
          <span><Leaf size={18} /></span>
          <div><h2>Diet preferences</h2><p>Ziya checks clear conflicts and stays cautious when labels are incomplete.</p></div>
        </div>
        <div className="profile-choice-grid" role="group" aria-label="Diet preferences">
          {DIET_PREFERENCES.map((item) => {
            const selected = profile.dietPreferences.includes(item.key);
            return (
              <button key={item.key} className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => toggleDietPreference(item.key)}>
                {selected && <Check size={15} />}{item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card profile-section-card">
        <div className="profile-section-heading">
          <span><Bell size={18} /></span>
          <div><h2>Ingredient alerts</h2><p>Aliases and E-numbers are matched through Ziya's ingredient knowledge.</p></div>
        </div>
        <ProfileIngredientEditor
          title="Avoided ingredients"
          copy="Shown as a personal avoid-list alert."
          items={profile.avoidedIngredients}
          placeholder="Try Red 40 or E129"
          onAdd={(value) => updateIngredientList("avoidedIngredients", value)}
          onRemove={(value) => updateIngredientList("avoidedIngredients", value, true)}
        />
        <ProfileIngredientEditor
          title="Watchlist"
          copy="Shown as information, not a danger warning."
          items={profile.watchlistIngredients}
          placeholder="Try carrageenan"
          onAdd={(value) => updateIngredientList("watchlistIngredients", value)}
          onRemove={(value) => updateIngredientList("watchlistIngredients", value, true)}
        />
      </section>

      <section className="card profile-section-card">
        <div className="profile-section-heading">
          <span><Languages size={18} /></span>
          <div><h2>App preferences</h2><p>Choose your preferred product market and how recognized label ingredients appear.</p></div>
        </div>
        <div className="profile-select-grid">
          <label>
            <span>Language</span>
            <select value={profile.preferredLanguage} onChange={(event) => onChange({ preferredLanguage: event.target.value })}>
              {PROFILE_LANGUAGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Units</span>
            <select value={profile.unitSystem} onChange={(event) => onChange({ unitSystem: event.target.value })}>
              {PROFILE_UNITS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Product region</span>
            <select value={profile.productRegion} onChange={(event) => onChange({ productRegion: event.target.value })}>
              {PRODUCT_REGIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <small>Preferred sold-in market, not guaranteed origin.</small>
          </label>
          <label>
            <span>Ingredient display</span>
            <select value={profile.ingredientDisplayMode} onChange={(event) => onChange({ ingredientDisplayMode: event.target.value })}>
              {INGREDIENT_DISPLAY_MODES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="card profile-section-card profile-goals-card">
        <div className="profile-section-heading">
          <span><Target size={18} /></span>
          <div><h2>Today's Plate goals</h2><p>These are your editable targets, not medical recommendations.</p></div>
        </div>
        <div className="profile-goal-summary">
          <span><small>Calories</small><strong>{hasNumber(calorieGoal) ? `${calorieGoal.toLocaleString()} kcal` : "Not set"}</strong></span>
          <span><small>Eaten today</small><strong>{Math.round(dailyTotals.calories).toLocaleString()} kcal</strong></span>
          <span><small>Foods today</small><strong>{dailyLog.length}</strong></span>
        </div>
        <button className="profile-edit-goals" onClick={() => setEditingGoals((current) => !current)}>
          <Pencil size={17} />{editingGoals ? "Close goal editor" : "Edit goals"}<ChevronRight size={17} />
        </button>
      </section>

      {editingGoals && (
        <GoalSetupCard
          initialGoals={effectiveGoals || PLATE_DEFAULT_GOALS}
          onCancel={() => setEditingGoals(false)}
          onSave={(nextGoals) => {
            if (onSaveGoals(nextGoals)) setEditingGoals(false);
          }}
        />
      )}
    </div>
  );
}

function AccountProfileCard({ account }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const signedIn = Boolean(account.session?.user);

  async function submitMagicLink(event) {
    event.preventDefault();
    setSending(true);
    try {
      await account.onMagicLink(email);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card profile-section-card account-profile-card">
      <div className="profile-section-heading">
        <span>{signedIn ? <Cloud size={18} /> : <User size={18} />}</span>
        <div>
          <h2>{signedIn ? "Signed in" : "Local profile"}</h2>
          <p>{signedIn ? account.session.user.email || "Your Ziya account" : "Continue without an account. Your profile stays on this device."}</p>
        </div>
        <em className={`sync-status sync-status-${account.syncStatus.toLowerCase().replace(/\s+/g, "-")}`}>
          {account.syncStatus === "Synced" ? <Cloud size={14} /> : <CloudOff size={14} />}{account.syncStatus}
        </em>
      </div>

      {!account.ready ? (
        <div className="account-quiet-state"><RefreshCw size={17} />Checking account...</div>
      ) : !account.configured ? (
        <div className="account-quiet-state"><Check size={17} />Local profile is ready. Account sync can be enabled later.</div>
      ) : signedIn ? (
        <div className="account-actions-stack">
          {account.syncConsentPending && (
            <div className="sync-consent-card">
              <strong>Sync your local data to this account?</strong>
              <span>Ziya will merge your profile, food log, history, and label corrections without deleting local data.</span>
              <div><button className="secondary-button" onClick={account.onPauseSync}>Not now</button><button className="primary-button" onClick={account.onSync}>Sync now</button></div>
            </div>
          )}
          {!account.syncConsentPending && (
            <button className="secondary-button" onClick={account.onSync} disabled={account.syncStatus === "Syncing"}>
              <RefreshCw size={17} />{account.syncStatus === "Syncing" ? "Syncing..." : "Sync now"}
            </button>
          )}
          <button className="profile-sign-out" onClick={account.onSignOut}><LogOut size={17} />Sign out</button>
        </div>
      ) : (
        <div className="account-sign-in">
          <div><span className="eyebrow">Optional</span><strong>Sign in to sync your data</strong><p>Scanning, reports, and Today's Plate keep working without an account.</p></div>
          <form onSubmit={submitMagicLink}>
            <label htmlFor="profile-email">Email</label>
            <div><Mail size={18} /><input id="profile-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /><button type="submit" disabled={sending}>{sending ? "Sending" : "Send link"}</button></div>
          </form>
          <button className="secondary-button account-google-button" onClick={account.onGoogle}><LogIn size={17} />Continue with Google</button>
        </div>
      )}
      {account.message && <p className="account-message" role="status">{account.message}</p>}
    </section>
  );
}

function ProfileIngredientEditor({ title, copy, items, placeholder, onAdd, onRemove }) {
  const [value, setValue] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  }

  return (
    <div className="profile-ingredient-editor">
      <div><strong>{title}</strong><small>{copy}</small></div>
      {items.length > 0 && (
        <div className="profile-tag-list">
          {items.map((item) => (
            <button key={item.key} onClick={() => onRemove(item)} aria-label={`Remove ${item.label}`}>{item.label}<X size={14} /></button>
          ))}
        </div>
      )}
      <form className="profile-add-form" onSubmit={submit}>
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} maxLength={100} aria-label={`Add to ${title.toLowerCase()}`} />
        <button type="submit" aria-label={`Add to ${title.toLowerCase()}`}><Plus size={18} /></button>
      </form>
    </div>
  );
}

function ProductListCard({ product, onClick, meta, showMarketMeta = false }) {
  const category = categoryMeta[product.category];
  const Icon = category.icon;
  if (meta) {
    return (
      <button className="history-row" onClick={onClick}>
        <ProductImage product={product} alt={product.name} />
        <div>
          <strong>{product.name}</strong>
          <small>{product.brand}</small>
          <span className="history-status">
            <i className={product.analysisPending || product.category === "medicine" || product.category === "textile" ? "neutral" : getScoreClass(product.score)} />
            {product.analysisPending ? "Needs Label" : product.category === "medicine" || product.category === "textile" ? product.summaryStatus || product.rating : `${product.score}/100 ${product.rating}`}
          </span>
          <span className="history-date">{meta}</span>
        </div>
        <ChevronRight size={20} />
      </button>
    );
  }
  const searchMetadata = showMarketMeta ? getSearchResultMetadata(product) : null;
  const productSubtitle = [product.brand, searchMetadata?.market, searchMetadata?.quantity].filter(Boolean).join(" · ");
  return (
    <button className="product-list-card" onClick={onClick}>
      <ProductImage product={product} alt={product.name} />
      <div>
        <span className={`mini-category ${category.tone}`}>
          <Icon size={12} />
          {category.shortLabel}
        </span>
        <strong>{product.name}</strong>
        <small>{productSubtitle || product.brand}</small>
        {meta && <small>{meta}</small>}
      </div>
      <div className={`list-score ${product.analysisPending || product.category === "medicine" || product.category === "textile" ? "neutral" : getScoreClass(product.score)}`}>
        <span>{getScoreLabel(product)}</span>
        <small>{product.analysisPending ? "Partial" : product.rating}</small>
      </div>
    </button>
  );
}

function EmptyState({ title, copy, compact = false }) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <Search size={compact ? 18 : 22} />
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function ServingSheet({ product, onClose, onAdd }) {
  const profile = getNutritionLogProfile(product);
  const [amount, setAmount] = useState(profile?.amount || 1);
  if (!profile) return null;
  const contribution = normalizeNutritionForServing(product, amount, profile.mode);
  const isValid = Boolean(contribution) && toNumber(amount) > 0;
  const missingCount = PLATE_NUTRIENTS.filter((nutrient) => !hasNumber(contribution?.[nutrient])).length;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="ingredient-sheet serving-sheet" role="dialog" aria-modal="true" aria-label={`Add ${product.name} to Today’s Plate`} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div><span className="eyebrow">Today’s Plate</span><h2>Add a serving</h2></div>
          <button onClick={onClose} aria-label="Close serving sheet"><X size={20} /></button>
        </div>
        <div className="serving-product">
          <ProductImage product={product} alt={product.name} />
          <div><strong>{product.name}</strong><span>{product.brand}</span><small>{profile.label}</small></div>
        </div>
        <QuantityControl mode={profile.mode} amount={amount} setAmount={setAmount} step={profile.step} />
        <div className="serving-preview-heading"><strong>Adds to today</strong><span>Based on this amount</span></div>
        {contribution && <NutritionContributionList contribution={contribution} />}
        {missingCount > 0 && <p className="plate-partial-note">Some nutrition fields are missing from this product.</p>}
        <button className="primary-button full" disabled={!isValid} onClick={() => onAdd(product, Number(amount), profile.mode)}><Plus size={18} />Add to Today’s Plate</button>
      </section>
    </div>
  );
}

function QuantityControl({ mode, amount, setAmount, step, disabled = false }) {
  const numeric = toNumber(amount) || 0;
  const minimum = mode === "servings" ? 0.5 : 1;
  const label = mode === "servings" ? "Quantity" : mode === "grams" ? "Grams" : "Milliliters";
  const unit = mode === "servings" ? "servings" : mode === "grams" ? "g" : "ml";
  return (
    <div className="quantity-control-wrap">
      <span>{label}</span>
      <div className="quantity-control">
        <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={disabled || numeric <= minimum} onClick={() => setAmount(Math.max(minimum, roundNutrient(numeric - step, 1)))}><Minus size={18} /></button>
        <label><input type="number" inputMode="decimal" min={minimum} step={step} value={amount} disabled={disabled} onChange={(event) => setAmount(event.target.value)} aria-label={label} /><span>{unit}</span></label>
        <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={disabled} onClick={() => setAmount(roundNutrient(Math.max(minimum, numeric) + step, 1))}><Plus size={18} /></button>
      </div>
    </div>
  );
}

function NutritionContributionList({ contribution }) {
  return (
    <div className="nutrition-contribution-list">
      {PLATE_NUTRIENTS.filter((nutrient) => hasNumber(contribution[nutrient])).map((nutrient) => {
        const meta = PLATE_NUTRIENT_META[nutrient];
        return <div key={nutrient}><span><i className={`nutrient-dot nutrient-${meta.tone}`} />{meta.label}</span><strong>{formatNutrientValue(contribution[nutrient], nutrient)} {meta.unit}</strong></div>;
      })}
    </div>
  );
}

function FoodContributionSheet({ target, plateState, onClose, onUpdate, onRemove }) {
  const day = plateState.days[target.dateKey];
  const entry = day?.entries.find((item) => item.id === target.entryId);
  const [amount, setAmount] = useState(entry?.amount || 1);
  if (!entry) return null;
  const isToday = target.dateKey === getLocalDateKey();
  const product = { ...entry.product, nutrition: entry.nutritionBase };
  const contribution = normalizeNutritionForServing(product, amount, entry.mode) || entry.contribution;
  const step = entry.mode === "servings" ? 0.5 : 10;
  const isValid = toNumber(amount) > 0;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="ingredient-sheet serving-sheet contribution-sheet" role="dialog" aria-modal="true" aria-label={`${entry.product.name} contribution`} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div><span className="eyebrow">{formatPlateDate(target.dateKey)}</span><h2>Food contribution</h2></div>
          <button onClick={onClose} aria-label="Close food contribution"><X size={20} /></button>
        </div>
        <div className="serving-product"><ProductImage product={entry.product} alt={entry.product.name} /><div><strong>{entry.product.name}</strong><span>{entry.product.brand}</span><small>{formatPlateServing(entry)}</small></div></div>
        <QuantityControl mode={entry.mode} amount={amount} setAmount={setAmount} step={step} disabled={!isToday} />
        <NutritionContributionList contribution={contribution} />
        {isToday ? (
          <div className="contribution-actions">
            <button className="primary-button" disabled={!isValid} onClick={() => { onUpdate(target.dateKey, entry.id, Number(amount)); onClose(); }}><Check size={18} />Save changes</button>
            <button className="remove-plate-entry" onClick={() => onRemove(target.dateKey, entry.id)}><Trash2 size={17} />Remove from Today’s Plate</button>
          </div>
        ) : (
          <p className="plate-readonly-note">Previous days are read-only.</p>
        )}
      </section>
    </div>
  );
}

function IngredientSheet({ ingredient, onClose }) {
  const ingredientQuery = ingredient.canonicalName || ingredient.recognizedName || ingredient.normalizedLabelText || ingredient.name || ingredient.originalLabelText;
  const localKnowledge = useMemo(
    () => resolveLocalIngredientKnowledge(ingredientQuery, { category: ingredient.productCategory }),
    [ingredient.productCategory, ingredientQuery]
  );
  const [knowledge, setKnowledge] = useState(localKnowledge);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setKnowledge(localKnowledge);
    setLoading(true);
    enrichIngredientKnowledge(ingredientQuery, { category: ingredient.productCategory })
      .then((result) => {
        if (!cancelled) setKnowledge(result);
      })
      .catch(() => {
        if (!cancelled) setKnowledge({ ...localKnowledge, enrichmentStatus: "unavailable" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ingredient.productCategory, ingredientQuery, localKnowledge]);

  const risk = riskMeta[knowledge.risk || ingredient.risk] || riskMeta.unknown;
  const statusLabel = knowledge.statusLabel || ingredient.statusLabel || risk.label;
  const originalLabelText = ingredient.originalLabelText || knowledge.originalLabelText;
  const originalDiffers = originalLabelText
    && normalizeKnowledgeDisplay(originalLabelText) !== normalizeKnowledgeDisplay(knowledge.canonicalName);
  const recognizedDisplayName = knowledge.displayName || knowledge.canonicalName;
  const display = getIngredientDisplayName({ ...ingredient, displayName: recognizedDisplayName }, ingredient.ingredientDisplayMode);
  const aliases = (knowledge.aliases || []).filter((alias) => normalizeKnowledgeDisplay(alias) !== normalizeKnowledgeDisplay(knowledge.canonicalName)).slice(0, 8);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="ingredient-sheet" role="dialog" aria-modal="true" aria-label={`${display.primaryName} details`} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <span className={`risk-pill ${risk.className}`}>{statusLabel}</span>
            <h2>{display.primaryName}</h2>
          </div>
          <button onClick={onClose} aria-label="Close ingredient details">
            <X size={20} />
          </button>
        </div>
        {loading && <p className="knowledge-status">Checking source records…</p>}
        {(originalDiffers || knowledge.translationConfidence === "low") && (
          <InfoBlock
            label="Original label text"
            value={`${originalLabelText}${knowledge.translationConfidence === "low" ? " · Translation needs review; verify label" : ""}`}
          />
        )}
        {originalDiffers && <InfoBlock label="Recognized as" value={recognizedDisplayName} />}
        {aliases.length > 0 && <InfoBlock label="Also known as" value={aliases.join(", ")} />}
        <InfoBlock label="What it is" value={knowledge.plainDescription || knowledge.summary || knowledge.type} />
        <InfoBlock label="Why it is used" value={knowledge.whyUsed || knowledge.use} />
        {knowledge.nutritionRole && <InfoBlock label="Nutrition relevance" value={knowledge.nutritionRole} />}
        <InfoBlock label="Ziya status" value={knowledge.statusDescription || knowledge.evidenceSummary} />
        {knowledge.knowledgeKind !== "common_ingredient" && <InfoBlock label="Commonly found in" value={knowledge.commonUse} />}
        {knowledge.knowledgeKind !== "common_ingredient" && <InfoBlock label="Evidence summary" value={knowledge.evidenceSummary} />}
        {knowledge.knowledgeKind !== "common_ingredient" && <InfoBlock label="Regulatory context" value={knowledge.regulatoryContext} />}
        {knowledge.chemicalProperties && (
          <InfoBlock
            label="Chemical identity"
            value={[
              knowledge.pubchemCid ? `PubChem CID ${knowledge.pubchemCid}` : null,
              knowledge.chemicalProperties.molecularFormula,
              knowledge.chemicalProperties.molecularWeight ? `${knowledge.chemicalProperties.molecularWeight} g/mol` : null,
              knowledge.chemicalProperties.iupacName
            ].filter(Boolean).join(" · ")}
          />
        )}
        <InfoBlock label="Data confidence" value={`${capitalizeKnowledge(knowledge.confidence)} · ${knowledge.dataSources?.join(" · ") || "Local match not available"}`} />
        {knowledge.studies?.length > 0 && (
          <div className="knowledge-citations">
            <span>Relevant literature</span>
            {knowledge.studies.map((study) => (
              <a href={study.url} key={study.pmid} target="_blank" rel="noreferrer">
                <strong>{study.title}</strong>
                <small>{[study.journal, study.year, study.sourceType].filter(Boolean).join(" · ")}</small>
              </a>
            ))}
          </div>
        )}
        <div className="source-list">
          <span>Sources</span>
          {knowledge.sources?.map((source) => (
            <a href={source.url} key={source.id || source.url} title={source.title} target="_blank" rel="noreferrer">{source.label}</a>
          ))}
          {!knowledge.sources?.length && <p className="methodology-copy">No strong source links found yet.</p>}
          {knowledge.enrichmentStatus === "unavailable" && <p className="methodology-copy">More source data unavailable right now.</p>}
          <p className="methodology-copy">Methodology: curated records take priority; chemical identity and citation metadata add context but do not establish that an ingredient will cause harm.</p>
        </div>
      </div>
    </div>
  );
}

function normalizeKnowledgeDisplay(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function capitalizeKnowledge(value) {
  const text = String(value || "low");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ExpandableSection({ id, title, subtitle, icon: Icon, expandedSection, setExpandedSection, children }) {
  const open = expandedSection === id;
  return (
    <section className="card expandable">
      <button aria-expanded={open} onClick={() => setExpandedSection(open ? "" : id)}>
        <span className="expandable-title">
          <i><Icon size={19} /></i>
          <span>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
        </span>
        {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {open && <div className="expand-body">{children}</div>}
    </section>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "history", label: "History", icon: BookOpen },
    { id: "recs", label: "Recs", icon: Leaf },
    { id: "scan", label: "Scan", icon: Barcode, primary: true },
    { id: "top", label: "Top", icon: Star },
    { id: "search", label: "Search", icon: Search }
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id
          || (tab.id === "scan" && activeTab === "report")
          || (tab.id === "top" && activeTab === "profile");
        return (
          <button
            key={tab.id}
            className={`${active ? "active" : ""} ${tab.primary ? "primary-tab" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
          >
            <span>
              <Icon size={tab.primary ? 24 : 21} />
            </span>
            <small>{tab.label}</small>
          </button>
        );
      })}
    </nav>
  );
}

function Header({ eyebrow, title, subtitle, action }) {
  return (
    <header className={`page-header ${action ? "has-action" : ""}`}>
      <div className="page-header-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

function RiskCount({ label, value, type }) {
  return (
    <div className={`risk-count ${riskMeta[type].className}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  return (
    <div className="score-bar">
      <div>
        <span>{label}</span>
        <strong>
          {Math.round(value)}/{max}
        </strong>
      </div>
      <em>
        <i style={{ width: `${clamp((value / max) * 100, 0, 100)}%` }} />
      </em>
    </div>
  );
}

function Macro({ label, value, unit }) {
  const isMissing = value === null || value === undefined || value === "";
  return (
    <div className={`macro ${isMissing ? "missing" : ""}`}>
      <span>{label}</span>
      <strong>{isMissing ? "Missing" : `${value}${unit}`}</strong>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

export {
  applyStoredProductOverride,
  calculateDailyTotals,
  completeProductWithUserInput,
  createManualReport,
  createPlateEntry,
  createReportFromOcr,
  getLocalDateKey,
  getNutritionLogProfile,
  loadPlateState,
  lookupProductByBarcode,
  mapOpenFoodFactsIngredients,
  mapOpenFoodFactsNutrition,
  normalizeOpenFoodFactsProduct,
  normalizeNutrition,
  normalizeNutritionForServing,
  parseOpenFoodFactsIngredients,
  searchFoodProductsByName,
  sanitizePlateGoals,
  shiftLocalDateKey,
  updatePlateEntryInState,
  removePlateEntryFromState,
  upgradeLegacyIngredientRecord
};

if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  const root = globalThis.__ziyaReactRoot || createRoot(rootElement);
  globalThis.__ziyaReactRoot = root;
  root.render(<App />);
}
