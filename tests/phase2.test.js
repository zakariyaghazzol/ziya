import assert from "node:assert/strict";
import {
  buildWeeklyGoalSummary,
  createWeeklyGoal,
  createWeeklySnapshot,
  getWeekWindow,
  materializeClosedWeeklySnapshots,
  shiftWeekWindow,
  transitionWeeklyGoal,
  updateWeeklyGoal
} from "../src/lib/weeklyGoalEngine.js";
import {
  buildLongTermGoalSummary,
  createLongTermGoal,
  createLongTermSnapshot,
  getLongTermPeriodWindows,
  materializeClosedLongTermSnapshots,
  restartLongTermGoal,
  transitionLongTermGoal,
  updateLongTermGoal
} from "../src/lib/longTermGoalEngine.js";
import { analyzeGoalFit, analyzePreparationDetails, rankMenuItemsForGoals } from "../src/lib/goalFitAnalyzer.js";
import { parseReceiptText } from "../src/lib/receiptParser.js";
import { findNearbySavedPlace, haversineDistanceMeters } from "../src/lib/locationContextDetector.js";
import { buildContextualNudge } from "../src/lib/contextualNudgeEngine.js";
import {
  PHASE2_STATE_VERSION,
  createEmptyPhase2State,
  createPhase2DeletionPatch,
  mergePhase2States,
  migratePhase2State,
  sanitizePhase2State
} from "../src/lib/phase2State.js";

const now = new Date("2026-07-16T12:00:00-04:00");
const week = getWeekWindow(now);

function plateEntry(id, contribution) {
  return { id, contribution, product: { id: `product-${id}`, name: id } };
}

function makePlate() {
  return {
    goals: { calories: 2000, protein: 100, carbs: 250, fat: 70, fiber: 30, sugar: 45, sodium: 2300 },
    days: {
      [week.keys[0]]: {
        goalsSnapshot: { protein: 100 },
        entries: [plateEntry("monday", { calories: 1800, protein: 105, sugar: 30, sodium: 1900 })]
      },
      [week.keys[1]]: {
        goalsSnapshot: { protein: 100 },
        entries: [plateEntry("tuesday", { calories: 1600, protein: 70, sugar: 35 })]
      }
    }
  };
}

function testStateSanitationAndMerge() {
  const local = createEmptyPhase2State();
  local.weeklyGoals = [createWeeklyGoal("gym_visits", { id: "weekly-gym", target: 2 })];
  local.updatedAt = "2026-07-16T10:00:00.000Z";
  const cloud = createEmptyPhase2State();
  cloud.savedPlaces = [{ id: "gym", name: "My Gym", type: "gym", latitude: 40, longitude: -74, radiusMeters: 120 }];
  cloud.updatedAt = "2026-07-16T11:00:00.000Z";
  const merged = mergePhase2States(local, cloud);
  assert.equal(merged.weeklyGoals.length, 1);
  assert.equal(merged.savedPlaces.length, 1);
  assert.equal(sanitizePhase2State({ weeklyGoals: [{ id: "bad", templateId: "unknown" }] }).weeklyGoals.length, 0);
}

function testWeeklyGoals() {
  const state = createEmptyPhase2State();
  state.weeklyGoals = [
    createWeeklyGoal("protein_goal_days", { id: "protein", target: 2 }),
    createWeeklyGoal("weekly_sodium_limit", { id: "sodium", target: 5000 }),
    createWeeklyGoal("gym_visits", { id: "gym", target: 2 }),
    createWeeklyGoal("fast_food_limit", { id: "fast", target: 2 })
  ];
  state.activities = [
    { id: "a1", type: "gym_visit", source: "manual", occurredAt: `${week.keys[0]}T18:00:00.000Z` },
    { id: "a2", type: "fast_food_visit", source: "location-confirmed", occurredAt: `${week.keys[1]}T18:00:00.000Z` }
  ];
  const summary = buildWeeklyGoalSummary({ phase2State: state, plateState: makePlate(), now });
  assert.equal(summary.metrics.gymVisits, 1);
  const groceryState = createEmptyPhase2State();
  groceryState.activities = [{ id: "grocery-product", type: "product_scanned", source: "scan", occurredAt: now.toISOString(), metadata: { context: "grocery" } }];
  assert.equal(buildWeeklyGoalSummary({ phase2State: groceryState, plateState: makePlate(), now }).metrics.groceryScans, 1);
  assert.equal(summary.metrics.proteinGoalDays, 1);
  assert.equal(summary.metrics.fastFoodVisits, 1);
  assert.equal(summary.goals.find((goal) => goal.templateId === "weekly_sodium_limit").partial, true);
  assert.match(summary.goals.find((goal) => goal.templateId === "fast_food_limit").summary, /available this week/);
}

