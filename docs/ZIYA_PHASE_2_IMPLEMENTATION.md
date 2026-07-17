# Ziya Phase 2 Current Implementation Status

Audit date: 2026-07-17

This document describes the current uncommitted Phase 2 implementation exactly as audited. It is not a launch claim. The implementation is a broad local-first foundation with several truthful manual flows, but it is not yet a production restaurant, OCR, trend, notification, or background-context product.

The implementation intentionally preserves Ziya's scanner, product lookup, product report scoring, Profile, Better Matches, and Today's Plate calculations.

## Status vocabulary

| Status | Meaning |
|---|---|
| Implemented | The current code provides the intended bounded behavior and a usable path. |
| Partially implemented | A meaningful part works, but lifecycle, integration, coverage, or edge handling is incomplete. |
| Foundation only | The state, deterministic helper, or UI shell exists, but the feature is not yet sufficiently useful by itself. |
| Manual fallback | The user can complete the task by entering or confirming data; automation is absent or unreliable. |
| Needs API | Meaningful productization requires an external or first-party data source not currently connected. |
| Needs native platform | The required behavior cannot be promised by the current browser app. |
| Needs UX redesign | The behavior exists but is presented as a long form, raw log, or disconnected workflow. |
| Deferred | Intentionally not built in the current foundation. |

## Capability status

