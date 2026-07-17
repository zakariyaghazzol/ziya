# Ziya Phase 2 Productization Roadmap

Audit date: 2026-07-17

This document is the product and architecture specification for Ziya's Phase 2 context-aware behavior layer. It is based on an audit of the current working tree, the current mobile UI at 393x852 and 360x800, and current official provider and platform documentation. It deliberately separates code that exists from behavior that is useful, polished, evidence-backed, and ready for real users.

## 1. Product Vision

Phase 1 answers:

> What is in this product?

Phase 2 should answer:

> How does this real-life choice fit my day, week, preferences, and longer-term direction?

Ziya should connect confirmed product scans, food logs, restaurant meals, receipts, saved places, Profile preferences, and Today's Plate into a supportive behavior layer. It should help a user act without demanding perfect data or perfect behavior.

The differentiator is not a larger feature list. It is a trustworthy evidence pipeline:

raw evidence -> normalized entity -> source and confidence -> user confirmation when uncertain -> goal impact -> confirmed event -> daily, weekly, and trend feedback

The product must never turn a probabilistic photo, an ambiguous receipt line, missing nutrition, or proximity to a place into a confirmed meal or health conclusion.

## 2. Current State

### 2.1 Maturity scale

| Level | Meaning |
|---|---|
| Implemented foundation | Code, state, and a basic UI path exist. |
| Basic usable flow | A user can complete the task with truthful output, often manually. |
| Productized flow | The path minimizes entry, handles failures, and connects to the rest of Ziya. |
| Polished flow | Mobile interaction, motion, accessibility, and edge states are consistently resolved. |
| Data-backed intelligence | Reliable external or first-party data, provenance, and confidence make the output meaningfully useful. |
| Production-ready | Privacy, operational cost, monitoring, retention, platform constraints, and real-device validation are complete. |

### 2.2 What exists now

The uncommitted Phase 2 foundation includes:

- Deterministic weekly goals for quick-service meals, protein days, sugar, sodium, gym visits, grocery scans, and goal-compatible restaurant choices.
- Deterministic long-term goals for soda reduction, ingredient avoidance, product quality, protein consistency, quick-service reduction, gym routine, and high-sugar snack reduction.
- Local restaurant and menu records with source notes, confidence, nutrition, ingredients, preparation notes, and cooking-oil notes.
- Goal-fit analysis connected to Today's Plate totals and Profile alerts.
- Capture records for receipts, menus, order screens, nutrition boards, grocery receipts, takeout labels, and food photos.
- Browser TextDetector use when available, deterministic receipt parsing, saved-menu matching, and manual review.
- One-time foreground location checks against user-saved coordinates, followed by explicit visit confirmation.
- In-app nudges, optional browser notifications while the current app logic runs, cooldowns, and dismissal state.
- Local persistence, sanitation, deletion tombstones, export/delete controls, and optional one-row-per-user Supabase synchronization.

### 2.3 What the implementation is not yet

It is not a production restaurant discovery system, a reliable OCR pipeline, a food-photo nutrition estimator, a background geofencing system, a trend product, or a complete notification system. Most value currently depends on a user creating the restaurant, place, menu item, source, ingredients, and nutrition manually.

The current Phase 2 surface is visually coherent with Ziya, but it behaves like four developer-oriented forms:

- **This week:** one useful summary plus an always-visible goal-creation form.
- **Places:** a useful one-time place check followed by a long restaurant and nutrient form.
- **Capture:** a capture type, local image, text area, and review action rather than a production extraction pipeline.
- **Trends:** long-term-goal setup and a raw activity list rather than interpretable insights.

At 393x852 and 360x800 there was no horizontal overflow, and bottom padding generally kept content above navigation. The main issue is vertical burden: repeated cards, long forms, weak progressive disclosure, and few guided next steps.

## 3. Gap Audit