function testLongTermGoals() {
  const state = createEmptyPhase2State();
  state.longTermGoals = [
    createLongTermGoal("protein_consistency", { id: "protein-long", target: 50, durationDays: 30, startDate: "2026-07-01T00:00:00.000Z" }),
    createLongTermGoal("avoid_ingredient", { id: "avoid", target: 14, trackedValue: "Red 40", startDate: "2026-07-10T00:00:00.000Z" })
  ];
  state.activities = [{
    id: "scan-e129",
    type: "product_scanned",
    occurredAt: now.toISOString(),
    source: "scan",
    productId: "colored-snack",
    metadata: { ingredients: ["E129"] }
  }];
  const result = buildLongTermGoalSummary({ phase2State: state, plateState: makePlate(), now });
  assert.equal(result.goals.length, 2);
  assert.equal(result.goals.find((goal) => goal.templateId === "protein_consistency").hasData, true);
  assert.match(result.goals.find((goal) => goal.templateId === "avoid_ingredient").detail, /matching label/);

  const noLabelState = createEmptyPhase2State();
  noLabelState.longTermGoals = [createLongTermGoal("avoid_ingredient", { id: "avoid-empty", target: 14, trackedValue: "Red 40", startDate: "2026-07-10T00:00:00.000Z" })];
  const noLabel = buildLongTermGoalSummary({ phase2State: noLabelState, plateState: makePlate(), now }).goals[0];
  assert.equal(noLabel.hasData, false);
  assert.match(noLabel.detail, /No reviewed ingredient labels/);
}

function testGoalFitDoesNotInventValues() {
  const missing = analyzeGoalFit({ nutrition: {}, dailyGoals: { calories: 2000 } });
  assert.equal(missing.state, "needs-data");
  assert.equal(analyzeGoalFit({ nutrition: { calories: "", protein: "" }, dailyGoals: { calories: 2000 } }).state, "needs-data");
  assert.match(missing.summary, /confirm nutrition/);
  const fit = analyzeGoalFit({
    nutrition: { calories: 450, protein: 30, sugar: 4, sodium: 700 },
    dailyTotals: { calories: 900, sugar: 12, sodium: 900 },
    dailyGoals: { calories: 2000, protein: 100, sugar: 45, sodium: 2300 },
    confidence: "user_confirmed"
  });
  assert.equal(fit.state, "fits");
  assert.ok(fit.reasons.some((reason) => /calorie goal/.test(reason)));
  assert.ok(!JSON.stringify(fit).toLowerCase().includes("guilt"));
}

function testMenuRanking() {
  const ranked = rankMenuItemsForGoals([
    { id: "complete", name: "Grilled bowl", nutrition: { calories: 500, protein: 35, sodium: 650 }, confidence: "user_confirmed" },
    { id: "missing", name: "Mystery meal", nutrition: {}, confidence: "unknown" }
  ], { dailyGoals: { calories: 2000, protein: 100, sodium: 2300 }, dailyTotals: { calories: 600, sodium: 500 } });
  assert.equal(ranked[0].item.id, "complete");
  assert.equal(ranked[1].fit.state, "needs-data");
}

function testReceiptParser() {
  const restaurant = {
    id: "r1",
    name: "Corner Cafe",
    menuItems: [
      { id: "m1", name: "Chicken Bowl", servingSize: "1 bowl", nutrition: { calories: 520, protein: 34 }, ingredients: [] }
    ]
  };
  const parsed = parseReceiptText("CORNER CAFE\n1x Chicken Bowl 12.50\nTax 1.00\nTotal 13.50", { restaurants: [restaurant], now });
  assert.equal(parsed.restaurant.id, "r1");
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].menuItemId, "m1");
  assert.equal(parsed.items[0].nutrition.calories, 520);
  assert.equal(parsed.status, "needs-confirmation");
  const empty = parseReceiptText("", { restaurants: [] });
  assert.equal(empty.confidence, "not-confident");
}

function testLocationDetection() {
  const distance = haversineDistanceMeters({ latitude: 40, longitude: -74 }, { latitude: 40.0005, longitude: -74 });
  assert.ok(distance > 50 && distance < 60);
  const match = findNearbySavedPlace({ latitude: 40.0005, longitude: -74 }, [
    { id: "gym", name: "My Gym", type: "gym", latitude: 40, longitude: -74, radiusMeters: 100 }
  ]);
  assert.equal(match.placeId, "gym");
  assert.equal(findNearbySavedPlace({ latitude: 41, longitude: -74 }, [{ id: "gym", name: "My Gym", type: "gym", latitude: 40, longitude: -74, radiusMeters: 100 }]), null);
}

function testNudgePrivacyAndTone() {
  const state = createEmptyPhase2State();
  state.settings.nudgesEnabled = true;
  state.currentContext = { placeId: "quick", name: "Quick Stop", type: "fast_food", detectedAt: now.toISOString() };
  const nudge = buildContextualNudge({
    phase2State: state,
    weeklySummary: { window: week, goals: [{ templateId: "fast_food_limit", remaining: 1, unit: "meal" }], activities: [] },
    now
  });
  assert.match(nudge.message, /still fit your week/i);
  state.settings.nudgesEnabled = false;
  assert.equal(buildContextualNudge({ phase2State: state, weeklySummary: null, now }), null);
}

