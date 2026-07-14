import {
  normalizeIngredientLabel,
  normalizeKnowledgeKey,
  resolveLocalIngredientKnowledge
} from "../knowledge/ingredientKnowledge";
import { flattenParsedIngredients, parseIngredientList } from "../lib/ingredientParser";

const VALID_SHORT_NAMES = new Set([
  "bha",
  "bht",
  "egg",
  "fat",
  "gum",
  "msg",
  "oat",
  "oil",
  "pea",
  "rye",
  "salt",
  "sles",
  "sls",
  "soy",
  "milk"
]);

const EXACT_NOISE = new Set([
  "co",
  "company",
  "inc",
  "llc",
  "ltd",
  "made in",
  "orrville",
  "product of",
  "tm",
  "trademark",
  "usa",
  "usage"
]);

const PACKAGING_PATTERNS = [
  { reason: "manufacturer or distributor copy", pattern: /\b(?:distributed|manufactured|marketed|packed|produced)\s+by\b/i },
  { reason: "company or legal copy", pattern: /\b(?:company|corporation|corp\.?|inc\.?|llc|ltd\.?|all rights reserved|trademark)\b/i },
  { reason: "website or contact information", pattern: /(?:https?:\/\/|www\.|\.com\b|customer service|questions? or comments?|visit us|call us|tel(?:ephone)?\b|@[a-z0-9.-]+\.)/i },
  { reason: "date or storage copy", pattern: /\b(?:best by|sell by|use by|storage instructions?|store in|keep refrigerated|directions?|usage)\b/i },
  { reason: "packaging instruction", pattern: /\b(?:barcode|scan here|recycl(?:e|able|ing)|nutrition facts|serving size|calories)\b/i },
  { reason: "origin or address copy", pattern: /\b(?:made in|product of|street|road|avenue|boulevard|suite|postal|zip code|u\.?s\.?a\.?)\b/i },
  { reason: "postal code or address number", pattern: /\b\d{5}(?:-\d{4})?\b/ },
  { reason: "phone number", pattern: /(?:\+?\d[\d\s().-]{7,}\d)/ }
];

const START_MARKERS = [
  /\b(?:ingredients?|ingredient list|ingr[eé]dients?|ingredientes?)\s*[:：]\s*/i,
  /(?:\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062a|\u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649)\s*[:：]\s*/i
];

const STOP_MARKER = /\b(?:nutrition facts?|supplement facts?|drug facts?|manufactured by|distributed by|packed by|best by|sell by|storage instructions?|directions?|usage|warnings?|questions? or comments?|customer service|visit us|website|barcode|recycl(?:e|ing))\b|(?:\u062a\u062d\u0630\u064a\u0631\u0627\u062a|\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645)/i;

function cleanRawText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    .trim();
}

export function detectIngredientSection(rawText) {
  const text = cleanRawText(rawText);
  let selected = null;
  for (const marker of START_MARKERS) {
    const match = marker.exec(text);
    if (match && (!selected || match.index < selected.index)) selected = match;
  }
  if (!selected) {
    return {
      found: false,
      text: "",
      startIndex: -1,
      endIndex: -1,
      startMarker: null,
      stopMarker: null
    };
  }

  const startIndex = selected.index + selected[0].length;
  const remainder = text.slice(startIndex);
  const stop = STOP_MARKER.exec(remainder);
  const endIndex = stop ? startIndex + stop.index : text.length;
  return {
    found: true,
    text: text.slice(startIndex, endIndex).trim(),
    startIndex,
    endIndex,
    startMarker: selected[0].trim(),
    stopMarker: stop?.[0]?.trim() || null
  };
}

