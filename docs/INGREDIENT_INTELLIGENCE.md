# Ingredient Intelligence

Ziya interprets ingredient labels with deterministic local knowledge first. The goal is useful coverage without treating missing data as proof of safety or asking a language model to create live product claims.

## Resolution order

1. Existing source-backed additive and chemical concern records
2. Additive aliases, including common E-number, INS, and FD&C variants
3. The local Common Ingredient Atlas
4. The local Vague Ingredient Terms atlas
5. Allergen-source and processing-marker signals
6. Product-level label evidence already supplied by the product provider or user correction
7. Existing PubChem and PubMed enrichment where applicable
8. `Needs review` when no deterministic or source-backed match exists

The concern layer always outranks the common atlas. A color additive, preservative, or other established concern record cannot be downgraded to a common ingredient because a broad alias happens to match.

## Local atlases

The Common Ingredient Atlas covers ordinary recognizable food ingredients offline. Each canonical record includes aliases, category, function, plain-language description, nutrition relevance, diet compatibility signals, and allergen sources where applicable.

Vague Ingredient Terms identify phrases such as `natural flavor`, `spices`, and `vegetable oil`. These are shown as limited-detail or broad label terms rather than fully known ingredients.

The Additive Alias Map improves identity matching for labels such as `E129`, `FD&C Red 40`, and `Allura Red AC`. It complements the existing source-backed additive records and does not replace them.

## Parsing and coverage

`ingredientParser.js` preserves direct ingredients, nested sub-ingredients, allergen parentheticals, contains statements, advisory traces, and rejected label noise. `ingredientClassifier.js` is the shared interpretation path used by product ingredient records. `ingredientCoverage.js` reports internal coverage and unknown terms without adding a user-facing dashboard.

Common ingredients use wording such as `Common ingredient` and `No specific concern flagged by default`. Unknown terms use `Needs review` and `Not enough source-backed data`. Missing data is never treated as proof of absence.

## Product evidence and external sources

Open Food Facts product fields can provide useful label evidence, including ingredient text, additive tags, allergen tags, traces, nutrition, and processing fields. That data is community-contributed and may be incomplete, so Ziya preserves field confidence and label-completion behavior.

PubChem remains available for chemical identity and synonyms. PubMed remains available for selected source metadata. Ordinary common ingredients resolve locally first instead of triggering external chemical lookups.

USDA FoodData Central may be useful later for generic food identity and nutrition references. It requires a data.gov API key and must be integrated through a server-side endpoint; no USDA key belongs in frontend code.

AI tools may later draft candidate atlas entries for developer review. Generated ingredient explanations must not appear directly in product reports unless they are verified and committed into the deterministic or source-backed knowledge layer.

## Extending the atlas

Add one canonical record for a substance and place spelling, plural, accented, or label variants in `aliases`. Do not create separate canonical records for trivial wording changes. Keep descriptions factual and concise, preserve allergen and diet uncertainty, and add tests for any new ambiguity or additive-code mapping.