| Capability | Status | Current behavior | Important limitation |
|---|---|---|---|
| Today's Plate connection | Partially implemented | Restaurant meals with usable nutrition can be converted to the existing food-log shape; food logs create Phase 2 activities. | The connection follows manual meal construction and does not yet present a strong day/week confirmation flow. |
| Weekly goals | Partially implemented, Needs UX redesign | Deterministic current-week progress exists for quick-service meals, protein-goal days, sugar, sodium, gym visits, grocery scans, and goal-compatible restaurant choices. | No pause/archive/history/snapshot lifecycle; limit goals need better zero-evidence semantics; setup remains form-heavy. |
| Long-term goals | Foundation only, Needs UX redesign | Current and prior fixed-duration periods can be compared for soda, ingredient avoidance, product quality, protein consistency, quick-service, gym, and high-sugar snack metrics. | Sparse baselines can be weak; no lifecycle or stable period snapshots; UI is a form plus recent event list. |
| Flexible weekly allowances | Foundation only | Goal-fit and limit progress can describe remaining room. | There is no explicit allowance, planned exception, carryover, or what-if model. |
| Manual restaurants | Manual fallback | Users can save restaurant name, place type, source notes, confidence, and menu items. | Users supply nearly every identity and evidence field. |
| Restaurant discovery | Needs API | None beyond saved/manual records. | No place search, autocomplete, branch identity, or current external catalog. |
| Restaurant comparison | Partially implemented | Known saved menu items are analyzed against Today's Plate, weekly goals, and Profile alerts. | Candidate pool is local/manual and serving/menu versions are not normalized. |
| Menu-item matching | Foundation only, Manual fallback | Deterministic token matching ranks saved menu items for parsed receipt lines. | Both receipt text and menu records usually require user creation; no modifier, size, region, or menu-date model. |
| Fast-food decision support | Foundation only | Quick-service goal rules and nonjudgmental goal-fit copy exist. | It has no live menu source and appears after substantial data entry. |
| Receipt capture | Manual fallback, Needs UX redesign | A user can select an image, choose a capture type, retain a local preview, and review extracted or pasted text. | Capture, processing, extraction, row review, and confirmation are not a productized staged flow. |
| Receipt OCR | Manual fallback, Needs API | window.TextDetector is used when available, with createImageBitmap; otherwise the user pastes or enters text. | TextDetector is not a dependable cross-browser production OCR service. |
| Receipt parser | Foundation only | Deterministic parsing removes likely totals/tax lines and extracts item, quantity, and price candidates. | Real receipts vary widely; parser quality depends on OCR and abbreviations. |
| Receipt-to-menu matching | Foundation only | Parsed item text can be compared with saved menu items and assigned a heuristic confidence. | No external menu catalog and no production benchmark. |
| Nutrition-board capture | Manual fallback, Needs API | Uses the generic capture and text-review path. | No layout/table extraction or nutrient-column reconciliation. |
| Grocery-receipt capture | Manual fallback | Uses the generic receipt review path. | No retailer catalog, product/GTIN reconciliation, or basket workflow. |
| Food-photo review | Manual fallback, Deferred automation | A photo can be retained as evidence for manual review. | It does not identify a dish, portion, ingredients, or nutrition. |
| One-time location check | Implemented | Explicit navigator.geolocation.getCurrentPosition checks current location after the user asks. | Foreground only, permission-gated, and no place provider. |
| Saved-place matching | Partially implemented | Haversine distance compares a foreground coordinate with user-saved places and radii. | It does not fully incorporate location accuracy, dwell, dense-place ambiguity, or branch data. |
| Gym visit confirmation | Partially implemented | A saved gym proximity can be explicitly confirmed into an activity. | Proximity does not prove exercise; no passive detection. |
| Restaurant visit confirmation | Partially implemented | A saved restaurant proximity can be explicitly confirmed; recent restaurant visits help avoid duplicate meal/visit counting. | No branch catalog and no smooth menu/capture continuation. |
| Grocery visit confirmation | Partially implemented | A saved grocery proximity can be explicitly confirmed and count toward supported goals. | No shopping-session or purchase linkage. |
| Background geofencing | Needs native platform | Not implemented. | The current web app cannot reliably provide closed-app region monitoring. |
| Contextual nudges | Foundation only | Deterministic nudge rules use context freshness, an 18-hour cooldown, seven-day dismissal behavior, and supportive copy. | Rule coverage is narrow and events only exist while current app logic runs. |
| Browser notifications | Foundation only | Notification permission and foreground-triggered browser notifications are available when supported. | No service worker push subscription, scheduler, background delivery service, or receipt tracking. |
| Rewards | Deferred | No points, streak system, or reward economy. | This is intentional until confirmed event quality and goal history are stronger. |
| Trends | Foundation only, Needs UX redesign | Long-term calculations and a recent activity list exist. | No minimum evidence rule, closed-period snapshots, insight ranking, chart/detail flow, or polished trend narrative. |
| Behavior insights | Foundation only | A few deterministic comparisons can be derived. | Sparse data and selective logging are not yet sufficiently controlled for broad claims. |
| Profile personalization | Partially implemented | Goal-fit analysis reuses current Profile alerts and preferences. | Missing restaurant ingredient/nutrition data limits what can be checked. |
| Label Watch connection | Partially implemented | Existing Profile watchlist and ingredient alias logic can participate when ingredient text exists. | There is no separate Label Watch Phase 2 contract, and missing label data cannot be cleared. |
| Better Matches connection | Deferred Phase 2 integration | The existing product Better Matches system remains intact; restaurant items are ranked separately by goal-fit. | There is no shared restaurant comparison presentation or external menu candidate pool. |
| Local persistence | Implemented | Versioned localStorage state is sanitized, capped, merged by stable IDs/timestamps, and protected by deletion tombstones. | Browser storage is not durable backup and the state is one large object. |
| Optional cloud sync | Partially implemented | A phase2_state JSONB row per user can sync through Supabase with RLS; missing configuration/table remains local-only. | Whole-state merge is coarse and not suited to field-level analytics or complex conflicts. |
| Privacy controls | Partially implemented | Receipt-text retention, export, location-history deletion, meal-history deletion, receipt-review deletion, local-only use, and opt-in permissions exist. | No full provider disclosure/retention architecture, uploaded-media policy, or account-deletion integration for Phase 2. |
| Source provenance | Foundation only | Restaurant records and meals retain confidence/source notes and distinguish several source types. | Provenance is mostly record-level and free text, not field-level with date, region, and version. |
| Confidence handling | Foundation only | Confirmed menu, published nutrition, user confirmed, receipt match, estimated menu, and unknown levels exist; missing values remain missing. | Identity, extraction, field, match, and completeness confidence are not independent. |
| Mobile UI | Needs UX redesign | A responsive Goals & Places hub has This week, Places, Capture, and Trends tabs. | Long forms and repeated cards dominate; progressive disclosure and guided next steps are limited. |
| Motion and smoothness | Needs UX redesign | Existing Ziya shared styles provide basic interaction feedback. | Phase 2 lacks staged processing, focused transitions, and clear empty-to-confirmed motion. |
| Accessibility | Partially implemented, Needs UX redesign | Standard React controls and readable text provide a basic foundation. | No complete Phase 2 focus-order, live-region, reduced-motion, large-text, and screen-reader audit has been completed. |

## Current architecture

### Data and rules

- **src/data/locationContextTypes.js** defines supported place contexts and confirmed activity types.
- **src/data/restaurantGoalRules.js** defines restaurant evidence confidence and weekly/long-term goal templates.
- Confidence currently ranks confirmed menu and restaurant-published nutrition highest, followed by user-confirmed, receipt match, estimated menu, and unknown.

### Local state and synchronization

