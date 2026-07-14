export const INGREDIENT_PROVENANCE = Object.freeze({
  COMMON_ATLAS: "local_common_atlas",
  VAGUE_ATLAS: "local_vague_term_atlas",
  ADDITIVE_ALIAS: "local_additive_alias_map",
  MULTILINGUAL_ALIAS: "local_multilingual_alias_map",
  EXISTING_ADDITIVE: "existing_additive_layer",
  PRODUCT_PAYLOAD: "open_food_facts_product_payload",
  ALLERGEN_TAGS: "open_food_facts_allergen_tags",
  ADDITIVE_TAGS: "open_food_facts_additive_tags",
  USER_CORRECTION: "user_correction",
  PUBCHEM: "pubchem_lookup",
  PUBMED: "pubmed_lookup",
  UNKNOWN: "unknown"
});

export function createIngredientProvenance(source, { confidence = "medium", field, note } = {}) {
  return Object.freeze({ source, confidence, ...(field ? { field } : {}), ...(note ? { note } : {}) });
}

export function mergeIngredientProvenance(...groups) {
  const merged = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    const entry = typeof item === "string" ? createIngredientProvenance(item) : item;
    const key = `${entry.source}:${entry.field || ""}`;
    if (!merged.has(key)) merged.set(key, entry);
  });
  return [...merged.values()];
}

export function summarizeIngredientProvenance(classifications = []) {
  return classifications.reduce((summary, classification) => {
    (classification.provenance || []).forEach((entry) => {
      const source = typeof entry === "string" ? entry : entry.source;
      if (source) summary[source] = (summary[source] || 0) + 1;
    });
    return summary;
  }, {});
}
