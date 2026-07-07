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
  Clipboard,
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
    rating: "Better",
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
    rating: "Excellent",
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
    rating: "Excellent",
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
    rating: "Moderate Concern",
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
    rating: "Fair",
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
    rating: "Concern",
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

  const realFoodResult = await lookupOpenFoodFactsFood(barcode);
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
  const processing = mapOpenFoodFactsProcessing(rawProduct.nova_group);
  const counts = getRiskCounts(ingredients);
  const nutritionFlags = getNutritionFlags(nutrition);
  const additivesCount = toNumber(rawProduct.additives_n);
  const hasAdditives = additivesCount > 0 || asArray(rawProduct.additives_tags).length > 0 || asArray(rawProduct.additives_original_tags).length > 0;
  const allergens = formatAllergens(rawProduct.allergens || asArray(rawProduct.allergens_tags).join(", "));
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
    processing,
    allergens,
    additives: {
      count: additivesCount || asArray(rawProduct.additives_tags).length,
      tags: asArray(rawProduct.additives_tags)
    },
    ingredients,
    concerns: concerns.length ? concerns : ["Review full label"],
    positives: positives.length ? positives : ["Barcode match found"],
    nutrition,
    alternatives: ["skinny-pop", "protein-bar", "peanut-butter"]
  };
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

