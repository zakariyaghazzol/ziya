import { findAdditiveAlias } from "../data/additiveAliasMap";
import { findCommonIngredient } from "../data/commonIngredientAtlas";
import { findVagueIngredientTerm } from "../data/vagueIngredientTerms";
import { resolveLocalIngredientKnowledge } from "../knowledge/ingredientKnowledge";
import { normalizeIngredientName } from "./ingredientParser";
import { canonicalizeIngredientLanguage } from "./ingredientLanguageNormalizer";
import { createIngredientProvenance, INGREDIENT_PROVENANCE, mergeIngredientProvenance } from "./ingredientProvenance";
import { createUnknownIngredientReview, getUnknownIngredientMessage } from "./ingredientUnknowns";

const ALLERGEN_RULES = [
  ["milk", /\b(?:milk|whey|casein|caseinate|lactose|cream|butter|cheese|yogurt)\b/i],
  ["egg", /\b(?:egg|eggs|egg whites?|egg yolk|albumin|ovalbumin)\b/i],
  ["wheat", /\b(?:wheat|semolina|durum|spelt|barley|rye|malt|gluten)\b/i],
  ["soy", /\b(?:soy|soya|soybean)\b/i],
  ["peanut", /\b(?:peanut|groundnut)\b/i],
  ["tree nuts", /\b(?:almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|brazil nut|pine nut)\b/i],
  ["sesame", /\b(?:sesame|tahini)\b/i],
  ["fish", /\b(?:fish|anchovy|tuna|salmon|cod)\b/i],
  ["shellfish", /\b(?:shellfish|shrimp|crab|lobster|crayfish)\b/i]
];

const PROCESSING_MARKERS = [
  ["modified starch", /\bmodified (?:food |corn |maize )?starch\b/i],
  ["refined carbohydrate", /\bmaltodextrin\b/i],
  ["processed oil", /\b(?:partially )?hydrogenated (?:vegetable )?oil\b/i],
  ["protein isolate", /\b(?:soy|pea|whey|milk|rice) protein isolate\b/i],
  ["hydrolyzed protein", /\bhydroly[sz]ed (?:vegetable |plant )?protein\b/i],
  ["vague flavor term", /\b(?:natural|artificial) flavo[u]?rs?\b/i]
];

