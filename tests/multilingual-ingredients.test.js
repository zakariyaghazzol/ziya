import assert from "node:assert/strict";
import { classifyIngredient } from "../src/lib/ingredientClassifier.js";
import { evaluateIngredientCoverage } from "../src/lib/ingredientCoverage.js";
import { parseIngredientList } from "../src/lib/ingredientParser.js";

const classified = [];

function expectIngredient(input, canonicalName, options = {}) {
  const result = classifyIngredient(input, { category: "food" });
  classified.push(result);
  assert.equal(result.canonicalName.toLowerCase(), canonicalName.toLowerCase(), `${input} should resolve to ${canonicalName}`);
  assert.notEqual(result.classificationKind, "unknown", `${input} should be recognized`);
  assert.equal(result.originalLabelText, input);
  if (options.kind) assert.equal(result.classificationKind, options.kind);
  if (options.type) assert.match(result.type, new RegExp(options.type, "i"));
  if (options.status) assert.match(result.statusLabel, new RegExp(options.status, "i"));
  if (options.allergen) assert(result.allergenSources.includes(options.allergen), `${input} should include ${options.allergen}`);
  return result;
}

expectIngredient("NOISETTES", "hazelnuts", { kind: "common", type: "nut", allergen: "tree nuts", status: "tree nut source" });
expectIngredient("NOISETTES 13%", "hazelnuts", { kind: "common", type: "nut", allergen: "tree nuts", status: "tree nut source" });
expectIngredient("noisettes", "hazelnuts", { allergen: "tree nuts" });
expectIngredient("LACTOSERUM en poudre", "whey powder", { type: "dairy ingredient", allergen: "milk", status: "milk source" });
expectIngredient("lactosérum en poudre", "whey powder", { allergen: "milk" });
expectIngredient("lait écrémé en poudre", "skim milk powder", { allergen: "milk" });
expectIngredient("lait ecreme en poudre", "skim milk powder", { allergen: "milk" });
expectIngredient("émulsifiants", "emulsifiers", { kind: "vague", type: "broad additive function term", status: "limited detail" });
expectIngredient("emulsifiants", "emulsifiers", { kind: "vague" });
expectIngredient("vanilline", "vanillin", { kind: "common", type: "flavoring compound", status: "common flavoring" });
expectIngredient("lécithines", "lecithins", { kind: "vague", type: "emulsifier", status: "limited detail" });
expectIngredient("lécithine de soja", "soy lecithin", { kind: "common", allergen: "soy", status: "soy source" });
expectIngredient("lécithine de tournesol", "sunflower lecithin", { kind: "common", type: "emulsifier" });
expectIngredient("sucre", "sugar", { type: "sweetener" });
expectIngredient("huile de palme", "palm oil", { type: "plant oil" });
expectIngredient("cacao maigre", "cocoa powder", { type: "cocoa ingredient" });
expectIngredient("poudre de lait", "milk powder", { allergen: "milk" });
expectIngredient("farine de blé", "wheat flour", { allergen: "wheat" });
expectIngredient("amidon de maïs", "corn starch", { type: "starch" });
expectIngredient("arôme naturel", "natural flavor", { kind: "vague", type: "vague flavor term" });
expectIngredient("épices", "spices", { kind: "vague", type: "vague seasoning term" });
expectIngredient("azúcar", "sugar");
expectIngredient("leche en polvo", "milk powder", { allergen: "milk" });
expectIngredient("avellanas", "hazelnuts", { allergen: "tree nuts" });
expectIngredient("harina de trigo", "wheat flour", { allergen: "wheat" });
expectIngredient("lecitina de soja", "soy lecithin", { allergen: "soy" });
expectIngredient("sunflower oil", "sunflower oil", { kind: "common" });

const red40 = expectIngredient("E129", "Allura Red AC", { kind: "known_concern" });
assert.notEqual(red40.statusLabel, "Common ingredient");
expectIngredient("carrageenan", "Carrageenan", { kind: "known_concern" });

const unknown = classifyIngredient("zxqv multilingual mystery flakes", { category: "food" });
classified.push(unknown);
assert.equal(unknown.classificationKind, "unknown");
assert.equal(unknown.statusLabel, "Needs review");

const nutellaText = "sucre, huile de palme, noisettes, cacao maigre, lait écrémé en poudre, lactosérum en poudre, émulsifiants: lécithines, vanilline";
const parsed = parseIngredientList(nutellaText);
assert.equal(parsed.directIngredients.length, 8);
const emulsifiers = parsed.directIngredients.find((item) => item.normalizedName === "emulsifiants");
assert(emulsifiers, "emulsifiers parent should be parsed");
assert.equal(emulsifiers.children.length, 1);
assert.equal(emulsifiers.children[0].normalizedName, "lecithines");

const coverage = evaluateIngredientCoverage(parsed, { category: "food", sourceProductName: "Nutella-style spread" });
assert.equal(coverage.total, 9);
assert.equal(coverage.unknown, 0, coverage.unknownTerms.join(", "));
assert.equal(coverage.coveragePercent, 100);
assert(coverage.provenanceSummary.local_multilingual_alias_map >= 9);

const compactFrenchLabel = parseIngredientList("émulsifiants: lécithines [soja] vanilline");
const compactCoverage = evaluateIngredientCoverage(compactFrenchLabel, { category: "food", sourceProductName: "French compact label" });
assert.equal(compactCoverage.unknown, 0, compactCoverage.unknownTerms.join(", "));
assert(compactCoverage.classifications.some((item) => item.canonicalName === "lecithins"));
assert(compactCoverage.classifications.some((item) => item.canonicalName === "soybeans"));
assert(compactCoverage.classifications.some((item) => item.canonicalName === "vanillin"));

for (const result of [...classified, ...coverage.classifications]) {
  const visibleCopy = [result.displayName, result.type, result.statusLabel, result.rowSubtitle, result.statusDescription].join(" ");
  assert(!/\b(?:safe|healthy|good for you|harmless|allergen-free)\b/i.test(visibleCopy), `${result.inputName} used banned wording: ${visibleCopy}`);
}

console.log("Multilingual ingredient checks passed.");