| Feature | Roadmap intention | Current implementation | What works | What is shallow or foundational | UI/UX problems | Data/API limitations | Smart implementation opportunity | Platform limitation | Recommended next step | Deferred work |
|---|---|---|---|---|---|---|---|---|---|---|
| Today's Plate connection | Let confirmed choices update the day and inform weekly guidance. | Restaurant meals with usable nutrition can be converted to food logs; food logs create Phase 2 activities. | Known values remain known and missing values are not changed to zero. | The connection is available only after manual meal construction and has little visible explanation of weekly impact. | Logging and weekly impact feel like separate destinations. | Restaurant serving and nutrition identity are usually user-entered. | Add a confirmation sheet showing serving, source, today's effect, weekly effect, and one Log action. | Web is sufficient. | Productize the weekly recap and link each value to the confirmed Today's Plate evidence. | Automatic meal logging. |
| Weekly goals | Make flexible weekly behavior more useful than daily pass/fail. | Current-week deterministic counters and limits use food logs, scans, visits, and meals. | Multiple goal templates and partial nutrition tracking exist. | No lifecycle, history, pause, archive, custom period, or evidence drill-down. A limit can appear on track before meaningful evidence exists. | The creation form dominates the screen and target versus limit is not explained. | Completeness depends on confirmed events and label fields. | Use guided templates, evidence-linked progress, target/limit semantics, and a saved weekly snapshot. | Web is sufficient. | Make weekly goals the first productized Phase 2 slice. | Social challenges and adaptive goals. |
| Long-term goals | Show directional progress over weeks without guilt. | Fixed-duration current-versus-previous comparisons exist. | Ingredient aliases and confirmed event data are reused. | Baselines may be sparse; no pause, archive, completion, or stable period history. | Setup is form-heavy and the Trends tab exposes event rows instead of a narrative. | Reliable comparisons require consistent event capture over multiple periods. | Require a minimum evidence threshold, show baseline quality, and generate deterministic trend cards. | Web is sufficient. | Follow weekly-goal productization with period snapshots and evidence thresholds. | Predictive coaching. |
| Flexible allowances | Let occasional choices fit a weekly target. | Limit goals and goal-fit copy can indicate remaining room. | The engine can compare a candidate with remaining daily or weekly amounts. | There is no explicit allowance model, rollover rule, planned exception, or what-if preview. | Users cannot see how one choice changes the week before confirming it. | Requires comparable serving nutrition and a defined goal policy. | Add a pre-log scenario card: current, after this choice, room remaining, data completeness. | Web is sufficient. | Add only after target/limit semantics are stable. | Automatic budget reallocation. |
| Restaurant discovery | Find nearby or searched restaurants without manual setup. | Users create and save restaurants themselves. | Saved records can be reused and matched. | There is no external place catalog, autocomplete, hours, branch identity, or regional discovery. | A blank restaurant form is the starting point. | Place APIs have cost, caching, attribution, and region-coverage constraints. | Server-side place search, recent/saved places first, provider place ID storage, and manual fallback. | Foreground discovery works on web; background discovery does not. | Pilot one place provider after weekly goals are productized. | Multi-provider worldwide fusion. |
| Restaurant comparison | Compare relevant options against goals. | Deterministic goal-fit analysis ranks saved menu items. | Today's totals, Profile alerts, and known nutrients are considered. | It only compares manually saved items and does not normalize serving or menu versions. | The result follows a long data-entry form instead of appearing as the main decision surface. | Official menu nutrition and ingredients have fragmented coverage. | Start from a selected restaurant, retrieve or import menu evidence, then show three comparable options with source labels. | Web is sufficient for foreground use. | Build on verified menu data, not generic food estimates. | Full-chain menu coverage. |
| Menu-item matching | Match receipt/menu text to a specific item and version. | Token-based fuzzy matching against local saved menu items. | Deterministic candidates and confidence exist. | No chain alias set, modifier model, size normalization, regional version, or menu date. | The user must create both sides of the match first. | OCR text and provider naming differ; first-party menus lack a common API. | Normalize chain, branch, locale, item, size, modifiers, and effective date; require confirmation below high confidence. | Web is sufficient. | Add match metadata and candidate review when production OCR is introduced. | Fully automatic modifier interpretation. |
| Fast-food decision support | Help a user choose realistically rather than ban a category. | Goal-fit copy and quick-service weekly limits exist. | The tone is nonjudgmental and can use daily/weekly context. | Candidate quality is limited to saved items and manually entered values. | The value appears after setup instead of at decision time. | No dependable universal menu ingredient source. | Surface recent restaurant, three verified candidates, after-choice goal impact, and one-tap confirmation. | Foreground web works; proactive arrival prompts require native context. | First productize manual/search-driven decisions. | Automatic arrival-triggered menu suggestions. |
| Receipt capture | Turn a receipt image into reviewable evidence. | File capture, local preview, optional text extraction, and stored review metadata exist. | Original images are not silently uploaded or persisted. | The image is mostly a gateway to a text box. | Capture, extraction, correction, and confirmation are not distinct stages. | Browser OCR varies sharply by device. | Use a four-state pipeline: capture, process, review rows, confirm matched entities. | Camera/file capture works on web. | Select and benchmark a server OCR provider with local fallback. | Automatic logging without review. |
| Receipt OCR | Extract merchant and item lines reliably. | TextDetector when available, otherwise pasted/manual text; deterministic parsing. | Failures retain a manual path. | TextDetector is not a dependable cross-browser production dependency. | No crop/rotate/contrast controls, per-line confidence, or retry guidance. | Receipts can be faded, multilingual, crumpled, and structurally diverse. | Client image cleanup plus server receipt/document OCR; keep raw OCR and parsed fields separate. | Web capture works; local OCR may be CPU-heavy. | Benchmark Google Document AI, Textract, Azure, Mindee, and Tesseract on representative receipts. | Continuous receipt ingestion. |
| Food-photo recognition | Suggest likely foods from a photo. | Photo is retained only as manual-review evidence. | It does not invent dishes or nutrition. | No model or candidate ranking exists. | Users receive little value after selecting the photo. | Visual appearance cannot establish recipe, portion, ingredients, or nutrition. | Return candidate dish labels and a portion prompt, then match verified references; never auto-log. | On-device custom models require native delivery for best performance. | Defer until receipt/menu flows provide better evidence. | Exact nutrition from appearance. |
| Nutrition-board capture | Convert posted menu nutrition into structured items. | It shares the generic capture/text review path. | The user can preserve and correct text. | No table detection, column alignment, serving/unit parser, or item grouping. | A dense board becomes one text area. | OCR must preserve layout and units. | Use document-layout OCR, table extraction, row confidence, and visual alignment review. | Web capture is sufficient; processing is server-side. | Include in the OCR benchmark corpus, separate from receipts. | Automatic publishing to a shared menu catalog. |
| Grocery receipt capture | Match purchased packaged products and produce behavior events. | Generic receipt review and manual item confirmation exist. | Confirmed items can become evidence. | No GTIN, store catalog, quantity, weight, or product-index reconciliation. | The user must repair most abbreviated lines. | Receipt names rarely include barcodes; store catalogs are proprietary. | Match high-confidence lines to the existing product index and ask for barcode scans for unresolved items. | Web is sufficient. | Productize only after generic receipt review is stable. | Loyalty-account imports. |
| Location permission | Ask only when a contextual action needs location. | Explicit one-time getCurrentPosition call. | Clear opt-in and no hidden continuous tracking. | No staged education, accuracy handling, or permission recovery flow. | Denial and unavailable states are functional but not strongly guided. | Browser policies differ and HTTPS is required. | Explain value before the system prompt, accept approximate location, and offer saved/manual place fallback. | Browser geolocation is foreground and permission-gated. | Keep the current foreground model while improving permission UX. | Requesting background location on first use. |
| Place matching | Identify a saved place from coordinates. | Haversine distance against user-saved coordinates and radius. | Deterministic, private, and transparent. | No accuracy-radius propagation, branch identity, dwell time, or competing-place resolution. | The user must manually create every coordinate. | GPS can be inaccurate indoors and dense venues overlap. | Combine location accuracy, candidate distance, place type, recent confirmation, and explicit user choice. | Reliable background matching requires native services. | Add accuracy-aware foreground candidate ranking. | Passive all-day place graph. |
| Gym visit confirmation | Count an activity event after user confirmation. | Saved gym place plus one-time check and confirmed activity. | No visit is logged merely from proximity. | No dwell duration, workout integration, or duplicate explanation. | Confirmation is buried in the Places flow. | Location alone cannot prove exercise. | Show a single confirm card with time/place and an optional duration; keep "visited" separate from "worked out." | Passive detection requires native geofencing or health-platform integration. | Preserve explicit confirmation and improve evidence copy. | Automatic workout credit. |
| Restaurant visit confirmation | Create a visit context without auto-logging food. | Saved restaurant place plus explicit confirmation and duplicate prevention. | Visit and meal are separate concepts. | Place entry is manual and a visit has little follow-up value unless menu records exist. | Confirmation does not smoothly lead to Compare, Capture receipt, or Dismiss. | Branch identity and visit timing are uncertain. | After confirmation show three next actions: compare options, capture order, no meal. | Passive arrival detection requires native geofencing. | Connect confirmed visits to the restaurant decision flow. | Automatic meal inference. |
| Grocery visit confirmation | Offer scan-before-checkout behavior support. | Saved grocery place and confirmed activity can count toward a goal. | It can support a grocery-scan goal. | No shopping session, list, basket, or receipt linkage exists. | A confirmed visit ends without a useful action sequence. | Place identity does not reveal purchases. | Start a temporary shopping session that groups scans and optionally closes with receipt review. | Passive arrival requires native geofencing. | Defer until goals and receipt confirmation are productized. | Retailer cart integrations. |
| Contextual nudges | Offer low-frequency, goal-aware next steps. | Freshness, cooldown, dismissal, place, and goal rules exist. | Duplicate and stale nudges are constrained. | Rule coverage is small and only as good as manually confirmed context. | Nudges do not always lead directly into a task. | There is no background event stream in the web app. | Every nudge should have evidence, one action, cooldown reason, and measurable outcome. | Background context needs native events; web push needs server delivery and opt-in. | Productize in-app nudges after goal evidence is trustworthy. | Generative coaching. |
| Notifications | Reach the user outside the current screen. | Optional browser Notification calls from active app logic. | Permission is not forced. | No service worker push subscription, scheduling backend, or delivery receipts. | Permission can be requested before enough value is demonstrated. | Browser and iOS Home Screen support vary. | Ask after a user creates a goal; support Web Push for installed/compatible apps; use native local/push later. | iOS Web Push requires a Home Screen web app and a user gesture. | Defer full notification delivery until the nudge model is validated in-app. | High-frequency reminders. |
| Rewards | Reinforce useful behavior without gamification pressure. | No real reward system; supportive copy is the nearest foundation. | The roadmap avoids guilt. | There is no reward definition, audit trail, or accessibility treatment. | Adding badges now would distract from weak core flows. | Requires reliable confirmed events to avoid false credit. | Use restrained completion acknowledgments and weekly recap milestones, not points or streak penalties. | Web is sufficient. | Defer until goals have stable history. | Social leaderboards and currency. |
| Trends | Explain change across meaningful periods. | Long-term current-versus-previous calculations and a recent activity list. | Confirmed events can be aggregated. | There are no stable period snapshots, minimum sample rules, or drill-down. | Raw event rows look like logs, not insight. | Missing nutrition and inconsistent capture bias the trend. | Show at most three evidence-backed cards with period, sample size, completeness, and source events. | Web is sufficient. | Productize after weekly history exists. | Predictive forecasting. |
| Behavior insights | Turn events into a useful explanation and next action. | A few deterministic long-term comparisons exist. | No AI is needed for basic summaries. | Insight selection, significance, confidence, and action mapping are undeveloped. | Users must interpret counters themselves. | Sparse or selectively logged data can mislead. | Require minimum evidence, compare like periods, disclose missingness, and link one next action. | Web is sufficient. | Build deterministic insight rules after trend snapshots. | Open-ended AI coaching. |
| Profile personalization | Apply allergies, avoid lists, watchlists, diet preferences, and goals. | Goal-fit analysis reuses current Profile alerts and Today's Plate goals. | Existing alias-aware alerts remain separate from the general product score. | Restaurant and capture flows expose only a subset of preferences and uncertainty. | Personal relevance is not consistently summarized at decision time. | Ingredient/menu data may be absent or provider-limited. | Show "based on available data" alerts with a direct label-completion action. | Web is sufficient. | Reuse one shared personal-alert result in all Phase 2 decisions. | Personalized medical advice. |
| Label Watch integration | Carry watched ingredients into restaurant and capture decisions. | There is no separate Label Watch product, but Profile watchlist and ingredient aliases are reused. | Known ingredient aliases can match. | It only works when ingredient text is present and confirmed. | The user cannot see whether a no-alert result means absent or unknown. | Restaurant ingredient coverage is poor. | Display checked, matched, and missing-label states separately; never call missing evidence clear. | Web is sufficient. | Formalize the existing watchlist as the shared integration contract. | Crowdsourced restaurant ingredient claims. |
| Better Matches integration | Suggest a comparable choice using product and personal signals. | Better Matches exists for products; Phase 2 separately ranks saved restaurant menu items. | Both are deterministic and avoid invented candidates. | They use separate candidate pools and explanations. | Restaurant comparisons do not feel like the familiar Better Matches experience. | Comparable restaurant items require menu data, region, size, and serving normalization. | Share comparison metadata and copy while keeping product and menu candidate retrieval separate. | Web is sufficient. | Integrate the presentation after verified restaurant candidates exist. | Cross-restaurant recommendation marketplace. |
| Local persistence | Keep context features useful for guests and offline use. | Versioned localStorage state, caps, sanitation, merge rules, and tombstones. | Local-first operation and deletion protection are strong foundations. | One large state object is difficult to migrate, query, or recover selectively. | Sync and storage state are not always visible at the moment of action. | Browser storage can be evicted and has quota limits. | Add schema migration tests, export versioning, storage health, and smaller logical stores before image persistence. | Browser storage is not durable backup. | Harden migrations during the first productization slice. | Offline media archive. |
| Cloud synchronization | Preserve compatible state across signed-in devices. | Optional Supabase phase2_state JSONB row with RLS and conservative merge. | Missing configuration or table degrades to local-only mode. | Whole-state merging limits analytics and can create coarse conflicts. | Sync status lacks field-level conflict explanation. | Server timestamps, offline edits, and tombstone retention need policy. | Keep local source of responsiveness, add revision metadata and normalized event tables only when cross-device value justifies them. | Network is optional; offline must remain viable. | Do not redesign sync until the goal event schema stabilizes. | Real-time collaborative state. |
| Privacy controls | Make location, receipts, meals, and sync controllable. | Export and targeted deletion controls, receipt text retention, tombstones, and opt-in location/notifications. | No silent image upload or automatic meal log. | Retention periods, third-party processing disclosures, and account-deletion flow are incomplete. | Controls are distributed rather than shown before sensitive actions. | External OCR/place providers receive data when introduced. | Use just-in-time consent, local processing by default, per-artifact retention, provider disclosure, and a privacy ledger. | Native permissions add OS-level settings. | Define data classes and retention before any server OCR pilot. | Advertising or location analytics. |
| Source provenance | Explain where restaurant, nutrition, OCR, and place facts came from. | Meals store confidence and source notes; confirmed menu and published nutrition ranks exist. | The model distinguishes several evidence types. | Provenance is mostly free text, not field-level structured metadata. | Users cannot inspect which value came from which source or date. | Providers have different licensing and effective dates. | Store source ID, field path, retrieved date, locale/region, version, and user override separately. | Web is sufficient. | Add a field-level evidence envelope before external menu/OCR data. | Public evidence graph. |
| Confidence handling | Prevent estimates from looking exact. | Ranked confidence levels, partial nutrition handling, and explicit confirmation exist. | Missing values remain missing. | Confidence is record-level and coarse; match, OCR, nutrition, and ingredient certainty can differ. | Labels are not consistently actionable. | APIs may omit confidence or return several candidates. | Use independent identity, extraction, field, and match confidence; map each to prefill, confirm, candidate, or unknown behavior. | Web is sufficient. | Standardize the confidence contract before provider integration. | One opaque confidence score. |
| Mobile UI | Make Phase 2 feel like a consumer product. | Four tabs in a Goals & Places hub; responsive cards and fixed bottom navigation. | No horizontal overflow at 360 or 393 widths. | Core paths are still long forms and card stacks. | Repeated labels, full-time setup forms, long vertical scroll, and weak action hierarchy. | Better data will not fix entry burden by itself. | Default to summaries, use bottom sheets for creation/editing, show recent/saved entities, and reveal fields only when needed. | Small screens and Safari controls constrain vertical space. | Redesign only the selected first slice, not all four tabs at once. | Tablet/desktop-specific layouts. |
| Animation/smoothness | Explain state changes and keep interactions responsive. | Existing Ziya motion patterns and local state updates are available. | Local actions can update immediately. | Phase 2 has few explicit loading, extraction, confirmation, or progress transitions. | Abrupt card insertion and long form changes make the flow feel assembled. | External OCR/place latency will increase perceived delay. | Use short transform/opacity transitions, skeletons, optimistic local writes, visible processing stages, and reduced-motion fallbacks. | Browser background tasks are limited. | Add motion only inside the productized slice. | Decorative page transitions. |
| Accessibility | Keep goals and context usable without color or precise gestures. | Semantic controls and readable copy exist in parts of the app. | Mobile tap targets are generally usable. | Phase 2 lacks a documented focus order, live progress announcements, error summary, and extraction-review keyboard path. | Dense forms increase cognitive and screen-reader burden. | Third-party maps and camera/OCR interfaces may have their own gaps. | Add labels plus text states, 44px targets, focus restoration for sheets, live regions for processing, and contrast/reduced-motion tests. | Mobile browser and native accessibility differ. | Include accessibility acceptance criteria in every phase. | Voice-first logging. |

## 4. Product Principles

1. **Confirmed events over inferred behavior.** Proximity is not a visit, a visit is not a meal, and a photo is not nutrition.
2. **Missing is not zero and unknown is not absent.** Every aggregate must retain completeness metadata.
3. **One decision at a time.** The default screen shows status and one useful next action; forms live in focused sheets.
4. **Daily, weekly, and long-term views share evidence.** They must not create competing logs or totals.
5. **Support, do not moralize.** A choice may fit a plan while still carrying a sodium, sugar, or ingredient caveat.
6. **Local-first and reversible.** Guest use, export, deletion, and offline access remain first-class.
7. **Provider data is evidence, not truth.** Preserve source, date, region, version, and user correction.
8. **Automation earns trust.** Start with suggestions and confirmation; only automate stable, observable tasks.
9. **Platform honesty.** Foreground browser capability must not be marketed as background native behavior.
10. **Depth before breadth.** Productize one connected loop before opening another provider or feature family.

