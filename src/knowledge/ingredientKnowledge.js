import { findAdditiveAlias } from "../data/additiveAliasMap";
import { findCommonIngredient } from "../data/commonIngredientAtlas";
import { findVagueIngredientTerm } from "../data/vagueIngredientTerms";

const SOURCE_CATALOG = Object.freeze({
  fdaRed3: {
    id: "fda-red-3-2025",
    label: "FDA",
    title: "FDA phase-out of FD&C Red No. 3 in foods and ingested drugs",
    organization: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/food/food-ingredients-packaging/fda-encourages-food-manufacturers-accelerate-phasing-out-use-fdc-red-no-3-foods-2027-deadline",
    date: "2025-07-14",
    sourceType: "regulatory",
    note: "Explains the U.S. authorization revocation and manufacturer compliance dates."
  },
  fdaColors: {
    id: "fda-color-additives",
    label: "FDA",
    title: "Color Additives in Food",
    organization: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/food/food-ingredients-packaging/color-additives-food",
    sourceType: "regulatory",
    note: "U.S. color-additive requirements and permitted-use context."
  },
  fdaAdditives: {
    id: "fda-food-additives",
    label: "FDA",
    title: "Food Additives and GRAS Ingredients",
    organization: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/food/food-ingredients-packaging/food-additives-and-gras-ingredients-information-consumers",
    sourceType: "regulatory",
    note: "General U.S. food-ingredient regulatory context."
  },
  fdaAllergens: {
    id: "fda-food-allergies",
    label: "FDA",
    title: "Food Allergies: What You Need to Know",
    organization: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/food-allergies-what-you-need-know",
    sourceType: "regulatory",
    note: "Major-allergen identity and U.S. food-labeling context."
  },
  fdaPho: {
    id: "fda-partially-hydrogenated-oils",
    label: "FDA",
    title: "Final Determination Regarding Partially Hydrogenated Oils",
    organization: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/food/food-additives-petitions/trans-fat",
    sourceType: "regulatory",
    note: "U.S. regulatory history for partially hydrogenated oils."
  },
  efsaColours: {
    id: "efsa-food-colours",
    label: "EFSA",
    title: "Food colours",
    organization: "European Food Safety Authority",
    url: "https://www.efsa.europa.eu/en/topics/topic/food-colours",
    sourceType: "regulatory",
    note: "European scientific-assessment context for food colours."
  },
  jecfa: {
    id: "jecfa-database",
    label: "JECFA",
    title: "JECFA food additive database",
    organization: "WHO / FAO Joint Expert Committee on Food Additives",
    url: "https://apps.who.int/food-additives-contaminants-jecfa-database/",
    sourceType: "regulatory",
    note: "International food-additive evaluations and specifications."
  },
  cir: {
    id: "cir-ingredients",
    label: "CIR",
    title: "Cosmetic Ingredient Review safety assessments",
    organization: "Cosmetic Ingredient Review",
    url: "https://www.cir-safety.org/ingredients",
    sourceType: "review",
    note: "Cosmetic ingredient safety-review records."
  },
  echa: {
    id: "echa-chemicals",
    label: "ECHA",
    title: "Information on Chemicals",
    organization: "European Chemicals Agency",
    url: "https://echa.europa.eu/information-on-chemicals",
    sourceType: "database",
    note: "Chemical identity, classification, and regulatory records in Europe."
  },
  epaSaferChoice: {
    id: "epa-safer-choice",
    label: "EPA",
    title: "Safer Choice Standard and ingredient resources",
    organization: "U.S. Environmental Protection Agency",
    url: "https://www.epa.gov/saferchoice/safer-ingredients",
    sourceType: "regulatory",
    note: "Ingredient criteria for household and institutional products."
  },
  cdcChlorine: {
    id: "cdc-chlorine",
    label: "CDC",
    title: "Chlorine chemical fact sheet",
    organization: "U.S. Centers for Disease Control and Prevention",
    url: "https://www.cdc.gov/chemical-emergencies/chemical-fact-sheets/chlorine.html",
    sourceType: "regulatory",
    note: "Exposure and emergency-safety context for chlorine compounds."
  },
  dailyMed: {
    id: "dailymed-labels",
    label: "DailyMed",
    title: "DailyMed drug label database",
    organization: "U.S. National Library of Medicine",
    url: "https://dailymed.nlm.nih.gov/dailymed/",
    sourceType: "database",
    note: "Current medicine label information; follow the specific product label."
  },
  textileExchange: {
    id: "textile-exchange-materials",
    label: "Textile Exchange",
    title: "Materials resources",
    organization: "Textile Exchange",
    url: "https://textileexchange.org/knowledge-center/",
    sourceType: "database",
    note: "Fiber and material context, including preferred-material standards."
  },
  ftcTextiles: {
    id: "ftc-textile-labeling",
    label: "FTC",
    title: "Textile and Wool Acts labeling requirements",
    organization: "U.S. Federal Trade Commission",
    url: "https://www.ftc.gov/business-guidance/resources/threading-your-way-through-labeling-requirements-under-textile-wool-acts",
    sourceType: "regulatory",
    note: "Fiber-content naming and labeling context."
  }
});

const KNOWLEDGE_CACHE_VERSION = 1;

const DEFAULT_EVIDENCE = {
  low: "Available reference records do not identify a major concern for typical labeled use. Product form, amount, allergies, and individual sensitivity can still matter.",
  moderate: "The ingredient has context-dependent concerns or sensitivity considerations. Evidence and permitted uses vary by amount, product type, and jurisdiction.",
  higher: "The ingredient has a stronger regulatory, irritation, sensitization, or formulation concern in at least one relevant use. This does not establish that typical exposure will cause harm.",
  unknown: "There is not enough matched source-backed information to assign a concern level. Missing evidence does not establish either concern or absence of concern."
};

const CATEGORY_DEFAULTS = {
  food: { sourceIds: ["fdaAdditives", "jecfa"], use: "Used as a food ingredient or additive.", commonUse: "Packaged foods and beverages" },
  beauty: { sourceIds: ["cir", "echa"], use: "Used in cosmetic or personal-care formulations.", commonUse: "Beauty and personal-care products" },
  household: { sourceIds: ["epaSaferChoice", "echa"], use: "Used in household or cleaning formulations.", commonUse: "Household and cleaning products" },
  medicine: { sourceIds: ["dailyMed"], use: "Used as an active or inactive medicine-label ingredient.", commonUse: "Medicine and supplement labels" },
  textile: { sourceIds: ["textileExchange", "ftcTextiles"], use: "Used as a textile fiber or material.", commonUse: "Clothing, household textiles, and fabric products" }
};