function testPreparationAndPersonalFit() {
  const fit = analyzeGoalFit({
    nutrition: { calories: 420, protein: 22, sodium: 900 },
    ingredients: ["Milk", "Canola oil", "E129"],
    profile: {
      allergies: [{ key: "milk", label: "Milk" }],
      avoidedIngredients: [{ key: "red-40", label: "Red 40 / Allura Red AC", canonicalName: "Allura Red AC" }],
      watchlistIngredients: []
    },
    dailyTotals: { calories: 700, sodium: 600 },
    dailyGoals: { calories: 2000, protein: 100, sodium: 2300 },
    confidence: "published_nutrition"
  });
  assert.ok(fit.cautions.some((item) => /marked allergen/i.test(item)));
  assert.ok(fit.cautions.some((item) => /avoid list/i.test(item)));
  const preparation = analyzePreparationDetails(["Chicken", "Canola oil"]);
  assert.deepEqual(preparation.cookingOils, ["canola oil"]);
  assert.match(preparation.summary, /verify current restaurant information/i);
}

function testDeletionTombstonesAndMetadata() {
  const cloud = createEmptyPhase2State();
  cloud.weeklyGoals = [createWeeklyGoal("gym_visits", { id: "deleted-goal", target: 3 })];
  cloud.updatedAt = "2026-07-16T10:00:00.000Z";
  const local = createEmptyPhase2State();
  local.updatedAt = "2026-07-16T11:00:00.000Z";
  const deleted = createPhase2DeletionPatch(local, "weeklyGoal", ["deleted-goal"], { weeklyGoals: [] });
  const merged = mergePhase2States(deleted, cloud);
  assert.equal(merged.weeklyGoals.length, 0);

  const sanitized = sanitizePhase2State({
    receiptReviews: [{
      id: "capture",
      restaurantName: "Cafe",
      captureKind: "food_photo",
      items: [{ id: "item", name: "Bowl", servingSize: "1 bowl", ingredients: ["Canola oil"], nutrition: { calories: 420, protein: 20 } }]
    }],
    restaurants: [{
      id: "restaurant",
      name: "Cafe",
      menuItems: [{ id: "menu", name: "Bowl", sourceNote: "Published nutrition page" }]
    }]
  });
  assert.equal(sanitized.receiptReviews[0].captureKind, "food_photo");
  assert.deepEqual(sanitized.receiptReviews[0].items[0].ingredients, ["Canola oil"]);
  assert.equal(sanitized.restaurants[0].menuItems[0].sourceNote, "Published nutrition page");
  assert.deepEqual(sanitizePhase2State({ restaurants: [{ id: "blank", name: "Blank", menuItems: [{ id: "blank-item", name: "Blank item", nutrition: { calories: "", protein: "" } }] }] }).restaurants[0].menuItems[0].nutrition, {});
}

function testStaleContextDoesNotNudge() {
  const state = createEmptyPhase2State();
  state.settings.nudgesEnabled = true;
  state.currentContext = {
    placeId: "old",
    name: "Old cafe",
    type: "cafe",
    detectedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
  };
  assert.equal(buildContextualNudge({ phase2State: state, weeklySummary: { window: week, goals: [], activities: [] }, now }), null);
}

function testLocalWeekBoundaries() {
  const sunday = getWeekWindow(new Date(2026, 2, 8, 23, 59, 0));
  assert.equal(sunday.startKey, "2026-03-02");
  assert.equal(sunday.endKey, "2026-03-08");
  assert.equal(sunday.keys.length, 7);
  const monday = getWeekWindow(new Date(2026, 2, 9, 0, 1, 0));
  assert.equal(monday.startKey, "2026-03-09");
  assert.equal(monday.endKey, "2026-03-15");
}

function testZeroEvidenceAndDirectionSemantics() {
  const state = createEmptyPhase2State();
  state.weeklyGoals = [
    createWeeklyGoal("fast_food_limit", { id: "zero-limit", target: 2, now }),
    createWeeklyGoal("gym_visits", { id: "zero-target", target: 3, now })
  ];
  const summary = buildWeeklyGoalSummary({ phase2State: state, plateState: { goals: null, days: {} }, now });
  const limit = summary.goals.find((goal) => goal.id === "zero-limit");
  const target = summary.goals.find((goal) => goal.id === "zero-target");
  assert.equal(limit.directionLabel, "Stay at or below");
  assert.equal(target.directionLabel, "Reach at least");
  assert.equal(limit.status, "no-data");
  assert.equal(target.status, "no-data");
  assert.equal(limit.reached, false);
  assert.equal(target.reached, false);
  assert.equal(summary.onTrackCount, 0);
  assert.match(limit.summary, /No confirmed entries yet/);
}