## 5. UX Architecture

### 5.1 Information architecture

Keep the existing five-item bottom navigation unchanged. Phase 2 remains a secondary destination from the current Top/Overview area and connects back to Today's Plate, Profile, product reports, and Better Matches.

The hub should eventually present four concise views:

- **This week:** progress, room remaining, evidence completeness, and one add/edit action.
- **Places:** saved/recent place cards and a foreground Check nearby action.
- **Capture:** a focused capture launcher and review queue, not an OCR form.
- **Trends:** up to three evidence-backed changes and a period selector.

Setup forms should be sheets or edit states. They should not remain expanded under every summary.

### 5.2 Improved goal flow

Current:

goal type -> several manual fields -> save -> counter card

Productized:

starter templates -> choose target or limit -> review what counts -> save -> immediate progress with source events -> edit, pause, or archive in a secondary sheet

Loading is local and immediate. Empty state offers three recommended templates. A failed cloud sync keeps the local save and shows a quiet Local only state. Partial data opens an explanation of which events or nutrient fields are missing.

### 5.3 Improved restaurant flow

Current:

restaurant form -> place type -> menu item -> source -> ingredients -> six nutrient fields -> analyze -> optionally log

Productized:

recent/saved/search restaurant -> retrieve or select menu evidence -> choose likely item and modifiers -> show goal fit, personal alerts, source, and confidence -> user confirms serving -> one-tap Today's Plate log -> weekly progress updates

Loading uses restaurant and menu skeleton rows. Provider failure falls back to saved/manual records. Low-confidence matches show candidates. Missing menu data offers Capture menu, Scan receipt, or Enter item. No uncertain item is logged without confirmation.

### 5.4 Improved receipt flow

Current:

capture type -> file -> text area -> review detected items

Productized:

capture/import -> crop and retake -> processing stages -> extracted merchant and item rows -> per-row match and confidence -> edit unresolved rows -> review nutrition source -> confirm selected items -> log

The image remains visible during review. OCR failure keeps the image and offers Paste text or Enter items. A network failure preserves a local pending review. Closing an unfinished review asks whether to keep the draft.

### 5.5 Improved location flow

Current:

create saved place -> request location -> distance match -> confirm visit

Productized web:

explain one-time check -> system permission -> ranked nearby saved/place-provider candidates with accuracy -> user selects or rejects -> context card -> explicit action such as Compare options or Confirm visit

Denied permission offers Search place or Choose saved place. A timeout offers Retry with lower accuracy. No place match offers Save this place without forcing it.

### 5.6 Improved trend flow

Current:

long-term setup form -> recent raw event list

Productized:

period summary -> no more than three supported insights -> evidence and completeness -> tap for contributing events -> one optional next action

An empty state explains what to log, not that the user has failed. Insufficient evidence produces "Not enough confirmed data yet" rather than a directional claim.

### 5.7 Motion and responsiveness

- Use 180-280ms transform and opacity transitions for sheets, confirmation rows, and progress changes.
- Use skeletons only for external retrieval, not for synchronous local calculations.
- Apply optimistic local updates, then show a compact sync state; never make local success wait for cloud.
- Animate a progress bar from its previous value to its new value, with a text announcement and a reduced-motion immediate state.
- Keep extraction stages visible: Preparing image, Reading text, Matching items, Ready to review.
- Preserve focus when a sheet closes and return to the originating card.
- Never use looping celebration, guilt animations, or motion that shifts the fixed bottom navigation.

## 6. Weekly Goals

### 6.1 Product role

Weekly goals are the best immediate Phase 2 opportunity because they can create value from systems Ziya already has: Today's Plate, scans, Profile alerts, saved context events, and local persistence. They do not require a new external provider.

### 6.2 Goal model

Every goal needs these explicit properties:

- **Metric:** what is counted, summed, averaged, or checked.
- **Direction:** target at least, limit at most, average limit, or consistency count.
- **Period:** local week start, local timezone, and immutable start/end dates.
- **Evidence rule:** which event types and fields count.
- **Completeness rule:** what missing events or fields prevent a full conclusion.
- **Status:** draft, active, paused, completed, archived.
- **Target:** numeric value and unit.
- **Allowance behavior:** none in V1; later, an explicit planned allowance rather than hidden rollover.
- **Snapshot:** target and rule version preserved with each completed week.

Recommended starter goals:

- Hit protein goal on 5 days.
- Stay under a weekly average sodium target.
- Limit quick-service meals to 2.
- Go to the gym 3 times.
- Avoid a selected ingredient for 14 days.
- Choose a lower-sugar option twice.
- Scan groceries before checkout 3 times.

### 6.3 Honest status semantics

A limit goal at zero activity is not automatically "completed." Before enough evidence exists, show **No confirmed entries yet**. Distinguish:

- **On track:** enough evidence exists and the current trajectory remains within the target.
- **Room left:** a limit has remaining allowance.
- **Close to limit:** a configured threshold such as 80 percent is reached.
- **Target reached:** a minimum target has been met.
- **Partial data:** relevant entries exist, but at least one lacks the needed field.
- **Not enough data:** no supported conclusion can be made.

For nutrient goals, the calculation must reference the same normalized values used by Today's Plate. A product with missing sodium cannot silently contribute zero sodium. For a weekly average, expose both known-day average and missing-day count.

### 6.4 Productized screen

The default This week screen should contain:

1. A compact week header with previous/current week navigation.
2. A two-line summary using confirmed evidence.
3. One card per active goal with value, target, status, completeness, and a short next step.
4. One Add goal action.
5. A collapsed Completed or paused section.

Tapping a card opens:

- progress by day,
- the events that contributed,
- missing-evidence explanation,
- Edit, Pause, Archive,
- and supportive what-if copy for a candidate choice when available.

The creation flow should be a bottom sheet with template selection first. Advanced fields appear only after choosing Custom.

### 6.5 Persistence and synchronization

Store immutable weekly snapshots separately from active goal definitions. A goal edit affects the current and future period only. Local writes remain immediate. Sync conflicts use the latest goal definition revision but never rewrite completed snapshots.

## 7. Long-Term Goals

Long-term goals should use stable weekly snapshots, not recompute history from whatever current goal settings happen to be.

### 7.1 Minimum viable model

- A selected metric and direction.
- A baseline period with an evidence count and completeness score.
- A target period such as 14, 30, or 56 days.
- Current result, previous comparable result, and the difference.
- Pause, archive, completion, and restart.
- A minimum evidence threshold before a trend is stated.

### 7.2 Suitable goals

- Reduce soda events over 30 days.
- Reduce quick-service visits over 8 weeks.
- Avoid a selected ingredient for 14 days.
- Improve protein-goal consistency.
- Improve average documented grocery product score.
- Reduce confirmed high-sugar snack events.
- Build a confirmed gym-visit routine.

Ingredient avoidance is only supported when the relevant product or meal has an ingredient label. Unknown ingredient data is not compliance.

### 7.3 Feedback model

A long-term card should say what changed, over which dates, and from how many confirmed events. It should not infer causation. Example:

> Quick-service meals decreased from 6 to 4 across comparable four-week periods. Based on 10 confirmed visits.

If one period has substantially less evidence, show **Comparison not ready**. A user can inspect contributing events and delete or correct them.

## 8. Restaurant Intelligence

### 8.1 Entity model

Keep these entities separate:

- **Place:** a branch with provider place ID, coordinates, region, and provider source.
- **Restaurant brand:** a chain or independent identity.
- **Menu edition:** restaurant, region, effective date, locale, and source.
- **Menu item:** canonical name, size, variant, modifiers, and source.
- **Nutrition fact:** field, value, unit, basis, source, retrieved date, and confidence.
- **Ingredient/allergen statement:** raw text, normalized terms, source, locale, and date.
- **User meal:** the confirmed item, modifiers, serving, time, and copied evidence snapshot.

A provider place record must not be treated as a menu source. A generic nutrition match must not be presented as restaurant-published data.

### 8.2 Discovery pipeline

1. Show recent and saved restaurants first.
2. If the user searches, call a server-side place endpoint with region/language context.
3. Store the provider's stable place ID and only the fields licensing permits.
4. Resolve the place to a restaurant brand without collapsing independent branches incorrectly.
5. Search a curated first-party menu registry for that brand and region.
6. If no menu exists, offer Capture menu, Scan receipt, or Enter item.
7. Keep manual restaurant creation as the offline and unsupported-region fallback.

For Morocco and French-market support, provider choice must be validated with a test set across Casablanca, Rabat, Marrakesh, Tangier, and smaller cities. Marketing claims cannot rely on provider documentation alone.

### 8.3 Menu and nutrition hierarchy

Use, in order:

1. Current restaurant-published nutrition or ingredient disclosure for the exact item, size, region, and effective date.
2. A licensed restaurant/menu provider record with matching identity and version.
3. User-confirmed receipt or menu-board match linked to a documented source.
4. USDA or other generic reference only as an explicitly estimated fallback for a generic food, never as exact restaurant truth.
5. Manual user entry.

Nutritionix, Edamam, or another commercial food database may improve coverage, but each requires a legal, caching, attribution, cost, and region review before production selection. No provider should silently replace a current first-party statement.

### 8.4 Decision flow

The result should lead with:

- item identity and serving,
- source and update date,
- current-day fit,
- weekly fit,
- personal alerts based on available label data,
- two or three comparable alternatives from the same restaurant,
- and one Confirm and log action.

Unknown ingredients, allergens, cooking oil, or nutrition remain visibly unknown. Preparation notes such as common cooking oils require an official ingredient disclosure or a clearly labeled user-provided source. Do not infer them from cuisine or item name.

### 8.5 Restaurant-specific confidence

Maintain separate confidence for:

- place identity,
- menu item identity,
- modifiers,
- serving size,
- each nutrition field,
- ingredients/allergens,
- and match to a receipt or image.

A single "Verified" badge is insufficient. The UI can summarize the lowest decision-critical confidence and let the user inspect the evidence.

## 9. Receipt and Capture Intelligence

### 9.1 Capture pipeline

1. **Choose evidence type:** restaurant receipt, grocery receipt, menu, order screen, nutrition board, takeout label, or food photo.
2. **Acquire:** camera or file import, with consent copy before any upload.
3. **Preprocess locally:** orientation, crop, perspective correction, resize, and contrast preview.
4. **Extract:** local OCR when practical or an explicitly disclosed server OCR endpoint.
5. **Structure:** merchant, date, line items, quantity, price, and layout cells where supported.
6. **Match:** place, restaurant, menu item, or known product candidates.
7. **Review:** image beside extracted rows, per-row confidence, edit and unmatched state.
8. **Retrieve evidence:** menu/product nutrition and ingredients from appropriate sources.
9. **Confirm:** the user selects what was actually consumed or purchased.
10. **Log:** copy the confirmed evidence snapshot into Today's Plate or a behavior event.
11. **Retain or delete:** follow the user's chosen image and text retention policy.