function pubChemSource(name) {
  return {
    id: `pubchem-${slugify(name)}`,
    label: "PubChem",
    title: `${name} compound record`,
    organization: "NIH National Library of Medicine",
    url: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(name)}`,
    sourceType: "database",
    note: "Chemical identity, synonyms, and compound properties when a matching record exists."
  };
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function seed({
  canonicalName,
  aliases = [],
  category,
  type,
  concernLevel = "unknown",
  use,
  commonUse,
  summary,
  evidenceSummary,
  regulatoryContext = "Regulatory status and permitted uses can vary by region and product type.",
  sourceIds,
  confidence = "medium",
  chemical = true,
  applicableCategories
}) {
  const defaults = CATEGORY_DEFAULTS[category];
  const sources = [...new Set(sourceIds || defaults.sourceIds)].map((id) => SOURCE_CATALOG[id]).filter(Boolean);
  if (chemical) sources.push(pubChemSource(canonicalName));
  return Object.freeze({
    id: slugify(canonicalName),
    canonicalName,
    aliases: [...new Set([canonicalName, ...aliases])],
    category,
    type,
    commonUse: commonUse || defaults.commonUse,
    use: use || defaults.use,
    concernLevel,
    summary: summary || `${canonicalName} is ${type ? `a ${type.toLowerCase()}` : "a labeled ingredient"}.`,
    evidenceSummary: evidenceSummary || DEFAULT_EVIDENCE[concernLevel],
    regulatoryContext,
    sources,
    lastFetchedDate: "2026-07-12",
    confidence,
    dataSources: [...new Set(sources.map((source) => source.label))],
    applicableCategories: applicableCategories || [category]
  });
}

export const INGREDIENT_SEEDS = Object.freeze([
  seed({
    canonicalName: "Erythrosine",
    aliases: ["Red 3", "Red No. 3", "FD&C Red No. 3", "FD and C Red No. 3", "E127", "Acid Red 51", "C.I. 45430", "CI 45430"],
    category: "food",
    type: "Synthetic food color / color additive",
    concernLevel: "higher",
    use: "Adds a red or pink color.",
    commonUse: "Candies, frostings, baked goods, desserts, drinks, medicines, and dyed foods where permitted",
    summary: "Erythrosine, commonly called Red 3 or E127, is a synthetic red-pink color additive.",
    evidenceSummary: "U.S. regulatory action was based on high-dose animal-study findings and the Delaney Clause. That action is not proof that typical exposure causes cancer in humans.",
    regulatoryContext: "The FDA revoked authorization for use in U.S. foods and ingested drugs in 2025. Manufacturer compliance dates are January 15, 2027 for foods and January 18, 2028 for ingested drugs; rules differ elsewhere.",
    sourceIds: ["fdaRed3", "fdaColors", "efsaColours", "jecfa"],
    confidence: "high"
  }),
  seed({ canonicalName: "Allura Red AC", aliases: ["Red 40", "Red No. 40", "FD&C Red No. 40", "FD and C Red No. 40", "E129", "C.I. 16035"], category: "food", type: "Synthetic food color", concernLevel: "moderate", use: "Adds a red color.", commonUse: "Candy, drinks, cereals, desserts, and medicines", sourceIds: ["fdaColors", "efsaColours", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Tartrazine", aliases: ["Yellow 5", "Yellow No. 5", "FD&C Yellow No. 5", "E102", "C.I. 19140"], category: "food", type: "Synthetic food color", concernLevel: "moderate", use: "Adds a yellow color.", commonUse: "Drinks, candy, snacks, desserts, and medicines", sourceIds: ["fdaColors", "efsaColours", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Sunset Yellow FCF", aliases: ["Yellow 6", "Yellow No. 6", "FD&C Yellow No. 6", "E110", "C.I. 15985"], category: "food", type: "Synthetic food color", concernLevel: "moderate", use: "Adds an orange-yellow color.", sourceIds: ["fdaColors", "efsaColours", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Brilliant Blue FCF", aliases: ["Blue 1", "Blue No. 1", "FD&C Blue No. 1", "E133", "C.I. 42090"], category: "food", type: "Synthetic food color", concernLevel: "moderate", use: "Adds a blue color.", sourceIds: ["fdaColors", "efsaColours", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Indigo carmine", aliases: ["Blue 2", "Blue No. 2", "FD&C Blue No. 2", "E132", "indigotine", "C.I. 73015"], category: "food", type: "Synthetic food color", concernLevel: "moderate", use: "Adds a blue color.", sourceIds: ["fdaColors", "efsaColours", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Titanium dioxide", aliases: ["E171", "CI 77891", "C.I. 77891", "titanium white"], category: "food", type: "Color additive / opacifier", concernLevel: "moderate", use: "Adds whiteness or opacity.", regulatoryContext: "Permitted uses vary by jurisdiction; food use is not authorized in the European Union, while other product-category uses follow separate rules.", sourceIds: ["fdaColors", "efsaColours", "echa"], confidence: "high", applicableCategories: ["food", "beauty", "medicine"] }),
  seed({ canonicalName: "Annatto", aliases: ["annatto color", "annatto extract", "E160b", "bixin", "norbixin"], category: "food", type: "Plant-derived color additive", concernLevel: "low", use: "Adds yellow to orange color.", sourceIds: ["fdaColors", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Caramel color", aliases: ["caramel colour", "E150", "E150a", "E150b", "E150c", "E150d"], category: "food", type: "Color additive", concernLevel: "moderate", use: "Adds brown color.", sourceIds: ["fdaColors", "jecfa"], confidence: "medium" }),
  seed({ canonicalName: "Artificial flavor", aliases: ["artificial flavour", "artificial flavors", "artificial flavouring"], category: "food", type: "Flavoring category", concernLevel: "unknown", chemical: false, use: "Provides flavor through one or more flavoring substances.", evidenceSummary: "This is a broad label category rather than one chemical, so a specific concern cannot be assigned without fuller disclosure.", confidence: "medium" }),
  seed({ canonicalName: "Natural flavor", aliases: ["natural flavour", "natural flavors", "natural flavouring", "arôme naturel", "arome naturel"], category: "food", type: "Flavoring category", concernLevel: "unknown", chemical: false, use: "Provides flavor from materials that meet the applicable labeling definition.", evidenceSummary: "This broad label term does not identify each flavor substance. Sensitivity depends on the actual formulation.", confidence: "medium" }),

  seed({ canonicalName: "TBHQ", aliases: ["tert-butylhydroquinone", "tertiary butylhydroquinone", "E319"], category: "food", type: "Antioxidant preservative", concernLevel: "moderate", use: "Slows oxidation and rancidity in fats and oils.", commonUse: "Cooking oils, snack foods, cereals, and packaged foods", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "BHT", aliases: ["butylated hydroxytoluene", "E321"], category: "food", type: "Antioxidant preservative", concernLevel: "moderate", use: "Slows oxidation in fats, foods, cosmetics, and packaging.", sourceIds: ["fdaAdditives", "jecfa", "cir"], confidence: "high", applicableCategories: ["food", "beauty"] }),
  seed({ canonicalName: "BHA", aliases: ["butylated hydroxyanisole", "E320"], category: "food", type: "Antioxidant preservative", concernLevel: "moderate", use: "Slows oxidation and rancidity.", sourceIds: ["fdaAdditives", "jecfa", "cir"], confidence: "high", applicableCategories: ["food", "beauty"] }),
  seed({ canonicalName: "Sodium benzoate", aliases: ["E211", "benzoate of soda"], category: "food", type: "Preservative", concernLevel: "moderate", use: "Helps control yeast, mold, and some bacteria in acidic products.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Potassium sorbate", aliases: ["E202", "sorbic acid potassium salt"], category: "food", type: "Preservative", concernLevel: "low", use: "Helps control mold and yeast.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Calcium propionate", aliases: ["E282", "calcium propanoate"], category: "food", type: "Preservative", concernLevel: "low", use: "Helps prevent mold in baked goods.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Sodium nitrate", aliases: ["E251", "nitrate of soda"], category: "food", type: "Curing preservative", concernLevel: "moderate", use: "Supports curing and microbial control in certain foods.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Sodium nitrite", aliases: ["E250"], category: "food", type: "Curing preservative", concernLevel: "moderate", use: "Supports curing, color, and microbial control in certain foods.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Carrageenan", aliases: ["E407", "irish moss extract"], category: "food", type: "Thickener / stabilizer", concernLevel: "moderate", use: "Thickens and stabilizes food mixtures.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Polysorbate 80", aliases: ["E433", "polyoxyethylene sorbitan monooleate"], category: "food", type: "Emulsifier", concernLevel: "moderate", use: "Helps oil and water remain mixed.", sourceIds: ["fdaAdditives", "jecfa", "cir"], confidence: "high", applicableCategories: ["food", "beauty", "medicine"] }),
  seed({ canonicalName: "Xanthan gum", aliases: ["E415"], category: "food", type: "Thickener / stabilizer", concernLevel: "low", use: "Thickens and stabilizes mixtures.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Guar gum", aliases: ["E412", "guaran"], category: "food", type: "Thickener / stabilizer", concernLevel: "low", use: "Thickens and binds water.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),

  seed({ canonicalName: "Aspartame", aliases: ["E951"], category: "food", type: "High-intensity sweetener", concernLevel: "moderate", use: "Adds sweetness with little or no sugar.", regulatoryContext: "Approved uses and labeling requirements vary; products containing aspartame carry phenylalanine information where required.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Sucralose", aliases: ["E955", "trichlorogalactosucrose"], category: "food", type: "High-intensity sweetener", concernLevel: "low", use: "Adds sweetness with little or no sugar.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Acesulfame potassium", aliases: ["acesulfame K", "Ace-K", "E950"], category: "food", type: "High-intensity sweetener", concernLevel: "low", use: "Adds sweetness with little or no sugar.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "High-fructose corn syrup", aliases: ["HFCS", "high fructose corn syrup", "jarabe de maíz de alta fructosa", "sirop de glucose-fructose"], category: "food", type: "Caloric sweetener", concernLevel: "moderate", use: "Adds sweetness and body.", evidenceSummary: "Its contribution is best evaluated through the product's total added sugar and serving pattern rather than treating the ingredient name alone as proof of harm.", sourceIds: ["fdaAdditives"], confidence: "high" }),
  seed({ canonicalName: "Corn syrup", aliases: ["glucose syrup", "corn glucose syrup"], category: "food", type: "Caloric sweetener", concernLevel: "moderate", use: "Adds sweetness, body, and moisture control.", sourceIds: ["fdaAdditives"], confidence: "high" }),
  seed({ canonicalName: "Palm oil", aliases: ["palm fat", "huile de palme", "aceite de palma", "زيت النخيل"], category: "food", type: "Plant oil", concernLevel: "moderate", use: "Provides fat, texture, and shelf stability.", evidenceSummary: "Concern depends mainly on the food's saturated-fat profile, processing, sourcing, and overall dietary pattern.", sourceIds: ["fdaAdditives"], confidence: "high", applicableCategories: ["food", "beauty"] }),
  seed({ canonicalName: "Partially hydrogenated oil", aliases: ["partially hydrogenated oils", "PHO", "partially hydrogenated vegetable oil"], category: "food", type: "Hydrogenated fat", concernLevel: "higher", use: "Historically used for texture and shelf stability.", regulatoryContext: "The FDA determined that partially hydrogenated oils no longer qualified for generally recognized status for use in human food, subject to limited transition provisions.", sourceIds: ["fdaPho"], confidence: "high" }),
  seed({ canonicalName: "Monosodium glutamate", aliases: ["MSG", "E621", "sodium glutamate"], category: "food", type: "Flavor enhancer", concernLevel: "low", use: "Adds savory or umami taste.", evidenceSummary: "Available regulatory assessments support permitted food uses; some people report transient sensitivity symptoms, which does not justify a universal harmful classification.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Enriched wheat flour", aliases: ["enriched flour", "farine de blé enrichie", "harina de trigo enriquecida", "دقيق القمح المدعم"], category: "food", type: "Refined grain ingredient", concernLevel: "low", use: "Provides flour with specified nutrients restored or added.", chemical: false, sourceIds: ["fdaAdditives"], confidence: "high" }),
  seed({ canonicalName: "Maltodextrin", aliases: [], category: "food", type: "Starch-derived carbohydrate", concernLevel: "moderate", use: "Adds body, carries flavors, or changes texture.", sourceIds: ["fdaAdditives"], confidence: "high" }),
  seed({ canonicalName: "Dextrose", aliases: ["D-glucose", "grape sugar"], category: "food", type: "Simple sugar", concernLevel: "moderate", use: "Adds sweetness or supports browning and fermentation.", sourceIds: ["fdaAdditives"], confidence: "high" }),
  seed({ canonicalName: "Soy lecithin", aliases: ["soya lecithin", "E322", "lecithins"], category: "food", type: "Emulsifier", concernLevel: "low", use: "Helps oil and water remain mixed.", sourceIds: ["fdaAdditives", "jecfa"], confidence: "high" }),
  seed({ canonicalName: "Whey", aliases: ["whey powder", "milk whey"], category: "food", type: "Milk-derived ingredient / major allergen", concernLevel: "low", use: "Adds protein, solids, flavor, or texture.", evidenceSummary: "Low concern for people without milk allergy; whey is milk-derived and the physical allergen statement should be reviewed.", chemical: false, sourceIds: ["fdaAdditives", "fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Casein", aliases: ["milk casein", "caseinate"], category: "food", type: "Milk protein / major allergen", concernLevel: "low", use: "Adds protein, structure, or emulsification.", evidenceSummary: "Low concern for people without milk allergy; casein is milk-derived and the physical allergen statement should be reviewed.", chemical: false, sourceIds: ["fdaAdditives", "fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Water", aliases: ["aqua", "eau", "agua", "ماء"], category: "food", type: "Water / solvent", concernLevel: "low", use: "Acts as a base, solvent, or moisture source.", confidence: "high", applicableCategories: ["food", "beauty", "household", "medicine"] }),
  seed({ canonicalName: "Salt", aliases: ["sodium chloride", "sel", "sal", "ملح"], category: "food", type: "Mineral seasoning", concernLevel: "low", use: "Adds flavor and can support preservation or texture.", evidenceSummary: "The product's total sodium is more informative than the ingredient name alone.", confidence: "high" }),
  seed({ canonicalName: "Sugar", aliases: ["sucrose", "table sugar", "sucre", "azúcar", "سكر"], category: "food", type: "Caloric sweetener", concernLevel: "moderate", use: "Adds sweetness, structure, browning, or preservation effects.", evidenceSummary: "Concern depends on the product's total and added sugar, serving size, and consumption pattern.", confidence: "high" }),
  seed({ canonicalName: "Milk", aliases: ["cow's milk", "dairy milk", "lait", "leche", "حليب"], category: "food", type: "Dairy ingredient / major allergen", concernLevel: "low", chemical: false, use: "Provides liquid, protein, fat, sugar, flavor, or texture.", evidenceSummary: "Low concern for people without a milk allergy or relevant intolerance; milk is a major allergen and the physical label should be reviewed.", sourceIds: ["fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Wheat", aliases: ["wheat grain", "blé", "trigo", "قمح"], category: "food", type: "Grain / major allergen", concernLevel: "low", chemical: false, use: "Provides grain solids, starch, protein, or structure.", evidenceSummary: "Low concern for people without a wheat allergy or related condition; wheat is a major allergen and the physical label should be reviewed.", sourceIds: ["fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Wheat flour", aliases: ["flour", "farine de blé", "harina de trigo", "دقيق القمح"], category: "food", type: "Grain flour / major allergen", concernLevel: "low", use: "Provides structure and starch in baked or prepared foods.", evidenceSummary: "Low concern for people without a wheat allergy or related condition; wheat is a major allergen and the physical label should be reviewed.", chemical: false, sourceIds: ["fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Popcorn", aliases: ["popped corn", "corn kernels"], category: "food", type: "Whole-grain food ingredient", concernLevel: "low", use: "Provides the grain base of popcorn products.", chemical: false, confidence: "high" }),
  seed({ canonicalName: "Sunflower oil", aliases: ["sunflower seed oil"], category: "food", type: "Plant oil", concernLevel: "low", use: "Provides fat, texture, or cooking performance.", confidence: "high", applicableCategories: ["food", "beauty"] }),
  seed({ canonicalName: "Vegetable oil", aliases: ["vegetable oils"], category: "food", type: "Plant-oil category", concernLevel: "unknown", chemical: false, use: "Provides fat, texture, or cooking performance.", evidenceSummary: "This label does not identify the specific oil blend, so fatty-acid and sourcing context cannot be determined from the term alone.", confidence: "medium" }),
  seed({ canonicalName: "Cocoa", aliases: ["cocoa powder", "cacao"], category: "food", type: "Cocoa ingredient", concernLevel: "low", use: "Adds chocolate flavor, color, and solids.", chemical: false, confidence: "high" }),
  seed({ canonicalName: "Peanuts", aliases: ["peanut", "groundnuts"], category: "food", type: "Legume / major allergen", concernLevel: "low", use: "Provides flavor, protein, and fat.", chemical: false, evidenceSummary: "Low concern for people without an allergy; peanuts are a major allergen and the physical label should be reviewed.", sourceIds: ["fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Almonds", aliases: ["almond"], category: "food", type: "Tree nut / major allergen", concernLevel: "low", use: "Provides flavor, protein, and fat.", chemical: false, evidenceSummary: "Low concern for people without an allergy; almonds are a tree-nut allergen and the physical label should be reviewed.", sourceIds: ["fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Milk protein isolate", aliases: ["milk protein"], category: "food", type: "Milk-derived protein / major allergen", concernLevel: "low", use: "Adds protein and structure.", chemical: false, evidenceSummary: "Low concern for people without milk allergy; the physical allergen statement should be reviewed.", sourceIds: ["fdaAllergens"], confidence: "high" }),
  seed({ canonicalName: "Corn starch", aliases: ["cornstarch", "maize starch"], category: "food", type: "Starch", concernLevel: "low", use: "Thickens, binds, or adds structure.", chemical: false, confidence: "high", applicableCategories: ["food", "medicine"] }),

  seed({ canonicalName: "Fragrance", aliases: ["parfum", "perfume", "fragrance blend"], category: "beauty", type: "Fragrance mixture", concernLevel: "moderate", chemical: false, use: "Adds scent or masks base odors.", evidenceSummary: "Fragrance is a mixture label, not one compound. Some fragrance components can be allergens or irritants for sensitive users, so the full formulation matters.", confidence: "high", applicableCategories: ["beauty", "household"] }),
  seed({ canonicalName: "Methylisothiazolinone", aliases: ["MI", "MIT", "2-methyl-4-isothiazolin-3-one"], category: "beauty", type: "Preservative", concernLevel: "higher", use: "Controls microbial growth in water-based products.", evidenceSummary: "Methylisothiazolinone is a recognized contact-sensitization concern, especially where exposure is prolonged. Product type and regional restrictions matter.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "household"] }),
  seed({ canonicalName: "Parabens", aliases: ["paraben", "methylparaben", "propylparaben", "butylparaben", "ethylparaben"], category: "beauty", type: "Preservative family", concernLevel: "moderate", chemical: false, use: "Controls microbial growth.", evidenceSummary: "This is a chemical family; individual parabens have different assessments and permitted concentrations. A group label should not be treated as one compound.", sourceIds: ["cir", "echa"], confidence: "medium" }),
  seed({ canonicalName: "Phenoxyethanol", aliases: ["2-phenoxyethanol"], category: "beauty", type: "Preservative", concernLevel: "moderate", use: "Controls microbial growth and can act as a solvent.", sourceIds: ["cir", "echa"], confidence: "high" }),
  seed({ canonicalName: "Sodium lauryl sulfate", aliases: ["SLS", "sodium dodecyl sulfate", "SDS"], category: "beauty", type: "Anionic surfactant", concernLevel: "moderate", use: "Cleans and creates foam.", evidenceSummary: "Can be irritating or drying at some concentrations or exposure conditions; this is an irritation context, not evidence of systemic toxicity from typical rinse-off use.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "household"] }),
  seed({ canonicalName: "Sodium laureth sulfate", aliases: ["SLES", "sodium lauryl ether sulfate"], category: "beauty", type: "Anionic surfactant", concernLevel: "moderate", use: "Cleans and creates foam.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "household"] }),
  seed({ canonicalName: "Dimethicone", aliases: ["polydimethylsiloxane", "PDMS", "E900"], category: "beauty", type: "Silicone polymer", concernLevel: "low", use: "Improves slip, feel, moisture barrier, and foam control.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "food"] }),
  seed({ canonicalName: "Petrolatum", aliases: ["petroleum jelly", "white petrolatum"], category: "beauty", type: "Occlusive emollient", concernLevel: "low", use: "Reduces moisture loss and protects skin.", sourceIds: ["cir", "echa"], confidence: "high" }),
  seed({ canonicalName: "Mineral oil", aliases: ["paraffinum liquidum", "liquid paraffin"], category: "beauty", type: "Emollient / occlusive oil", concernLevel: "low", use: "Softens skin and reduces moisture loss.", sourceIds: ["cir", "echa"], confidence: "high" }),
  seed({ canonicalName: "Talc", aliases: ["talcum", "magnesium silicate"], category: "beauty", type: "Absorbent mineral", concernLevel: "moderate", use: "Absorbs moisture and improves feel or coverage.", evidenceSummary: "Risk context depends on product form, inhalation potential, and mineral purity. Talc should not be conflated with asbestos.", sourceIds: ["cir", "echa"], confidence: "high" }),
  seed({ canonicalName: "Zinc oxide", aliases: ["CI 77947", "C.I. 77947"], category: "beauty", type: "Mineral UV filter / skin protectant", concernLevel: "low", use: "Provides mineral UV protection or skin-protectant coverage where labeled.", evidenceSummary: "Assessment depends on product type, particle form, route of exposure, and labeled use; it is a different substance from titanium dioxide.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "medicine"] }),
  seed({ canonicalName: "Benzyl alcohol", aliases: ["phenylmethanol"], category: "beauty", type: "Preservative / solvent / fragrance component", concernLevel: "moderate", use: "Acts as a solvent, preservative, or fragrance component.", sourceIds: ["cir", "echa"], confidence: "high" }),
  seed({ canonicalName: "Cocamidopropyl betaine", aliases: ["CAPB"], category: "beauty", type: "Amphoteric surfactant", concernLevel: "moderate", use: "Cleans, boosts foam, and helps reduce harshness in surfactant blends.", evidenceSummary: "Some users can develop irritation or contact allergy, sometimes related to manufacturing impurities; product type and individual sensitivity matter.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "household"] }),
  seed({ canonicalName: "Glycerin", aliases: ["glycerol"], category: "beauty", type: "Humectant", concernLevel: "low", use: "Helps attract and retain moisture.", sourceIds: ["cir", "echa"], confidence: "high", applicableCategories: ["beauty", "food", "medicine"] }),
  seed({ canonicalName: "Shea butter", aliases: ["butyrospermum parkii butter"], category: "beauty", type: "Plant-derived emollient", concernLevel: "low", use: "Softens skin and reduces moisture loss.", chemical: false, sourceIds: ["cir"], confidence: "high" }),
  seed({ canonicalName: "Propylene glycol", aliases: ["1,2-propanediol", "E1520"], category: "beauty", type: "Humectant / solvent", concernLevel: "low", use: "Retains moisture, carries ingredients, or controls texture.", sourceIds: ["cir", "echa", "fdaAdditives"], confidence: "high", applicableCategories: ["beauty", "food", "medicine"] }),
  seed({ canonicalName: "Aloe vera", aliases: ["aloe", "aloe barbadensis leaf juice"], category: "beauty", type: "Botanical ingredient", concernLevel: "low", use: "Adds a soothing or moisturizing botanical component.", chemical: false, sourceIds: ["cir"], confidence: "high" }),
  seed({ canonicalName: "Sodium citrate", aliases: ["E331", "trisodium citrate"], category: "food", type: "Acidity regulator / builder", concernLevel: "low", use: "Adjusts acidity, buffers pH, or binds minerals.", sourceIds: ["fdaAdditives", "jecfa", "epaSaferChoice"], confidence: "high", applicableCategories: ["food", "household", "medicine"] }),
  seed({ canonicalName: "Alcohol ethoxylates", aliases: ["C10-16 alcohol ethoxylate", "ethoxylated alcohols"], category: "household", type: "Nonionic surfactant family", concernLevel: "moderate", chemical: false, use: "Lifts oily soil and supports cleaning.", evidenceSummary: "This is a family of surfactants. Irritation and environmental profiles depend on chain length, ethoxylation, concentration, and formulation.", sourceIds: ["epaSaferChoice", "echa"], confidence: "medium" }),

  seed({ canonicalName: "Ammonia", aliases: ["ammonium hydroxide", "aqueous ammonia"], category: "household", type: "Alkaline cleaner", concernLevel: "higher", use: "Cuts grease and adjusts pH.", evidenceSummary: "Concentrated vapors and solutions can irritate eyes, skin, and airways. Never mix ammonia cleaners with bleach.", sourceIds: ["epaSaferChoice", "echa", "cdcChlorine"], confidence: "high" }),
  seed({ canonicalName: "Sodium hypochlorite", aliases: ["bleach", "chlorine bleach", "hypochlorite"], category: "household", type: "Bleaching / disinfecting agent", concernLevel: "higher", use: "Whitens, removes stains, and disinfects where labeled.", evidenceSummary: "Can irritate skin, eyes, and airways. Mixing with acids or ammonia can release dangerous gases; follow the product label.", sourceIds: ["cdcChlorine", "echa"], confidence: "high" }),
  seed({ canonicalName: "Quaternary ammonium compounds", aliases: ["quats", "quaternary ammonium", "benzalkonium chloride", "alkyl dimethyl benzyl ammonium chloride"], category: "household", type: "Disinfectant / cationic surfactant family", concernLevel: "moderate", chemical: false, use: "Disinfects or provides antistatic and fabric-conditioning effects.", evidenceSummary: "This is a chemical family. Irritation and environmental profiles vary by compound and concentration; the specific label matters.", sourceIds: ["epaSaferChoice", "echa"], confidence: "medium" }),
  seed({ canonicalName: "Chlorine compounds", aliases: ["chlorine", "chlorinated cleaner"], category: "household", type: "Reactive disinfectant family", concernLevel: "higher", chemical: false, use: "Used for bleaching or disinfection depending on the compound.", sourceIds: ["cdcChlorine", "echa"], confidence: "medium" }),
  seed({ canonicalName: "Surfactants", aliases: ["surfactant", "surface-active agents"], category: "household", type: "Cleaning-agent family", concernLevel: "unknown", chemical: false, use: "Helps water lift oils, soil, or particles.", evidenceSummary: "This is a broad ingredient class. Concern cannot be assigned without the specific surfactant identity and concentration.", sourceIds: ["epaSaferChoice"], confidence: "medium", applicableCategories: ["household", "beauty"] }),
  seed({ canonicalName: "Phosphates", aliases: ["phosphate builders", "sodium phosphates"], category: "household", type: "Builder / water-softening family", concernLevel: "moderate", chemical: false, use: "Improves cleaning by binding minerals and adjusting water chemistry.", evidenceSummary: "Environmental concern depends on discharge, wastewater treatment, formulation, and jurisdiction.", sourceIds: ["epaSaferChoice", "echa"], confidence: "medium" }),
  seed({ canonicalName: "Ethanol", aliases: ["ethyl alcohol", "alcohol", "CAS 64-17-5"], category: "household", type: "Solvent / antimicrobial alcohol", concernLevel: "low", use: "Dissolves soils, supports drying, or provides antimicrobial activity where labeled.", sourceIds: ["epaSaferChoice", "echa"], confidence: "high", applicableCategories: ["household", "beauty", "medicine"] }),
  seed({ canonicalName: "Isopropyl alcohol", aliases: ["isopropanol", "2-propanol", "rubbing alcohol"], category: "household", type: "Solvent / antimicrobial alcohol", concernLevel: "moderate", use: "Dissolves soils and provides antimicrobial activity where labeled.", sourceIds: ["epaSaferChoice", "echa"], confidence: "high", applicableCategories: ["household", "beauty", "medicine"] }),

  seed({ canonicalName: "Polyester", aliases: ["polyethylene terephthalate", "PET fabric"], category: "textile", type: "Synthetic fiber", concernLevel: "moderate", chemical: false, use: "Provides durable, quick-drying fabric.", evidenceSummary: "Material concerns are mainly about comfort, shedding, finishes, and environmental context; the fiber name alone does not establish a health hazard.", confidence: "high" }),
  seed({ canonicalName: "Cotton", aliases: ["cotton fiber", "coton", "algodón", "قطن"], category: "textile", type: "Natural plant fiber", concernLevel: "low", chemical: false, use: "Provides soft, absorbent fabric.", confidence: "high" }),
  seed({ canonicalName: "Organic cotton", aliases: ["certified organic cotton", "coton biologique", "algodón orgánico"], category: "textile", type: "Certified natural plant fiber", concernLevel: "low", chemical: false, use: "Provides cotton fiber produced under an organic standard.", regulatoryContext: "Certification scope and chain-of-custody claims should be checked on the product label.", confidence: "high" }),
  seed({ canonicalName: "Nylon", aliases: ["polyamide", "PA fiber"], category: "textile", type: "Synthetic polyamide fiber", concernLevel: "moderate", chemical: false, use: "Provides strength, abrasion resistance, and stretch recovery.", confidence: "high" }),
  seed({ canonicalName: "Rayon", aliases: ["rayon fiber"], category: "textile", type: "Regenerated cellulose fiber", concernLevel: "unknown", chemical: false, use: "Provides a soft, draping cellulose-based fabric.", confidence: "high" }),
  seed({ canonicalName: "Viscose", aliases: ["viscose rayon"], category: "textile", type: "Regenerated cellulose fiber", concernLevel: "unknown", chemical: false, use: "Provides a soft, draping cellulose-based fabric.", confidence: "high" }),
  seed({ canonicalName: "Wool", aliases: ["laine", "lana", "صوف"], category: "textile", type: "Animal protein fiber", concernLevel: "low", chemical: false, use: "Provides warmth, resilience, and moisture management.", confidence: "high" }),
  seed({ canonicalName: "Spandex", aliases: ["elastane", "lycra"], category: "textile", type: "Elastic synthetic fiber", concernLevel: "moderate", chemical: false, use: "Adds stretch and shape recovery.", confidence: "high" }),
  seed({ canonicalName: "Acrylic fiber", aliases: ["acrylic", "polyacrylonitrile fiber"], category: "textile", type: "Synthetic fiber", concernLevel: "moderate", chemical: false, use: "Provides lightweight warmth and wool-like texture.", confidence: "high" }),
  seed({ canonicalName: "Leather", aliases: ["genuine leather", "cuir", "cuero", "جلد"], category: "textile", type: "Animal-derived material", concernLevel: "unknown", chemical: false, use: "Provides a durable flexible material.", evidenceSummary: "Relevant context includes tanning agents, dyes, coatings, and individual sensitivity; the word leather alone is not enough to evaluate finishes.", confidence: "medium" }),
  seed({ canonicalName: "Polyurethane", aliases: ["PU", "polyurethane foam", "PU coating"], category: "textile", type: "Synthetic polymer / coating", concernLevel: "moderate", use: "Adds cushioning, stretch, coating, or faux-leather structure.", sourceIds: ["echa", "textileExchange"], confidence: "high", applicableCategories: ["textile", "household"] }),
  seed({ canonicalName: "Recycled polyester", aliases: ["rPET", "recycled PET"], category: "textile", type: "Recycled synthetic fiber", concernLevel: "moderate", chemical: false, use: "Provides polyester performance using recycled feedstock.", evidenceSummary: "Recycled content can change sourcing impacts but does not remove questions about shedding, finishes, or skin comfort.", confidence: "high" }),

  seed({ canonicalName: "Acetaminophen", aliases: ["paracetamol", "APAP"], category: "medicine", type: "Active medicine ingredient", concernLevel: "unknown", use: "Used as a pain reliever and fever reducer where labeled.", evidenceSummary: "This medicine ingredient is not scored as good or bad. Dose limits, duplicate-product use, liver warnings, and individual circumstances require the specific product label or a clinician.", confidence: "high" }),
  seed({ canonicalName: "Ibuprofen", aliases: ["2-(4-isobutylphenyl)propionic acid"], category: "medicine", type: "Active medicine ingredient / NSAID", concernLevel: "unknown", use: "Used as a pain reliever and fever reducer where labeled.", evidenceSummary: "This medicine ingredient is not health-scored. Follow dose, allergy, bleeding, pregnancy, and duplicate-NSAID warnings on the product label.", confidence: "high" }),
  seed({ canonicalName: "Aspirin", aliases: ["acetylsalicylic acid", "ASA"], category: "medicine", type: "Active medicine ingredient / salicylate", concernLevel: "unknown", use: "Used for pain, fever, inflammation, or antiplatelet purposes depending on the labeled product.", confidence: "high" }),
  seed({ canonicalName: "Diphenhydramine", aliases: ["diphenhydramine hydrochloride", "DPH"], category: "medicine", type: "Active medicine ingredient / antihistamine", concernLevel: "unknown", use: "Used for allergy symptoms or other labeled indications.", confidence: "high" }),
  seed({ canonicalName: "Pseudoephedrine", aliases: ["pseudoephedrine hydrochloride"], category: "medicine", type: "Active medicine ingredient / decongestant", concernLevel: "unknown", use: "Used for nasal decongestion where labeled.", confidence: "high" }),
  seed({ canonicalName: "Phenylephrine", aliases: ["phenylephrine hydrochloride"], category: "medicine", type: "Active medicine ingredient / decongestant", concernLevel: "unknown", use: "Used in some decongestant products where labeled.", confidence: "high" }),
  seed({ canonicalName: "Caffeine", aliases: ["1,3,7-trimethylxanthine"], category: "medicine", type: "Stimulant ingredient", concernLevel: "unknown", use: "Used in foods, beverages, supplements, and some medicines.", evidenceSummary: "Context depends on amount, age, sensitivity, pregnancy, other caffeine sources, and the product label.", confidence: "high", applicableCategories: ["medicine", "food"] }),
  seed({ canonicalName: "Cetirizine", aliases: ["cetirizine HCl", "cetirizine hydrochloride"], category: "medicine", type: "Active medicine ingredient / antihistamine", concernLevel: "unknown", use: "Used for allergy symptoms where labeled.", confidence: "high" }),
  seed({ canonicalName: "Dextromethorphan", aliases: ["dextromethorphan HBr", "dextromethorphan hydrobromide", "DXM"], category: "medicine", type: "Active medicine ingredient / cough suppressant", concernLevel: "unknown", use: "Used as a cough suppressant where labeled.", confidence: "high" }),
  seed({ canonicalName: "Povidone", aliases: ["polyvinylpyrrolidone", "PVP"], category: "medicine", type: "Inactive binder / formulation aid", concernLevel: "low", use: "Helps bind, coat, or stabilize a medicine formulation.", confidence: "high", applicableCategories: ["medicine", "beauty"] }),
  seed({ canonicalName: "Lactose monohydrate", aliases: ["lactose"], category: "medicine", type: "Inactive filler / milk-derived sugar", concernLevel: "low", use: "Adds bulk or supports tablet manufacture.", evidenceSummary: "This is an inactive excipient in many products. People with specific allergies or intolerances should review the label and ask a pharmacist if unsure.", confidence: "high" })
]);

const MULTILINGUAL_EXACT = new Map([
  ["colorant rouge no 3", "Red No. 3"],
  ["colorant rouge n 3", "Red No. 3"],
  ["colorante rojo no 3", "Red No. 3"],
  ["colorante rojo n 3", "Red No. 3"],
  ["sirop de glucose fructose", "High-fructose corn syrup"],
  ["jarabe de maiz de alta fructosa", "High-fructose corn syrup"],
  ["arome naturel", "Natural flavor"],
  ["huile de palme", "Palm oil"],
  ["aceite de palma", "Palm oil"],
  ["farine de ble enrichie", "Enriched wheat flour"],
  ["harina de trigo enriquecida", "Enriched wheat flour"],
  ["biscuits au chocolat", "Chocolate biscuits"],
  ["زيت النخيل", "Palm oil"],
  ["دقيق القمح", "Wheat flour"],
  ["دقيق القمح المدعم", "Enriched wheat flour"],
  ["نكهة طبيعية", "Natural flavor"],
  ["ملون احمر رقم 3", "Red No. 3"],
  ["ملون أحمر رقم 3", "Red No. 3"],
  ["اللون الاحمر رقم 3", "Red No. 3"],
  ["اللون الأحمر رقم 3", "Red No. 3"],
  ["مواد حافظة", "Preservatives"],
  ["سكر", "Sugar"],
  ["ملح", "Salt"],
  ["حليب", "Milk"],
  ["قمح", "Wheat"]
].map(([label, english]) => [foldText(label), english]));

function foldText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

export function normalizeKnowledgeKey(value) {
  return foldText(value)
    .replace(/\bfd\s+and\s+c\b/g, "fd c")
    .replace(/\bfd\s*c\b/g, "fd c")
    .replace(/\bno\s+(\d+)\b/g, "no $1")
    .replace(/\be\s+(\d{3,4}[a-z]?)\b/g, "e$1")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_INDEX = new Map();
for (const record of INGREDIENT_SEEDS) {
  for (const alias of record.aliases) {
    const key = normalizeKnowledgeKey(alias);
    if (!key) continue;
    const matches = ALIAS_INDEX.get(key) || [];
    if (!matches.some((match) => match.id === record.id)) matches.push(record);
    ALIAS_INDEX.set(key, matches);
  }
}

export function normalizeIngredientLabel(value) {
  const originalText = String(value || "").trim();
  const folded = foldText(originalText.replace(/^\w{2}:/, ""));
  const exact = MULTILINGUAL_EXACT.get(folded);
  if (exact) {
    return { englishText: exact, originalText, translated: normalizeKnowledgeKey(exact) !== normalizeKnowledgeKey(originalText), translationConfidence: "high" };
  }
  const eNumber = folded.match(/\be\s?(102|110|127|129|132|133|150[a-d]?|160b|171|202|211|250|251|282|319|320|321|322|407|410|412|415|418|433|466|471|621|900|950|951|954|955)\b/i);
  if (eNumber) {
    const code = `E${eNumber[1].toUpperCase()}`;
    return { englishText: code, originalText, translated: normalizeKnowledgeKey(code) !== normalizeKnowledgeKey(originalText), translationConfidence: "high" };
  }
  return { englishText: originalText, originalText, translated: false, translationConfidence: /[^\x00-\x7F]/.test(originalText) ? "low" : "not-needed" };
}

export function normalizeProductTextForAnalysis(value) {
  const originalText = String(value || "").trim();
  const folded = foldText(originalText);
  const exact = MULTILINGUAL_EXACT.get(folded);
  return {
    englishText: exact || originalText,
    originalText,
    translated: Boolean(exact && normalizeKnowledgeKey(exact) !== normalizeKnowledgeKey(originalText)),
    translationConfidence: exact ? "high" : /[^\x00-\x7F]/.test(originalText) ? "low" : "not-needed"
  };
}

function selectAliasMatch(key, category) {
  const exact = ALIAS_INDEX.get(key) || [];
  if (exact.length === 1) return exact[0];
  if (exact.length > 1 && category) {
    const categoryMatches = exact.filter((record) => record.applicableCategories.includes(category));
    if (categoryMatches.length === 1) return categoryMatches[0];
  }
  return null;
}

function toRisk(concernLevel) {
  if (concernLevel === "low") return "safe";
  if (concernLevel === "moderate") return "moderate";
  if (concernLevel === "higher") return "harmful";
  return "unknown";
}

function titleCaseKnowledge(value) {
  return String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPriorityExistingRecord(record, additiveAlias, category) {
  if (!record) return false;
  if (category && category !== "food") return true;
  if (additiveAlias || record.concernLevel === "higher") return true;
  return /(?:synthetic|color additive|preservative|high-intensity|curing|opacifier|surfactant|disinfect|bleach|fragrance|thickener \/ stabilizer)/i.test(record.type || "");
}

function commonAtlasKnowledge(record, normalizedLabel) {
  const type = record.canonicalName === "salt" ? "Seasoning" : titleCaseKnowledge(record.category);
  const processingMarker = record.tags.includes("processing-marker");
  const sourceStatus = record.allergenSources.length
    ? `${titleCaseKnowledge(record.allergenSources[0])} source`
    : record.tags.includes("sodium-source")
      ? "Sodium source"
      : processingMarker
        ? "Processing marker"
        : "Common ingredient";
  return {
    id: slugify(record.canonicalName),
    canonicalName: record.displayName,
    originalLabelText: normalizedLabel.originalText,
    aliases: record.aliases,
    category: "food",
    type,
    commonUse: "Food ingredient labels",
    use: record.whyUsed,
    whyUsed: record.whyUsed,
    plainDescription: record.plainDescription,
    nutritionRole: record.nutritionRole,
    concernLevel: "none",
    risk: "common",
    summary: record.plainDescription,
    evidenceSummary: "Known common ingredient. No specific concern flagged by default. Product amount, allergies, and the full formulation can still matter.",
    regulatoryContext: "No specific regulatory concern record is attached to this common ingredient entry.",
    sources: [],
    studies: [],
    confidence: "high",
    knowledgeKind: "common_ingredient",
    statusLabel: sourceStatus,
    rowSubtitle: `${type} · ${sourceStatus}`,
    statusDescription: sourceStatus === "Common ingredient" ? "Known common ingredient. No specific concern flagged by default." : `${sourceStatus} found in the available label data.`,
    tags: record.tags,
    dietFlags: record.dietFlags,
    allergenSources: record.allergenSources,
    processingMarkers: processingMarker ? ["processing marker"] : [],
    vagueTerm: false,
    dataSources: ["Local Common Ingredient Atlas"],
    applicableCategories: ["food"],
    translated: normalizedLabel.translated,
    translationConfidence: normalizedLabel.translationConfidence,
    enrichmentStatus: "local"
  };
}

function vagueAtlasKnowledge(record, normalizedLabel) {
  const type = titleCaseKnowledge(record.vagueCategory);
  return {
    id: slugify(record.canonicalName),
    canonicalName: record.displayName,
    originalLabelText: normalizedLabel.originalText,
    aliases: record.aliases,
    category: "food",
    type,
    commonUse: "Food ingredient labels",
    use: record.whyUsed,
    whyUsed: record.whyUsed,
    plainDescription: record.plainDescription,
    nutritionRole: record.nutritionRole,
    concernLevel: "unknown",
    risk: "unknown",
    summary: record.plainDescription,
    evidenceSummary: "This is a broad label term. Exact ingredient details are not available from this phrase alone.",
    regulatoryContext: "The exact source and formulation need package context.",
    sources: [],
    studies: [],
    confidence: "medium",
    knowledgeKind: "vague_label_term",
    statusLabel: "Limited detail",
    rowSubtitle: `${type} · Limited detail`,
    statusDescription: "Limited detail. The exact source is not specified by this label term.",
    tags: record.tags,
    dietFlags: record.dietFlags,
    allergenSources: [],
    processingMarkers: record.tags.includes("processing-marker") ? ["processing marker"] : [],
    vagueTerm: true,
    dataSources: ["Local Vague Ingredient Terms"],
    applicableCategories: ["food"],
    translated: normalizedLabel.translated,
    translationConfidence: normalizedLabel.translationConfidence,
    enrichmentStatus: "local"
  };
}

export function resolveLocalIngredientKnowledge(query, { category, includeAtlas = true } = {}) {
  const normalizedLabel = normalizeIngredientLabel(query);
  const key = normalizeKnowledgeKey(normalizedLabel.englishText);
  let record = selectAliasMatch(key, category);

  if (!record && key) {
    const embeddedMatches = [];
    for (const [alias, records] of ALIAS_INDEX.entries()) {
      if (alias.length < 4 || !new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`).test(key)) continue;
      records.forEach((candidate) => embeddedMatches.push(candidate));
    }
    const unique = [...new Map(embeddedMatches.map((candidate) => [candidate.id, candidate])).values()];
    const categoryMatches = category ? unique.filter((candidate) => candidate.applicableCategories.includes(category)) : unique;
    if (categoryMatches.length === 1) record = categoryMatches[0];
  }

  const additiveAlias = findAdditiveAlias(key);
  const commonRecord = !category || category === "food" ? findCommonIngredient(key) : null;
  const vagueRecord = !category || category === "food" ? findVagueIngredientTerm(key) : null;

  if (includeAtlas && !isPriorityExistingRecord(record, additiveAlias, category)) {
    if (commonRecord) return commonAtlasKnowledge(commonRecord, normalizedLabel);
    if (vagueRecord) return vagueAtlasKnowledge(vagueRecord, normalizedLabel);
  }

  if (!record) {
    if (additiveAlias) {
      const concernLevel = additiveAlias.concernLevel;
      return {
        id: slugify(additiveAlias.canonicalName),
        canonicalName: additiveAlias.canonicalName,
        originalLabelText: normalizedLabel.originalText,
        aliases: additiveAlias.aliases,
        category: category || "food",
        type: additiveAlias.type,
        commonUse: "Packaged food labels",
        use: "Used as a labeled food additive.",
        concernLevel,
        risk: toRisk(concernLevel),
        summary: `${additiveAlias.canonicalName} is a recognized ${additiveAlias.type.toLowerCase()}.`,
        evidenceSummary: "The alias is recognized, but a fuller source-backed detail record is still needed.",
        regulatoryContext: "Permitted uses and status can vary by region and product type.",
        sources: [],
        studies: [],
        confidence: "medium",
        knowledgeKind: "additive_alias",
        statusLabel: additiveAlias.statusLabel,
        rowSubtitle: `${additiveAlias.type} · ${additiveAlias.statusLabel}`,
        tags: ["additive"],
        dietFlags: { vegan: "unknown", vegetarian: "unknown", glutenFree: "unknown" },
        allergenSources: [],
        processingMarkers: [],
        vagueTerm: false,
        dataSources: ["Local Additive Alias Map"],
        applicableCategories: [category || "food"],
        translated: normalizedLabel.translated,
        translationConfidence: normalizedLabel.translationConfidence,
        enrichmentStatus: "local"
      };
    }
    return {
      id: `unknown-${slugify(normalizedLabel.englishText) || "ingredient"}`,
      canonicalName: normalizedLabel.englishText || "Unknown ingredient",
      originalLabelText: normalizedLabel.originalText,
      aliases: [],
      category: category || "unknown",
      type: "Ingredient or material not yet classified",
      commonUse: "Not available",
      use: "No source-backed use description is available.",
      concernLevel: "unknown",
      risk: "unknown",
      summary: "No detailed source-backed information yet.",
      evidenceSummary: DEFAULT_EVIDENCE.unknown,
      regulatoryContext: "No matched regulatory record is available.",
      sources: [],
      studies: [],
      confidence: "low",
      knowledgeKind: "unknown",
      statusLabel: "Needs review",
      rowSubtitle: "Needs review · Not enough data",
      statusDescription: "Needs review. Ziya does not have enough source-backed data to identify this ingredient confidently.",
      tags: [],
      dietFlags: { vegan: "unknown", vegetarian: "unknown", glutenFree: "unknown" },
      allergenSources: [],
      processingMarkers: [],
      vagueTerm: false,
      dataSources: [],
      applicableCategories: category ? [category] : [],
      translated: normalizedLabel.translated,
      translationConfidence: normalizedLabel.translationConfidence,
      enrichmentStatus: "local-only"
    };
  }

  return {
    ...record,
    risk: toRisk(record.concernLevel),
    originalLabelText: normalizedLabel.originalText,
    translated: normalizedLabel.translated,
    translationConfidence: normalizedLabel.translationConfidence,
    enrichmentStatus: "local"
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeSources(...sourceGroups) {
  const merged = new Map();
  sourceGroups.flat().filter(Boolean).forEach((source) => {
    const singletonDatabase = ["PubChem", "PubMed"].includes(source.label);
    merged.set(singletonDatabase ? source.label : source.id || source.url, source);
  });
  return [...merged.values()];
}

function readClientCache(key) {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "null");
    if (
      !value
      || value.version !== KNOWLEDGE_CACHE_VERSION
      || Date.now() > value.expiresAt
      || !value.data?.canonicalName
      || !Array.isArray(value.data.sources)
    ) return null;
    return value.data;
  } catch {
    return null;
  }
}