- **src/lib/phase2State.js** owns sanitation, caps, versioned local persistence, entity merge, and deletion tombstones.
- The local key is ziya-context-layer-v1 and the current stored schema version is 1.
- The state includes goals, activities, restaurants/menu items, restaurant meals, receipt reviews, saved places, nudges, settings, and deletion metadata.
- Stable-ID records merge by the most recent update timestamp and deletion tombstones filter older reappearing records.
- **src/data/cloudSync.js** optionally reads and writes the Phase 2 state when Supabase is configured.
- **supabase/migrations/202607160001_phase2_context.sql** adds the phase2_state row with Row Level Security.
- A missing Phase 2 table or missing Supabase configuration degrades gracefully to local-only mode.

### Goal engines

- **src/lib/weeklyGoalEngine.js** computes Monday-based current-week progress from existing Today's Plate logs and Phase 2 activities/meals.
- It supports count, minimum/consistency, sum, and limit-style templates as currently defined.
- Missing sugar or sodium fields are tracked as partial rather than converted to zero.
- **src/lib/longTermGoalEngine.js** compares current and previous fixed windows.
- Ingredient-avoidance evaluation reuses normalized ingredient knowledge aliases.
- Products or meals without ingredient labels do not count as proven avoidance.

### Restaurant and meal analysis

- **src/lib/goalFitAnalyzer.js** compares known calories, protein, sugar, and sodium with Today's Plate goals/current totals and uses Profile alerts.
- Preparation/cooking-oil notes remain evidence-qualified and do not invent oil use.
- **src/lib/restaurantMatcher.js** performs deterministic fuzzy token matching against saved local restaurants only.
- **src/lib/menuItemMatcher.js** compares extracted item text against saved local menu items only.
- **src/lib/restaurantProduct.js** converts a confirmed restaurant meal to a product-like identity record. It remains unscored and Needs label when analysis fields are incomplete.

### Capture and OCR

- **src/lib/receiptOcr.js** attempts browser TextDetector extraction only when available and returns a manual-review path otherwise.
- **src/lib/receiptParser.js** performs deterministic text-line parsing.
- Captured photos are not uploaded or persisted by this foundation.
- Receipt/menu/order-screen/nutrition-board/grocery/takeout/food-photo types share the same general review surface.

### Location and context

- **src/lib/locationContextDetector.js** performs explicit one-time browser geolocation and distance matching against saved places.
- No background watcher or geofence runs.
- Confirmed activities are distinct from candidate context.
- Duplicate/recent event checks reduce double counting.

### Nudges

- **src/lib/contextualNudgeEngine.js** uses recent context, active goals, cooldown, dismissal, and supportive wording.
- Current context older than roughly three hours is ignored.
- Repeated nudges are subject to an 18-hour cooldown and dismissed nudges remain suppressed for seven days.
- Optional browser notifications are not equivalent to Web Push or native scheduled notifications.

### UI and app integration

- **src/phase2/PhaseTwoScreen.jsx** provides the This week, Places, Capture, and Trends tabs.
- **src/main.jsx** records product_scanned activities with a short duplicate guard and records food_logged or soda_logged activities when Today's Plate is updated.
- Restaurant meals can be associated with a recent quick-service visit to avoid counting one behavior twice.
- Today's Plate includes a link into the weekly/trend area.
- Top/Overview includes the Goals & Places entry.

## Data honesty guarantees currently preserved

- Missing nutrition, ingredients, allergens, preparation details, or materials remain missing.
- No receipt or photo automatically becomes a consumed food.
- No proximity candidate automatically becomes a visit.
- No visit automatically becomes a meal.
- Food photos are not assigned exact nutrition from appearance.
- Restaurant cooking-oil information is not claimed without evidence.
- Medicine and non-food product behavior is not changed by this Phase 2 work.
- Profile alerts remain separate from the base product score.
- Optional cloud configuration is not required for local use.

## Current UI audit

At 393x852 and 360x800:

- No horizontal overflow was observed in the Phase 2 hub.
- Bottom navigation generally remained clear of content due to existing page padding.
- The UI matched Ziya's white, soft-green, rounded style.
- The main usability problem was vertical and cognitive load, not layout breakage.
- The This week form is always visible even after goals exist.
- Places combines location actions, quick logs, and a long restaurant/nutrition form.
- Capture presents broad capture types but mostly resolves to image plus text review.
- Trends presents goal setup and raw event history rather than concise insights.
- Loading, provider failure, extraction progress, partial-data details, and confirmation motion are not yet productized.

## Verification for the current implementation

The Phase 2 implementation adds a focused test command and should continue to be checked alongside the existing regressions:

    npm run test:phase2
    npm run test:better-matches
    npm run test:multilingual-ingredients
    npm run test:region-search
    npm run test:ingredient-parser
    npm run test:ingredient-coverage
    npm run test:profile
    npm run test:data-quality
    npm run test:plate-profile
    npm run build

This documentation audit did not rerun or modify these tests because it changes documentation only. The implementation remains uncommitted and unchanged.