### 9.2 OCR is not nutrition

OCR only establishes text candidates. It does not prove:

- that the user consumed an item,
- the portion consumed,
- the exact menu edition,
- preparation or substitutions,
- nutrition,
- ingredients,
- or allergens.

High OCR confidence may prefill text. It never bypasses item confirmation.

### 9.3 Review states

- **Processing:** stage label and Cancel.
- **Ready to review:** parsed rows with source image alignment.
- **Needs attention:** low-confidence or unmatched rows first.
- **Provider unavailable:** preserve a local draft and offer retry or manual text.
- **No readable text:** retake guidance, crop, Paste text, or Enter items.
- **Confirmed:** show exactly what will be logged before final action.

### 9.4 Food photos

Food image recognition is a candidate generator only. It may suggest likely dishes and portion prompts. A user must choose a candidate or enter a name, then Ziya retrieves a separate nutrition reference. Visual output never becomes exact nutrition directly.

## 10. Location and Context System

### 10.1 Current web stage

The current web app should keep:

- explicit one-time foreground checks,
- HTTPS and permission feature detection,
- user-saved or searched places,
- accuracy-aware candidate ranking,
- explicit confirmation,
- duplicate and cooldown protection,
- no automatic meal logging,
- and local delete controls.

Do not run watchPosition continuously merely to imitate background context. It consumes power and stops being reliable when the page is suspended.

### 10.2 Installed PWA stage

A PWA may improve installability, offline shell behavior, app identity, and push support. It does not create a dependable cross-platform background geofence API. Web Push can deliver server-originated notifications to supported user agents; on iOS and iPadOS it applies to Home Screen web apps and permission must follow direct user interaction.

A PWA can support:

- foreground location checks,
- saved places and cached context,
- service-worker Web Push where supported,
- offline queueing,
- and a clear install state.

It should not promise:

- region entry events while closed,
- continuous location history,
- scheduled local notifications with native reliability,
- or background OCR processing.

### 10.3 Capacitor/native wrapper stage

A Capacitor shell can reuse the web UI while adding native plugins or custom native code. The official Capacitor Geolocation plugin does not directly support background geolocation. Native geofencing therefore requires a vetted native/community plugin or custom Swift/Kotlin integration.

A wrapper can add:

- native permission surfaces,
- native local and push notifications,
- iOS Core Location and Android Geofencing integrations,
- controlled background events,
- native secure storage,
- and on-device ML models.

Capacitor Background Runner is event-based and OS-scheduled, not a persistent JavaScript process. The OS can delay or kill work.

### 10.4 Native safeguards

- Ask for When in Use first.
- Request background or Always access only after a user explicitly enables arrival prompts and understands the benefit.
- Monitor only selected places, not every nearby restaurant.
- Prefer dwell events and conservative radii to reduce drive-by false positives.
- Confirm gym, restaurant, and grocery visits before counting them.
- Show and delete location-derived events separately.
- Stop monitoring immediately when the feature is disabled.
- Respect iOS and Android store policies, battery limits, and system indicators.

## 11. Nudges and Rewards

### 11.1 In-app first

Validate nudge usefulness inside the app before building background delivery. Each nudge needs:

- a source event,
- a goal or preference connection,
- a freshness window,
- a cooldown key,
- one primary action,
- dismiss and disable controls,
- and an outcome event such as opened, acted, dismissed, or expired.

A nudge should not be generated from missing or low-confidence evidence.

### 11.2 Delivery stages

1. **In-app cards:** current implementation, expanded with action routing and outcome metrics.
2. **Web Push:** opt-in after demonstrated value; server subscription and service worker required.
3. **Native local/push:** for scheduled or geofence-triggered behavior after a native wrapper exists.

Notifications must not imply that Ziya saw a meal merely because the user entered a restaurant. Suggested context copy should ask, not declare.

### 11.3 Rewards

V1 rewards are restrained acknowledgments:

- goal reached,
- consistent week,
- confirmed improvement versus a complete baseline,
- or a helpful choice made.

Do not add points, punitive streak loss, leaderboards, or cash-like rewards until confirmed-event quality and long-term retention justify them.

## 12. Trends and Insights

### 12.1 Event foundation

Every trendable event should include:

- stable ID,
- event type,
- local and UTC timestamp,
- local date and timezone,
- source entity IDs,
- source and confidence envelope,
- relevant normalized fields,
- user-confirmed flag,
- correction and deletion metadata,
- and goal links.

Raw evidence remains separate from the confirmed event.

### 12.2 Trend rules

A trend may be stated only when:

- periods are comparable,
- the sample threshold is met,
- the metric basis is stable,
- completeness is displayed,
- and deleted/corrected events are respected.

Do not compare a fully logged week with a sparsely logged week as if the difference were behavior.

### 12.3 Insight card anatomy

- Plain-language change.
- Date range.
- Value before and after.
- Number of supporting events or complete days.
- Completeness label.
- Tap for supporting events.
- One optional action.

Examples:

> Your quick-service visits are down from 6 to 4 across comparable four-week periods.

> Protein-goal data is complete for 4 of 7 days. Log the remaining days before comparing this week.

No chart is required for V1. A compact bar or two-point comparison is enough.

## 13. Better Matches Integration

The existing Better Matches product engine and the restaurant goal-fit engine should share principles, not merge unlike data.

For product scans:

- candidates continue to come from the existing product index, history, and search caches;
- category comparability and known data remain mandatory;
- Profile alerts and Today's Plate pressure can explain ranking.

For restaurants:

- candidates must be menu items from the selected restaurant or a clearly labeled nearby comparison;
- item, size, modifiers, region, and menu edition must be comparable;
- nutrition and ingredient gaps lower confidence rather than improve ranking.

Shared output shape should include candidate, comparison basis, reasons, caveats, provenance, and confidence. Shared copy can say **Better fit for your current goals**. It must not say safe, healthy, or allergen-free.

## 14. Today's Plate Integration

Today's Plate remains the only daily nutrition log. Phase 2 must not create a second meal total.

A confirmed restaurant or receipt item should use the same serving normalization and known-field behavior as packaged food. Before logging, show:

- item and source,
- serving or grams/milliliters,
- known nutrient contribution,
- missing fields,
- current daily total,
- projected daily total,
- weekly goal impact,
- and personal alerts.

Scanning, visiting, photographing, or matching does not equal consuming. Logging always requires an explicit final action.

Weekly goals read Today's Plate entries through a stable event contract. They do not recalculate nutrition from current provider data after a historical item has been logged.

## 15. Profile Integration

Phase 2 reuses the existing Profile and ingredient intelligence; it must not create another preference store.

Relevant signals:

- allergies,
- avoided ingredients,
- watchlist ingredients,
- dietary preferences,
- low-sugar and low-sodium preferences,
- selected language and unit system,
- Today's Plate goals,
- and user corrections.

Decision output distinguishes:

- **Allergy alert:** a clear match in available source-backed label data.
- **Avoid list:** a normalized alias match.
- **Watchlist:** informational.
- **May not match preference:** a conservative diet-rule conflict.
- **Not enough data to check:** label or nutrition fields are missing.

A no-match state is not a safety statement. Restaurant and receipt views must link directly to the evidence or missing-label action that produced the result.

## 16. API and Data-Source Strategy

Research status: official documentation reviewed on 2026-07-17. Prices, quotas, licensing, and product names can change; verify them again before procurement or launch. Coverage claims must be tested with a representative Ziya dataset, especially Morocco, French-language menus, Arabic receipts, and regional restaurant variants.

### 16.1 Selection rules

- Keep secret keys and billable provider credentials server-side.
- Cache only fields and durations explicitly allowed by the provider.
- Record provider, source URL or identifier, retrieval date, locale, region, and licensing class.
- Use request coalescing, normalized cache keys, and rate-limit protection.
- Prefer first-party restaurant/package evidence over generic databases.
- Use manual and local-first fallbacks when a provider is unavailable.
- Run a benchmark before selecting an OCR, place, menu, or image-recognition vendor.
- Do not expose provider availability as a user guarantee.

### 16.2 Place and restaurant discovery

