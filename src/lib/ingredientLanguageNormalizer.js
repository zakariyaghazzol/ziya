import { MULTILINGUAL_INGREDIENT_ALIASES } from "../data/multilingualIngredientAliases";
import { normalizeIngredientName } from "./ingredientParser";

function normalizeAliasKey(value) {
  return normalizeIngredientName(value)
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[ـً-ٰٟ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_INDEX = new Map();
for (const record of MULTILINGUAL_INGREDIENT_ALIASES) {
  record.aliases.forEach((alias) => {
    const key = normalizeAliasKey(alias.value);
    if (!key || ALIAS_INDEX.has(key)) return;
    ALIAS_INDEX.set(key, Object.freeze({ ...record, matchedAlias: alias.value, language: alias.language }));
  });
}

function detectScriptLanguage(value) {
  if (/[؀-ۿ]/u.test(value)) return "ar";
  return "unknown";
}

export function canonicalizeIngredientLanguage(value) {
  const rawName = String(value || "").trim();
  const normalizedRawName = normalizeAliasKey(rawName);
  const matched = ALIAS_INDEX.get(normalizedRawName);
  if (matched) {
    return {
      rawName,
      normalizedRawName,
      canonicalName: matched.canonicalName,
      displayName: matched.displayName,
      detectedLanguage: matched.language,
      originalLanguage: matched.language,
      confidence: "high",
      provenance: "local_multilingual_alias_map",
      matched: true
    };
  }
  const detectedLanguage = detectScriptLanguage(rawName);
  return {
    rawName,
    normalizedRawName,
    canonicalName: normalizedRawName,
    displayName: rawName,
    detectedLanguage,
    originalLanguage: detectedLanguage,
    confidence: "low",
    provenance: null,
    matched: false
  };
}

export { normalizeAliasKey };