function testPartialNutritionEvidence() {
  const state = createEmptyPhase2State();
  state.weeklyGoals = [createWeeklyGoal("weekly_sodium_limit", { id: "partial-sodium", target: 2300, now })];
  const plate = {
    goals: { protein: 100 },
    days: {
      [week.keys[0]]: {
        goalsSnapshot: { protein: 100 },
        entries: [plateEntry("known-sodium", { protein: 20, sodium: 600 })]
      },
      [week.keys[1]]: {
        goalsSnapshot: { protein: 100 },
        entries: [plateEntry("missing-sodium", { protein: 30 })]
      }
    }
  };
  const goal = buildWeeklyGoalSummary({ phase2State: state, plateState: plate, now }).goals[0];
  assert.equal(goal.current, 600);
  assert.equal(goal.partial, true);
  assert.equal(goal.status, "partial");
  assert.equal(goal.evidenceCount, 2);
  assert.equal(goal.missingEvidenceCount, 1);
  assert.equal(goal.evidence.find((item) => item.sourceId === "missing-sodium").missing, true);
  assert.match(goal.summary, /partial total/);

  const proteinState = createEmptyPhase2State();
  proteinState.weeklyGoals = [createWeeklyGoal("protein_goal_days", { id: "partial-protein", target: 3, now })];
  const proteinPlate = {
    goals: { protein: 100 },
    days: {
      [week.keys[0]]: {
        goalsSnapshot: { protein: 100 },
        entries: [
          plateEntry("known-protein", { protein: 120 }),
          plateEntry("missing-protein", { sodium: 200 })
        ]
      }
    }
  };
  const proteinGoal = buildWeeklyGoalSummary({ phase2State: proteinState, plateState: proteinPlate, now }).goals[0];
  assert.equal(proteinGoal.current, 1);
  assert.equal(proteinGoal.partial, true);
  assert.equal(proteinGoal.dailyProgress[0].value, 1);
  assert.equal(proteinGoal.dailyProgress[0].missingCount, 1);
}

function testEvidenceDeduplicationAndCorrection() {
  const state = createEmptyPhase2State();
  state.weeklyGoals = [createWeeklyGoal("gym_visits", { id: "dedupe-gym", target: 2, now })];
  const activity = { id: "same-visit", type: "gym_visit", source: "manual", occurredAt: now.toISOString(), metadata: {} };
  state.activities = [activity, { ...activity }];
  const withVisit = buildWeeklyGoalSummary({ phase2State: state, plateState: { days: {} }, now }).goals[0];
  assert.equal(withVisit.current, 1);
  assert.equal(withVisit.evidenceCount, 1);
  state.activities = [];
  const afterDeletion = buildWeeklyGoalSummary({ phase2State: state, plateState: { days: {} }, now }).goals[0];
  assert.equal(afterDeletion.status, "no-data");
  assert.equal(afterDeletion.evidenceCount, 0);
}

function testWeeklyGoalLifecycle() {
  const draft = createWeeklyGoal("grocery_scans", { id: "lifecycle", status: "draft", target: 3, now });
  assert.equal(draft.status, "draft");
  assert.equal(draft.enabled, false);
  const active = transitionWeeklyGoal(draft, "active", new Date("2026-07-16T13:00:00.000Z"));
  assert.equal(active.status, "active");
  assert.equal(active.enabled, true);
  const paused = transitionWeeklyGoal(active, "paused", new Date("2026-07-16T14:00:00.000Z"));
  assert.equal(paused.status, "paused");
  assert.ok(paused.pausedAt);
  const completed = transitionWeeklyGoal(paused, "completed", new Date("2026-07-16T15:00:00.000Z"));
  assert.equal(completed.status, "completed");
  const archived = transitionWeeklyGoal(completed, "archived", new Date("2026-07-16T16:00:00.000Z"));
  assert.equal(archived.status, "archived");
  const edited = updateWeeklyGoal(active, { target: 5, label: "Five grocery scans" }, new Date("2026-07-16T17:00:00.000Z"));
  assert.equal(edited.target, 5);
  assert.equal(active.target, 3);
  assert.equal(edited.status, "active");

  const priorWindow = shiftWeekWindow(week, -1);
  const created = createWeeklyGoal("gym_visits", {
    id: "reactivated-snapshot",
    createdAt: new Date(priorWindow.start.getTime() - (2 * DAY_FOR_TEST)).toISOString(),
    now: new Date(priorWindow.start.getTime() - (2 * DAY_FOR_TEST))
  });
  const pausedBeforeWeek = transitionWeeklyGoal(created, "paused", new Date(priorWindow.start.getTime() - DAY_FOR_TEST));
  const reactivatedInWeek = transitionWeeklyGoal(pausedBeforeWeek, "active", new Date(priorWindow.start.getTime() + DAY_FOR_TEST));
  const snapshot = createWeeklySnapshot({
    phase2State: { ...createEmptyPhase2State(), weeklyGoals: [reactivatedInWeek] },
    plateState: { days: {} },
    window: priorWindow,
    now
  });
  assert.equal(snapshot.goals.length, 1);
  assert.equal(snapshot.goals[0].id, "reactivated-snapshot");
}