function getOpenFoodFactsConfidence({ image, ingredients, nutrition }) {
  const hasImage = Boolean(image);
  const hasIngredients = ingredients.length > 0;
  const hasNutrition = [nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].some(hasNumber);
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
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  return "Bad";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getScoreClass(score) {
  if (score >= 75) return "score-good";
  if (score >= 50) return "score-mid";
  return "score-bad";
}

function getScoreLabel(product) {
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

function ProductImage({ product, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  const imageKey = `${product.id}-${product.image || ""}-${product.userPhoto || ""}`;

  useEffect(() => {
    setFailed(false);
  }, [imageKey]);

  return (
    <img
      {...props}
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
  const normalized = text
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const guessedIngredients = normalized.length
    ? normalized
    : ["Water", "Fragrance", "Salt", "Artificial flavor"];
  const ingredients = guessedIngredients.map((name) => {
    const risk = classifyIngredientRisk(name);
    return { name, risk, type: selectedTypeForIngredient(name, risk) };
  });

  const selectedCategory = category === "not-sure" ? inferCategory(ingredients) : category;
  const baseProduct = {
    id: `manual-${Date.now()}`,
    name: productName,
    brand,
    category: selectedCategory,
    userPhoto,
    image: undefined,
    dataConfidence: confidence,
    rating: "Quick Analysis",
    positives: ["Manual fallback used", "Ingredient risks grouped simply"],
    concerns: buildManualConcerns(ingredients, selectedCategory),
    ingredients,
    breakdown: buildManualBreakdown(ingredients, selectedCategory),
    alternatives: selectedCategory === "medicine" ? [] : ["skinny-pop", "lotion", "free-detergent"],
    processing: selectedCategory === "food" ? "Unknown" : undefined,
    nutrition: selectedCategory === "food" ? nutrition || estimateNutritionFromIngredients(ingredients) : undefined,
    nutritionConfidence: selectedCategory === "food" ? nutritionConfidence || (nutrition ? "Manual Review" : "Estimated") : undefined,
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

  const score =
    selectedCategory === "food"
      ? scoreFoodProduct(baseProduct).total
      : selectedCategory === "beauty"
        ? scoreBeautyProduct(baseProduct)
        : scoreHouseholdProduct(baseProduct);

  return {
    ...baseProduct,
    score,
    rating: score >= 75 ? "Good" : score >= 50 ? "Moderate" : "Concern"
  };
}

function selectedTypeForIngredient(name, risk) {
  const lower = name.toLowerCase();
  if (lower.includes("cotton")) return "Natural fiber";
  if (lower.includes("polyester") || lower.includes("nylon") || lower.includes("spandex")) return "Synthetic fiber";
  return risk === "safe" ? "Ingredient" : "Flagged ingredient";
}

function estimateNutritionFromIngredients(ingredients) {
  const joined = ingredients.map((ingredient) => ingredient.name.toLowerCase()).join(" ");
  if (joined.includes("peanut")) {
    return { calories: 190, protein: 8, carbs: 7, fat: 16, sugar: 1, sodium: 65, saturatedFat: 2, fiber: 3 };
  }
  if (joined.includes("protein")) {
    return { calories: 220, protein: 20, carbs: 22, fat: 8, sugar: 3, sodium: 180, saturatedFat: 2, fiber: 8 };
  }
  return { calories: 160, protein: 3, carbs: 22, fat: 7, sugar: 4, sodium: 170, saturatedFat: 1, fiber: 2 };
}

function inferCategory(ingredients) {
  const joined = ingredients.map((ingredient) => ingredient.name.toLowerCase()).join(" ");
  if (joined.includes("ibuprofen") || joined.includes("acetaminophen") || joined.includes("cetirizine")) return "medicine";
  if (joined.includes("cotton") || joined.includes("polyester") || joined.includes("nylon") || joined.includes("spandex")) return "textile";
  if (joined.includes("surfactant") || joined.includes("hypochlorite") || joined.includes("detergent")) return "household";
  if (joined.includes("fragrance") || joined.includes("glycerin") || joined.includes("sulfate")) return "beauty";
  return "food";
}

function buildManualConcerns(ingredients, category) {
  const counts = getRiskCounts(ingredients);
  if (category === "medicine") return ["Review active ingredient", "Check duplicate ingredients", "Follow dosage label"];
  if (category === "textile") return ["Material blend", `${counts.moderate + counts.harmful} material notes`, "Wash before use"];
  if (category === "household") return ["Chemical caution", `${counts.moderate + counts.harmful} flagged ingredients`, "Review warning label"];
  if (category === "beauty") return ["Possible irritants", `${counts.moderate + counts.harmful} flagged ingredients`, "Sensitivity depends on user"];
  return ["Ingredient flags", "Nutrition not available from paste", "Processing estimated"];
}

function buildManualBreakdown(ingredients, category) {
  const counts = getRiskCounts(ingredients);
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
    productName: review.productName || "Demo Label Analysis",
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
    servingSize: nutrition.servingSize || "Review label",
    calories: Number(nutrition.calories) || 0,
    protein: Number(nutrition.protein) || 0,
    carbs: Number(nutrition.carbs) || 0,
    fat: Number(nutrition.fat) || 0,
    sugar: Number(nutrition.sugar) || 0,
    sodium: Number(nutrition.sodium) || 0,
    saturatedFat: Number(nutrition.saturatedFat) || 0,
    fiber: Number(nutrition.fiber) || 0
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
  const [scanHistory, setScanHistory] = useState(historySeed);
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
    () => dynamicProducts.filter((product) => product.sourceType === "food-provider"),
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
        const aReal = a.sourceType === "food-provider" ? 0 : 1;
        const bReal = b.sourceType === "food-provider" ? 0 : 1;
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
      return <RecommendationsScreen productIndex={productIndex} realProducts={realProducts} onOpenProduct={openProduct} />;
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
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanFrameRef = useRef(null);
  const scanResolvedRef = useRef(false);
  const dragStartY = useRef(null);

  const sheetProductIndex = useMemo(() => {
    const map = new Map(productIndex);
    if (sheetProduct) map.set(sheetProduct.id, sheetProduct);
    return map;
  }, [productIndex, sheetProduct]);

  function pauseDetection() {
    if (scanFrameRef.current) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    detectorRef.current = null;
  }

  function releaseCamera() {
    pauseDetection();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    scanResolvedRef.current = false;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function stopCamera(nextStatus = "paused", nextMessage = "") {
    releaseCamera();
    setCameraStatus(nextStatus);
    setCameraMessage(nextMessage);
  }

  useEffect(() => {
    startCamera();
    return () => releaseCamera();
  }, []);

  async function startNativeDetection() {
    if (!("BarcodeDetector" in window)) {
      setCameraMessage("Camera active. Use Can't scan? for manual barcode entry if this browser cannot detect automatically.");
      return;
    }

    try {
      const Detector = window.BarcodeDetector;
      const wantedFormats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];
      let supportedFormats = [];
      if (typeof Detector.getSupportedFormats === "function") {
        supportedFormats = await Detector.getSupportedFormats();
      }
      const formats = supportedFormats.length
        ? wantedFormats.filter((format) => supportedFormats.includes(format))
        : wantedFormats;
      try {
        detectorRef.current = new Detector(formats.length ? { formats } : undefined);
      } catch {
        detectorRef.current = new Detector();
      }
    } catch {
      setCameraMessage("Camera active. Use Can't scan? for manual barcode entry if automatic detection does not start.");
      return;
    }

    const detectFrame = async () => {
      if (!detectorRef.current || !videoRef.current || scanResolvedRef.current) return;
      try {
        if (videoRef.current.readyState >= 2) {
          const codes = await detectorRef.current.detect(videoRef.current);
          const detectedValue = codes?.[0]?.rawValue;
          if (detectedValue) {
            scanResolvedRef.current = true;
            setBarcode(detectedValue);
            pauseDetection();
            runBarcodeLookup(detectedValue);
            return;
          }
        }
      } catch {
        setCameraMessage("Camera active. Use Can't scan? if automatic detection does not catch the barcode.");
      }
      scanFrameRef.current = window.requestAnimationFrame(detectFrame);
    };

    scanFrameRef.current = window.requestAnimationFrame(detectFrame);
  }

  async function startCamera() {
    clearBarcodeMiss();
    setActiveFallback(null);
    stopCamera("requesting", "Requesting camera permission...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      setCameraMessage("Camera scanning requires browser permission and may require HTTPS or localhost.");
      openFallback("barcode");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraStatus("active");
      setCameraMessage("");
      await startNativeDetection();
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setCameraStatus(denied ? "denied" : "unavailable");
      setCameraMessage(
        denied
          ? "Camera permission denied. You can still use manual barcode lookup."
          : "Camera unavailable. Camera scanning requires browser permission and may require HTTPS or localhost."
      );
      openFallback("barcode");
    }
  }

  async function runBarcodeLookup(nextBarcode) {
    const lookupValue = normalizeBarcode(nextBarcode ?? barcode);
    setBarcode(lookupValue);
    if (!lookupValue) {
      setSheetMode("not-found");
      setSheetState("mid");
      return;
    }

    setLookupLoading(true);
    clearBarcodeMiss();
    const result = await lookupProductByBarcode(lookupValue);
    window.setTimeout(() => {
      setLookupLoading(false);
      if (result.status === "found" && result.product) {
        setManualProduct(result.product);
        onRecordHistory(result.product);
        setSheetProduct(result.product);
        setSheetMode("product");
        setSheetState("peek");
        setActiveFallback(null);
        return;
      }
      setSheetProduct(null);
      setSheetMode("not-found");
      setSheetState("mid");
    }, 320);
  }

  function openFallback(mode) {
    setSheetMode("fallback");
    setSheetState(mode === "paste" || mode === "label" ? "full" : "mid");
    setActiveFallback(mode);
    if (mode === "photo") {
      window.setTimeout(() => document.getElementById("product-photo")?.click(), 20);
    }
    if (mode === "label") {
      const category = manualCategory === "not-sure" ? "food" : manualCategory;
      setOcrReview(createOcrDraft(category, "ingredients"));
    }
    if (mode === "paste") {
      window.setTimeout(() => document.getElementById("ingredient-paste")?.focus(), 40);
    }
  }

  function useSampleProduct() {
    const sample = products.find((product) => product.id === "pop-secret") || products[0];
    setSheetProduct(sample);
    setSheetMode("product");
    setSheetState("peek");
    setActiveFallback(null);
  }

  function analyzeManualInSheet() {
    const report = createManualReport({ text: manualText, category: manualCategory, userPhoto: capturedPhoto });
    setManualProduct(report);
    onRecordHistory(report);
    setSheetProduct(report);
    setSheetMode("product");
    setSheetState("full");
    setActiveFallback(null);
    setExpandedSection(null);
  }

  function applyOcrInSheet() {
    if (!ocrReview) return;
    const report = createReportFromOcr(ocrReview, capturedPhoto);
    setManualProduct(report);
    onRecordHistory(report);
    setSheetProduct(report);
    setSheetMode("product");
    setSheetState("full");
    setActiveFallback(null);
    setOcrReview(null);
    setExpandedSection(null);
  }

  function expandSheet() {
    setSheetState((current) => (current === "peek" ? "mid" : "full"));
  }

  function collapseSheet() {
    setSheetState((current) => (current === "full" ? "mid" : current === "mid" ? "peek" : "peek"));
  }

  function handleSheetPointerDown(event) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleSheetPointerUp(event) {
    if (dragStartY.current == null) return;
    const delta = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (delta < -38) expandSheet();
    if (delta > 38) collapseSheet();
  }

  return (
    <div className="scanner-live">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cameraStatus === "active" ? "scanner-video is-active" : "scanner-video"}
      />
      <div className="scanner-fallback-bg" />
      <div className="scanner-shade" />

      <div className="scanner-top-controls">
        <button className={`glass-circle ${flashOn ? "is-on" : ""}`} onClick={() => setFlashOn((value) => !value)} aria-label="Toggle flashlight">
          <Flashlight size={21} />
        </button>
        <button className={`glass-circle ${soundOn ? "is-on" : ""}`} onClick={() => setSoundOn((value) => !value)} aria-label="Toggle sound">
          <Volume2 size={22} />
        </button>
      </div>

      <div className="scanner-center">
        <div className="scan-corners">
          <span />
          <span />
          <span />
          <span />
          {cameraStatus === "active" && <i />}
        </div>
        <p>
          {cameraStatus === "requesting"
            ? "Requesting camera"
            : cameraStatus === "active"
              ? "Align the barcode"
              : cameraStatus === "denied"
                ? "Camera permission denied"
                : "Camera unavailable"}
        </p>
        {cameraMessage && <small>{cameraMessage}</small>}
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
        }}
      />

      <ScannerBottomSheet
        mode={sheetMode}
        sheetState={sheetState}
        setSheetState={setSheetState}
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
        onLookup={() => runBarcodeLookup()}
        activeFallback={activeFallback}
        openFallback={openFallback}
        manualText={manualText}
        setManualText={setManualText}
        manualCategory={manualCategory}
        setManualCategory={setManualCategory}
        analyzeManual={analyzeManualInSheet}
        capturedPhoto={capturedPhoto}
        ocrReview={ocrReview}
        setOcrReview={setOcrReview}
        applyOcrReview={applyOcrInSheet}
        useSampleProduct={useSampleProduct}
      />
    </div>
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
  activeFallback,
  openFallback,
  manualText,
  setManualText,
  manualCategory,
  setManualCategory,
  analyzeManual,
  capturedPhoto,
  ocrReview,
  setOcrReview,
  applyOcrReview,
  useSampleProduct
}) {
  if (!mode) return null;
  const isProduct = mode === "product" && product;
  const canPeek = isProduct;

  function toggleSheet() {
    if (sheetState === "peek") setSheetState("mid");
    else if (sheetState === "mid") setSheetState("full");
    else setSheetState(canPeek ? "peek" : "mid");
  }

  return (
    <section className={`scanner-sheet scanner-sheet-${sheetState} scanner-sheet-${mode}`}>
      <button className="sheet-grabber" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onClick={toggleSheet} aria-label="Expand scan result">
        <span />
      </button>

      {isProduct && sheetState !== "full" && (
        <>
          <ScannerResultBar product={product} />
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
          activeFallback={activeFallback}
          openFallback={openFallback}
          manualText={manualText}
          setManualText={setManualText}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
          analyzeManual={analyzeManual}
          capturedPhoto={capturedPhoto}
          ocrReview={ocrReview}
          setOcrReview={setOcrReview}
          applyOcrReview={applyOcrReview}
          useSampleProduct={useSampleProduct}
        />
      )}

      {mode === "fallback" && (
        <ScannerFallbackSheet
          title="Can't scan?"
          copy="Use one fallback and keep the camera flow open."
          barcode={barcode}
          setBarcode={setBarcode}
          lookupLoading={lookupLoading}
          onLookup={onLookup}
          activeFallback={activeFallback}
          openFallback={openFallback}
          manualText={manualText}
          setManualText={setManualText}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
          analyzeManual={analyzeManual}
          capturedPhoto={capturedPhoto}
          ocrReview={ocrReview}
          setOcrReview={setOcrReview}
          applyOcrReview={applyOcrReview}
          useSampleProduct={useSampleProduct}
        />
      )}
    </section>
  );
}

function ScannerResultBar({ product }) {
  return (
    <div className="scanner-result-bar">
      <ProductImage product={product} alt={product.name} />
      <div>
        <strong>{product.name}</strong>
        <span>{product.brand}</span>
      </div>
      <em className={product.category === "medicine" || product.category === "textile" ? "neutral" : getScoreClass(product.score)}>
        {getScoreLabel(product)}
      </em>
    </div>
  );
}

function ScannerMiniDetails({ product, onExpand }) {
  const lines = product.category === "medicine" ? product.warnings : product.concerns;
  return (
    <div className="scanner-mini-details">
      <div className="mini-score-line">
        <span>{product.category === "medicine" ? "Label Summary" : product.category === "textile" ? "Material Summary" : product.rating}</span>
        <strong>{product.category === "medicine" || product.category === "textile" ? product.summaryStatus : `${product.score}/100`}</strong>
      </div>
      <div className="simple-list">
        {lines?.slice(0, 2).map((item) => (
          <div className="simple-row" key={item}>
            <span className="status-dot red" />
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
  activeFallback,
  openFallback,
  manualText,
  setManualText,
  manualCategory,
  setManualCategory,
  analyzeManual,
  capturedPhoto,
  ocrReview,
  setOcrReview,
  applyOcrReview,
  useSampleProduct
}) {
  return (
    <div className="scanner-fallback-sheet">
      <div className="sheet-title">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="fallback-grid">
        <button onClick={() => openFallback("barcode")}>Manual barcode</button>
        <button onClick={() => openFallback("paste")}>Paste ingredients</button>
        <button onClick={() => openFallback("label")}>Scan label</button>
        <button onClick={useSampleProduct}>Use sample</button>
      </div>

      {activeFallback === "barcode" && (
        <div className="scanner-inline-panel">
          <div className="inline-form">
            <input
              id="barcode-input"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Try 0023807019876"
              inputMode="numeric"
            />
            <button onClick={onLookup}>{lookupLoading ? "Checking" : "Lookup"}</button>
          </div>
        </div>
      )}

      {activeFallback === "paste" && (
        <ManualIngredientPanel
          manualText={manualText}
          setManualText={setManualText}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
          analyzeManual={analyzeManual}
        />
      )}

      {activeFallback === "label" && ocrReview && (
        <OcrReviewPanel review={ocrReview} setReview={setOcrReview} applyOcrReview={applyOcrReview} />
      )}

      {activeFallback === "photo" && capturedPhoto && (
        <div className="scanner-inline-panel">
          <img className="scanner-photo-preview" src={capturedPhoto} alt="User-selected product" />
        </div>
      )}
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
    <section className="card manual-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Fallback mode</span>
          <h2>Paste ingredients</h2>
        </div>
        <Clipboard size={22} />
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
      <button className="primary-button full" onClick={analyzeManual}>
        <Sparkles size={18} />
        Analyze
      </button>
    </section>
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
          <span className="eyebrow">Demo OCR review</span>
          <h2>Confirm label text</h2>
        </div>
        <ConfidenceBadge status="Manual Review" />
      </div>
      <p className="review-note">Demo OCR text is prefilled for this MVP. Edit anything that does not match the label before analyzing.</p>
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
          ["textile", "Fabric"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={review.category === value ? "selected" : ""}
            onClick={() => setReview((current) => ({ ...createOcrDraft(value, current.mode), productName: current.productName, brand: current.brand }))}
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
        <div className="nutrition-editor">
          {[
            ["servingSize", "Serving"],
            ["calories", "Calories"],
            ["protein", "Protein"],
            ["carbs", "Carbs"],
            ["fat", "Fat"],
            ["sugar", "Sugar"],
            ["sodium", "Sodium"]
          ].map(([field, label]) => (
            <label key={field}>
              <span>{label}</span>
              <input
                value={review.nutrition?.[field] ?? ""}
                onChange={(event) => updateNutrition(field, event.target.value)}
              />
            </label>
          ))}
        </div>
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
        <summary>Raw demo text</summary>
        <textarea value={review.text || ""} onChange={(event) => updateField("text", event.target.value)} />
      </details>
      <button className="primary-button full" onClick={applyOcrReview}>
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
  const showSamples = !query.trim();
  const heading =
    showSamples
      ? "Try a sample"
      : status === "searching"
        ? "Searching"
        : lastSearchTerm
          ? "Food results"
          : "Search results";

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
        <Search size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search food products"
        />
      </form>
      <section className="stack small-gap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{showSamples ? "Optional demo data" : "Results"}</span>
            <h2>{heading}</h2>
          </div>
        </div>
        {status === "searching" ? (
          <EmptyState title="Searching products" copy="Looking for matching food labels and images." />
        ) : showSamples ? (
          samples.map((product) => (
            <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
          ))
        ) : results.length ? (
          results.map((product) => (
            <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
          ))
        ) : status === "ready" ? (
          <EmptyState title="Ready to search" copy="Press Enter to look up real food products." />
        ) : (
          <EmptyState title="No products found" copy="Try another product name or scan a barcode." />
        )}
      </section>
    </div>
  );
}

function TopScreen({ productIndex, realProducts, onOpenProduct }) {
  const shownProducts = featuredSampleIds
    .map((id) => productIndex.get(id))
    .filter(Boolean)
    .slice(0, 5);
  return (
    <div className="stack">
      <Header eyebrow="Top" title="Popular picks" />
      {realProducts.length > 0 && (
        <section className="stack small-gap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Your real lookups</span>
              <h2>Recently found</h2>
            </div>
          </div>
          {realProducts.slice(0, 5).map((product) => (
            <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
          ))}
        </section>
      )}
      <section className="stack small-gap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Optional demo data</span>
            <h2>Try a sample</h2>
          </div>
        </div>
        {shownProducts.map((product) => (
          <ProductListCard key={product.id} product={product} onClick={() => onOpenProduct(product.id)} />
        ))}
      </section>
    </div>
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
  setCopied
}) {
  const meta = categoryMeta[product.category];
  const Icon = meta.icon;
  const counts = getRiskCounts(product.ingredients || []);
  const isMedicine = product.category === "medicine";
  const isTextile = product.category === "textile";
  const isSummary = isMedicine || isTextile;
  const scoreClass = isSummary ? "score-neutral" : getScoreClass(product.score);
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
            <ConfidenceBadge status={getConfidence(product)} />
            <ConfidenceBadge status={getImageStatus(product)} />
          </div>
          <div className={`score-block ${scoreClass}`}>
            <strong>
              {isMedicine ? "Label Summary" : isTextile ? "Material Summary" : `${product.score}/100`}
            </strong>
            <span>{isSummary ? product.summaryStatus : product.rating}</span>
          </div>
        </div>
      </section>

      {isMedicine ? (
        <>
          <MedicineSummary product={product} />
          <section className="note-card">
            This is a label summary, not medical advice. Follow the product label and ask a doctor or pharmacist if unsure.
          </section>
        </>
      ) : (
        <>
          {isTextile ? <TextileSummary product={product} /> : product.category === "food" ? <ScoreSummary product={product} /> : null}

          <ReportAtAGlance product={product} />

          {!isTextile && (
            <section className="breakdown-grid">
              {product.breakdown?.map((item) => (
                <div className="breakdown-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </section>
          )}

          <ExpandableSection
            id="concerns"
            title={isTextile ? "Material notes" : "All concerns"}
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
            title={product.category === "household" ? "Positives" : "Positives"}
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

          <section className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{isTextile ? "Materials" : "Ingredients"}</span>
                <h2>{isTextile ? "Material summary" : "Ingredient safety"}</h2>
              </div>
              <Info size={20} />
            </div>
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
          </section>

          {product.category === "food" && (
            <FoodNutrition product={product} dailyTotals={dailyTotals} dailyLog={dailyLog} onAddToDailyLog={onAddToDailyLog} />
          )}

          {product.category === "household" && (
            <ExpandableSection
              id="safety"
              title="Safety notes"
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
    <section className="at-a-glance">
      <div className="glance-card">
        <span>{product.category === "textile" ? "Material notes" : "Main concerns"}</span>
        {concernItems.map((item) => (
          <div className="simple-row" key={item}>
            <span className="status-dot red" />
            <strong>{item}</strong>
          </div>
        ))}
      </div>
      <div className="glance-card">
        <span>{supportTitle}</span>
        {supportItems.map((item) => (
          <div className="simple-row" key={item}>
            <span className={`status-dot ${supportDot}`} />
            <strong>{item}</strong>
          </div>
        ))}
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
  return (
    <section className="score-explainer">
      <div>
        <span className="eyebrow">Category-specific score</span>
        <h2>{product.category === "food" ? "Nutrition, ingredients, processing" : product.category === "beauty" ? "Ingredient concern, irritation, fragrance" : "Chemical caution, irritation, environment"}</h2>
      </div>
      {product.category === "food" ? (
        <div className="score-bars">
          <ScoreBar label="Nutrition" value={computed.nutrition} max={50} />
          <ScoreBar label="Ingredients" value={computed.ingredients} max={35} />
          <ScoreBar label="Processing" value={computed.processing} max={15} />
        </div>
      ) : (
        <p>
          Ziya scores this category with its own rules, so calories never appear on beauty or household products.
        </p>
      )}
    </section>
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

function FoodNutrition({ product, dailyTotals, dailyLog, onAddToDailyLog }) {
  const n = product.nutrition || {};
  const remaining = 2200 - dailyTotals.calories;
  const canLog = hasNumber(n.calories);
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Food only</span>
          <h2>Nutrition and daily log</h2>
        </div>
        <div className="nutrition-status">
          <ConfidenceBadge status={product.nutritionConfidence || getConfidence(product)} />
          <Utensils size={21} />
        </div>
      </div>
      {product.nutritionConfidence === "Estimated" && (
        <p className="estimate-note">Nutrition is estimated from a fallback nutrition search. Confirm the label when available.</p>
      )}
      <div className="macro-grid">
        {n.servingSize && <Macro label="Serving" value={n.servingSize} unit="" />}
        <Macro label="Calories" value={n.calories} unit="" />
        <Macro label="Protein" value={n.protein} unit="g" />
        <Macro label="Carbs" value={n.carbs} unit="g" />
        <Macro label="Fat" value={n.fat} unit="g" />
        <Macro label="Sugar" value={n.sugar} unit="g" />
        <Macro label="Sodium" value={n.sodium} unit="mg" />
      </div>
      <button className="primary-button full" onClick={() => onAddToDailyLog(product)} disabled={!canLog}>
        <Plus size={18} />
        {canLog ? "Add to Daily Log" : "Calories missing"}
      </button>
      <div className="daily-log">
        <div className="daily-ring">
          <Target size={24} />
          <strong>2,200</strong>
          <span>goal</span>
        </div>
        <div className="daily-copy">
          <div className="calorie-line">
            <span>Eaten</span>
            <strong>{dailyTotals.calories.toLocaleString()}</strong>
          </div>
          <div className="calorie-line">
            <span>Remaining</span>
            <strong>{remaining.toLocaleString()}</strong>
          </div>
          <div className="mini-progress">
            <span style={{ width: `${clamp((dailyTotals.calories / 2200) * 100, 0, 100)}%` }} />
          </div>
          <small>
            Protein {dailyTotals.protein}g/140g | Carbs {dailyTotals.carbs}g | Fat {dailyTotals.fat}g
          </small>
        </div>
      </div>
      <div className="today-foods">
        {dailyLog.slice(0, 3).map((food) => (
          <div key={food.id}>
            <span>{food.name}</span>
            <strong>{food.calories} calories</strong>
          </div>
        ))}
      </div>
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
  if (product.category === "medicine") return null;
  const message = buildActionMessage(product, flaggedIngredients, platform, tone);
  return (
    <section className="card take-action">
      <button className="take-action-toggle" onClick={() => setOpen(!open)}>
        <div>
          <span className="eyebrow">Phase 2</span>
          <h2>Take Action</h2>
          <p>Concerned about these ingredients? Ask the brand to improve this product.</p>
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

function RecommendationsScreen({ productIndex, realProducts, onOpenProduct }) {
  const realPairs = realProducts
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
      {samplePairs.length ? (
        <section className="stack small-gap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Optional demo data</span>
              <h2>Try sample swaps</h2>
            </div>
          </div>
          {samplePairs.map(({ bad, good, key }) => (
            <section className="comparison-card" key={key}>
              <RecommendationTile product={bad} icon="bad" role="bad" onOpenProduct={onOpenProduct} />
              <div className="swap-divider">
                <Zap size={16} />
              </div>
              <RecommendationTile product={good} icon="good" role="good" onOpenProduct={onOpenProduct} />
            </section>
          ))}
        </section>
      ) : (
        <EmptyState title="No recommendations yet" copy="Scan a product to compare it with cleaner alternatives." />
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
  return (
    <div className="stack">
      <Header eyebrow="History" title="Recently scanned" />
      <HistoryGroup title="Today" items={today} productIndex={productIndex} onOpenProduct={onOpenProduct} />
      <HistoryGroup title="Yesterday" items={yesterday} productIndex={productIndex} onOpenProduct={onOpenProduct} />
    </div>
  );
}

function HistoryGroup({ title, items, productIndex, onOpenProduct }) {
  return (
    <section className="stack small-gap">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      {items.length ? (
        items.map((item) => {
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
        })
      ) : (
        <EmptyState title="No history yet" copy="Scanned products will appear here by date." compact />
      )}
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
            <i className={product.category === "medicine" || product.category === "textile" ? "neutral" : getScoreClass(product.score)} />
            {product.category === "medicine" || product.category === "textile" ? product.summaryStatus || product.rating : product.rating}
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
      <div className={`list-score ${product.category === "medicine" || product.category === "textile" ? "neutral" : getScoreClass(product.score)}`}>
        <span>{getScoreLabel(product)}</span>
        <small>{product.rating}</small>
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

function ExpandableSection({ id, title, icon: Icon, expandedSection, setExpandedSection, children }) {
  const open = expandedSection === id;
  return (
    <section className="card expandable">
      <button onClick={() => setExpandedSection(open ? "" : id)}>
        <span>
          <Icon size={20} />
          {title}
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

createRoot(document.getElementById("root")).render(<App />);