function normalizeCandidate(value) {
  return cleanRawText(value)
    .replace(/^\s*(?:ingredients?|ingredient list|contains|may contain)\s*[:：-]?\s*/i, "")
    .replace(/^\s*(?:less than|not more than)?\s*\d+(?:\.\d+)?\s*%\s*(?:or less)?\s*(?:of)?\s*/i, "")
    .replace(/^\s*[a-z]{2}:\s*/i, "")
    .replace(/^[\s:_*\-–—]+|[\s:_*\-–—.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getRejectionReason(candidate, knownMatch, excludedTerms) {
  const folded = normalizeKnowledgeKey(candidate);
  const raw = String(candidate || "").trim();
  if (!raw || !folded) return "empty or symbol-only fragment";
  if (/[&/]\s*$|\b(?:and|or|contains|may contain)\s*$/i.test(raw)) return "incomplete phrase";
  if (/^artificial\s+(?:red|yellow|blue|green|color|colour)$/i.test(raw)) return "incomplete color name";
  if (EXACT_NOISE.has(folded)) return "packaging or legal fragment";
  if (!knownMatch && excludedTerms.has(folded)) return "product or brand identity fragment";
  const packagingMatch = PACKAGING_PATTERNS.find(({ pattern }) => pattern.test(raw));
  if (packagingMatch) return packagingMatch.reason;
  if (knownMatch) return null;
  if (/^(?:\d+|[a-z]?\d+[a-z]?)$/i.test(folded)) return "number-only fragment";
  const letters = (raw.match(/\p{L}/gu) || []).length;
  const digits = (raw.match(/\d/g) || []).length;
  if (digits >= 4 && digits >= letters) return "number-dominated fragment";
  const words = folded.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length < 4 && !VALID_SHORT_NAMES.has(words[0])) return "unrecognized short fragment";
  if (words.length > 1 && words.every((word) => word.length <= 3) && !words.some((word) => VALID_SHORT_NAMES.has(word))) return "low-information OCR fragment";
  if (folded.length > 100) return "fragment is too long to be one ingredient";
  return null;
}

function isENumber(value) {
  return /^e\s?\d{3,4}[a-z]?$/i.test(String(value || "").trim());
}

export function sanitizeIngredientCandidates(
  input,
  {
    category,
    sourceField = "unknown",
    requireSection = false,
    detectSection = true,
    excludedTerms = []
  } = {}
) {
  const isArrayInput = Array.isArray(input);
  const rawText = isArrayInput ? input.map((item) => item?.text || item?.id || item?._id || item).filter(Boolean).join(", ") : cleanRawText(input);
  const section = !isArrayInput && detectSection ? detectIngredientSection(rawText) : null;
  if (requireSection && !section?.found) {
    return {
      acceptedIngredients: [],
      rejectedFragments: rawText ? [{ originalText: rawText, rejectionReason: "ingredient section not detected", sourceField }] : [],
      warnings: ["Ingredient section not detected"],
      metadata: { sourceField, sectionDetected: false, sourcePriority: "raw-label" }
    };
  }

  const candidateSource = section?.found ? section.text : rawText;
  const parsed = isArrayInput ? null : parseIngredientList(candidateSource);
  const rawCandidates = isArrayInput
    ? input.map((item) => ({ originalText: item?.text || item?.id || item?._id || item })).filter((item) => item.originalText)
    : flattenParsedIngredients(parsed).map((node) => ({
        originalText: node.rawName,
        normalizedText: node.normalizedName,
        parentName: node.parentName,
        depth: node.depth,
        allergenSources: node.allergenSources,
        qualifiers: node.qualifiers,
        sourceSegment: node.sourceSegment
      }));
  const acceptedIngredients = [];
  const rejectedFragments = (parsed?.rejectedFragments || []).map((fragment) => ({
    originalText: fragment.rawName,
    normalizedText: fragment.normalizedName,
    rejectionReason: fragment.rejectionReason,
    sourceField
  }));
  const seen = new Set();
  const excludedKeys = new Set(excludedTerms.map(normalizeKnowledgeKey).filter(Boolean));

  rawCandidates.forEach((rawCandidate) => {
    const originalText = cleanRawText(rawCandidate.originalText);
    const candidate = normalizeCandidate(rawCandidate.normalizedText || originalText);
    const knowledge = candidate ? resolveLocalIngredientKnowledge(candidate, { category }) : null;
    const knownMatch = Boolean(knowledge && knowledge.confidence !== "low");
    const rejectionReason = getRejectionReason(candidate, knownMatch, excludedKeys);
    if (rejectionReason) {
      rejectedFragments.push({ originalText, normalizedText: candidate, rejectionReason, sourceField });
      return;
    }

    const normalized = normalizeIngredientLabel(candidate);
    const canonicalKey = knownMatch ? knowledge.id : normalizeKnowledgeKey(normalized.englishText);
    if (!canonicalKey || seen.has(canonicalKey)) return;
    seen.add(canonicalKey);
    acceptedIngredients.push({
      originalText,
      normalizedText: normalized.englishText,
      sourceField,
      confidence: knownMatch ? knowledge.confidence : requireSection ? "low" : "medium",
      reasonAccepted: knownMatch
        ? "Matched a curated ingredient or alias"
        : isENumber(candidate)
          ? "Valid additive code"
          : section?.found
            ? "Plausible item inside a detected ingredient section"
            : "Plausible item from an ingredient-specific field",
      knowledgeId: knownMatch ? knowledge.id : null,
      translated: normalized.translated,
      translationConfidence: normalized.translationConfidence,
      parentName: rawCandidate.parentName || null,
      depth: rawCandidate.depth || 0,
      allergenSources: rawCandidate.allergenSources || [],
      qualifiers: rawCandidate.qualifiers || [],
      sourceSegment: rawCandidate.sourceSegment || "direct"
    });
  });

  const warnings = [];
  if (section && !section.found && detectSection && !isArrayInput) warnings.push("No ingredient heading detected; treated as ingredient-specific input");
  if (rejectedFragments.length) warnings.push(`${rejectedFragments.length} non-ingredient fragment${rejectedFragments.length === 1 ? "" : "s"} rejected`);
  return {
    acceptedIngredients,
    rejectedFragments,
    warnings,
    metadata: {
      sourceField,
      sectionDetected: Boolean(section?.found),
      startMarker: section?.startMarker || null,
      stopMarker: section?.stopMarker || null,
      parsedStructure: parsed?.directIngredients || [],
      containsStatements: parsed?.containsStatements || [],
      advisoryStatements: parsed?.advisoryStatements || [],
      sourcePriority: sourceField.startsWith("ingredients") ? "provider-ingredient-field" : sourceField.startsWith("user") ? "user-provided" : "raw-label"
    }
  };
}
