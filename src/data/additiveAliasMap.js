function additive({ canonicalName, displayName, aliases, type, concernLevel = "unknown", statusLabel }) {
  return Object.freeze({
    canonicalName,
    displayName: displayName || canonicalName,
    aliases: [...new Set([canonicalName, ...(aliases || [])])],
    type,
    concernLevel,
    statusLabel: statusLabel || (concernLevel === "higher" ? "Flagged additive" : concernLevel === "moderate" ? "Moderate concern" : "Listed additive")
  });
}

export const ADDITIVE_ALIAS_MAP = Object.freeze([
  additive({ canonicalName: "Tartrazine", displayName: "Yellow 5 / Tartrazine", aliases: ["E102", "INS 102", "Yellow 5", "Yellow No. 5", "FD&C Yellow 5", "FD&C Yellow No. 5"], type: "Synthetic color additive", concernLevel: "moderate" }),
  additive({ canonicalName: "Sunset Yellow FCF", displayName: "Yellow 6 / Sunset Yellow FCF", aliases: ["E110", "INS 110", "Yellow 6", "Yellow No. 6", "FD&C Yellow 6", "FD&C Yellow No. 6"], type: "Synthetic color additive", concernLevel: "moderate" }),
  additive({ canonicalName: "Erythrosine", displayName: "Red 3 / Erythrosine", aliases: ["E127", "INS 127", "Red 3", "Red No. 3", "FD&C Red 3", "FD&C Red No. 3", "FD and C Red No. 3", "Acid Red 51", "C.I. 45430"], type: "Synthetic color additive", concernLevel: "higher", statusLabel: "Flagged additive" }),
  additive({ canonicalName: "Allura Red AC", displayName: "Red 40 / Allura Red AC", aliases: ["E129", "INS 129", "Red 40", "Red No. 40", "FD&C Red 40", "FD&C Red No. 40", "FD and C Red No. 40"], type: "Synthetic color additive", concernLevel: "moderate" }),
  additive({ canonicalName: "Indigo carmine", displayName: "Blue 2 / Indigo Carmine", aliases: ["E132", "INS 132", "Blue 2", "Blue No. 2", "FD&C Blue 2", "FD&C Blue No. 2", "indigotine"], type: "Synthetic color additive", concernLevel: "moderate" }),
  additive({ canonicalName: "Brilliant Blue FCF", displayName: "Blue 1 / Brilliant Blue FCF", aliases: ["E133", "INS 133", "Blue 1", "Blue No. 1", "FD&C Blue 1", "FD&C Blue No. 1"], type: "Synthetic color additive", concernLevel: "moderate" }),
  additive({ canonicalName: "Titanium dioxide", aliases: ["E171", "INS 171", "CI 77891", "C.I. 77891"], type: "Color additive / opacifier", concernLevel: "moderate" }),
  additive({ canonicalName: "Carrageenan", aliases: ["E407", "INS 407", "irish moss extract"], type: "Thickener / stabilizer", concernLevel: "moderate" }),
  additive({ canonicalName: "Potassium sorbate", aliases: ["E202", "INS 202"], type: "Preservative", concernLevel: "low" }),
  additive({ canonicalName: "Sodium benzoate", aliases: ["E211", "INS 211", "benzoate of soda"], type: "Preservative", concernLevel: "moderate" }),
  additive({ canonicalName: "Calcium propionate", aliases: ["E282", "INS 282", "calcium propanoate"], type: "Preservative", concernLevel: "low" }),
  additive({ canonicalName: "Sodium nitrite", aliases: ["E250", "INS 250"], type: "Curing preservative", concernLevel: "moderate" }),
  additive({ canonicalName: "Sodium nitrate", aliases: ["E251", "INS 251"], type: "Curing preservative", concernLevel: "moderate" }),
  additive({ canonicalName: "BHA", aliases: ["E320", "INS 320", "butylated hydroxyanisole"], type: "Antioxidant preservative", concernLevel: "moderate" }),
  additive({ canonicalName: "BHT", aliases: ["E321", "INS 321", "butylated hydroxytoluene"], type: "Antioxidant preservative", concernLevel: "moderate" }),
  additive({ canonicalName: "TBHQ", aliases: ["E319", "INS 319", "tert-butylhydroquinone", "tertiary butylhydroquinone"], type: "Antioxidant preservative", concernLevel: "moderate" }),
  additive({ canonicalName: "Sucralose", aliases: ["E955", "INS 955"], type: "High-intensity sweetener", concernLevel: "low" }),
  additive({ canonicalName: "Aspartame", aliases: ["E951", "INS 951"], type: "High-intensity sweetener", concernLevel: "moderate" }),
  additive({ canonicalName: "Acesulfame potassium", aliases: ["E950", "INS 950", "acesulfame K", "Ace-K"], type: "High-intensity sweetener", concernLevel: "low" }),
  additive({ canonicalName: "Saccharin", aliases: ["E954", "INS 954", "sodium saccharin"], type: "High-intensity sweetener", concernLevel: "moderate" }),
  additive({ canonicalName: "Monosodium glutamate", displayName: "MSG / Monosodium Glutamate", aliases: ["MSG", "E621", "INS 621", "sodium glutamate"], type: "Flavor enhancer", concernLevel: "low" }),
  additive({ canonicalName: "Polysorbate 80", aliases: ["E433", "INS 433", "polyoxyethylene sorbitan monooleate"], type: "Emulsifier", concernLevel: "moderate" }),
  additive({ canonicalName: "Mono- and diglycerides", aliases: ["E471", "INS 471", "mono and diglycerides", "mono & diglycerides", "monoglycerides and diglycerides"], type: "Emulsifier", concernLevel: "unknown" }),
  additive({ canonicalName: "Carboxymethylcellulose", aliases: ["E466", "INS 466", "cellulose gum", "CMC"], type: "Thickener / stabilizer", concernLevel: "moderate" }),
  additive({ canonicalName: "Xanthan gum", aliases: ["E415", "INS 415"], type: "Thickener / stabilizer", concernLevel: "low" }),
  additive({ canonicalName: "Guar gum", aliases: ["E412", "INS 412", "guaran"], type: "Thickener / stabilizer", concernLevel: "low" }),
  additive({ canonicalName: "Locust bean gum", aliases: ["E410", "INS 410", "carob bean gum"], type: "Thickener / stabilizer", concernLevel: "low" }),
  additive({ canonicalName: "Gellan gum", aliases: ["E418", "INS 418"], type: "Thickener / stabilizer", concernLevel: "low" })
]);

function normalizeAdditiveKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\bfd\s*(?:and|&)\s*c\b/gi, "fd c")
    .replace(/\bins\s+(\d{3,4})\b/gi, "e$1")
    .replace(/\be\s+(\d{3,4}[a-z]?)\b/gi, "e$1")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

const ADDITIVE_INDEX = new Map();
for (const item of ADDITIVE_ALIAS_MAP) {
  for (const alias of item.aliases) ADDITIVE_INDEX.set(normalizeAdditiveKey(alias), item);
}

export function findAdditiveAlias(value) {
  return ADDITIVE_INDEX.get(normalizeAdditiveKey(value)) || null;
}

export { normalizeAdditiveKey };