function titleCase(value) {
  return String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAllergenSource(source) {
  return source === "tree nuts" ? "Tree nut" : titleCase(source);
}

function toRisk(concernLevel) {
  if (concernLevel === "low" || concernLevel === "none") return "safe";
  if (concernLevel === "moderate") return "moderate";
  if (concernLevel === "higher") return "harmful";
  return "unknown";
}

function concernStatus(concernLevel, additiveAlias) {
  if (additiveAlias?.statusLabel) return additiveAlias.statusLabel;
  if (concernLevel === "higher") return "Flagged additive";
  if (concernLevel === "moderate") return "Moderate concern";
  if (concernLevel === "low") return "Low concern";
  return "Listed additive";
}

function isEstablishedConcern(knowledge, additiveAlias, category) {
  if (!knowledge || knowledge.confidence === "low") return false;
  if (category && category !== "food") return true;
  if (additiveAlias) return true;
  if (knowledge.concernLevel === "higher") return true;
  return /(?:synthetic|color additive|preservative|high-intensity|curing|opacifier|surfactant|disinfect|bleach|fragrance|thickener \/ stabilizer)/i.test(knowledge.type || "");
}

function detectAllergenSources(name, explicit = []) {
  const sources = new Set(explicit || []);
  ALLERGEN_RULES.forEach(([source, pattern]) => {
    if (pattern.test(name)) sources.add(source);
  });
  return [...sources];
}

function detectProcessingMarkers(name, tags = []) {
  const markers = new Set((tags || []).filter((tag) => tag === "processing-marker"));
  PROCESSING_MARKERS.forEach(([marker, pattern]) => {
    if (pattern.test(name)) markers.add(marker);
  });
  return [...markers];
}

function getSignalType(node, options) {
  if (options.allergenSignalType) return options.allergenSignalType;
  if (node?.sourceSegment === "contains_statement") return "contains_statement";
  if (["advisory_trace", "facility_trace"].includes(node?.sourceSegment)) return "advisory_trace";
  if ((node?.allergenSources || []).length) return "direct_ingredient";
  return "unknown";
}

function getNodeProvenance(node) {
  const sourceField = String(node?.sourceField || "");
  if (!sourceField) return null;
  if (/^user|manual|ocr/i.test(sourceField)) {
    return createIngredientProvenance(INGREDIENT_PROVENANCE.USER_CORRECTION, { confidence: "medium", field: sourceField });
  }
  if (/ingredients|provider/i.test(sourceField)) {
    return createIngredientProvenance(INGREDIENT_PROVENANCE.PRODUCT_PAYLOAD, { confidence: "medium", field: sourceField });
  }
  return null;
}

function commonStatus(record, allergens, processingMarkers) {
  if (processingMarkers.length) return "Processing marker";
  if (allergens.length) return `${formatAllergenSource(allergens[0])} source`;
  if (record.tags.includes("sodium-source")) return "Sodium source";
  if (record.tags.includes("common-flavoring")) return "Common flavoring";
  return "Common ingredient";
}

function commonType(record) {
  if (record.canonicalName === "salt") return "Seasoning";
  return titleCase(record.category);
}

function buildCommon(record, inputName, node, options) {
  const allergens = detectAllergenSources(record.canonicalName, [...record.allergenSources, ...(node?.allergenSources || [])]);
  const processingMarkers = detectProcessingMarkers(record.canonicalName, record.tags);
  const statusLabel = commonStatus(record, allergens, processingMarkers);
  const type = commonType(record);
  return {
    inputName,
    normalizedName: record.canonicalName,
    displayName: record.displayName,
    canonicalName: record.canonicalName,
    category: record.category,
    type,
    function: record.function,
    plainDescription: record.plainDescription,
    whyUsed: record.whyUsed,
    nutritionRole: record.nutritionRole,
    concernLevel: "none",
    risk: "common",
    scoreRisk: options.scoreRisk || "safe",
    confidence: record.confidence,
    knowledgeConfidence: "high",
    knowledgeKind: "common_ingredient",
    classificationKind: "common",
    statusLabel,
    rowSubtitle: `${type} · ${statusLabel}`,
    statusDescription: statusLabel === "Common ingredient"
      ? "Known common ingredient. No specific concern flagged by default."
      : `${statusLabel} found in the available label data.`,
    tags: record.tags,
    dietFlags: record.dietFlags,
    allergenSources: allergens,
    allergenSignalType: getSignalType(node, options),
    processingMarkers,
    vagueTerm: false,
    aliases: record.aliases,
    provenance: mergeIngredientProvenance(
      createIngredientProvenance(INGREDIENT_PROVENANCE.COMMON_ATLAS, { confidence: "high" }),
      options.provenance
    ),
    dataSources: ["Local Common Ingredient Atlas"]
  };
}

function buildVague(record, inputName, node, options) {
  const type = titleCase(record.vagueCategory);
  const processingMarkers = detectProcessingMarkers(record.canonicalName, record.tags);
  const allergens = detectAllergenSources(record.canonicalName, [...(record.allergenSources || []), ...(node?.allergenSources || [])]);
  return {
    inputName,
    normalizedName: record.canonicalName,
    displayName: record.displayName,
    canonicalName: record.canonicalName,
    category: record.category,
    type,
    function: record.function,
    plainDescription: record.plainDescription,
    whyUsed: record.whyUsed,
    nutritionRole: record.nutritionRole,
    concernLevel: "limited_detail",
    risk: "unknown",
    scoreRisk: "unknown",
    confidence: record.confidence,
    knowledgeConfidence: "medium",
    knowledgeKind: "vague_label_term",
    classificationKind: "vague",
    statusLabel: "Limited detail",
    rowSubtitle: `${type} · Limited detail`,
    statusDescription: "Limited detail. The exact source is not specified by this label term.",
    tags: record.tags,
    dietFlags: record.dietFlags,
    allergenSources: allergens,
    allergenSignalType: getSignalType(node, options),
    processingMarkers,
    vagueTerm: true,
    aliases: record.aliases,
    provenance: mergeIngredientProvenance(
      createIngredientProvenance(INGREDIENT_PROVENANCE.VAGUE_ATLAS, { confidence: "high" }),
      options.provenance
    ),
    dataSources: ["Local Vague Ingredient Terms"]
  };
}

function buildExisting(knowledge, additiveAlias, inputName, node, options) {
  const canonicalName = additiveAlias?.canonicalName || knowledge.canonicalName;
  const type = additiveAlias?.type || knowledge.type;
  const concernLevel = additiveAlias?.concernLevel && additiveAlias.concernLevel !== "unknown"
    ? additiveAlias.concernLevel
    : knowledge.concernLevel;
  const allergens = detectAllergenSources(canonicalName, node?.allergenSources || []);
  const processingMarkers = detectProcessingMarkers(canonicalName);
  const statusLabel = concernStatus(concernLevel, additiveAlias);
  const provenance = mergeIngredientProvenance(
    createIngredientProvenance(INGREDIENT_PROVENANCE.EXISTING_ADDITIVE, { confidence: knowledge.confidence || "medium" }),
    additiveAlias ? createIngredientProvenance(INGREDIENT_PROVENANCE.ADDITIVE_ALIAS, { confidence: "high" }) : null,
    options.provenance
  );
  return {
    ...knowledge,
    inputName,
    normalizedName: canonicalName.toLowerCase(),
    displayName: additiveAlias?.displayName || canonicalName,
    canonicalName,
    category: knowledge.category,
    type,
    function: type,
    plainDescription: knowledge.summary,
    whyUsed: knowledge.use,
    nutritionRole: knowledge.nutritionRole || "Nutrition relevance depends on the amount and the full product formulation.",
    concernLevel,
    risk: toRisk(concernLevel),
    scoreRisk: toRisk(concernLevel),
    confidence: knowledge.confidence,
    knowledgeConfidence: knowledge.confidence,
    knowledgeKind: "source_backed_ingredient",
    classificationKind: options.classificationKind || "known_concern",
    statusLabel,
    rowSubtitle: `${type} · ${statusLabel}`,
    statusDescription: knowledge.evidenceSummary,
    tags: knowledge.tags || [],
    dietFlags: knowledge.dietFlags || { vegan: "unknown", vegetarian: "unknown", glutenFree: "unknown" },
    allergenSources: allergens,
    allergenSignalType: getSignalType(node, options),
    processingMarkers,
    vagueTerm: false,
    aliases: [...new Set([...(knowledge.aliases || []), ...(additiveAlias?.aliases || [])])],
    provenance,
    dataSources: knowledge.dataSources || []
  };
}

function buildUnknown(inputName, normalizedName, node, options) {
  const allergens = detectAllergenSources(normalizedName, node?.allergenSources || []);
  const signalType = getSignalType(node, options);
  const review = createUnknownIngredientReview({
    rawName: inputName,
    normalizedName,
    sourceProductId: options.sourceProductId,
    sourceProductName: options.sourceProductName,
    surroundingIngredients: options.surroundingIngredients || []
  });
  return {
    inputName,
    normalizedName,
    displayName: titleCase(normalizedName || inputName || "Unknown ingredient"),
    canonicalName: normalizedName || inputName || "unknown ingredient",
    category: options.category || "unknown",
    type: allergens.length ? `${titleCase(allergens[0])} source` : "Not enough data",
    function: "Not enough source-backed data",
    plainDescription: "No detailed source-backed information yet.",
    whyUsed: "Not enough source-backed data to identify a use.",
    nutritionRole: "Not enough data to determine nutrition relevance.",
    concernLevel: "unknown",
    risk: "unknown",
    scoreRisk: "unknown",
    confidence: "low",
    knowledgeConfidence: "low",
    knowledgeKind: "unknown",
    classificationKind: "unknown",
    statusLabel: "Needs review",
    rowSubtitle: "Needs review · Not enough data",
    statusDescription: getUnknownIngredientMessage(),
    tags: [],
    dietFlags: { vegan: "unknown", vegetarian: "unknown", glutenFree: "unknown" },
    allergenSources: allergens,
    allergenSignalType: signalType,
    processingMarkers: detectProcessingMarkers(normalizedName),
    vagueTerm: false,
    aliases: [],
    provenance: mergeIngredientProvenance(
      createIngredientProvenance(INGREDIENT_PROVENANCE.UNKNOWN, { confidence: "low" }),
      options.provenance
    ),
    dataSources: [],
    review
  };
}

function withCanonicalization(result, canonicalization, inputName) {
  const originalLabelText = String(inputName || canonicalization.rawName || "").trim();
  return {
    ...result,
    displayName: canonicalization.matched ? canonicalization.displayName : result.displayName,
    originalLabelText,
    recognizedName: canonicalization.matched ? canonicalization.displayName : result.displayName,
    detectedLanguage: canonicalization.detectedLanguage,
    originalLanguage: canonicalization.originalLanguage,
    canonicalization
  };
}

export function classifyIngredient(input, options = {}) {
  const node = typeof input === "object" && input !== null ? input : null;
  const inputName = String(node?.rawName || node?.normalizedName || input || "").trim();
  const canonicalization = canonicalizeIngredientLanguage(node?.normalizedName || inputName);
  const normalizedName = normalizeIngredientName(canonicalization.canonicalName || node?.normalizedName || inputName);
  const resolvedOptions = {
    ...options,
    provenance: mergeIngredientProvenance(
      options.provenance,
      getNodeProvenance(node),
      canonicalization.matched
        ? createIngredientProvenance(INGREDIENT_PROVENANCE.MULTILINGUAL_ALIAS, { confidence: canonicalization.confidence })
        : null
    )
  };
  const category = resolvedOptions.category || "food";
  const additiveAlias = findAdditiveAlias(normalizedName);
  const existing = resolveLocalIngredientKnowledge(additiveAlias?.canonicalName || normalizedName, { category, includeAtlas: false });

  if (isEstablishedConcern(existing, additiveAlias, category)) {
    return withCanonicalization(buildExisting(existing, additiveAlias, inputName, node, { ...resolvedOptions, category }), canonicalization, inputName);
  }

  if (additiveAlias) {
    const aliasKnowledge = existing.confidence === "low"
      ? {
          ...existing,
          canonicalName: additiveAlias.canonicalName,
          category: "food",
          type: additiveAlias.type,
          concernLevel: additiveAlias.concernLevel,
          risk: toRisk(additiveAlias.concernLevel),
          confidence: "medium",
          summary: `${additiveAlias.canonicalName} is a recognized ${additiveAlias.type.toLowerCase()}.`,
          evidenceSummary: "The alias is recognized, but a fuller source-backed detail record is still needed.",
          aliases: additiveAlias.aliases
        }
      : existing;
    return withCanonicalization(buildExisting(aliasKnowledge, additiveAlias, inputName, node, { ...resolvedOptions, category }), canonicalization, inputName);
  }

  if (!category || category === "food" || category === "unknown") {
    const common = findCommonIngredient(normalizedName);
    if (common) {
      return withCanonicalization(buildCommon(common, inputName, node, {
        ...resolvedOptions,
        category,
        scoreRisk: existing.confidence !== "low" ? existing.risk : "safe"
      }), canonicalization, inputName);
    }
    const vague = findVagueIngredientTerm(normalizedName);
    if (vague) return withCanonicalization(buildVague(vague, inputName, node, { ...resolvedOptions, category }), canonicalization, inputName);
  }

  if (existing.confidence !== "low") {
    return withCanonicalization(
      buildExisting(existing, null, inputName, node, { ...resolvedOptions, category, classificationKind: "source_backed" }),
      canonicalization,
      inputName
    );
  }

  return withCanonicalization(buildUnknown(inputName, normalizedName, node, { ...resolvedOptions, category }), canonicalization, inputName);
}

export function classifyParsedIngredients(parsed, options = {}) {
  const output = [];
  function visit(node) {
    output.push(classifyIngredient(node, options));
    node.children.forEach(visit);
  }
  (parsed?.directIngredients || []).forEach(visit);
  return output;
}
