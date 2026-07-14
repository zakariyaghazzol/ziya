import { classifyParsedIngredients } from "./ingredientClassifier";
import { parseIngredientList } from "./ingredientParser";
import { summarizeIngredientProvenance } from "./ingredientProvenance";

export function evaluateIngredientCoverage(input, options = {}) {
  const parsed = input?.directIngredients ? input : parseIngredientList(input);
  const classifications = classifyParsedIngredients(parsed, options);
  const knownConcern = classifications.filter((item) => item.classificationKind === "known_concern").length;
  const common = classifications.filter((item) => item.classificationKind === "common").length;
  const vague = classifications.filter((item) => item.classificationKind === "vague").length;
  const unknownClassifications = classifications.filter((item) => item.classificationKind === "unknown");
  const allergenSources = classifications.filter((item) => item.allergenSources.length > 0).length
    + parsed.containsStatements.reduce((sum, statement) => sum + statement.sources.length, 0);
  const processingMarkers = classifications.filter((item) => item.processingMarkers.length > 0).length;
  const total = classifications.length;
  const recognized = total - unknownClassifications.length;
  return {
    total,
    parsedDirectIngredients: parsed.directIngredients.length,
    parsedSubIngredients: Math.max(0, total - parsed.directIngredients.length),
    knownConcern,
    common,
    allergenSources,
    advisoryTraces: parsed.advisoryStatements.reduce((sum, statement) => sum + Math.max(1, statement.sources.length), 0),
    vague,
    processingMarkers,
    unknown: unknownClassifications.length,
    coveragePercent: total ? Math.round((recognized / total) * 1000) / 10 : 0,
    unknownTerms: [...new Set(unknownClassifications.map((item) => item.normalizedName))],
    provenanceSummary: summarizeIngredientProvenance(classifications),
    classifications,
    parsed
  };
}
