# Ziya

## Scanner diagnostics

Append `?scannerDebug=1` to a deployed URL to reveal the developer-only scanner snapshot. It reports camera readiness, video dimensions, track settings, native detector support, decoder frame counts, and the last scanner error. The panel is hidden in normal production use.

## Ingredient intelligence

Ingredient, additive, chemical, medicine-ingredient, and textile-material matching starts with the curated records in `src/knowledge/ingredientKnowledge.js`. Those records own Ziya's cautious concern language and aliases; an unmatched label stays `unknown` instead of being treated as safe.

The same-origin routes `api/ingredients/pubchem.js` and `api/ingredients/pubmed.js` add chemical identity, synonyms, and citation metadata. Curated assessments always take priority, PubChem is never used as a health-risk rating, and PubMed titles are not treated as study conclusions. Both routes use a seven-day in-memory cache plus Vercel cache headers, while the client caches public enrichment records locally for seven days.

## Optional account sync

Ziya is local-first and does not require an account. Optional Supabase sign-in and sync setup is documented in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).