| Provider | Purpose | Official source | Coverage | Authentication | Cost/pricing model | Rate limits | Commercial-use considerations | Data freshness | Key strengths | Weaknesses | Privacy concerns | Frontend or server-side | Recommended role | Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Google Places API | Place search, autocomplete, details, branch identity | [Usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing), [policies](https://developers.google.com/maps/documentation/places/web-service/policies) | Broad international coverage; validate local branch quality in Morocco | API key with billing and platform restrictions | Pay as you go by SKU; requested fields can change the billed SKU | Per-method quotas configured in Google Cloud | Attribution, logo, privacy policy, and storage rules apply; most content cannot be freely prefetched or retained, while place IDs are exempt | Frequently updated commercial place catalog | Strong global identity, autocomplete, and branch details | Cost can grow with details and autocomplete; restrictive caching | Location query and user context reach Google | Server-side web service or restricted client SDK as policy permits | **Recommended later** for a quality-focused global pilot after cost controls | Saved/manual places; another licensed place provider |
| Foursquare Places | Place search, autocomplete, categories | [Upcoming API changes](https://docs.foursquare.com/developer/reference/upcoming-changes), [autocomplete](https://docs.foursquare.com/fsq-developers-places/reference/autocomplete), [rate limits](https://docs.foursquare.com/fsq-developers-places/reference/rate-limits) | Global POI catalog; Morocco quality must be benchmarked | Bearer API key and version header | New pricing announced for 2026; documentation describes 500 free Pro calls before CPM tiers; verify the current plan | Product-specific account limits; autocomplete session tokens affect billing | Terms, attribution, storage, and new 2026 migration requirements need legal review | Provider-managed | Detailed categories and session-aware autocomplete | Legacy V3 deprecation and pricing transition increase integration risk | Location query reaches Foursquare | Server-side | **Optional** challenger in the place benchmark | Saved/manual places |
| Yelp Places | Restaurant and business discovery | [Authentication](https://docs.developer.yelp.com/docs/places-authentication), [rate limits](https://docs.developer.yelp.com/docs/places-rate-limiting), [FAQ](https://docs.developer.yelp.com/docs/places-faq) | Strongest in supported Yelp markets; test Morocco and non-US depth | Private bearer API key | Starter tier documentation lists 300 calls per day; paid plans and higher quotas require current review | Daily and QPS limits; higher access may require review | Content caching is generally limited to 24 hours while business IDs may persist; FAQ restricts some analysis uses and requires attribution | Current business catalog | Restaurant-centric discovery, localization, ratings context | Licensing limits analysis and caching; coverage may be weak outside core markets | Search coordinates and queries reach Yelp | Server-side | **Not recommended for core behavior analysis** until licensing and Morocco coverage are confirmed | Google/Foursquare pilot or manual places |
| Mapbox Search Box and Geocoding | Address, category, and POI search; reverse geocoding | [Geocoding API](https://docs.mapbox.com/api/search/geocoding/), [temporary vs permanent](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/) | Global language-aware geocoding; POI search uses Search Box products | Access token | Usage-based; temporary and permanent storage rights differ; verify current pricing | Account and endpoint limits | Attribution and storage mode matter; permanent result storage requires the appropriate product/terms | Continuously updated | Strong map/search stack and language support | Restaurant detail/menu depth is weaker than dedicated place providers | Location query reaches Mapbox | Restricted client token for maps; server for protected workflows | **Optional** for geocoding and map display, not menu truth | Saved coordinates or Nominatim within policy |
| Public Nominatim and OpenStreetMap | Open geocoding and basic POI fallback | [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/), [tile policy](https://operations.osmfoundation.org/policies/tiles/) | Global community coverage, variable completeness | No key on public endpoint; valid app identification required | Free public service, donation-funded, no SLA | Maximum 1 request per second on public service | Attribution and ODbL apply; cache results; no autocomplete, systematic download, or heavy commercial use | Community-updated | Open data and broad geography | Public endpoint is not a production SLA and forbids common autocomplete behavior | Queries and IP reach the operated service | Server proxy with cache for modest user-triggered use, or a paid/self-hosted provider | **Recommended now only for low-volume manual geocoding experiments**, not production autocomplete | Manual coordinates or paid OSM provider |

### 16.3 Menu and nutrition data

| Provider | Purpose | Official source | Coverage | Authentication | Cost/pricing model | Rate limits | Commercial-use considerations | Data freshness | Key strengths | Weaknesses | Privacy concerns | Frontend or server-side | Recommended role | Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Restaurant first-party sources | Exact chain menu, nutrition, ingredients, allergens, and regional version | Restaurant nutrition pages, downloadable PDFs, or documented feeds | Chain and region specific | Varies; often public pages rather than a standard API | Usually no API fee, but integration and maintenance are significant | Site-specific | Permission, terms, attribution, robots rules, and redistribution rights must be reviewed per source | Best available when date and region match | Highest authority for the exact branded item | Fragmented formats, frequent layout changes, incomplete ingredient disclosure | A server fetch need not include user identity | Server-side curated connectors or manually reviewed imports | **Recommended now as source of truth** for a small curated chain set | User-provided label/menu evidence |
| Nutritionix by Syndigo | Food search, natural-language nutrition, UPC, restaurant foods | [API guide](https://docx.syndigo.com/developers/docs/nutritionix-api-guide), [endpoints](https://docx.syndigo.com/developers/docs/list-of-endpoints), [headers](https://docx.syndigo.com/developers/docs/understand-request-headers), [getting started](https://docx.syndigo.com/developers/docs/getting-started-1) | Large food database and restaurant coverage; documented region fields emphasize US/UK, so Morocco fit is uncertain | App ID, app key, and remote-user ID | Premium add-ons and commercial access; current public pricing is not sufficiently clear, so obtain a quote | Account plan limits | Attribution required; caching, display, and redistribution terms require review | Provider-managed | Natural-language input, branded and restaurant records | Commercial/licensing uncertainty and regional weakness | User query and remote-user ID reach provider | Server-side | **Optional, requires paid-service and licensing review** | First-party menu, USDA estimate, or manual entry |
| Edamam Food Database | Food, branded, restaurant/menu, barcode, and optional vision search | [Food Database API and pricing](https://developer.edamam.com/food-database-api) | Broad database with restaurant and grocery items; validate Morocco and local brands | App ID and key | Public page currently lists paid call tiers, including Basic, Core, and Plus; verify pricing and feature rights before launch | Plan-based monthly calls | Attribution and plan-specific caching/display restrictions are significant | Provider-managed | Search, nutrition, barcode, and vision in one vendor | Strict storage rules and regional data uncertainty | Queries and uploaded images reach provider when vision is used | Server-side | **Optional benchmark candidate**, requires legal review | First-party/menu evidence and USDA generic reference |
| Spoonacular | Recipe, ingredient, and food/menu reference | [Official Food API](https://spoonacular.com/food-api) | Broad recipe and food focus; restaurant/menu coverage and Morocco fit require validation | API key | Current pricing and commercial rights must be verified directly before recommendation | Plan-based | Licensing, caching, derived-data display, and production rights need review | Provider-managed | Useful recipe and ingredient utilities | Not selected because current official pricing/licensing evidence was insufficient for this audit | Queries reach provider | Server-side | **Not recommended now** pending a formal vendor review | USDA, first-party sources, manual data |
| USDA FoodData Central | Generic foods, branded-food reference, nutrient fallback | [API guide](https://fdc.nal.usda.gov/api-guide/), [data documentation](https://fdc.nal.usda.gov/data-documentation/) | US-focused reference and branded foods; not a restaurant-menu provider | API key | Public data; API key is free | Default 1,000 requests per hour per IP; DEMO_KEY is much lower | Data are public domain/CC0; attribution is requested; keep the key server-side | Branded data updated monthly; datasets have distinct update schedules | Strong nutrient reference, documented food types, stable API | US-centric, generic serving conversion, no proof of a restaurant recipe | Food query reaches USDA; no need to send user identity | Server-side | **Recommended later as an estimated generic-food fallback**, never automatic exact menu truth | Manual nutrition or no estimate |
| Open Food Facts | Packaged food product lookup, ingredients, additives, images | [Official API documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/) | International community database with variable regional completeness | Public read API; custom user agent expected | Free/open data | 15 product-read requests per minute per IP and 10 search requests per minute per IP; do not use search as typeahead, and use exports for bulk data | ODbL database and CC BY-SA image terms require attribution/share-alike review | Community-contributed and may be stale or incomplete | Already aligned with Ziya packaged products, ingredient and additive fields | Accuracy is not guaranteed; not a restaurant-menu source | Barcode/search query reaches the service | Server-side proxy/cache or compliant client read | **Recommended now for the existing packaged-product role only** | General UPC identity, manual label |

### 16.4 OCR and document extraction

| Provider | Purpose | Official source | Coverage | Authentication | Cost/pricing model | Rate limits | Commercial-use considerations | Data freshness | Key strengths | Weaknesses | Privacy concerns | Frontend or server-side | Recommended role | Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Google Cloud Vision | General text and document text OCR | [Pricing](https://cloud.google.com/vision/pricing) | Broad language OCR | Google Cloud credentials | First 1,000 feature units per month free; text/document text is listed at $1.50 per 1,000 units through 5 million, then lower tier pricing; verify region and current schedule | Project quotas | Google Cloud terms and data settings apply | Managed model | Mature OCR and language breadth | General OCR does not provide receipt semantics by itself | Receipt images are sent to Google Cloud | Server-side | **Benchmark candidate** for menu boards and multilingual text | Tesseract local OCR or manual review |
| Google Document AI | OCR, layout, custom extraction, expense parsing | [Pricing](https://cloud.google.com/document-ai/pricing), [processor list](https://docs.cloud.google.com/document-ai/docs/processors-list) | OCR supports many languages; expense parser has a narrower listed language set, so French/Arabic receipt support must be tested | Google Cloud credentials | OCR pricing is listed at $1.50 per 1,000 pages; specialized processors cost more | Project and processor quotas | Cloud terms, region, retention, and processor versioning apply | Managed processor versions | Layout, table, and expense line-item extraction | Specialized parser language coverage may not fit Morocco; custom extraction adds cost | Sensitive receipt images and text are uploaded | Server-side | **Recommended OCR benchmark candidate** | Vision OCR, manual text, local Tesseract |
| AWS Textract | Text, forms, tables, and expense analysis | [Pricing](https://aws.amazon.com/textract/pricing/) | General document OCR; language and receipt-format fit require benchmark | AWS credentials and signed requests | Detect Text listed from $0.0015 per page for the first million; Analyze Expense from $0.01 per page; verify current region pricing | Service quotas by region | AWS terms and regional data handling apply | Managed model | Expense API, tables, forms, predictable per-page billing | International receipt quality and Arabic/French semantics need testing | Receipt images are sent to AWS | Server-side | **Recommended OCR benchmark candidate** | Manual review or another OCR provider |
| Azure Document Intelligence | Prebuilt receipt, layout, and custom extraction | [Receipt model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt?view=doc-intel-4.0.0), [pricing](https://azure.microsoft.com/en-us/pricing/details/document-intelligence/), [limits](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/service-limits) | Receipt model extracts merchant, totals, and line items; language/locale support requires test | Azure key or managed identity | Region and tier pricing shown through Azure calculator; verify before selection | F0 and S0 have documented size, page, and transaction limits | Azure terms, region, and retention configuration apply | Managed model | Strong receipt schema and layout review | Numeric pricing is region-dependent; unsupported receipt styles require generic layout OCR | Images are sent to Azure | Server-side | **Recommended OCR benchmark candidate** | Manual review or local OCR |
| Mindee | Receipt/invoice OCR with line items | [Plans](https://docs.mindee.com/account-management/plans), [limits](https://docs.mindee.com/integrations/technical-limitations), [technical guidelines](https://docs.mindee.com/integrations/technical-guidelines), [receipt API](https://www.mindee.com/product/receipt-ocr-api) | Global and multilingual claims; benchmark local receipts | Secret API key | Starter plan documentation lists EUR44 per month billed annually with 6,000 pages per year and overage; verify current terms | Documentation lists processing and polling limits | Browser calls are explicitly discouraged; retention and training settings require review | Managed model | Receipt-focused schema, fast integration, trial | Smaller vendor dependency and plan limits | Receipt images are sent to Mindee | Server-side only | **Optional rapid-pilot candidate** | Tesseract/manual review |
| Tesseract.js | Local browser/Node OCR | [Official repository](https://github.com/naptha/tesseract.js/) | 100+ language models with quality variation | None | Open source, Apache 2.0; device CPU and download cost replace API cost | No service quota | Bundle/model licensing and notices apply; no external data transfer | Model packages update with releases | Privacy, offline use, no vendor request cost | CPU/memory heavy on mobile, weak receipt layout semantics, no PDF support | Can remain fully local | Frontend worker or server | **Recommended now as an optional local privacy fallback**, not sole production OCR | Manual text or server OCR with consent |

### 16.5 Food image recognition

| Provider | Purpose | Official source | Coverage | Authentication | Cost/pricing model | Rate limits | Commercial-use considerations | Data freshness | Key strengths | Weaknesses | Privacy concerns | Frontend or server-side | Recommended role | Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LogMeal | Food recognition, dish candidates, nutrition-oriented food vision | [Pricing](https://logmeal.com/api/pricing/) | Food-focused catalog; regional cuisine coverage must be benchmarked | Secret API key | Trial and credit plans; official page lists usage constraints and plan options, which must be rechecked before launch | Standard usage limits include image-per-user and per-second constraints | Commercial terms and result storage require review | Managed model | Purpose-built food recognition and candidate output | Cannot establish recipe, portion, ingredients, or exact nutrition from appearance | Food photos are uploaded | Server-side | **Recommended later as a benchmark candidate**, never auto-log | User selects dish and reference manually |
| Edamam Vision | Food image candidate search tied to its food database | [Food Database API](https://developer.edamam.com/food-database-api) | Broad food catalog; regional cuisine coverage uncertain | App ID and key | Plan/token based and subject to feature rights | Plan-based | Attribution, caching, image, and response-storage restrictions require review | Managed model | Vision and nutrition reference in one vendor | Vendor lock-in and strict plan terms | Food photos are uploaded | Server-side | **Optional later** | Manual dish search |
| Server multimodal model | Candidate labels, OCR cleanup, or menu-line grouping | Provider-specific official model and pricing documentation must be selected during a separate review | Broad visual/language capability, variable food precision | Secret server credential | Token/image based | Provider/account limits | Data-use, retention, training, and output rights require review | Model versions change | Flexible candidate generation and multilingual assistance | Non-deterministic and may hallucinate details | Images and prompt context are uploaded | Server-side | **Optional later for candidate suggestions only** | Deterministic OCR and manual choice |
| Google ML Kit plus custom model | On-device food category candidate model | [Image labeling](https://developers.google.com/ml-kit/vision/image-labeling) | General base model; food-specific quality requires a custom LiteRT model and training corpus | Native SDK setup | On-device SDK; model development and app size are the main cost | No network quota for bundled inference | Model dataset and app-store disclosures apply | Model freshness depends on app/model delivery | On-device privacy and low latency | Native-only delivery and substantial model training; general labels are not exact food identification | Can remain on device | Native app | **Requires native app; recommended later only after a validated model** | Server candidate provider or manual review |
| Apple Vision plus Core ML | On-device food category candidate model on Apple platforms | [Vision and Core ML image classification](https://developer.apple.com/documentation/coreml/classifying-images-with-vision-and-core-ml) | Apple devices; capability depends on the custom model | Native app entitlement/build | No per-call fee; model development and app distribution cost | Device-bound | Model dataset rights and app privacy disclosure apply | Bundled/downloaded model version | Strong on-device privacy and native performance | Apple-only and requires a trained food model | Can remain on device | Native iOS app | **Requires native app; optional later** | Server candidate provider or manual review |

### 16.6 Location, background work, and notifications

| Provider or API | Purpose | Official source | Coverage | Authentication | Cost/pricing model | Rate limits | Commercial-use considerations | Data freshness | Key strengths | Weaknesses | Privacy concerns | Frontend or server-side | Recommended role | Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Browser Geolocation API | One-time or foreground location | [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), [getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) | Modern browsers in secure contexts, subject to user and Permissions Policy | User permission | No API fee | Browser/OS governed | Must explain purpose and handle denial | Live device estimate | Already available, no native wrapper | Not a reliable background geofence or visit detector | Precise location is sensitive and remains available to page logic | Frontend | **Recommended now** for explicit foreground checks | Search or saved place |
| Web Push API | Server-to-service-worker push | [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [WebKit iOS Home Screen support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) | Modern browsers; iOS/iPadOS support is for Home Screen web apps from 16.4 and permission follows user interaction | User permission, push subscription, application server keys | Push service and backend costs vary | Browser push services apply their own behavior | Subscription endpoints are capabilities and must be protected; consent and unsubscribe are required | Server-triggered | Can work when app is not foregrounded | Platform-specific install/permission behavior and no location trigger by itself | Subscription endpoint and notification content are sensitive | Service worker plus server | **Recommended later** after in-app nudge validation | In-app nudges |
| Capacitor Geolocation | Native foreground location bridge | [Official plugin](https://capacitorjs.com/docs/apis/geolocation) | iOS and Android | OS permission | Open-source plugin, native development cost | OS governed | App store permission declarations required | Live device estimate | Reuses web code with native permissions | Official plugin explicitly does not support background geolocation directly | Precise native location | Native client | **Recommended later** for a wrapper's foreground location | Browser geolocation |
| Capacitor Background Runner | OS-scheduled headless JavaScript events | [Official plugin](https://capacitorjs.com/docs/apis/background-runner) | iOS and Android with platform setup | OS permissions depend on APIs used | Open-source plugin, native operations cost | OS scheduler governs execution | Background modes and store policy apply | Event-time data | Reuses JavaScript for native background events | Not persistent; OS schedules, delays, or kills work | Can process sensitive context outside the UI | Native client | **Optional support layer**, not a geofence replacement | Native Swift/Kotlin handler or foreground flow |
| Capacitor Local and Push Notifications | Native scheduled and remote notifications | [Local Notifications](https://capacitorjs.com/docs/apis/local-notifications), [Push Notifications](https://capacitorjs.com/docs/apis/push-notifications) | iOS and Android | OS permission plus APNs/FCM setup for push | No per-call plugin fee; backend and provider operations cost | OS/provider governed | Store policy, exact-alarm restrictions, consent, and unsubscribe apply | Scheduled or server-triggered | Native reliability and action handling | Platform setup and Android/iOS policy differences | Device tokens and notification content are sensitive | Native plus server for push | **Recommended with a future native wrapper** | Web Push or in-app nudges |
| Android Geofencing API | Native region entry, exit, and dwell events | [Android geofencing guide](https://developer.android.com/develop/sensors-and-location/location/geofencing), [background location](https://developer.android.com/develop/sensors-and-location/location/background) | Android devices with required services and permissions | Fine and background location permission where required | No per-call fee | Limit of 100 geofences per app/device user; background delivery can be delayed | Google Play background-location policy applies | Device/OS events | Native dwell and boundary events with battery-aware service | Latency, false positives, reboot re-registration, policy scrutiny | Background location is highly sensitive | Native Android | **Requires native app; recommended only for explicitly saved places** | Foreground check |
| Apple Core Location monitoring | Native region/condition, visit, or significant-change events | [Region monitoring](https://developer.apple.com/documentation/CoreLocation/monitoring-the-user-s-proximity-to-geographic-regions), [background updates](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background), [authorization](https://developer.apple.com/documentation/CoreLocation/requesting-authorization-to-use-location-services) | iOS/iPadOS native apps | When in Use or Always permission depending behavior | No per-call fee | Core Location limits an app to 20 monitored conditions; OS controls delivery | App Store privacy, background mode, and clear user benefit are required | Device/OS events | Native region and visit support; can wake an app for supported events | Strict limits, authorization complexity, battery and delayed delivery | Background location is highly sensitive | Native iOS | **Requires native app; recommended only after foreground value is proven** | Foreground check |

### 16.7 USDA's bounded role

USDA FoodData Central is not currently a Ziya runtime provider. If added, use a server route such as /api/nutrition/usda/search and /api/nutrition/usda/food/:fdcId.

The server should:

1. Normalize language and food terms without changing brand identity.
2. Search branded and generic datasets separately.
3. Rank exact brand/description/package matches above generic foods.
4. Return the FDC ID, data type, description, serving basis, nutrient values, publication/update metadata, and a match confidence.
5. Cache public reference records by FDC ID and normalized query, while rechecking update policy.
6. Convert servings only when mass or volume basis is explicit.
7. Label a generic match Estimated and require user confirmation.
8. Never replace a package label, restaurant-published value, confirmed menu item, or user correction.
9. Keep the API key server-side.
10. Preserve missing nutrients as missing.

### 16.8 Recommended provider decision process

Before selecting a paid provider:

- Create a de-identified benchmark corpus with at least 100 place queries, 100 receipts, 50 menu boards, and 50 food photos across English, French, and Arabic where relevant.
- Score identity accuracy, field accuracy, candidate recall, confidence calibration, latency, user correction burden, and cost.
- Include Morocco and at least one US comparison set.
- Review caching, attribution, derived-data, and commercial display rights with the actual intended use.
- Run provider calls through server routes with a kill switch, quotas, logging, and request coalescing.
- Keep the current manual path available when the provider is disabled or fails.

## 17. Source Hierarchy

### 17.1 General order

1. User-confirmed correction for that exact product, menu item, or event.
2. Current physical package or restaurant label captured and confirmed by the user.
3. Exact first-party restaurant or manufacturer source with matching region, item, size, and date.
4. Licensed structured provider with exact entity/version match.
5. Existing Ziya product provider record with documented completeness.
6. High-confidence OCR or entity match that the user confirms.
7. Generic reference nutrition labeled Estimated.
8. Manual entry.
9. Unknown.

A higher-ranked source does not erase provenance from a lower-ranked one. User corrections are overlays, not edits to the original provider snapshot.

### 17.2 Domain rules

- **Place identity:** provider place ID or user-saved coordinate; never infer a restaurant branch from proximity alone.
- **Menu identity:** exact item, size, modifiers, locale, and effective date.
- **Nutrition:** exact label first; generic reference only when basis and serving can be reconciled.
- **Ingredients/allergens:** current physical or first-party statement; missing text is unknown.
- **Cooking oil:** explicit ingredient/preparation disclosure only.
- **Receipt:** raw image -> OCR text -> parsed row -> matched entity -> user confirmation.
- **Food photo:** image -> candidate labels -> user selection -> separate reference lookup.
- **Behavior event:** user-confirmed event with copied evidence snapshot; later provider changes do not rewrite it.

## 18. Confidence and Provenance Model

### 18.1 Evidence envelope

Every externally derived or inferred value should be able to carry:

- source type and provider,
- source record ID or URL,
- retrieved or captured timestamp,
- source publication/effective date when known,
- region and language,
- raw value,
- normalized value and unit,
- transformation method and version,
- identity confidence,
- extraction confidence,
- field confidence,
- user-confirmed state,
- user override and timestamp,
- and licensing/cache class.

### 18.2 Confidence dimensions

Do not compress these into one number:

- **Identity:** Is this the right place, product, menu item, or material?
- **Extraction:** Did OCR or parsing read the text correctly?
- **Field:** Is this nutrition, ingredient, allergen, or preparation value directly supported?
- **Match:** Does the evidence belong to this size, modifier, region, and date?
- **Completeness:** Which decision-relevant fields are absent?
- **Behavior:** Did the user confirm the visit, purchase, or consumption?

### 18.3 Action thresholds

- **High:** May prefill and proceed to a visible confirmation.
- **Medium:** Show the top candidates and require selection.
- **Low:** Keep the raw evidence and ask for manual entry or a better image.
- **Unknown:** Do not infer.

A high OCR confidence does not make a menu-item match high confidence. A high place match does not prove a visit or meal.

### 18.4 User-facing presentation

Use short labels:

- Confirmed label
- Published nutrition
- User confirmed
- Possible match
- Estimated reference
- Partial data
- Needs review
- Unknown

A details sheet explains source, date, region, and missing fields. Confidence color is supplemental to text, never the sole signal.

## 19. AI Boundaries

AI may assist with:

- OCR cleanup while preserving original text,
- grouping receipt lines,
- ranking menu-item candidates,
- suggesting food-photo candidates,
- multilingual normalization,
- developer-side data curation,
- and phrasing a trend summary from deterministic verified metrics.

AI must not:

- invent nutrition, ingredients, allergens, serving size, place visits, or preparation details;
- claim that a restaurant uses an oil without a source;
- turn proximity into a confirmed visit;
- turn a photo into an automatic meal log;
- override a user correction;
- hide provenance;
- treat missing data as absence;
- make medical diagnoses or medication recommendations;
- or create goal status from unsupported evidence.

Any model call belongs behind a server route with redaction, retention disclosure, cost limits, version tracking, and a deterministic fallback. Store candidate output separately from confirmed data.

## 20. Privacy and Security

### 20.1 Data classes

| Class | Examples | Default | Required control |
|---|---|---|---|
| Local profile and goals | Preferences, active goals, dismissed nudges | Local-first | Export, clear, optional sync |
| Confirmed structured events | Food log, visit, receipt item, goal evidence | Local-first | Edit, delete, export, sync toggle |
| Precise location | One-time coordinates, accuracy | Ephemeral unless user confirms a place/event | Explain, deny fallback, delete location events |
| Uploaded images | Receipt, menu, food photo | Local preview only until explicit processing consent | Upload disclosure, retention choice, delete |
| OCR and provider requests | Image/text/query sent to third party | No request until action | Provider-purpose disclosure and retry/manual fallback |
| Synced cloud state | Goals, events, saved places | Opt-in through account | RLS, account deletion, sign-out behavior |
| Analytics | Feature and error events if later added | None by default in this roadmap | Separate consent and minimization |

### 20.2 Requirements

- Guest/local-only mode remains fully usable.
- Request location and notifications just in time, not at launch.
- Never enable continuous tracking by default.
- Process crops and image cleanup locally when practical.
- Disclose server processing before the first uploaded image.
- Define retention for images, OCR text, provider responses, structured events, and tombstones.
- Keep provider and Supabase secrets server-side.
- Use Supabase RLS for every user row and test cross-user denial.
- Make Delete receipt image, Delete location history, Delete meal history, Export, Disable nudges, and Delete account discoverable.
- Delete derived records when their only source is deleted, or mark them unsupported if policy requires retention.
- Do not place health-context or precise-location details in notification lock-screen copy unless the user explicitly chooses it.
- Do not send full Profile allergy/watchlist data to place providers.
- Add an incident and provider-disable plan before production external processing.

## 21. Web, PWA, and Native Platform Boundaries

| Capability | Current web app | Installed PWA | Capacitor/native wrapper | Fully native iOS/Android |
|---|---|---|---|---|
| One-time foreground location | Supported on HTTPS with permission | Supported while app is active | Supported through browser or native plugin | Supported |
| Foreground watchPosition | Supported while page is active; power-sensitive | Similar browser constraints | Supported natively while active | Supported |
| Reliable closed-app geofencing | Not available as a standard web capability | Not reliably available | Requires native plugin/custom code | Supported with OS limits and permissions |
| Significant-change/visit events | Not available | Not available | Requires native Core Location/Android implementation | Supported by platform APIs |
| In-app nudges | Supported | Supported | Supported | Supported |
| Web Push | Supported on compatible browsers with service worker | Best fit; iOS/iPadOS requires Home Screen installation | Usually use native push instead | Not applicable |
| Local scheduled notifications | Browser support is inconsistent | Not native-equivalent | Supported with native plugin and platform restrictions | Supported |
| Background JavaScript | Page is suspended; Background Sync has limited availability and purpose | Service workers handle narrow event types, not continuous execution | Background Runner is OS-scheduled and non-persistent | Native background modes still OS-controlled |
| Offline structured state | localStorage/IndexedDB | Stronger app-shell experience, same storage durability caveats | Native storage available | Native storage available |
| Local OCR | Possible with WASM, resource-heavy | Same | Native/on-device models possible | Native/on-device models possible |
| Camera/file capture | Supported | Supported | Native camera integration | Native camera integration |
| App-store distribution | No | Home Screen install | Yes | Yes |

### 21.1 Practical conclusion

- **Now:** foreground one-time checks, local context, manual confirmation, and in-app nudges.
- **PWA:** installability, offline shell, and opt-in Web Push, but still no dependable geofence promise.
- **Capacitor:** reuse the React UI and add vetted native geofence, local notification, push, and secure-storage integrations.
- **Fully native:** highest control for background context and on-device ML, with the highest implementation and maintenance cost.

Native does not remove privacy, permission, latency, battery, or false-positive constraints. Android background geofence events can be delayed and require background permission for modern target levels. Apple condition monitoring has a finite per-app limit and requires explicit authorization and lifecycle handling.

## 22. Phased Implementation Plan

The order favors value from existing evidence before external automation.

### Phase 2A: Productize weekly goals and weekly recap

- **User value:** A clear answer to what is on track, what remains, and which confirmed events contributed.
- **Problems solved:** Form-heavy setup, misleading zero-activity limit states, no history, no drill-down, weak Today's Plate connection.
- **Exact scope:** Guided templates, target/limit semantics, goal lifecycle, week snapshots, evidence drill-down, completeness states, and weekly recap.
- **Data sources:** Existing Today's Plate, scans, confirmed meals, visits, and Profile.
- **API dependencies:** None.
- **UI changes:** Summary-first This week screen; setup/edit sheets; previous-week navigation; one recap.
- **Backend changes:** Local schema migration and sync-compatible weekly snapshots; no provider work.
- **Privacy:** No new sensitive data class.
- **Tests:** Calculation, timezone/week boundaries, partial fields, lifecycle, snapshots, sync merge, accessibility states.
- **Manual smoke checks:** 360x800 and 393x852; empty, one goal, many goals, partial data, offline, refresh.
- **Acceptance:** Every value links to evidence; missing fields remain missing; edits do not rewrite closed weeks; setup is no longer permanently expanded.
- **Known limits:** Only logged/confirmed behavior is represented.
- **Must remain unchanged:** Scanner, product lookup, report scoring, Today's Plate math, Profile, Better Matches.
- **Complexity:** Medium.
- **Order:** First.

### Phase 2B: Productize long-term trends

- **User value:** See meaningful change without interpreting raw logs.
- **Problems solved:** Sparse baseline claims, no period snapshots, event-list UI.
- **Exact scope:** Long-term lifecycle, baseline quality, stable periods, three deterministic insight types, evidence drill-down.
- **Data sources:** Closed weekly snapshots and confirmed events.
- **API dependencies:** None.
- **UI changes:** Trend cards, period comparison, evidence/completeness details.
- **Backend changes:** Optional normalized snapshot/event tables only if sync value is proven.
- **Privacy:** Clear event deletion and recomputation rules.
- **Tests:** Minimum samples, comparable periods, deletions, partial data, no causal wording.
- **Manual smoke checks:** Empty, sparse, complete, conflicting periods, archived goal.
- **Acceptance:** No insight appears without its evidence threshold and date range.
- **Known limits:** Selective logging can still bias the data and must be disclosed.
- **Must remain unchanged:** Daily nutrition calculations and product score.
- **Complexity:** Medium.
- **Order:** Second.

### Phase 2C: Restaurant discovery and decision support pilot

- **User value:** Select a real restaurant and compare documented options without entering every field.
- **Problems solved:** Blank forms, no place catalog, no external menu evidence.
- **Exact scope:** One place-provider pilot, recent/saved results, small curated first-party menu registry, three comparable menu options, confirmation and Today's Plate log.
- **Data sources:** Place provider, first-party menu sources, existing Profile and goals.
- **API dependencies:** Server-side place search; no generic menu provider until licensing benchmark.
- **UI changes:** Search/select restaurant, menu skeleton, candidate cards, source details, manual fallback.
- **Backend changes:** Provider proxy, cache policy, place/menu entity schema, field-level evidence.
- **Privacy:** Query disclosure, location minimization, provider retention and deletion review.
- **Tests:** Region/language, branch identity, menu version, missing fields, provider outage, cost guardrails.
- **Manual smoke checks:** Morocco and US sample places, saved/manual fallback, Profile alert, log flow.
- **Acceptance:** No menu fact lacks a source; exact and estimated records are visibly different.
- **Known limits:** Coverage will remain partial.
- **Must remain unchanged:** Existing product providers and scores.
- **Complexity:** High.
- **Order:** Third.

### Phase 2D: Receipt OCR and review pilot

- **User value:** Turn a receipt into editable item rows with less typing.
- **Problems solved:** Text-area capture and inconsistent browser OCR.
- **Exact scope:** Preprocessing, one selected server OCR, item/merchant parser, per-row review, menu/product candidates, pending local drafts, confirmation.
- **Data sources:** User image, selected OCR provider, existing saved menu/product index.
- **API dependencies:** OCR provider selected by benchmark.
- **UI changes:** Capture, processing, image-aligned review, unmatched row state, final confirmation.
- **Backend changes:** Upload endpoint, temporary storage policy, OCR cache, deletion job, audit metadata.
- **Privacy:** Explicit upload consent and short retention; no model training reuse unless separately agreed.
- **Tests:** Multilingual images, orientation, faded receipts, provider failure, deletion, parser confidence.
- **Manual smoke checks:** French/Arabic/English representative receipts and unsupported image fallback.
- **Acceptance:** OCR never logs directly; every confirmed row preserves raw text and provenance.
- **Known limits:** Abbreviations and menu version matching remain uncertain.
- **Must remain unchanged:** Manual capture fallback and Today's Plate math.
- **Complexity:** High.
- **Order:** Fourth.

### Phase 2E: Foreground place context

- **User value:** Quickly use a current or saved place to start the right task.
- **Problems solved:** Manual coordinates and dead-end visit confirmation.
- **Exact scope:** Permission education, accuracy-aware foreground check, candidate selection, visit confirmation, action routing, delete controls.
- **Data sources:** Browser geolocation, saved places, selected place-provider results.
- **API dependencies:** Reuse Phase 2C place provider.
- **UI changes:** Just-in-time permission sheet, nearby candidates, Confirm/Reject, next-action card.
- **Backend changes:** None required for local mode; synced confirmed events optional.
- **Privacy:** No continuous tracking, no raw location retention by default.
- **Tests:** Denial, timeout, low accuracy, overlapping places, cooldown, deletion.
- **Manual smoke checks:** Real mobile foreground permission and manual fallback.
- **Acceptance:** Proximity never becomes a visit or meal without confirmation.
- **Known limits:** No closed-app detection.
- **Must remain unchanged:** Scanner and bottom navigation.
- **Complexity:** Medium.
- **Order:** Fifth.

### Phase 2F: Validated nudges and PWA delivery

- **User value:** Receive a small number of useful goal reminders after opting in.
- **Problems solved:** In-app-only delivery and unmeasured nudge usefulness.
- **Exact scope:** Outcome tracking, preference controls, service worker push, subscription backend, delivery quiet hours.
- **Data sources:** Confirmed events and goal state only.
- **API dependencies:** Web Push infrastructure.
- **UI changes:** Value-first permission prompt and notification controls.
- **Backend changes:** Subscription storage, scheduler, delivery and expiry logs.
- **Privacy:** Minimize lock-screen content; easy unsubscribe/delete.
- **Tests:** Permission states, iOS Home Screen, expired subscriptions, offline, timezone, duplicate suppression.
- **Manual smoke checks:** Supported desktop/Android browser and physical iOS Home Screen app.
- **Acceptance:** No push without explicit opt-in; every push has a source and cooldown.
- **Known limits:** Browser support and install requirements vary.
- **Must remain unchanged:** Local-only core use.
- **Complexity:** High.
- **Order:** Sixth.

### Phase 2G: Native context pilot

- **User value:** Optional saved-place arrival prompts with native reliability.
- **Problems solved:** Web cannot provide dependable background geofencing.
- **Exact scope:** Capacitor shell, native geofence bridge, selected saved places, dwell confirmation, local notification, disable/delete controls.
- **Data sources:** User-selected places and native OS events.
- **API dependencies:** Native iOS/Android APIs, not a new place provider.
- **UI changes:** Native permission education and monitored-place management.
- **Backend changes:** None for local geofences; optional push/sync events.
- **Privacy:** Always/background access only after separate opt-in and clear benefit.
- **Tests:** Reboot, permission downgrade, battery mode, false drive-by, reinstall, limit handling.
- **Manual smoke checks:** Physical iOS and Android across foreground, background, and terminated states.
- **Acceptance:** No place is monitored unless the user selects it; every visit still requires confirmation.
- **Known limits:** OS latency, finite geofence limits, store-policy review.
- **Must remain unchanged:** Web app remains fully usable.
- **Complexity:** Very high.
- **Order:** Seventh.

### Phase 2H: Food-photo candidate intelligence

- **User value:** Get likely dish candidates when a receipt or menu is unavailable.
- **Problems solved:** Photo evidence currently has no useful next step.
- **Exact scope:** Provider/model benchmark, top candidates, portion prompt, separate nutrition match, explicit confirmation.
- **Data sources:** User image and selected reference database.
- **API dependencies:** Food-vision provider or validated on-device model.
- **UI changes:** Candidate sheet, Not listed path, portion and source review.
- **Backend changes:** Image endpoint/retention or native model delivery.
- **Privacy:** Explicit image processing consent and deletion.
- **Tests:** Regional dishes, mixed plates, low light, portion uncertainty, no-result behavior.
- **Manual smoke checks:** Representative real food images and manual fallback.
- **Acceptance:** No exact nutrition or automatic log comes directly from the image.
- **Known limits:** Recipe and portion remain probabilistic.
- **Must remain unchanged:** Confirmed receipt/menu and manual flows.
- **Complexity:** Very high.
- **Order:** Last.

## 23. Testing Strategy

### 23.1 Deterministic unit tests

- Week and period boundaries across timezones and daylight-saving changes.
- Target, limit, average, and consistency semantics.
- Missing nutrient fields and partial totals.
- Event deduplication, correction, deletion, and tombstone behavior.
- Goal lifecycle and immutable closed-period snapshots.
- Restaurant/menu entity normalization and region/version separation.
- Confidence threshold mapping.
- Receipt parsing independent of network OCR.
- Nudge freshness, cooldown, dismissal, and quiet hours.
- Local/cloud merge and schema migration.

### 23.2 Contract and fixture tests

- Recorded provider responses with secrets and personal data removed.
- Required field and provenance mapping.
- Provider error, quota, timeout, and malformed-response behavior.
- Cache-policy and request-coalescing behavior.
- No provider's missing fields become zero or absent.

### 23.3 Benchmark suites

- Place precision/recall across target regions.
- OCR character, line, merchant, item, quantity, and price accuracy.
- Menu-item candidate top-1 and top-3 recall.
- Food-photo candidate recall, not nutrition accuracy.
- Latency, correction burden, and cost per completed flow.

### 23.4 UI and accessibility tests

- 360x800 and 393x852, Android-like and iPhone safe areas.
- Keyboard, screen reader, focus restoration, live processing announcements.
- Reduced motion, high text scaling, and color-independent status.
- Offline, provider failure, partial data, cancellation, and local-only sync.
- No fixed navigation coverage and no trapped sheet scroll.

### 23.5 Real-device gates

Physical-device tests are mandatory for camera capture, permission prompts, iOS Home Screen push, native notification behavior, and geofencing. Desktop emulation is not proof.

## 24. Success Metrics

| Outcome | Metric |
|---|---|
| Weekly goal usability | Goal setup completion, median setup time, edit/pause success, week-two retention |
| Evidence trust | Percentage of goal values with inspectable source events; correction and deletion rate |
| Data completeness | Percentage of logged items with each required nutrient/ingredient field; partial-total rate |
| Restaurant usefulness | Time from restaurant selection to decision; manual fields per meal; verified nutrition rate |
| Receipt extraction | Merchant accuracy, item-line recall, confirmed match rate, correction seconds per item |
| Place context | Candidate precision, false-positive rate, confirmation rate, duplicate visit rate |
| Nudge quality | Action, dismissal, disable, and expiry rates; pushes per active user per week |
| Trends | Percentage of shown insights meeting sample/completeness thresholds; evidence drill-down use |
| Reliability | Flow error rate, offline completion rate, sync-conflict rate, provider outage fallback completion |
| Cost | Provider cost per completed restaurant decision, receipt, and active user |
| Privacy | Percentage of sensitive actions preceded by disclosure; deletion completion; image retention compliance |
| Accessibility | Automated violations plus completion rate with keyboard, screen reader, and large text |

No release should use "looks polished" as its only quality gate.

## 25. Risks and Limitations

- Restaurant menu, ingredient, and allergen data are fragmented, region-specific, and legally constrained.
- Place coverage and business freshness differ by country; Morocco and French/Arabic behavior require direct testing.
- Public API prices, quotas, and policies can change after this audit.
- User logging is selective and can bias weekly and trend conclusions.
- OCR quality varies with receipt printing, image quality, language, layout, and provider.
- Food photos cannot establish recipe, portion, hidden ingredients, or exact nutrition.
- Web apps cannot promise native background geofencing.
- Web Push support and installation/permission requirements vary.
- Native background location increases privacy, battery, review, and support burden.
- localStorage can be evicted and is not a durable backup.
- A whole-state cloud record will become difficult to query as analytics needs grow.
- Field-level provenance and confidence require schema work before external data is trustworthy.
- User correction should win for personal history but must not silently become public catalog truth.
- A supportive tone does not remove the need to avoid medical claims.

## 26. Deferred Ideas

- Social challenges, leaderboards, points, and monetary rewards.
- Automatic meal logging from location, receipt, or photo.
- Always-on location history.
- Store loyalty-account and delivery-app imports.
- A universal crowdsourced restaurant ingredient catalog.
- Cross-restaurant marketplace recommendations.
- Predictive or prescriptive AI coaching.
- Medical dietary plans.
- Exact portion estimation from a single photo.
- Continuous on-device camera recognition.
- Wearable and health-platform workout imports.
- Advanced chart dashboards.
- Family or caregiver accounts.

These ideas remain deferred until the core confirmed-event loop is useful, measurable, private, and maintainable.

## 27. Favorite Product Copy

> Good match for your current goals.
> Want to log this meal?

> Does this fit your weekly goal?

> You're near McDonald's.
> This can still fit your week if you keep it within your goal.
> Want help choosing the best option?

> This fits your weekly goal.

> This is okay today, but watch sodium later.

> This meal pushes your weekly fast-food goal close to the limit.

> This choice is high in sodium, but your calories still fit today.

> Want a better option from this restaurant?

> Gym visit detected. This supports your weekly activity goal.

> You went over sodium today, but your weekly average is still on track.

> Your fast-food visits are down compared with last month.

Additional copy:

> You have room left this week.

> This would put you over the current target. One choice does not erase your progress.

> Not enough confirmed data yet.

> Some entries are missing sodium, so this total is partial.

> Possible menu match. Review the item before logging.

> We could not retrieve this menu right now. You can capture the board or enter the item.

> Location is checked only when you ask.

> No visit or meal will be logged until you confirm it.

## Recommended Next Implementation Goal

**Phase 2A: Turn weekly goals into a guided weekly plan and evidence-backed recap.**

This should come first because it creates immediate value from Today's Plate, Profile, scans, and the Phase 2 event foundation without adding vendor cost or unreliable automation. It also establishes stable goal semantics, period snapshots, completeness, and evidence drill-down that restaurant decisions, trends, nudges, and later native context all need.

### Codex-ready implementation prompt

> You are working in the existing Ziya React/Vite repository. Implement one focused phase only: productize weekly goals and the weekly recap. Do not add restaurant APIs, OCR providers, food-photo recognition, background location, Web Push, rewards, or a native wrapper. Preserve scanner decoding, product lookup, product reports, scoring, Search, History, Better Matches, Profile, Supabase auth, ingredient intelligence, and Today's Plate calculations.
>
> The current Phase 2 foundation and documentation are the baseline. Build on them without resetting, replacing, or broadly refactoring unrelated Phase 2 modules.
>
> This pass must substantially improve only the This week experience. Places, Capture, restaurant intelligence, long-term Trends, nudges, OCR, and location behavior must remain functionally unchanged.
>
> Begin by auditing the existing Phase 2 weekly goal engine, PhaseTwoScreen This week UI, phase2State persistence/merge/tombstones, Today's Plate event integration, Profile integration, and tests. Reuse the existing event and nutrition data. Do not create a second food log or nutrition calculation model.
>
> Build a summary-first This week experience. The default view must show the current local week, a concise evidence-backed summary, active goal cards, and one Add goal action. Move setup and editing into focused mobile sheets. Do not leave the full goal form permanently expanded.
>
> Support these existing starter templates: quick-service meal limit, protein-goal days, weekly sugar limit, weekly sodium average/limit as the existing engine can safely support, gym visits, grocery scans, and goal-compatible restaurant choices. Make target-versus-limit behavior explicit. Add draft, active, paused, completed, and archived lifecycle states where appropriate.
>
> Correct zero-evidence behavior. A limit goal with no confirmed events must not be shown as completed or successfully on track. Use No confirmed entries yet or Not enough data. For nutrient goals, preserve missing fields as missing. Show Partial data when relevant logged items lack the required nutrient. Do not infer zero.
>
> Add evidence drill-down for each goal. A user must be able to see which confirmed Today's Plate entries, scans, meals, or visits contributed, their dates, and any missing-data caveat. Deleting or correcting an event must update the current week deterministically.
>
> Add immutable weekly snapshots. Closed weeks preserve the goal definition, target, date range, totals, completeness, and supporting event IDs used at close. Editing today's goal must not rewrite prior weeks. Add previous/current week navigation. Historical weeks are read-only in this phase.
>
> Reuse local-first persistence. Add a versioned migration for existing Phase 2 local state, preserve deletion tombstones, and keep optional Supabase synchronization compatible. Missing Supabase configuration or table must remain a local-only success. Do not normalize the entire cloud schema in this phase.
>
> Preserve Ziya's existing design tokens, card radii, soft-green palette, and rounded mobile identity. Reuse existing shared components and spacing rules rather than introducing a flatter or sharper visual language. Keep clear text states, 44px touch targets, safe-area padding, and no nested cards. Use short 180-280ms state transitions and respect prefers-reduced-motion. Ensure the fixed bottom navigation does not cover content.
>
> Add tests for local week boundaries, target and limit semantics, zero-evidence states, partial nutrients, event deduplication, pause/archive behavior, immutable historical snapshots, current-goal edits, local persistence migration, deletion/tombstones, and cloud merge compatibility. Add mobile smoke checks at 360x800 and 393x852 for empty, one-goal, many-goal, partial-data, previous-week, offline, refresh, and reduced-motion states.
>
> Acceptance criteria: weekly setup is guided and no longer an always-visible long form; every displayed progress value links to supporting evidence; missing nutrition is never zero; zero activity is not falsely celebrated; prior week snapshots do not change after edits; Today's Plate math is unchanged; local-only mode works; all existing tests and the production build pass; no unrelated Phase 2 feature is expanded.
>
> The finished This week screen must feel like a polished consumer dashboard rather than a configuration form. Existing polished Ziya screens and shared navigation must remain visually recognizable.
>
> At completion, report files changed, migrations, tests run, mobile checks actually performed, limitations, and whether any cloud behavior still needs a configured Supabase environment. Do not commit unless the user explicitly asks.