function writeClientCache(key, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: KNOWLEDGE_CACHE_VERSION, data, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  } catch {
    // Public enrichment remains available without client caching.
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichIngredientKnowledge(query, { category, includeStudies = true } = {}) {
  const local = resolveLocalIngredientKnowledge(query, { category });
  const cacheKey = `ziya-ingredient:${normalizeKnowledgeKey(local.canonicalName)}:${category || "all"}`;
  const cached = readClientCache(cacheKey);
  if (cached) return cached;

  const isDeterministicAtlasEntry = ["common_ingredient", "vague_label_term"].includes(local.knowledgeKind);
  const isBroadIdentity = /family|mixture|category|fiber|flavoring category/i.test(local.type);
  const shouldQueryCompound = !isDeterministicAtlasEntry && local.category !== "textile" && !isBroadIdentity;
  const shouldQueryStudies = includeStudies
    && !isDeterministicAtlasEntry
    && local.confidence !== "low"
    && ["moderate", "higher"].includes(local.concernLevel)
    && !["textile", "medicine"].includes(local.category)
    && !isBroadIdentity;
  const requests = [
    shouldQueryCompound ? fetchJson(`/api/ingredients/pubchem?query=${encodeURIComponent(local.canonicalName)}`) : Promise.resolve(null),
    shouldQueryStudies ? fetchJson(`/api/ingredients/pubmed?query=${encodeURIComponent(local.canonicalName)}`) : Promise.resolve(null)
  ];
  const [pubchemResult, pubmedResult] = await Promise.allSettled(requests);
  const pubchem = pubchemResult.status === "fulfilled" ? pubchemResult.value : null;
  const pubmed = pubmedResult.status === "fulfilled" ? pubmedResult.value : null;
  const hasCuratedRecord = local.confidence !== "low";
  const exactChemicalIdentity = Boolean(pubchem?.found && !pubchem.ambiguous && pubchem.cid);
  const resolvedChemicalName = pubchem?.properties?.title || local.canonicalName;
  const enriched = {
    ...local,
    canonicalName: hasCuratedRecord ? local.canonicalName : exactChemicalIdentity ? resolvedChemicalName : local.canonicalName,
    type: hasCuratedRecord ? local.type : exactChemicalIdentity ? "Recognized chemical compound" : local.type,
    summary: hasCuratedRecord
      ? local.summary
      : exactChemicalIdentity
        ? `${resolvedChemicalName} matched a PubChem chemical identity. No source-backed concern assessment is available yet.`
        : local.summary,
    aliases: [...new Set([...(local.aliases || []), ...(pubchem?.synonyms || [])])].slice(0, 30),
    chemicalProperties: pubchem?.ambiguous ? null : pubchem?.properties || null,
    pubchemCid: pubchem?.ambiguous ? null : pubchem?.cid || null,
    studies: pubmed?.citations || [],
    sources: mergeSources(local.sources, pubchem?.source, pubmed?.source),
    dataSources: [...new Set([...(local.dataSources || []), ...(pubchem?.source ? [pubchem.source.label] : []), ...(pubmed?.source ? [pubmed.source.label] : [])])],
    lastFetchedDate: new Date().toISOString().slice(0, 10),
    confidence: pubchem?.ambiguous ? "low" : hasCuratedRecord ? local.confidence : exactChemicalIdentity ? "medium" : "low",
    enrichmentStatus: pubchemResult.status === "rejected" && (!shouldQueryStudies || pubmedResult.status === "rejected") ? "unavailable" : "complete"
  };
  writeClientCache(cacheKey, enriched);
  return enriched;
}