function testImmutableWeeklySnapshots() {
  const priorWindow = shiftWeekWindow(week, -1);
  const createdAt = new Date(priorWindow.start.getTime() - 60 * 60 * 1000).toISOString();
  const state = createEmptyPhase2State();
  state.weeklyGoals = [createWeeklyGoal("gym_visits", {
    id: "snapshot-goal",
    target: 2,
    createdAt,
    activatedAt: createdAt,
    now: new Date(createdAt)
  })];
  state.activities = [{
    id: "prior-gym",
    type: "gym_visit",
    source: "manual",
    occurredAt: new Date(priorWindow.start.getTime() + DAY_FOR_TEST).toISOString(),
    metadata: {}
  }];
  const snapshot = createWeeklySnapshot({ phase2State: state, plateState: { days: {} }, window: priorWindow, now });
  assert.equal(snapshot.goals[0].target, 2);
  assert.equal(snapshot.goals[0].current, 1);
  assert.deepEqual(snapshot.evidenceIds, ["activity:prior-gym"]);

  const editedGoal = updateWeeklyGoal(state.weeklyGoals[0], { target: 7 }, now);
  const nextState = { ...state, weeklyGoals: [editedGoal], weeklySnapshots: [snapshot] };
  const snapshots = materializeClosedWeeklySnapshots({ phase2State: nextState, plateState: { days: {} }, now });
  assert.equal(snapshots.find((item) => item.id === snapshot.id).goals[0].target, 2);
  assert.equal(snapshot.goals[0].target, 2);
}

function testPhase2MigrationAndSnapshotMerge() {
  const migrated = migratePhase2State({
    version: 1,
    weeklyGoals: [{ id: "legacy-active", templateId: "gym_visits", target: 2, enabled: true }],
    deletedItems: [{ id: "activity:old", kind: "activity", targetId: "old", deletedAt: now.toISOString() }]
  });
  const sanitized = sanitizePhase2State(migrated);
  assert.equal(sanitized.version, PHASE2_STATE_VERSION);
  assert.equal(sanitized.weeklyGoals[0].status, "active");
  assert.equal(sanitized.deletedItems.length, 1);

  const pausedLegacy = sanitizePhase2State({
    version: 1,
    weeklyGoals: [{ id: "legacy-paused", templateId: "gym_visits", target: 2, enabled: false }]
  });
  assert.equal(pausedLegacy.weeklyGoals[0].status, "paused");

  const priorWindow = shiftWeekWindow(week, -1);
  const local = createEmptyPhase2State();
  local.weeklyGoals = [createWeeklyGoal("gym_visits", { id: "merge-goal", target: 2, createdAt: priorWindow.start.toISOString(), now: priorWindow.start })];
  const localSnapshot = createWeeklySnapshot({ phase2State: local, plateState: { days: {} }, window: priorWindow, now });
  local.weeklySnapshots = [localSnapshot];
  local.updatedAt = "2026-07-16T10:00:00.000Z";
  const cloud = createEmptyPhase2State();
  cloud.weeklySnapshots = [{
    ...localSnapshot,
    capturedAt: "2026-07-16T11:00:00.000Z",
    goals: localSnapshot.goals.map((goal) => ({ ...goal, target: 99 }))
  }];
  cloud.updatedAt = "2026-07-16T11:00:00.000Z";
  const merged = mergePhase2States(local, cloud);
  assert.equal(merged.weeklySnapshots.length, 1);
  assert.equal(merged.weeklySnapshots[0].goals[0].target, 2);
}

