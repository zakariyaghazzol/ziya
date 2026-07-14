export const INGREDIENT_DISPLAY_MODES = Object.freeze([
  { id: "translated", label: "Translate recognized ingredients" },
  { id: "original", label: "Keep original label wording" },
  { id: "both", label: "Show both" }
]);

const MODE_IDS = new Set(INGREDIENT_DISPLAY_MODES.map((item) => item.id));

export function sanitizeIngredientDisplayMode(value) {
  return MODE_IDS.has(value) ? value : "translated";
}

export function getIngredientDisplayName(ingredient, mode = "translated") {
  const resolvedMode = sanitizeIngredientDisplayMode(mode);
  const original = String(ingredient?.originalLabelText || ingredient?.inputName || ingredient?.rawName || ingredient?.name || "").trim();
  const recognized = String(ingredient?.displayName || ingredient?.canonicalName || ingredient?.name || original || "Ingredient").trim();
  const differs = Boolean(original && recognized && original.localeCompare(recognized, undefined, { sensitivity: "base" }) !== 0);

  if (resolvedMode === "original" && original) {
    return { primaryName: original, secondaryText: differs ? `Recognized as ${recognized}` : "" };
  }
  if (resolvedMode === "both" && differs) {
    return { primaryName: recognized, secondaryText: `Original: ${original}` };
  }
  return { primaryName: recognized, secondaryText: "" };
}
