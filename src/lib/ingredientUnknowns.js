export function createUnknownIngredientReview({
  rawName,
  normalizedName,
  sourceProductId = null,
  sourceProductName = null,
  surroundingIngredients = [],
  firstSeenAt = new Date().toISOString()
} = {}) {
  return Object.freeze({
    rawName: String(rawName || "").trim(),
    normalizedName: String(normalizedName || "").trim(),
    sourceProductId,
    sourceProductName,
    surroundingIngredients: [...surroundingIngredients],
    firstSeenAt,
    suggestedStatus: "needs_review",
    reason: "No deterministic atlas, additive, vague-term, allergen, or source-backed match."
  });
}

export function getUnknownIngredientMessage() {
  return "Needs review. Ziya does not have enough source-backed data to identify this ingredient confidently.";
}
