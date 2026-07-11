import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Apple,
  Baby,
  Barcode,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Droplets,
  Dumbbell,
  Flashlight,
  FlaskConical,
  HeartPulse,
  Home,
  Info,
  Leaf,
  Minus,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  User,
  Utensils,
  Volume2,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const riskMeta = {
  safe: { label: "Safe", className: "risk-safe" },
  moderate: { label: "Moderate", className: "risk-moderate" },
  harmful: { label: "Harmful", className: "risk-harmful" }
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

const ingredientDetails = {
  "Palm oil": {
    risk: "moderate",
    type: "Refined plant oil",
    why:
      "Flagged as moderate because it can raise saturated fat in some foods and may be associated with higher processing levels depending on the product.",
    common: "Microwave popcorn, baked snacks, spreads, frozen meals",
    alternatives: "Look for olive oil, avocado oil, sunflower oil, or products with less saturated fat.",
    sources: ["Food label reference", "Nutrition reference", "Chemical reference"]
  },
  "Artificial flavor": {
    risk: "harmful",
    type: "Flavor additive",
    why:
      "Flagged as higher concern because it is a broad label term and can indicate a more processed formula. Sensitivity depends on product type and frequency of use.",
    common: "Snack foods, candy, drinks, cereals, protein bars",
    alternatives: "Choose products flavored with named spices, cocoa, vanilla, fruit, or no added flavor.",
    sources: ["Food additive reference", "Food label reference"]
  },
  "Salt": {
    risk: "safe",
    type: "Mineral seasoning",
    why:
      "Low concern for typical use, but total sodium can matter for the whole product and daily intake.",
    common: "Snacks, sauces, frozen meals, soups",
    alternatives: "Choose lower-sodium products when sodium is already high in the product.",
    sources: ["Nutrition reference", "Food label reference"]
  },
  "Annatto color": {
    risk: "moderate",
    type: "Color additive",
    why:
      "Usually lower concern than synthetic dyes, but flagged as moderate because color additives can be sensitivity triggers for some people.",
    common: "Cheese snacks, popcorn, cereals, dairy products",
    alternatives: "Look for products with no added color or naturally colored ingredients only.",
    sources: ["Color additive reference", "Chemical reference"]
  },
  "Red 40": {
    risk: "harmful",
    type: "Artificial food dye",
    why:
      "Red 40 is a synthetic color additive. Some research and regulatory discussions have examined possible sensitivity and behavioral concerns, especially in children.",
    common: "Candy, drinks, cereals, snacks",
    alternatives: "Look for beet juice, turmeric, paprika extract, or no added color.",
    sources: ["Color additive reference", "Food safety review", "Chemical reference"]
  },
  "Fragrance": {
    risk: "moderate",
    type: "Fragrance blend",
    why:
      "Fragrance can include many aroma compounds and may be irritating for some users, especially with sensitive skin or frequent exposure.",
    common: "Shampoo, lotion, deodorant, cleaners, laundry detergent",
    alternatives: "Choose fragrance-free products or products with clearly disclosed scent ingredients.",
    sources: ["Cosmetic ingredient reference", "Chemical reference", "Safer product reference"]
  },
  "Methylisothiazolinone": {
    risk: "harmful",
    type: "Preservative",
    why:
      "Flagged as higher concern because it is a known skin sensitizer for some people and is more concerning in leave-on or high-exposure products.",
    common: "Shampoo, cleaners, wipes, detergents",
    alternatives: "Look for products with lower-sensitizing preservative systems and clear allergen labeling.",
    sources: ["Cosmetic ingredient reference", "Chemical reference", "Ingredient safety record"]
  },
  "Sodium laureth sulfate": {
    risk: "moderate",
    type: "Surfactant",
    why:
      "A common cleansing agent that can be drying or irritating for some users depending on concentration and product format.",
    common: "Shampoo, body wash, toothpaste, dish soap",
    alternatives: "Look for gentler surfactants such as sodium cocoyl isethionate or coco-glucoside.",
    sources: ["Cosmetic ingredient reference", "Chemical reference"]
  },
  "Sodium hypochlorite": {
    risk: "harmful",
    type: "Bleach cleaner",
    why:
      "Flagged as higher concern because it can irritate skin, eyes, and airways and should not be mixed with ammonia or acids.",
    common: "Disinfectants, bleach cleaners, wipes",
    alternatives: "Use milder cleaners when disinfection is not required and always follow the label.",
    sources: ["Product safety reference", "Chemical reference"]
  },
  "Cocamidopropyl betaine": {
    risk: "moderate",
    type: "Surfactant",
    why:
      "Generally useful as a foaming cleanser, but it may bother some users with sensitivities.",
    common: "Shampoo, soap, face wash, dish soap",
    alternatives: "Look for low-irritation, fragrance-free formulas if sensitivity is a concern.",
    sources: ["Cosmetic ingredient reference", "Chemical reference"]
  },
  "Ibuprofen": {
    risk: "moderate",
    type: "Active drug ingredient",
    why:
      "This is an active medicine ingredient, so it is not scored as good or bad. Follow the dosage label and ask a doctor or pharmacist if unsure.",
    common: "Pain relievers, fever reducers",
    alternatives: "Ask a doctor or pharmacist which option fits your situation.",
    sources: ["Medicine label reference", "Drug safety reference"]
  },
  "Cotton": {
    risk: "safe",
    type: "Natural fiber",
    why:
      "Low concern for most users. New textiles can still carry finishing residues, so washing before first wear is a good default.",
    common: "T-shirts, towels, bedding, baby clothing",
    alternatives: "Look for organic cotton, undyed cotton, or OEKO-TEX certified fabrics for lower-residue preferences.",
    sources: ["Textile certification reference", "Material reference"]
  },
  "Organic cotton": {
    risk: "safe",
    type: "Certified natural fiber",
    why:
      "Generally lower concern when certification is clear. Still review dyes, finishes, and care labels.",
    common: "Towels, shirts, underwear, bedding",
    alternatives: "Choose certified organic cotton, undyed textiles, or fragrance-free/dye-free materials.",
    sources: ["Textile certification reference", "Material reference"]
  },
  "Polyester": {
    risk: "moderate",
    type: "Synthetic fiber",
    why:
      "Flagged as moderate because it is synthetic, can retain odor, and may bother some sensitive-skin users depending on weave, dyes, and finishes.",
    common: "Athletic shirts, fleece, towels, scrubbers, blends",
    alternatives: "Look for cotton, organic cotton, lyocell, or certified low-residue textiles.",
    sources: ["Material reference", "Chemical reference"]
  },
  "Nylon": {
    risk: "moderate",
    type: "Synthetic fiber",
    why:
      "A durable synthetic fiber that may be less comfortable for some sensitive users depending on dyes, finishes, and skin contact.",
    common: "Activewear, scrubbers, bags, hosiery",
    alternatives: "Choose cotton, organic cotton, or low-dye certified fabric when skin sensitivity is a concern.",
    sources: ["Material reference", "Chemical reference"]
  },
  "Spandex": {
    risk: "moderate",
    type: "Elastic synthetic fiber",
    why:
      "Often used in small amounts for stretch. It can affect breathability and may matter for very sensitive users in tight clothing.",
    common: "Stretch shirts, leggings, underwear, athletic wear",
    alternatives: "Look for looser fits, lower-spandex blends, or soft natural-fiber basics.",
    sources: ["Material reference"]
  }
};

const sourceLinks = {
  "Food label reference": "https://world.openfoodfacts.org/",
  "Nutrition reference": "https://fdc.nal.usda.gov/",
  "Food additive reference": "https://www.fda.gov/food/food-additives-petitions/food-additive-status-list",
  "Color additive reference": "https://www.fda.gov/industry/color-additives",
  "Food safety review": "https://www.efsa.europa.eu/",
  "Cosmetic ingredient reference": "https://world.openbeautyfacts.org/",
  "Safer product reference": "https://www.epa.gov/saferchoice",
  "Product safety reference": "https://www.epa.gov/pesticide-labels",
  "Ingredient safety record": "https://echa.europa.eu/",
  "Medicine label reference": "https://dailymed.nlm.nih.gov/dailymed/",
  "Drug safety reference": "https://open.fda.gov/",
  "Chemical reference": "https://pubchem.ncbi.nlm.nih.gov/",
  "Ingredient reference": "https://pubchem.ncbi.nlm.nih.gov/",
  "Textile certification reference": "https://www.oeko-tex.com/",
  "Material reference": "https://textileexchange.org/"
};

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

const dailyLogSeed = [
  { id: "daily-1", name: "Protein Bar", calories: 220, protein: 20, carbs: 22, fat: 8 },
  { id: "daily-2", name: "Popcorn", calories: 120, protein: 2, carbs: 14, fat: 7 },
  { id: "daily-3", name: "Greek yogurt bowl", calories: 310, protein: 28, carbs: 36, fat: 6 },
  { id: "daily-4", name: "Turkey sandwich", calories: 410, protein: 32, carbs: 42, fat: 12 },
  { id: "daily-5", name: "Coffee with milk", calories: 90, protein: 4, carbs: 9, fat: 3 },
  { id: "daily-6", name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0 }
];

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

const OPEN_FOOD_FACTS_PRODUCT_FIELDS = [
  "code",
  "status",
  "product_name",
  "product_name_en",
  "generic_name",
  "brands",
  "categories",
  "categories_tags",
  "image_url",
  "image_front_url",
  "image_front_small_url",
  "image_front_thumb_url",
  "selected_images",
  "ingredients_text",
  "ingredients_text_en",
  "ingredients",
  "allergens",
  "allergens_tags",
  "additives_n",
  "additives_tags",
  "additives_original_tags",
  "nutriments",
  "serving_size",
  "nutriscore_grade",
  "nova_group"
].join(",");

const OPEN_FOOD_FACTS_SEARCH_FIELDS = OPEN_FOOD_FACTS_PRODUCT_FIELDS;

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
    return {
      status: "found",
      barcode,
      product: realFoodResult.product,
      confidence: getConfidence(realFoodResult.product),
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
    return {
      status: "found",
      barcode,
      product,
      confidence: getConfidence(product),
      source: "barcode-provider"
    };
  }

  if (realFoodResult.product) {
    return {
      status: "found",
      barcode,
      product: realFoodResult.product,
      confidence: getConfidence(realFoodResult.product),
      source: "food-provider"
    };
  }

  const demoResult = await lookupDemoProductByBarcode(barcode, catalog);
  if (demoResult.product) {
    return {
      status: "found",
      barcode,
      product: demoResult.product,
      confidence: getConfidence(demoResult.product),
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

async function searchFoodProductsByName(rawQuery, { limit = 8 } = {}) {
  const query = cleanText(rawQuery);
  if (query.length < 2) return [];
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: String(limit),
      fields: OPEN_FOOD_FACTS_SEARCH_FIELDS
    });
    const response = await fetchFoodSearch(params);
    if (!response.ok) return [];
    const payload = await response.json();
    return asArray(payload.products)
      .filter((product) => product?.code)
      .map((product) => normalizeOpenFoodFactsProduct(product, normalizeBarcode(product.code)))
      .filter((product) => product.name && product.brand)
      .slice(0, limit);
  } catch (error) {
    console.warn("Food name lookup failed", error);
    return [];
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

function normalizeOpenFoodFactsProduct(rawProduct, barcode) {
  const name = cleanText(rawProduct.product_name || rawProduct.product_name_en || rawProduct.generic_name) || `Food product ${barcode}`;
  const brand = cleanText(String(rawProduct.brands || "").split(",")[0]) || "Unknown brand";
  const image = pickOpenFoodFactsImage(rawProduct);
  const ingredients = mapOpenFoodFactsIngredients(rawProduct);
  const nutrition = mapOpenFoodFactsNutrition(rawProduct);
  const categoryPath = cleanText(rawProduct.categories || asArray(rawProduct.categories_tags).join(" "));
  const inferredCategory = inferCategoryFromProductText([name, brand, categoryPath, ingredients.slice(0, 6).map((item) => item.name).join(" ")].join(" "));
  const hasFoodEvidence = inferredCategory === "food" || ingredients.length > 0 || hasCoreFoodNutrition(nutrition);
  if (!["food", "unknown"].includes(inferredCategory) || (inferredCategory === "unknown" && !hasFoodEvidence)) {
    return createPartialIdentityProduct({
      id: `food-${barcode}`,
      barcode,
      name,
      brand,
      category: inferredCategory === "unknown" ? "unknown" : inferredCategory,
      image,
      description: cleanText(rawProduct.generic_name),
      categoryPath,
      sourceType: "food-provider"
    });
  }

  const processing = mapOpenFoodFactsProcessing(rawProduct.nova_group);
  const counts = getRiskCounts(ingredients);
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
    ...(concerns.length ? [] : ["No major flags found"])
  ].slice(0, 4);
  const baseProduct = {
    id: `food-${barcode}`,
    barcode,
    name,
    brand,
    category: "food",
    image,
    sourceType: "food-provider",
    dataConfidence: getOpenFoodFactsConfidence({ image, ingredients, nutrition }),
    nutritionConfidence: getNutritionConfidence(nutrition),
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

function mapOpenFoodFactsIngredients(product) {
  const fromArray = asArray(product.ingredients)
    .map((ingredient) => cleanText(ingredient.text || ingredient.id || ingredient._id))
    .filter(Boolean);
  const fromText = cleanText(product.ingredients_text_en || product.ingredients_text)
    .split(/[,;•]/)
    .map((item) => cleanText(item.replace(/\([^)]*\)/g, "")))
    .filter(Boolean);
  const names = Array.from(new Set((fromArray.length ? fromArray : fromText).slice(0, 32)));
  return names.map((name) => {
    const risk = classifyIngredientRisk(name);
    return { name, risk, type: selectedTypeForIngredient(name, risk) };
  });
}

function mapOpenFoodFactsNutrition(product) {
  const nutriments = product.nutriments || {};
  const calories = firstNumber(
    nutriments["energy-kcal_serving"],
    nutriments["energy-kcal_100g"],
    nutriments["energy-kcal"],
    hasNumber(toNumber(nutriments["energy-kj_serving"])) ? toNumber(nutriments["energy-kj_serving"]) / 4.184 : null,
    hasNumber(toNumber(nutriments["energy-kj_100g"])) ? toNumber(nutriments["energy-kj_100g"]) / 4.184 : null
  );
  const sodiumGrams = firstNumber(nutriments.sodium_serving, nutriments.sodium_100g, nutriments.sodium);
  const saltGrams = firstNumber(nutriments.salt_serving, nutriments.salt_100g, nutriments.salt);
  const sodiumMg = hasNumber(sodiumGrams) ? sodiumGrams * 1000 : hasNumber(saltGrams) ? saltGrams * 400 : null;
  return {
    servingSize: cleanText(product.serving_size) || "Per label data",
    calories: roundNutrient(calories, 0),
    protein: roundNutrient(firstNumber(nutriments.proteins_serving, nutriments.proteins_100g, nutriments.proteins), 1),
    carbs: roundNutrient(firstNumber(nutriments.carbohydrates_serving, nutriments.carbohydrates_100g, nutriments.carbohydrates), 1),
    fat: roundNutrient(firstNumber(nutriments.fat_serving, nutriments.fat_100g, nutriments.fat), 1),
    sugar: roundNutrient(firstNumber(nutriments.sugars_serving, nutriments.sugars_100g, nutriments.sugars), 1),
    sodium: roundNutrient(sodiumMg, 0),
    saturatedFat: roundNutrient(firstNumber(nutriments["saturated-fat_serving"], nutriments["saturated-fat_100g"], nutriments["saturated-fat"]), 1),
    fiber: roundNutrient(firstNumber(nutriments.fiber_serving, nutriments.fiber_100g, nutriments.fiber), 1)
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
  categoryPath = ""
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

function getRiskCounts(ingredients = []) {
  return ingredients.reduce(
    (acc, ingredient) => {
      acc[ingredient.risk] += 1;
      return acc;
    },
    { safe: 0, moderate: 0, harmful: 0 }
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

  const counts = getRiskCounts(input.ingredients || []);
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

function classifyIngredientRisk(name) {
  const lower = name.toLowerCase();
  if (
    lower.includes("red 40") ||
    lower.includes("artificial") ||
    lower.includes("methylisothiazolinone") ||
    lower.includes("hypochlorite") ||
    lower.includes("titanium dioxide") ||
    lower.includes("bha") ||
    lower.includes("bht")
  ) {
    return "harmful";
  }
  if (
    lower.includes("fragrance") ||
    lower.includes("flavor") ||
    lower.includes("flavour") ||
    lower.includes("sulfate") ||
    lower.includes("sulphate") ||
    lower.includes("palm") ||
    lower.includes("preservative") ||
    lower.includes("color") ||
    lower.includes("colour") ||
    lower.includes("carrageenan") ||
    lower.includes("polyester") ||
    lower.includes("nylon") ||
    lower.includes("spandex")
  ) {
    return "moderate";
  }
  return "safe";
}

function scoreBeautyProduct(input) {
  const counts = getRiskCounts(input.ingredients || []);
  let score = 88;
  score -= Math.min(counts.moderate * 6 + counts.harmful * 14, 42);
  if ((input.ingredients || []).some((ingredient) => ingredient.name.toLowerCase().includes("fragrance"))) score -= 8;
  if ((input.ingredients || []).length <= 6) score += 5;
  if (input.positives?.some((positive) => positive.toLowerCase().includes("fragrance-free"))) score += 8;
  return clamp(Math.round(score), 0, 100);
}

function scoreHouseholdProduct(input) {
  const counts = getRiskCounts(input.ingredients || []);
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
  nutrition,
  nutritionConfidence,
  confidence = "Manual Review"
}) {
  const normalized = String(text || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const ingredients = normalized.map((name) => {
    const risk = classifyIngredientRisk(name);
    return { name, risk, type: selectedTypeForIngredient(name, risk) };
  });

  const selectedCategory = category === "not-sure" ? inferCategory(ingredients) : category;
  const hasNutrition = selectedCategory === "food" && hasCoreFoodNutrition(nutrition);
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
      additives: "Manual Review",
      allergens: "Missing"
    },
    rating: "Quick Analysis",
    positives: ["Manual fallback used", "Ingredient risks grouped simply"],
    concerns: buildManualConcerns(ingredients, selectedCategory),
    ingredients,
    breakdown: buildManualBreakdown(ingredients, selectedCategory),
    alternatives: selectedCategory === "medicine" ? [] : ["skinny-pop", "lotion", "free-detergent"],
    processing: selectedCategory === "food" ? "Unknown" : undefined,
    nutrition: selectedCategory === "food" ? nutrition : undefined,
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
    const hasSynthetic = materials.some((material) => material.risk !== "safe");
    return {
      ...baseProduct,
      image: undefined,
      rating: "Material Summary",
      summaryStatus: hasSynthetic ? "Moderate Concern" : "Low Concern",
      materialSummary: materials.map((material) => material.name).join(", "),
      concernLevel: hasSynthetic ? "Moderate" : "Low",
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

  if (selectedCategory === "unknown" || (selectedCategory === "food" && !hasNutrition)) {
    return {
      ...baseProduct,
      score: null,
      analysisPending: true,
      summaryStatus: "Needs label",
      rating: "Partial match",
      concerns: [
        ...(selectedCategory === "food" ? ["Nutrition label needed"] : ["Product category needs confirmation"]),
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

function mergeProductLabelCompletion(product, completed) {
  if (!product) return completed;
  const category = completed.category === "unknown" && product.category !== "unknown" ? product.category : completed.category;
  const fieldConfidence = {
    ...(product.fieldConfidence || {}),
    ...(completed.fieldConfidence || {}),
    identity: product.fieldConfidence?.identity || "Verified",
    image: completed.userPhoto ? "Manual Review" : product.fieldConfidence?.image || (product.image ? "Verified" : "Missing")
  };

  if (category === "medicine") {
    fieldConfidence.activeIngredient = completed.activeIngredient ? "Manual Review" : "Missing";
    fieldConfidence.warnings = completed.warnings?.length ? "Manual Review" : "Missing";
    fieldConfidence.inactiveIngredients = completed.inactiveIngredients?.length ? "Manual Review" : "Missing";
  }
  if (category === "textile") {
    fieldConfidence.materials = (completed.materials?.length || completed.ingredients?.length) ? "Manual Review" : "Missing";
    fieldConfidence.care = completed.treatmentNotes ? "Manual Review" : "Missing";
  }
  if (category === "household") {
    fieldConfidence.cautions = completed.safetyNotes?.length ? "Manual Review" : "Missing";
  }

  return {
    ...product,
    ...completed,
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    category,
    image: product.image,
    userPhoto: completed.userPhoto || product.userPhoto,
    description: product.description,
    sourceType: product.sourceType,
    dataConfidence: "Manual Review",
    fieldConfidence
  };
}

function selectedTypeForIngredient(name, risk) {
  const lower = name.toLowerCase();
  if (lower.includes("cotton")) return "Natural fiber";
  if (lower.includes("polyester") || lower.includes("nylon") || lower.includes("spandex")) return "Synthetic fiber";
  return risk === "safe" ? "Ingredient" : "Flagged ingredient";
}

function inferCategory(ingredients) {
  return inferCategoryFromProductText(ingredients.map((ingredient) => ingredient.name).join(" "));
}

function buildManualConcerns(ingredients, category) {
  const counts = getRiskCounts(ingredients);
  if (category === "unknown") return ["Category not confirmed", `${counts.moderate + counts.harmful} flagged ingredients`, "Add the product label"];
  if (category === "medicine") return ["Review active ingredient", "Check duplicate ingredients", "Follow dosage label"];
  if (category === "textile") return ["Material blend", `${counts.moderate + counts.harmful} material notes`, "Wash before use"];
  if (category === "household") return ["Chemical caution", `${counts.moderate + counts.harmful} flagged ingredients`, "Review warning label"];
  if (category === "beauty") return ["Possible irritants", `${counts.moderate + counts.harmful} flagged ingredients`, "Sensitivity depends on user"];
  return ["Ingredient flags", "Nutrition not available from paste", "Processing estimated"];
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
      nutrition: { servingSize: "3 tbsp", calories: 170, protein: 2, carbs: 18, fat: 11, sugar: 0, sodium: 330, saturatedFat: 5, fiber: 3 }
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
    confidence: "Manual Review",
    nutritionEstimated: false
  };

  if (category === "food") {
    return {
      ...base,
      nutrition: {
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
    confidence: "Manual Review"
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
  return {
    servingSize: nutrition.servingSize || "Not available",
    calories: toNumber(nutrition.calories),
    protein: toNumber(nutrition.protein),
    carbs: toNumber(nutrition.carbs),
    fat: toNumber(nutrition.fat),
    sugar: toNumber(nutrition.sugar),
    sodium: toNumber(nutrition.sodium),
    saturatedFat: toNumber(nutrition.saturatedFat),
    fiber: toNumber(nutrition.fiber)
  };
}

function splitLabelText(text) {
  if (!text) return null;
  return text
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function App() {
  const [activeTab, setActiveTab] = useState("scan");
  const [selectedProductId, setSelectedProductId] = useState("pop-secret");
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [barcodeMiss, setBarcodeMiss] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [query, setQuery] = useState("");
  const [realSearchResults, setRealSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [manualText, setManualText] = useState("Palm oil, salt, artificial flavor, annatto color");
  const [manualCategory, setManualCategory] = useState("food");
  const [capturedPhoto, setCapturedPhoto] = useState("");
  const [ocrReview, setOcrReview] = useState(null);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [dailyLog, setDailyLog] = useState(dailyLogSeed);
  const [actionOpen, setActionOpen] = useState(false);
  const [messageTone, setMessageTone] = useState("Polite");
  const [platform, setPlatform] = useState("Instagram");
  const [copied, setCopied] = useState(false);

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

  const dailyTotals = dailyLog.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

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

  function recordHistoryProduct(product) {
    setScanHistory((items) => {
      if (items[0]?.productId === product.id && items[0]?.date === "Today, just now") return items;
      return [
        { id: `h-${product.id}-${Date.now()}`, productId: product.id, date: "Today, just now" },
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
      return;
    }
    setSearchStatus("ready");
  }

  async function runProductSearch(nextQuery = query) {
    const searchTerm = cleanText(nextQuery);
    if (searchTerm.length < 2) {
      setRealSearchResults([]);
      setLastSearchTerm("");
      setSearchStatus("idle");
      return;
    }
    setSearchStatus("searching");
    setLastSearchTerm(searchTerm);
    const results = await searchFoodProductsByName(searchTerm);
    setRealSearchResults(results);
    if (results.length) upsertDynamicProducts(results);
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
    if (product.category !== "food" || !product.nutrition || !hasNumber(product.nutrition.calories)) return;
    setDailyLog((items) => [
      {
        id: `${product.id}-${Date.now()}`,
        name: product.name,
        calories: product.nutrition.calories,
        protein: product.nutrition.protein || 0,
        carbs: product.nutrition.carbs || 0,
        fat: product.nutrition.fat || 0
      },
      ...items
    ]);
  }

  function renderActiveView() {
    if (activeTab === "history") {
      return <HistoryScreen history={scanHistory} productIndex={productIndex} onOpenProduct={openProduct} />;
    }
    if (activeTab === "search") {
      return (
        <SearchScreen
          query={query}
          setQuery={updateSearchQuery}
          results={realSearchResults}
          status={searchStatus}
          lastSearchTerm={lastSearchTerm}
          onSearch={runProductSearch}
          onOpenProduct={openProduct}
        />
      );
    }
    if (activeTab === "recs") {
      return <RecommendationsScreen productIndex={productIndex} history={scanHistory} onOpenProduct={openProduct} />;
    }
    if (activeTab === "top") {
      return <TopScreen productIndex={productIndex} realProducts={realProducts} onOpenProduct={openProduct} />;
    }
    if (activeTab === "profile") {
      return <ProfileScreen dailyTotals={dailyTotals} dailyLog={dailyLog} />;
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
  onRecordHistory
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
      nutritionConfidence: sheetProduct?.nutritionConfidence
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
  useSampleProduct
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
                createBlankLabelDraft(value, current.mode, {
                  name: current.productName,
                  brand: current.brand
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
      <button
        className="primary-button full"
        onClick={applyOcrReview}
        disabled={!primaryLabelText.trim() && !review.activeIngredient?.trim()}
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

function SearchScreen({ query, setQuery, results, status, lastSearchTerm, onSearch, onOpenProduct }) {
  const samples = featuredSampleIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean)
    .slice(0, 5);
  const showIntro = !query.trim();

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
            results.map((product) => (
              <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
            ))
          ) : status === "ready" ? (
            <EmptyState title="Ready to search" copy="Press Enter to look up matching products." />
          ) : (
            <EmptyState title="No products found" copy="Try another product name or scan a barcode." />
          )}
        </section>
      )}
    </div>
  );
}

function TopScreen({ productIndex, realProducts, onOpenProduct }) {
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
      <Header eyebrow="Top" title="Popular picks" />
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
  const actionLabel = onlyImageMissing ? "Add product photo" : onlyIngredientsMissing ? "Paste ingredients" : "Add label photo";
  const content = (
    <>
      <div className="label-completion-heading">
        <span className="label-completion-icon"><Camera size={18} /></span>
        <div>
          <span className="eyebrow">Needs label</span>
          <h2>Complete this report</h2>
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
        <Camera size={16} />
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
  onCompleteLabel
}) {
  const meta = categoryMeta[product.category];
  const Icon = meta.icon;
  const counts = getRiskCounts(product.ingredients || []);
  const isMedicine = product.category === "medicine";
  const isTextile = product.category === "textile";
  const isSummary = isMedicine || isTextile || product.analysisPending;
  const scoreClass = isSummary ? "score-neutral" : getScoreClass(product.score);
  const confidenceStatus = getConfidence(product);
  const imageStatus = getImageStatus(product);
  const showImageStatus = imageStatus !== confidenceStatus && ["Placeholder", "User Photo"].includes(imageStatus);
  const flaggedIngredients = (product.actionIngredients?.length
    ? product.actionIngredients
    : product.ingredients?.filter((ingredient) => ingredient.risk !== "safe").map((ingredient) => ingredient.name)) || [];

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
          {isTextile ? <TextileSummary product={product} /> : null}

          <ReportAtAGlance product={product} />
          <LabelCompletionPanel product={product} onCompleteLabel={onCompleteLabel} />

          {!isTextile && !product.analysisPending && product.breakdown?.length > 0 && (
            <ExpandableSection
              id="breakdown"
              title="Score breakdown"
              subtitle="Nutrition, ingredients, and processing"
              icon={FlaskConical}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <ScoreSummary product={product} />
              <div className="report-detail-rows">
                {product.breakdown.map((item) => (
                  <div className="report-detail-row" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <em>{item.value}</em>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          <ExpandableSection
            id="concerns"
            title={isTextile ? "Material notes" : "All concerns"}
            subtitle={`${product.concerns?.length || 0} ${product.concerns?.length === 1 ? "reason" : "reasons"}`}
            icon={AlertTriangle}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <div className="simple-list">
              {product.concerns?.map((item) => (
                <div className="simple-row" key={item}>
                  <span className="status-dot red" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </ExpandableSection>

          <ExpandableSection
            id="positives"
            title="Positives"
            subtitle={`${product.positives?.length || 0} ${product.positives?.length === 1 ? "positive" : "positives"}`}
            icon={Check}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <div className="simple-list">
              {product.positives?.map((item) => (
                <div className="simple-row" key={item}>
                  <span className="status-dot green" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </ExpandableSection>

          {(product.ingredients?.length > 0 || isTextile) && (
            <ExpandableSection
              id="ingredients"
              title={isTextile ? "Material details" : "Ingredient details"}
              subtitle={`${product.ingredients?.length || 0} listed - ${counts.moderate + counts.harmful} flagged`}
              icon={Info}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <div className="risk-counts">
                <RiskCount label="Safe" value={counts.safe} type="safe" />
                <RiskCount label="Moderate" value={counts.moderate} type="moderate" />
                <RiskCount label="Harmful" value={counts.harmful} type="harmful" />
              </div>
              <div className="ingredient-chips">
                {product.ingredients?.slice(0, 8).map((ingredient) => (
                  <button
                    className={`ingredient-chip ${riskMeta[ingredient.risk].className}`}
                    key={`${ingredient.name}-${ingredient.type}`}
                    onClick={() => onIngredientClick(ingredient)}
                  >
                    {ingredient.name}
                  </button>
                ))}
              </div>
            </ExpandableSection>
          )}

          {product.category === "food" && !product.analysisPending && (
            <ExpandableSection
              id="nutrition"
              title="Nutrition"
              subtitle={hasNumber(product.nutrition?.calories) ? `${product.nutrition.calories} calories - tap for macros` : "Needs label"}
              icon={Utensils}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <FoodNutrition product={product} onAddToDailyLog={onAddToDailyLog} embedded />
            </ExpandableSection>
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

          <Alternatives product={product} productIndex={productIndex} onOpenProduct={onOpenProduct} />

          <TakeAction
            product={product}
            flaggedIngredients={flaggedIngredients}
            open={actionOpen}
            setOpen={setActionOpen}
            platform={platform}
            setPlatform={setPlatform}
            tone={messageTone}
            setTone={setMessageTone}
            copied={copied}
            setCopied={setCopied}
          />
        </>
      )}
    </div>
  );
}

function ReportAtAGlance({ product }) {
  const concernItems = product.concerns?.slice(0, 2) || [];
  const supportItems =
    product.category === "household"
      ? product.safetyNotes?.slice(0, 2) || []
      : product.category === "textile"
        ? [
            product.washBeforeUse ? "Wash before first use" : "Review care label",
            product.sensitiveSkinNotes
          ].filter(Boolean).slice(0, 2)
        : product.positives?.slice(0, 2) || [];
  const supportTitle =
    product.category === "household"
      ? "Safety notes"
      : product.category === "textile"
        ? "Wear notes"
        : "Positives";
  const supportDot = product.category === "household" || product.category === "textile" ? "yellow" : "green";

  return (
    <section className="card report-reasons">
      <div className="report-reason-group">
        <span>{product.category === "textile" ? "Material notes" : "Main concerns"}</span>
        <div className="report-native-list">
          {concernItems.map((item) => (
            <div className="report-native-row" key={item}>
              <span className="status-dot red" />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="report-reason-group">
        <span>{supportTitle}</span>
        <div className="report-native-list">
          {supportItems.map((item) => (
            <div className="report-native-row" key={item}>
              <span className={`status-dot ${supportDot}`} />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoreSummary({ product }) {
  const computed =
    product.category === "food"
      ? product.scoring || scoreFoodProduct(product)
      : product.category === "beauty"
        ? { total: scoreBeautyProduct(product), nutrition: null, ingredients: null, processing: null }
        : { total: scoreHouseholdProduct(product), nutrition: null, ingredients: null, processing: null };
  return product.category === "food" ? (
    <div className="score-summary-compact">
      <p>Nutrition, ingredients, and processing are scored separately.</p>
      <div className="score-bars">
          <ScoreBar label="Nutrition" value={computed.nutrition} max={50} />
          <ScoreBar label="Ingredients" value={computed.ingredients} max={35} />
          <ScoreBar label="Processing" value={computed.processing} max={15} />
      </div>
    </div>
  ) : (
    <p className="report-detail-note">
      This score uses category-specific ingredient, irritation, fragrance, and caution rules.
    </p>
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

function FoodNutrition({ product, onAddToDailyLog, embedded = false }) {
  const n = product.nutrition || {};
  const canLog = hasNumber(n.calories);
  return (
    <section className={`${embedded ? "nutrition-card-embedded" : "card nutrition-card"}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Nutrition</span>
          <h2>Calories and macros</h2>
        </div>
        <div className="nutrition-status">
          <ConfidenceBadge status={product.nutritionConfidence || getConfidence(product)} />
          <Utensils size={21} />
        </div>
      </div>
      {product.nutritionConfidence === "Estimated" && (
        <p className="estimate-note">Nutrition is estimated from a fallback nutrition search. Confirm the label when available.</p>
      )}
      <div className="macro-grid macro-grid-primary">
        <Macro label="Calories" value={n.calories} unit="" />
        <Macro label="Protein" value={n.protein} unit="g" />
        <Macro label="Carbs" value={n.carbs} unit="g" />
        <Macro label="Fat" value={n.fat} unit="g" />
      </div>
      <details className="nutrition-more">
        <summary>
          More nutrition
          <ChevronDown size={18} />
        </summary>
        <div className="macro-grid nutrition-secondary-grid">
          <Macro label="Serving" value={n.servingSize} unit="" />
          <Macro label="Sugar" value={n.sugar} unit="g" />
          <Macro label="Sodium" value={n.sodium} unit="mg" />
          <Macro label="Sat. fat" value={n.saturatedFat} unit="g" />
          <Macro label="Fiber" value={n.fiber} unit="g" />
        </div>
      </details>
      <button className="primary-button full" onClick={() => onAddToDailyLog(product)} disabled={!canLog}>
        <Plus size={18} />
        {canLog ? "Add to Daily Log" : "Calories missing"}
      </button>
    </section>
  );
}

function Alternatives({ product, productIndex, onOpenProduct }) {
  const alternatives = (product.alternatives || []).map((id) => productIndex.get(id)).filter(Boolean);
  if (!alternatives.length) return null;
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Better picks</span>
          <h2>Safer alternatives</h2>
        </div>
        <Leaf size={21} />
      </div>
      <div className="alternative-list">
        {alternatives.slice(0, 3).map((alternative) => (
          <button key={alternative.id} onClick={() => onOpenProduct(alternative.id)}>
            <ProductImage product={alternative} alt={alternative.name} />
            <div>
              <strong>{alternative.name}</strong>
              <span>{alternative.brand}</span>
            </div>
            <em>{getScoreLabel(alternative)}</em>
          </button>
        ))}
      </div>
    </section>
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

function HistoryScreen({ history, productIndex, onOpenProduct }) {
  const today = history.filter((item) => item.date.startsWith("Today"));
  const yesterday = history.filter((item) => item.date.startsWith("Yesterday"));
  const earlier = history.filter((item) => !item.date.startsWith("Today") && !item.date.startsWith("Yesterday"));
  return (
    <div className="stack">
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

function ProfileScreen({ dailyTotals, dailyLog }) {
  const remaining = 2200 - dailyTotals.calories;
  return (
    <div className="stack">
      <Header eyebrow="Profile" title="Profile" />
      <section className="card profile-card">
        <div className="profile-top">
          <div className="avatar">
            <User size={28} />
          </div>
          <div>
            <h2>Guest scanner</h2>
            <p>Guest mode</p>
          </div>
        </div>
        <div className="settings-list">
          <ProfileRow icon={Target} label="Daily calorie goal" value="2,200 calories" />
          <ProfileRow icon={Bell} label="Saved preferences" value="Low sodium, fragrance-free" />
          <ProfileRow icon={AlertTriangle} label="Allergies or sensitivities" value="Milk, peanuts, fragrance" />
          <ProfileRow icon={Minus} label="Avoided ingredients" value="Red 40, artificial flavor" />
          <ProfileRow icon={Star} label="Premium status" value="Not required to scan" />
        </div>
      </section>
      <section className="card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Food only</span>
            <h2>Daily Log</h2>
          </div>
          <Dumbbell size={21} />
        </div>
        <div className="daily-log profile-log">
          <div className="daily-ring">
            <Target size={24} />
            <strong>{remaining.toLocaleString()}</strong>
            <span>left</span>
          </div>
          <div className="daily-copy">
            <div className="calorie-line">
              <span>Goal</span>
              <strong>2,200 calories</strong>
            </div>
            <div className="calorie-line">
              <span>Eaten</span>
              <strong>{dailyTotals.calories.toLocaleString()}</strong>
            </div>
            <small>
              Protein {dailyTotals.protein}g/140g | Carbs {dailyTotals.carbs}g | Fat {dailyTotals.fat}g
            </small>
          </div>
        </div>
        <div className="today-foods">
          {dailyLog.slice(0, 4).map((food) => (
            <div key={food.id}>
              <span>{food.name}</span>
              <strong>{food.calories} calories</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductListCard({ product, onClick, meta }) {
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
  return (
    <button className="product-list-card" onClick={onClick}>
      <ProductImage product={product} alt={product.name} />
      <div>
        <span className={`mini-category ${category.tone}`}>
          <Icon size={12} />
          {category.shortLabel}
        </span>
        <strong>{product.name}</strong>
        <small>{product.brand}</small>
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

function IngredientSheet({ ingredient, onClose }) {
  const fallback = {
    risk: ingredient.risk,
    type: ingredient.type,
    why:
      ingredient.risk === "safe"
        ? "Low concern for typical use. Review the full product label if you have allergies or sensitivities."
        : "Flagged because this ingredient may be a concern depending on amount, frequency, sensitivity, or product type.",
    common: "Packaged products with ingredient labels",
    alternatives: "Choose shorter formulas and products with clearer ingredient disclosure.",
    sources: ["Ingredient reference", "Chemical reference"]
  };
  const details = ingredientDetails[ingredient.name] || fallback;
  const risk = riskMeta[details.risk || ingredient.risk];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="ingredient-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <span className={`risk-pill ${risk.className}`}>{risk.label}</span>
            <h2>{ingredient.name}</h2>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <InfoBlock label="Type" value={details.type || ingredient.type} />
        <InfoBlock label="Why flagged" value={details.why} />
        <InfoBlock label="Commonly found in" value={details.common} />
        <InfoBlock label="Better alternatives" value={details.alternatives} />
        <div className="source-list">
          <span>Sources</span>
          {details.sources?.map((source) => (
            <a
              href={sourceLinks[source] || sourceLinks["Ingredient reference"]}
              key={source}
              target="_blank"
              rel="noreferrer"
            >
              {source}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
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
        const active = activeTab === tab.id || (tab.id === "scan" && activeTab === "report");
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

function Header({ eyebrow, title, subtitle }) {
  return (
    <header className="page-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
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

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="profile-row">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
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

const rootElement = document.getElementById("root");
const root = globalThis.__ziyaReactRoot || createRoot(rootElement);
globalThis.__ziyaReactRoot = root;
root.render(<App />);