function dateInPeriod(window, dayOffset, hour = 12) {
  const date = new Date(window.start);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function periodDateKey(window, dayOffset) {
  const date = new Date(window.start);
  date.setDate(date.getDate() + dayOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function scoreActivity(id, occurredAt, score) {
  return {
    id,
    type: "product_scanned",
    source: "scan",
    occurredAt,
    updatedAt: occurredAt,
    productId: id,
    metadata: { productName: id, category: "Food", score }
  };
}

function testStableLongTermPeriodsAndThresholds() {
  const testNow = new Date(2026, 4, 28, 12, 0, 0);
  const goal = createLongTermGoal("average_product_quality", {
    id: "stable-quality",
    target: 5,
    durationDays: 14,
    startDate: new Date(2026, 4, 15, 0, 0, 0).toISOString(),
    now: testNow
  });
  const windows = getLongTermPeriodWindows(goal, testNow);
  assert.equal(windows.current.startKey, "2026-05-15");
  assert.equal(windows.current.endKey, "2026-05-28");
  assert.equal(windows.current.observedDays, 14);
  assert.equal(windows.previous.startKey, "2026-05-01");
  assert.equal(windows.previous.observedDays, 14);

  const state = createEmptyPhase2State();
  state.longTermGoals = [goal];
  state.activities = [
    scoreActivity("previous-1", dateInPeriod(windows.previous, 0), 68),
    scoreActivity("previous-2", dateInPeriod(windows.previous, 1), 70),
    scoreActivity("previous-3", dateInPeriod(windows.previous, 2), 72),
    scoreActivity("current-1", dateInPeriod(windows.current, 0), 82),
    scoreActivity("current-2", dateInPeriod(windows.current, 1), 84)
  ];

  const sparse = buildLongTermGoalSummary({ phase2State: state, plateState: { days: {} }, now: testNow }).goals[0];
  assert.equal(sparse.comparisonReady, false);
  assert.equal(sparse.insight, "");
  assert.equal(sparse.current.meetsThreshold, false);
  assert.match(sparse.detail, /needs 1 more confirmed entry/);

  state.activities.push(scoreActivity("current-3", dateInPeriod(windows.current, 2), 86));
  const ready = buildLongTermGoalSummary({ phase2State: state, plateState: { days: {} }, now: testNow }).goals[0];
  assert.equal(ready.comparisonReady, true);
  assert.equal(ready.status, "improving");
  assert.match(ready.insight, /May 1 - May 14 compared with May 15 - May 28/);
  assert.doesNotMatch(ready.insight, /\bcaused\b|because you|made you/i);

  const dstGoal = createLongTermGoal("gym_routine", {
    id: "dst-period",
    durationDays: 14,
    startDate: new Date(2026, 2, 1, 0, 0, 0).toISOString(),
    now: new Date(2026, 2, 14, 12, 0, 0)
  });
  const dstWindows = getLongTermPeriodWindows(dstGoal, new Date(2026, 2, 14, 12, 0, 0));
  assert.equal(dstWindows.current.startKey, "2026-03-01");
  assert.equal(dstWindows.current.endKey, "2026-03-14");
  assert.equal(dstWindows.current.observedDays, 14);
}

function testLongTermComparabilityAndPartialData() {
  const testNow = new Date(2026, 4, 28, 12, 0, 0);
  const goal = createLongTermGoal("average_product_quality", {
    id: "coverage-quality",
    durationDays: 14,
    startDate: new Date(2026, 4, 15, 0, 0, 0).toISOString(),
    now: testNow
  });
  const windows = getLongTermPeriodWindows(goal, testNow);
  const uneven = createEmptyPhase2State();
  uneven.longTermGoals = [goal];
  uneven.activities = Array.from({ length: 8 }, (_, index) => scoreActivity("prior-wide-" + index, dateInPeriod(windows.previous, index), 80))
    .concat(Array.from({ length: 3 }, (_, index) => scoreActivity("current-narrow-" + index, dateInPeriod(windows.current, index), 84)));
  const unevenResult = buildLongTermGoalSummary({ phase2State: uneven, plateState: { days: {} }, now: testNow }).goals[0];
  assert.equal(unevenResult.current.meetsThreshold, true);
  assert.equal(unevenResult.previous.meetsThreshold, true);
  assert.equal(unevenResult.comparisonReady, false);
  assert.equal(unevenResult.comparisonReason, "uneven-evidence");
  assert.match(unevenResult.detail, /different evidence coverage/);

  const partial = createEmptyPhase2State();
  partial.longTermGoals = [goal];
  partial.activities = [
    scoreActivity("partial-p1", dateInPeriod(windows.previous, 0), 80),
    scoreActivity("partial-p2", dateInPeriod(windows.previous, 1), 82),
    scoreActivity("partial-p3", dateInPeriod(windows.previous, 2), 84),
    scoreActivity("partial-c1", dateInPeriod(windows.current, 0), 70),
    scoreActivity("partial-c2", dateInPeriod(windows.current, 1), 72),
    scoreActivity("partial-c3", dateInPeriod(windows.current, 2), 74),
    scoreActivity("partial-missing", dateInPeriod(windows.current, 3), null)
  ];
  const partialResult = buildLongTermGoalSummary({ phase2State: partial, plateState: { days: {} }, now: testNow }).goals[0];
  assert.equal(partialResult.comparisonReady, true);
  assert.equal(partialResult.completeness, "partial");
  assert.equal(partialResult.current.missingCount, 1);
  assert.equal(partialResult.status, "watch");
  assert.match(partialResult.insight, /changed from 82 to 72/);
}

function testLongTermSnapshotsAndDeletedEvidence() {
  const testNow = new Date(2026, 4, 28, 12, 0, 0);
  const goal = createLongTermGoal("average_product_quality", {
    id: "snapshot-quality",
    target: 5,
    durationDays: 14,
    startDate: new Date(2026, 4, 15, 0, 0, 0).toISOString(),
    now: testNow
  });
  const windows = getLongTermPeriodWindows(goal, testNow);
  const state = createEmptyPhase2State();
  state.longTermGoals = [goal];
  state.activities = [
    scoreActivity("snapshot-p1", dateInPeriod(windows.previous, 0), 70),
    scoreActivity("snapshot-p2", dateInPeriod(windows.previous, 1), 72),
    scoreActivity("snapshot-p3", dateInPeriod(windows.previous, 2), 74),
    scoreActivity("snapshot-c1", dateInPeriod(windows.current, 0), 80),
    scoreActivity("snapshot-c2", dateInPeriod(windows.current, 1), 82),
    scoreActivity("snapshot-c3", dateInPeriod(windows.current, 2), 84)
  ];

  const directSnapshot = createLongTermSnapshot({ phase2State: state, plateState: { days: {} }, goal, window: windows.previous, now: testNow });
  assert.equal(directSnapshot.periodStartKey, "2026-05-01");
  assert.equal(directSnapshot.metric.sampleCount, 3);

  state.longTermSnapshots = materializeClosedLongTermSnapshots({ phase2State: state, plateState: { days: {} }, now: testNow });
  assert.equal(state.longTermSnapshots.length, 1);
  assert.equal(state.longTermSnapshots[0].target, 5);
  assert.equal(buildLongTermGoalSummary({ phase2State: state, plateState: { days: {} }, now: testNow }).goals[0].comparisonReady, true);

  const edited = updateLongTermGoal(goal, { target: 12 }, testNow);
  const afterEdit = { ...state, longTermGoals: [edited] };
  const preserved = materializeClosedLongTermSnapshots({ phase2State: afterEdit, plateState: { days: {} }, now: testNow });
  assert.equal(preserved[0].target, 5);

  const deleted = {
    ...afterEdit,
    longTermSnapshots: preserved,
    activities: afterEdit.activities.filter((item) => item.id !== "snapshot-p1"),
    deletedItems: [{ id: "activity:snapshot-p1", kind: "activity", targetId: "snapshot-p1", deletedAt: testNow.toISOString() }]
  };
  const invalidated = buildLongTermGoalSummary({ phase2State: deleted, plateState: { days: {} }, now: testNow }).goals[0];
  assert.equal(invalidated.comparisonReady, false);
  assert.equal(invalidated.comparisonReason, "evidence-changed");
  assert.equal(invalidated.insight, "");
  assert.match(invalidated.detail, /corrected or deleted/);
}

function testLongTermLifecycleAndCardLimit() {
  const draft = createLongTermGoal("gym_routine", { id: "long-lifecycle", status: "draft", now });
  assert.equal(draft.status, "draft");
  assert.equal(draft.enabled, false);
  const active = transitionLongTermGoal(draft, "active", now);
  const paused = transitionLongTermGoal(active, "paused", now);
  const completed = transitionLongTermGoal(paused, "completed", now);
  const archived = transitionLongTermGoal(completed, "archived", now);
  assert.equal(active.enabled, true);
  assert.ok(paused.pausedAt);
  assert.ok(completed.completedAt);
  assert.ok(archived.archivedAt);
  const restarted = restartLongTermGoal(archived, { id: "long-restarted" }, now);
  assert.equal(restarted.status, "active");
  assert.equal(restarted.parentGoalId, archived.id);
  assert.equal(restarted.id, "long-restarted");

  const freezeStart = new Date("2026-06-01T08:00:00-04:00");
  const freezeGoal = createLongTermGoal("gym_routine", { id: "freeze-paused", startDate: freezeStart, now: freezeStart });
  const freezeState = createEmptyPhase2State();
  freezeState.longTermGoals = [transitionLongTermGoal(freezeGoal, "paused", now)];
  const pausedAtTransition = buildLongTermGoalSummary({ phase2State: freezeState, plateState: { days: {} }, now }).inactiveGoals[0];
  const pausedLater = buildLongTermGoalSummary({ phase2State: freezeState, plateState: { days: {} }, now: new Date("2026-10-01T12:00:00-04:00") }).inactiveGoals[0];
  assert.equal(pausedLater.current.dateRange, pausedAtTransition.current.dateRange);
  assert.equal(pausedLater.current.endAt, pausedAtTransition.current.endAt);

  const state = createEmptyPhase2State();
  state.longTermGoals = [
    createLongTermGoal("gym_routine", { id: "featured-1", now }),
    createLongTermGoal("protein_consistency", { id: "featured-2", now }),
    createLongTermGoal("reduce_soda", { id: "featured-3", now }),
    createLongTermGoal("average_product_quality", { id: "featured-4", now })
  ];
  const summary = buildLongTermGoalSummary({ phase2State: state, plateState: { days: {} }, now });
  assert.equal(summary.goals.length, 4);
  assert.equal(summary.featuredGoals.length, 3);
  assert.deepEqual(new Set(summary.goals.map((goal) => goal.insightType)), new Set(["frequency", "quality", "consistency"]));
}

function testLongTermIncompleteIngredientAndProteinEvidence() {
  const testNow = new Date(2026, 4, 28, 12, 0, 0);
  const ingredientGoal = createLongTermGoal("avoid_ingredient", {
    id: "ingredient-missing",
    trackedValue: "Red 40",
    durationDays: 14,
    startDate: new Date(2026, 4, 15, 0, 0, 0).toISOString(),
    now: testNow
  });
  const ingredientWindows = getLongTermPeriodWindows(ingredientGoal, testNow);
  const ingredientState = createEmptyPhase2State();
  ingredientState.longTermGoals = [ingredientGoal];
  ingredientState.activities = [{
    id: "missing-label",
    type: "product_scanned",
    source: "scan",
    occurredAt: dateInPeriod(ingredientWindows.current, 0),
    productId: "missing-label",
    metadata: { productName: "Unknown label", ingredients: [] }
  }];
  const ingredient = buildLongTermGoalSummary({ phase2State: ingredientState, plateState: { days: {} }, now: testNow }).goals[0];
  assert.equal(ingredient.current.sampleCount, 0);
  assert.equal(ingredient.current.missingCount, 1);
  assert.equal(ingredient.current.meetsThreshold, false);
  assert.equal(ingredient.insight, "");
  assert.match(ingredient.detail, /No reviewed ingredient labels/);

  const proteinGoal = createLongTermGoal("protein_consistency", {
    id: "protein-partial-period",
    durationDays: 14,
    startDate: new Date(2026, 4, 15, 0, 0, 0).toISOString(),
    now: testNow
  });
  const proteinWindows = getLongTermPeriodWindows(proteinGoal, testNow);
  const proteinState = createEmptyPhase2State();
  proteinState.longTermGoals = [proteinGoal];
  const plate = { goals: { protein: 100 }, days: {} };
  [0, 1].forEach((offset) => {
    const key = periodDateKey(proteinWindows.current, offset);
    plate.days[key] = { goalsSnapshot: { protein: 100 }, entries: [plateEntry("protein-" + offset, { protein: offset ? 80 : 110 })] };
  });
  const protein = buildLongTermGoalSummary({ phase2State: proteinState, plateState: plate, now: testNow }).goals[0];
  assert.equal(protein.current.sampleCount, 2);
  assert.equal(protein.current.missingCount, 12);
  assert.equal(protein.current.meetsThreshold, false);
  assert.equal(protein.comparisonReady, false);
}

function testLongTermStateMigrationAndSnapshotMerge() {
  const legacy = sanitizePhase2State({
    version: 2,
    longTermGoals: [{ id: "legacy-long", templateId: "gym_routine", enabled: false, target: 2, durationDays: 56 }]
  });
  assert.equal(legacy.version, PHASE2_STATE_VERSION);
  assert.equal(legacy.longTermGoals[0].status, "paused");
  assert.deepEqual(legacy.longTermSnapshots, []);

  const testNow = new Date(2026, 4, 28, 12, 0, 0);
  const goal = createLongTermGoal("average_product_quality", {
    id: "merge-long",
    durationDays: 14,
    startDate: new Date(2026, 4, 15, 0, 0, 0).toISOString(),
    now: testNow
  });
  const windows = getLongTermPeriodWindows(goal, testNow);
  const local = createEmptyPhase2State();
  local.longTermGoals = [goal];
  local.activities = [
    scoreActivity("merge-p1", dateInPeriod(windows.previous, 0), 70),
    scoreActivity("merge-p2", dateInPeriod(windows.previous, 1), 72),
    scoreActivity("merge-p3", dateInPeriod(windows.previous, 2), 74)
  ];
  const snapshot = createLongTermSnapshot({ phase2State: local, plateState: { days: {} }, goal, window: windows.previous, now: testNow });
  local.longTermSnapshots = [snapshot];
  local.updatedAt = "2026-05-28T10:00:00.000Z";
  const cloud = createEmptyPhase2State();
  cloud.longTermSnapshots = [{ ...snapshot, target: 99 }];
  cloud.updatedAt = "2026-05-28T11:00:00.000Z";
  const merged = mergePhase2States(local, cloud);
  assert.equal(merged.longTermSnapshots.length, 1);
  assert.equal(merged.longTermSnapshots[0].target, snapshot.target);
}
const DAY_FOR_TEST = 12 * 60 * 60 * 1000;
testStateSanitationAndMerge();
testLocalWeekBoundaries();
testZeroEvidenceAndDirectionSemantics();
testPartialNutritionEvidence();
testEvidenceDeduplicationAndCorrection();
testWeeklyGoalLifecycle();
testImmutableWeeklySnapshots();
testPhase2MigrationAndSnapshotMerge();
testWeeklyGoals();
testLongTermGoals();
testStableLongTermPeriodsAndThresholds();
testLongTermComparabilityAndPartialData();
testLongTermSnapshotsAndDeletedEvidence();
testLongTermLifecycleAndCardLimit();
testLongTermIncompleteIngredientAndProteinEvidence();
testLongTermStateMigrationAndSnapshotMerge();
testGoalFitDoesNotInventValues();
testMenuRanking();
testReceiptParser();
testLocationDetection();
testNudgePrivacyAndTone();
testPreparationAndPersonalFit();
testDeletionTombstonesAndMetadata();
testStaleContextDoesNotNudge();

console.log("Phase 2 domain tests passed.");
