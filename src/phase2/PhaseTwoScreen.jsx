import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarRange,
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  FileText,
  Info,
  MapPin,
  Navigation,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Target,
  Trash2,
  TrendingUp,
  Utensils,
  X
} from "lucide-react";
import { LOCATION_CONTEXT_TYPES, getLocationContextMeta } from "../data/locationContextTypes";
import {
  LONG_TERM_GOAL_TEMPLATES,
  MENU_DATA_CONFIDENCE,
  WEEKLY_GOAL_TEMPLATES,
  getMenuConfidence
} from "../data/restaurantGoalRules";
import { buildContextualNudge, canSendContextNotification } from "../lib/contextualNudgeEngine";
import { analyzeGoalFit, analyzePreparationDetails } from "../lib/goalFitAnalyzer";
import { detectLocationContext, requestCurrentPosition } from "../lib/locationContextDetector";
import { buildLongTermGoalSummary, createLongTermGoal } from "../lib/longTermGoalEngine";
import { createPhase2DeletionPatch, createPhase2Id, touchPhase2State } from "../lib/phase2State";
import { canUseBrowserTextRecognition, extractReceiptTextFromImage } from "../lib/receiptOcr";
import { parseReceiptText, receiptConfidenceCopy } from "../lib/receiptParser";
import { rankMenuItemsForGoals as rankMenuItems } from "../lib/goalFitAnalyzer";
import { buildWeeklyGoalSummary, createWeeklyGoal, formatMetric } from "../lib/weeklyGoalEngine";
import "./phase2.css";

const VIEWS = [
  { id: "week", label: "This week", icon: CalendarRange },
  { id: "places", label: "Places", icon: MapPin },
  { id: "capture", label: "Capture", icon: ReceiptText },
  { id: "trends", label: "Trends", icon: TrendingUp }
];

const NUTRIENT_FIELDS = [
  ["calories", "Calories", "kcal"],
  ["protein", "Protein", "g"],
  ["carbs", "Carbs", "g"],
  ["fat", "Fat", "g"],
  ["sugar", "Sugar", "g"],
  ["sodium", "Sodium", "mg"]
];

const CAPTURE_TYPES = [
  { id: "receipt", label: "Receipt", helper: "Receipt item names can be matched to menu items you already saved." },
  { id: "menu", label: "Menu", helper: "Read menu text, then confirm the restaurant and items." },
  { id: "order_screen", label: "Order screen", helper: "Use visible order text and review every detected item." },
  { id: "nutrition_board", label: "Nutrition board", helper: "Capture published values, then confirm them before logging." },
  { id: "grocery_receipt", label: "Grocery receipt", helper: "Review product names before they count toward any goal." },
  { id: "takeout_bag", label: "Takeout bag", helper: "If a name is visible, add it as review text; packaging alone may not identify a meal." },
  { id: "food_photo", label: "Food photo", helper: "Food appearance is not treated as exact nutrition. Enter the item name for a manual match." }
];

function numeric(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function knownNutrition(value) {
  return Object.values(value || {}).some((item) => numeric(item) !== null);
}

function canLogNutrition(value) {
  return numeric(value?.calories) !== null
    && [value?.protein, value?.carbs, value?.fat].some((item) => numeric(item) !== null);
}

function cleanList(value) {
  return String(value || "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 80);
}

function formatDateRange(window) {
  return `${window.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(window.end.getTime() - 1).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function buildMenuItem(form) {
  return {
    id: createPhase2Id("menu"),
    name: form.itemName.trim(),
    description: form.description.trim(),
    category: "meal",
    servingSize: form.servingSize.trim() || "1 item",
    nutrition: Object.fromEntries(NUTRIENT_FIELDS.flatMap(([key]) => {
      const value = numeric(form[key]);
      return value === null ? [] : [[key, value]];
    })),
    ingredients: cleanList(form.ingredients),
    confidence: form.confidence,
    sourceNote: form.sourceNote.trim(),
    updatedAt: new Date().toISOString()
  };
}

function createMealFromMenuItem(restaurant, item, fit, source = "manual", overrides = {}) {
  return {
    id: createPhase2Id("meal"),
    restaurantId: restaurant?.id || "",
    restaurantName: restaurant?.name || overrides.restaurantName || "Restaurant",
    placeId: overrides.placeId || "",
    placeType: restaurant?.type || overrides.placeType || "restaurant",
    itemName: item.name,
    servingSize: item.servingSize || "1 item",
    nutrition: item.nutrition || {},
    ingredients: item.ingredients || [],
    confidence: item.confidence || "unknown",
    sourceNote: item.sourceNote || "",
    goalFit: fit.state,
    occurredAt: new Date().toISOString(),
    addedToPlate: false,
    plateEntryId: "",
    receiptReviewId: overrides.receiptReviewId || "",
    source
  };
}

export default function PhaseTwoScreen({
  phase2State,
  plateState,
  dailyTotals,
  personalProfile,
  onChange,
  onBack,
  onOpenScan,
  onLogMeal
}) {
  const [view, setView] = useState("week");
  const weeklySummary = useMemo(
    () => buildWeeklyGoalSummary({ phase2State, plateState }),
    [phase2State, plateState]
  );
  const longTermSummary = useMemo(
    () => buildLongTermGoalSummary({ phase2State, plateState }),
    [phase2State, plateState]
  );
  const nudge = useMemo(
    () => buildContextualNudge({ phase2State, weeklySummary }),
    [phase2State, weeklySummary]
  );

  useEffect(() => {
    if (!nudge) return;
    const alreadyRecorded = phase2State.activities.some((item) => item.type === "nudge_shown" && item.metadata?.nudgeId === nudge.id);
    if (alreadyRecorded) return;
    const occurredAt = new Date().toISOString();
    onChange((current) => ({
      activities: [{
        id: createPhase2Id("activity"),
        type: "nudge_shown",
        occurredAt,
        source: "manual",
        metadata: { nudgeId: nudge.id }
      }, ...current.activities]
    }));
    if (canSendContextNotification(phase2State.settings) && typeof document !== "undefined" && document.visibilityState !== "visible") {
      try {
        new Notification(nudge.title, { body: nudge.message, tag: "ziya-" + nudge.id });
      } catch {
        // The in-app nudge remains available if this browser blocks notification construction.
      }
    }
  }, [nudge, onChange, phase2State.activities, phase2State.settings]);

  function update(updater) {
    onChange((current) => touchPhase2State(current, typeof updater === "function" ? updater(current) : updater));
  }

  function dismissNudge() {
    if (!nudge) return;
    update((current) => ({ dismissedNudges: [{ id: nudge.id, dismissedAt: new Date().toISOString() }, ...current.dismissedNudges] }));
  }

  function useNudgeAction() {
    if (!nudge) return;
    if (nudge.actionType === "open-scan") onOpenScan();
    else if (nudge.actionType === "confirm-place") confirmDetectedVisit();
    else setView(nudge.actionType === "open-week" || nudge.actionType === "open-goals" ? "week" : "places");
    dismissNudge();
  }

  function confirmDetectedVisit() {
    const context = phase2State.currentContext;
    if (!context) return;
    const meta = getLocationContextMeta(context.type);
    const now = new Date();
    update((current) => {
      const duplicate = current.activities.some((item) => item.type === meta.activityType
        && item.placeId === context.placeId
        && now.getTime() - Date.parse(item.occurredAt) < 4 * 60 * 60 * 1000);
      return {
        currentContext: { ...context, confirmed: true },
        activities: duplicate ? current.activities : [{
          id: createPhase2Id("activity"),
          type: meta.activityType,
          occurredAt: now.toISOString(),
          source: "location-confirmed",
          placeId: context.placeId,
          metadata: { placeName: context.name, distanceMeters: context.distanceMeters }
        }, ...current.activities]
      };
    });
  }

  return (
    <div className="phase2-screen stack">
      <header className="phase2-header">
        <button type="button" className="phase2-back" onClick={onBack} aria-label="Back to Top"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">Goals & places</span><h1>Your direction</h1><p>Daily choices in the context of your week.</p></div>
      </header>

      <div className="phase2-tabs" role="tablist" aria-label="Goals and places">
        {VIEWS.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} role="tab" aria-selected={view === item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon size={17} /><span>{item.label}</span></button>;
        })}
      </div>

      {nudge && (
        <section className={`phase2-nudge ${nudge.kind}`}>
          <span><Info size={18} /></span>
          <div><strong>{nudge.title}</strong><p>{nudge.message}</p><button type="button" onClick={useNudgeAction}>{nudge.action}<ChevronRight size={15} /></button></div>
          <button type="button" className="phase2-nudge-close" onClick={dismissNudge} aria-label="Dismiss nudge"><X size={17} /></button>
        </section>
      )}

      {view === "week" && <WeeklyGoalsPanel state={phase2State} summary={weeklySummary} onChange={update} />}
      {view === "places" && (
        <PlacesPanel
          state={phase2State}
          weeklySummary={weeklySummary}
          dailyTotals={dailyTotals}
          dailyGoals={plateState.goals}
          personalProfile={personalProfile}
          onChange={update}
          onConfirmVisit={confirmDetectedVisit}
          onLogMeal={onLogMeal}
        />
      )}
      {view === "capture" && (
        <ReceiptPanel
          state={phase2State}
          weeklySummary={weeklySummary}
          dailyTotals={dailyTotals}
          dailyGoals={plateState.goals}
          personalProfile={personalProfile}
          onChange={update}
          onLogMeal={onLogMeal}
        />
      )}
      {view === "trends" && <LongTermGoalsPanel state={phase2State} summary={longTermSummary} onChange={update} />}
    </div>
  );
}
function WeeklyGoalsPanel({ state, summary, onChange }) {
  const [templateId, setTemplateId] = useState(WEEKLY_GOAL_TEMPLATES[0].id);
  const template = WEEKLY_GOAL_TEMPLATES.find((item) => item.id === templateId);
  const [target, setTarget] = useState(String(template.defaultTarget));

  useEffect(() => setTarget(String(template.defaultTarget)), [template.id]);

  function addGoal(event) {
    event.preventDefault();
    if (state.weeklyGoals.some((goal) => goal.templateId === template.id)) return;
    const goal = createWeeklyGoal(template.id, { target });
    onChange((current) => ({ weeklyGoals: [...current.weeklyGoals, goal] }));
  }

  return (
    <div className="stack phase2-view">
      <section className="phase2-summary-band">
        <div><span className="eyebrow">{formatDateRange(summary.window)}</span><h2>A flexible week</h2><p>{summary.goals.length ? `${summary.onTrackCount} of ${summary.goals.length} goals have room or are reached.` : "Choose a few goals that reflect the pattern you want to build."}</p></div>
        <span className="phase2-summary-count"><strong>{summary.goals.length}</strong><small>active</small></span>
      </section>

      {summary.goals.length ? (
        <section className="phase2-panel">
          <div className="phase2-section-heading"><div><span className="eyebrow">Progress</span><h2>This week</h2></div><Target size={19} /></div>
          <div className="phase2-goal-list">
            {summary.goals.map((goal) => (
              <div className="phase2-goal-row" key={goal.id}>
                <div className="phase2-goal-copy"><strong>{goal.label}</strong><small>{formatMetric(goal.current)} of {formatMetric(goal.target)} {goal.unit}{goal.partial ? " · Partial total" : ""}</small></div>
                <div className="phase2-progress" aria-hidden="true"><i style={{ width: `${goal.progress}%` }} /></div>
                <span>{goal.summary}</span>
                <button type="button" onClick={() => onChange((current) => createPhase2DeletionPatch(current, "weeklyGoal", [goal.id], { weeklyGoals: current.weeklyGoals.filter((item) => item.id !== goal.id) }))} aria-label={`Remove ${goal.label}`}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="phase2-empty"><Target size={24} /><strong>Build your week</strong><p>Weekly goals give single meals more context without turning a day into pass or fail.</p></section>
      )}

      <form className="phase2-panel phase2-add-goal" onSubmit={addGoal}>
        <div className="phase2-section-heading"><div><span className="eyebrow">Add a goal</span><h2>Choose one useful signal</h2></div><Plus size={19} /></div>
        <label><span>Goal</span><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{WEEKLY_GOAL_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <p>{template.description}</p>
        <label><span>Weekly target</span><span className="phase2-number-input"><input type="number" inputMode="decimal" min="0.1" step="any" value={target} onChange={(event) => setTarget(event.target.value)} required /><em>{template.unit}</em></span></label>
        <button className="primary-button" type="submit" disabled={state.weeklyGoals.some((goal) => goal.templateId === template.id)}><Plus size={18} />{state.weeklyGoals.some((goal) => goal.templateId === template.id) ? "Already tracking" : "Add weekly goal"}</button>
      </form>
    </div>
  );
}

function PlacesPanel({ state, weeklySummary, dailyTotals, dailyGoals, personalProfile, onChange, onConfirmVisit, onLogMeal }) {
  const [locationStatus, setLocationStatus] = useState("");
  const [placeForm, setPlaceForm] = useState({ name: "", type: "gym", radiusMeters: "150", latitude: "", longitude: "" });
  const [mealForm, setMealForm] = useState({
    restaurantName: "",
    placeType: "restaurant",
    itemName: "",
    description: "",
    servingSize: "1 item",
    ingredients: "",
    confidence: "user_confirmed",
    sourceNote: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    sugar: "",
    sodium: ""
  });
  const [mealDraft, setMealDraft] = useState(null);

  useEffect(() => {
    const context = state.currentContext;
    if (!context || !["restaurant", "fast_food", "cafe"].includes(context.type)) return;
    setMealForm((current) => current.restaurantName ? current : { ...current, restaurantName: context.name, placeType: context.type });
  }, [state.currentContext]);

  function setSetting(key, value) {
    onChange((current) => ({ settings: { ...current.settings, [key]: value, updatedAt: new Date().toISOString() } }));
  }

  async function useCurrentLocationForPlace() {
    setLocationStatus("Checking your location once…");
    try {
      const position = await requestCurrentPosition();
      setPlaceForm((current) => ({ ...current, latitude: String(position.latitude), longitude: String(position.longitude) }));
      setLocationStatus("Location added to this saved place. Review, then save.");
      setSetting("locationPermission", "granted");
    } catch (error) {
      setLocationStatus(error.message || "Location could not be checked.");
      setSetting("locationPermission", error.code === "denied" ? "denied" : "unavailable");
    }
  }

  function savePlace(event) {
    event.preventDefault();
    const latitude = Number(placeForm.latitude);
    const longitude = Number(placeForm.longitude);
    if (!placeForm.name.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setLocationStatus("Add a name and a valid location before saving.");
      return;
    }
    const now = new Date().toISOString();
    onChange((current) => ({
      savedPlaces: [{
        id: createPhase2Id("place"),
        name: placeForm.name.trim(),
        type: placeForm.type,
        latitude,
        longitude,
        radiusMeters: Math.max(30, Math.min(1000, Number(placeForm.radiusMeters) || 150)),
        createdAt: now,
        updatedAt: now
      }, ...current.savedPlaces]
    }));
    setPlaceForm({ name: "", type: "gym", radiusMeters: "150", latitude: "", longitude: "" });
    setLocationStatus("Saved. Ziya only checks it when you ask.");
  }

  async function checkNearby() {
    if (!state.settings.locationEnabled) {
      setLocationStatus("Turn on one-time place checks first.");
      return;
    }
    setLocationStatus("Checking nearby saved places…");
    onChange((current) => ({ settings: { ...current.settings, locationPermission: "requesting", updatedAt: new Date().toISOString() } }));
    try {
      const result = await detectLocationContext(state.savedPlaces);
      onChange((current) => ({
        currentContext: result.context,
        settings: { ...current.settings, locationPermission: "granted", lastLocationCheckAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }));
      setLocationStatus(result.context ? `${result.context.name} is within its saved radius. Confirm before it counts.` : "No saved place is nearby. Nothing was logged.");
    } catch (error) {
      onChange((current) => ({ settings: { ...current.settings, locationPermission: error.code === "denied" ? "denied" : "unavailable", updatedAt: new Date().toISOString() } }));
      setLocationStatus(error.message || "Location could not be checked.");
    }
  }

  function logManualActivity(type) {
    onChange((current) => ({ activities: [{ id: createPhase2Id("activity"), type, occurredAt: new Date().toISOString(), source: "manual", metadata: {} }, ...current.activities] }));
  }

  function compareMeal(event) {
    event.preventDefault();
    if (!mealForm.restaurantName.trim() || !mealForm.itemName.trim()) return;
    const item = buildMenuItem(mealForm);
    const existing = state.restaurants.find((restaurant) => restaurant.name.toLowerCase() === mealForm.restaurantName.trim().toLowerCase());
    const now = new Date().toISOString();
    const restaurant = existing || {
      id: createPhase2Id("restaurant"),
      name: mealForm.restaurantName.trim(),
      type: mealForm.placeType,
      region: "",
      source: "user",
      menuItems: [],
      createdAt: now,
      updatedAt: now
    };
    const nextRestaurant = { ...restaurant, type: mealForm.placeType, menuItems: [item, ...restaurant.menuItems.filter((entry) => entry.name.toLowerCase() !== item.name.toLowerCase())], updatedAt: now };
    onChange((current) => ({ restaurants: [nextRestaurant, ...current.restaurants.filter((entry) => entry.id !== nextRestaurant.id)] }));
    const fit = analyzeGoalFit({ nutrition: item.nutrition, ingredients: item.ingredients, profile: personalProfile, dailyTotals, dailyGoals, weeklySummary, placeType: nextRestaurant.type, confidence: item.confidence });
    const matchingContext = state.currentContext && state.currentContext.name.toLowerCase() === nextRestaurant.name.toLowerCase() ? state.currentContext : null;
    setMealDraft({ meal: createMealFromMenuItem(nextRestaurant, item, fit, "manual", { placeId: matchingContext?.placeId || "" }), fit, restaurant: nextRestaurant, item });
  }

  function logDraft(addToPlate) {
    if (!mealDraft) return;
    onLogMeal(mealDraft.meal, addToPlate);
    setMealDraft(null);
    setMealForm((current) => ({ ...current, itemName: "", description: "", ingredients: "", sourceNote: "", calories: "", protein: "", carbs: "", fat: "", sugar: "", sodium: "" }));
  }

  const rankedSavedItems = mealDraft ? rankMenuItems(mealDraft.restaurant.menuItems.filter((item) => item.id !== mealDraft.item.id), {
    dailyTotals,
    dailyGoals,
    weeklySummary,
    profile: personalProfile,
    placeType: mealDraft.restaurant.type
  }).slice(0, 2) : [];

  return (
    <div className="stack phase2-view">
      <section className="phase2-panel">
        <div className="phase2-section-heading"><div><span className="eyebrow">Optional context</span><h2>One-time place checks</h2></div><Navigation size={19} /></div>
        <p className="phase2-helper">Ziya never checks continuously. Permission is used only after you tap Check nearby.</p>
        <label className="phase2-switch-row"><span><strong>Place checks</strong><small>Match your current location to places you saved.</small></span><input type="checkbox" checked={state.settings.locationEnabled} onChange={(event) => setSetting("locationEnabled", event.target.checked)} /></label>
        <button className="primary-button" type="button" onClick={checkNearby} disabled={!state.settings.locationEnabled || !state.savedPlaces.length}><MapPin size={18} />Check nearby now</button>
        {locationStatus && <p className="phase2-status" role="status">{locationStatus}</p>}
        {state.currentContext && (
          <div className="phase2-detected-place"><span><MapPin size={18} /></span><div><strong>{state.currentContext.name}</strong><small>{getLocationContextMeta(state.currentContext.type).label} · about {state.currentContext.distanceMeters} m away</small></div>{state.currentContext.confirmed ? <em><Check size={14} />Confirmed</em> : <button type="button" onClick={onConfirmVisit}>Confirm visit</button>}</div>
        )}
      </section>

      <details className="phase2-disclosure">
        <summary><span><MapPin size={18} /><strong>Saved places</strong><small>{state.savedPlaces.length ? `${state.savedPlaces.length} saved` : "Add a gym, store, or restaurant"}</small></span><ChevronRight size={18} /></summary>
        <div className="phase2-disclosure-body">
          {state.savedPlaces.map((place) => <div className="phase2-simple-row" key={place.id}><span><strong>{place.name}</strong><small>{getLocationContextMeta(place.type).label} · {place.radiusMeters} m radius</small></span><button type="button" onClick={() => onChange((current) => createPhase2DeletionPatch(current, "savedPlace", [place.id], { savedPlaces: current.savedPlaces.filter((item) => item.id !== place.id) }))} aria-label={`Remove ${place.name}`}><Trash2 size={16} /></button></div>)}
          <form className="phase2-form" onSubmit={savePlace}>
            <label><span>Place name</span><input value={placeForm.name} onChange={(event) => setPlaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="My gym" required /></label>
            <div className="phase2-form-grid"><label><span>Type</span><select value={placeForm.type} onChange={(event) => setPlaceForm((current) => ({ ...current, type: event.target.value }))}>{Object.values(LOCATION_CONTEXT_TYPES).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>Radius</span><span className="phase2-number-input"><input type="number" min="30" max="1000" value={placeForm.radiusMeters} onChange={(event) => setPlaceForm((current) => ({ ...current, radiusMeters: event.target.value }))} /><em>m</em></span></label></div>
            <button className="secondary-button" type="button" onClick={useCurrentLocationForPlace}><Navigation size={17} />Use current location</button>
            <button className="primary-button" type="submit" disabled={!placeForm.latitude || !placeForm.longitude}><Plus size={17} />Save place</button>
          </form>
        </div>
      </details>

      <section className="phase2-panel">
        <div className="phase2-section-heading"><div><span className="eyebrow">Quick log</span><h2>Confirm an activity</h2></div><Dumbbell size={19} /></div>
        <div className="phase2-quick-actions"><button type="button" onClick={() => logManualActivity("gym_visit")}><Dumbbell size={18} /><span><strong>Gym visit</strong><small>Counts when you confirm it</small></span></button><button type="button" onClick={() => logManualActivity("grocery_scan")}><ShoppingCart size={18} /><span><strong>Grocery scan</strong><small>Add one weekly scan</small></span></button></div>
      </section>

      <form className="phase2-panel phase2-form" onSubmit={compareMeal}>
        <div className="phase2-section-heading"><div><span className="eyebrow">Restaurant meal</span><h2>See how an option fits</h2></div><Utensils size={19} /></div>
        <p className="phase2-helper">Enter published or label details when you have them. Estimates remain marked for review.</p>
        <div className="phase2-form-grid"><label><span>Restaurant</span><input value={mealForm.restaurantName} onChange={(event) => setMealForm((current) => ({ ...current, restaurantName: event.target.value }))} list="saved-restaurants" placeholder="Restaurant name" required /><datalist id="saved-restaurants">{state.restaurants.map((item) => <option value={item.name} key={item.id} />)}</datalist></label><label><span>Place type</span><select value={mealForm.placeType} onChange={(event) => setMealForm((current) => ({ ...current, placeType: event.target.value }))}><option value="restaurant">Restaurant</option><option value="fast_food">Quick service</option><option value="cafe">Cafe</option></select></label></div>
        <label><span>Menu item</span><input value={mealForm.itemName} onChange={(event) => setMealForm((current) => ({ ...current, itemName: event.target.value }))} placeholder="Item name" required /></label>
        <div className="phase2-form-grid"><label><span>Serving</span><input value={mealForm.servingSize} onChange={(event) => setMealForm((current) => ({ ...current, servingSize: event.target.value }))} placeholder="1 item" /></label><label><span>Data confidence</span><select value={mealForm.confidence} onChange={(event) => setMealForm((current) => ({ ...current, confidence: event.target.value }))}>{Object.values(MENU_DATA_CONFIDENCE).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label></div>
        <label><span>Source or note</span><input value={mealForm.sourceNote} onChange={(event) => setMealForm((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="Example: restaurant nutrition page" /></label>
        <label><span>Ingredients or preparation details</span><textarea rows="3" value={mealForm.ingredients} onChange={(event) => setMealForm((current) => ({ ...current, ingredients: event.target.value }))} placeholder="Only enter details available from the menu or label" /></label>
        <div className="phase2-nutrition-grid">{NUTRIENT_FIELDS.map(([key, label, unit]) => <label key={key}><span>{label}</span><span className="phase2-number-input"><input type="number" min="0" step="any" inputMode="decimal" value={mealForm[key]} onChange={(event) => setMealForm((current) => ({ ...current, [key]: event.target.value }))} placeholder="—" /><em>{unit}</em></span></label>)}</div>
        <button className="primary-button" type="submit"><Target size={18} />Compare with my goals</button>
      </form>

      {mealDraft && (
        <section className="phase2-panel phase2-fit-card">
          <div className="phase2-section-heading"><div><span className="eyebrow">{getMenuConfidence(mealDraft.item.confidence).label}</span><h2>{mealDraft.item.name}</h2></div><span className={`phase2-fit-pill ${mealDraft.fit.state}`}>{mealDraft.fit.label}</span></div>
          <p>{mealDraft.fit.summary}</p>
          {[...mealDraft.fit.reasons, ...mealDraft.fit.cautions].map((reason) => <div className="phase2-reason" key={reason}><span /><p>{reason}</p></div>)}
          {(() => {
            const preparation = analyzePreparationDetails(mealDraft.item.ingredients);
            return <div className="phase2-evidence"><strong>{preparation.label}</strong><span>{preparation.summary}</span>{mealDraft.item.ingredients.length > 0 && <small>Available details: {mealDraft.item.ingredients.join(", ")}</small>}{mealDraft.item.sourceNote && <small>Source note: {mealDraft.item.sourceNote}</small>}</div>;
          })()}
          {rankedSavedItems.length > 0 && <div className="phase2-saved-options"><strong>Other saved options</strong>{rankedSavedItems.map(({ item, fit }) => <div key={item.id}><span><b>{item.name}</b><small>{fit.label}</small></span><em>{getMenuConfidence(item.confidence).label}</em></div>)}</div>}
          <div className="phase2-actions"><button className="secondary-button" type="button" onClick={() => logDraft(false)}>Save meal</button><button className="primary-button" type="button" disabled={!canLogNutrition(mealDraft.item.nutrition)} onClick={() => logDraft(true)}><Plus size={17} />{canLogNutrition(mealDraft.item.nutrition) ? "Add to Today’s Plate" : "Nutrition needed"}</button></div>
        </section>
      )}

      <PrivacyControls state={state} onChange={onChange} />
    </div>
  );
}

function ReceiptPanel({ state, weeklySummary, dailyTotals, dailyGoals, personalProfile, onChange, onLogMeal }) {
  const [captureKind, setCaptureKind] = useState("receipt");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [review, setReview] = useState(null);
  const [addKnownToPlate, setAddKnownToPlate] = useState(true);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function readPhoto() {
    if (!photo) return;
    setStatus("Reading visible text…");
    const result = await extractReceiptTextFromImage(photo);
    if (result.text) setText(result.text);
    setStatus(result.message);
  }

  function parse(event) {
    event.preventDefault();
    const result = parseReceiptText(text, { restaurants: state.restaurants });
    setReview(result);
    setStatus(receiptConfidenceCopy(result.confidence));
  }

  function updateReviewItem(id, patch) {
    setReview((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  }

  function saveReview() {
    if (!review) return;
    const id = createPhase2Id("receipt");
    const now = new Date().toISOString();
    const confirmedItems = review.items.filter((item) => item.confirmed);
    const record = {
      id,
      restaurantName: review.restaurantName,
      originalText: state.settings.saveReceiptText ? text : "",
      captureKind,
      photoName: photo?.name || "",
      photoStored: false,
      status: confirmedItems.length ? "confirmed" : "needs-confirmation",
      confidence: review.confidence,
      items: review.items,
      createdAt: now,
      updatedAt: now
    };
    onChange((current) => ({ receiptReviews: [record, ...current.receiptReviews] }));
    confirmedItems.forEach((item) => {
      const menuItem = {
        id: item.menuItemId || createPhase2Id("menu"),
        name: item.name,
        servingSize: item.servingSize || "1 item",
        nutrition: item.nutrition || {},
        ingredients: item.ingredients || [],
        sourceNote: item.sourceNote || "",
        confidence: item.menuItemId ? "receipt_match" : "unknown"
      };
      const restaurant = review.restaurant || { id: "", name: review.restaurantName || "Restaurant", type: "restaurant" };
      const fit = analyzeGoalFit({ nutrition: menuItem.nutrition, ingredients: menuItem.ingredients, profile: personalProfile, dailyTotals, dailyGoals, weeklySummary, placeType: restaurant.type, confidence: menuItem.confidence });
      const meal = createMealFromMenuItem(restaurant, menuItem, fit, "receipt", { receiptReviewId: id, restaurantName: review.restaurantName });
      onLogMeal(meal, addKnownToPlate && canLogNutrition(menuItem.nutrition));
    });
    setReview(null);
    setPhoto(null);
    setText("");
    setStatus(confirmedItems.length ? "Confirmed items were saved." : "Receipt review saved for later confirmation.");
  }

  return (
    <div className="stack phase2-view">
      <section className="phase2-summary-band">
        <div><span className="eyebrow">Photo or receipt</span><h2>Review before logging</h2><p>Ziya separates text recognition from confirmation, so uncertain matches never become exact nutrition.</p></div>
        <span className="phase2-summary-count"><strong>{state.receiptReviews.length}</strong><small>saved</small></span>
      </section>

      <form className="phase2-panel phase2-form" onSubmit={parse}>
        <div className="phase2-section-heading"><div><span className="eyebrow">Step 1</span><h2>Add a photo or text</h2></div><Camera size={19} /></div>
        <label><span>What are you reviewing?</span><select value={captureKind} onChange={(event) => setCaptureKind(event.target.value)}>{CAPTURE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <p className="phase2-helper">{CAPTURE_TYPES.find((item) => item.id === captureKind)?.helper}</p>
        <label className="phase2-upload">
          {preview ? <img src={preview} alt={(CAPTURE_TYPES.find((item) => item.id === captureKind)?.label || "Capture") + " preview"} /> : <span><Camera size={24} /><strong>Take or choose a photo</strong><small>The photo stays on this device and is not saved by default.</small></span>}
          <input type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
        </label>
        {photo && <button className="secondary-button" type="button" onClick={readPhoto}><FileText size={17} />{canUseBrowserTextRecognition() ? "Read text from photo" : "Check photo support"}</button>}
        <label><span>Receipt or menu text</span><textarea rows="7" value={text} onChange={(event) => setText(event.target.value)} placeholder={'Restaurant name\n1x Menu item 12.50\nAnother item 5.00'} required /></label>
        {status && <p className="phase2-status" role="status">{status}</p>}
        <button className="primary-button" type="submit"><ReceiptText size={18} />Review detected items</button>
      </form>

      {review && (
        <section className="phase2-panel">
          <div className="phase2-section-heading"><div><span className="eyebrow">Step 2 · {review.confidence}</span><h2>Confirm the match</h2></div><ShieldCheck size={19} /></div>
          <label className="phase2-inline-field"><span>Restaurant</span><input value={review.restaurantName} onChange={(event) => setReview((current) => ({ ...current, restaurantName: event.target.value }))} /></label>
          <div className="phase2-receipt-items">
            {review.items.length ? review.items.map((item) => (
              <div key={item.id} className={item.confirmed ? "confirmed" : ""}>
                <button type="button" className="phase2-confirm-box" onClick={() => updateReviewItem(item.id, { confirmed: !item.confirmed })} aria-label={`${item.confirmed ? "Unconfirm" : "Confirm"} ${item.name}`}>{item.confirmed && <Check size={15} />}</button>
                <span><input value={item.name} onChange={(event) => updateReviewItem(item.id, { name: event.target.value })} /><small>{item.menuItemId ? `${item.confidence} menu match` : "Needs menu details"}{canLogNutrition(item.nutrition) ? " · Ready to log" : knownNutrition(item.nutrition) ? " · Partial nutrition" : " · Nutrition missing"}</small></span>
              </div>
            )) : <div className="phase2-empty compact"><Info size={20} /><strong>No confident items found</strong><p>Edit the receipt text and try again.</p></div>}
          </div>
          <label className="phase2-switch-row"><span><strong>Add known nutrition to Today’s Plate</strong><small>Only confirmed items with usable values are added.</small></span><input type="checkbox" checked={addKnownToPlate} onChange={(event) => setAddKnownToPlate(event.target.checked)} /></label>
          <button className="primary-button" type="button" onClick={saveReview}><Check size={18} />Save confirmed review</button>
        </section>
      )}

      {state.receiptReviews.length > 0 && (
        <section className="phase2-panel">
          <div className="phase2-section-heading"><div><span className="eyebrow">Recent</span><h2>Receipt reviews</h2></div><ReceiptText size={19} /></div>
          {state.receiptReviews.slice(0, 5).map((item) => <div className="phase2-simple-row" key={item.id}><span><strong>{item.restaurantName || "Receipt review"}</strong><small>{item.items.filter((entry) => entry.confirmed).length} confirmed · {getMenuConfidence(item.items.find((entry) => entry.menuItemId)?.confidence === "high" ? "receipt_match" : "unknown").label}</small></span><em>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</em></div>)}
        </section>
      )}
    </div>
  );
}

function LongTermGoalsPanel({ state, summary, onChange }) {
  const [templateId, setTemplateId] = useState(LONG_TERM_GOAL_TEMPLATES[0].id);
  const template = LONG_TERM_GOAL_TEMPLATES.find((item) => item.id === templateId);
  const [target, setTarget] = useState(String(template.defaultTarget));
  const [trackedValue, setTrackedValue] = useState("");

  useEffect(() => {
    setTarget(String(template.defaultTarget));
    setTrackedValue("");
  }, [template.id]);

  function addGoal(event) {
    event.preventDefault();
    if (template.requiresValue && !trackedValue.trim()) return;
    if (state.longTermGoals.some((goal) => goal.templateId === template.id && goal.trackedValue.toLowerCase() === trackedValue.trim().toLowerCase())) return;
    const goal = createLongTermGoal(template.id, { target, trackedValue });
    onChange((current) => ({ longTermGoals: [...current.longTermGoals, goal] }));
  }

  return (
    <div className="stack phase2-view">
      <section className="phase2-summary-band">
        <div><span className="eyebrow">Long-term direction</span><h2>Consistency over perfection</h2><p>{summary.dataReadyCount ? `${summary.dataReadyCount} goals have enough activity for an early trend.` : "Trends become more useful as you log real choices over time."}</p></div>
        <span className="phase2-summary-count"><strong>{summary.onTrackCount}</strong><small>on track</small></span>
      </section>

      {summary.goals.length ? <section className="phase2-panel"><div className="phase2-section-heading"><div><span className="eyebrow">Progress</span><h2>Long-term goals</h2></div><TrendingUp size={19} /></div><div className="phase2-goal-list">{summary.goals.map((goal) => <div className="phase2-goal-row" key={goal.id}><div className="phase2-goal-copy"><strong>{goal.label}</strong><small>{goal.hasData ? `${formatMetric(goal.value)} ${goal.unit}` : "Building a baseline"}</small></div><div className="phase2-progress" aria-hidden="true"><i style={{ width: `${goal.progress}%` }} /></div><span>{goal.detail}</span><button type="button" onClick={() => onChange((current) => createPhase2DeletionPatch(current, "longTermGoal", [goal.id], { longTermGoals: current.longTermGoals.filter((item) => item.id !== goal.id) }))} aria-label={`Remove ${goal.label}`}><Trash2 size={16} /></button></div>)}</div></section> : <section className="phase2-empty"><TrendingUp size={24} /><strong>No long-term goal yet</strong><p>Choose one direction and let the trend build from confirmed activity.</p></section>}

      <form className="phase2-panel phase2-add-goal" onSubmit={addGoal}>
        <div className="phase2-section-heading"><div><span className="eyebrow">Add a direction</span><h2>Track gradual progress</h2></div><Plus size={19} /></div>
        <label><span>Goal</span><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{LONG_TERM_GOAL_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <p>{template.description}</p>
        {template.requiresValue && <label><span>Ingredient to track</span><input value={trackedValue} onChange={(event) => setTrackedValue(event.target.value)} placeholder="Example: Red 40" required /></label>}
        <label><span>Target</span><span className="phase2-number-input"><input type="number" inputMode="decimal" min="0.1" step="any" value={target} onChange={(event) => setTarget(event.target.value)} required /><em>{template.unit}</em></span></label>
        <button className="primary-button" type="submit"><Plus size={18} />Add long-term goal</button>
      </form>

      <section className="phase2-panel">
        <div className="phase2-section-heading"><div><span className="eyebrow">Recent context</span><h2>Confirmed activity</h2></div><CalendarRange size={19} /></div>
        {[...(state.restaurantMeals || []).map((meal) => ({ id: meal.id, title: meal.itemName, detail: `${meal.restaurantName} · ${meal.goalFit === "fits" ? "Fits current goals" : meal.goalFit === "watch" ? "Worth balancing" : "Needs menu details"}`, occurredAt: meal.occurredAt })), ...(state.activities || []).filter((item) => item.type !== "nudge_shown" && !(["food_logged", "soda_logged"].includes(item.type) && item.productId?.startsWith("restaurant-product:"))).map((item) => ({ id: item.id, title: item.type.replace(/_/g, " "), detail: item.source === "location-confirmed" ? "Location-confirmed" : "User-confirmed", occurredAt: item.occurredAt }))].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 8).map((item) => <div className="phase2-simple-row" key={item.id}><span><strong>{item.title}</strong><small>{item.detail}</small></span><em>{new Date(item.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</em></div>)}
        {!state.restaurantMeals.length && !state.activities.length && <div className="phase2-empty compact"><CalendarRange size={20} /><strong>No activity yet</strong><p>Confirmed meals and visits will appear here.</p></div>}
      </section>
    </div>
  );
}

function PrivacyControls({ state, onChange }) {
  const [message, setMessage] = useState("");

  function setSetting(key, value) {
    onChange((current) => ({ settings: { ...current.settings, [key]: value, updatedAt: new Date().toISOString() } }));
  }

  async function toggleNotifications(enabled) {
    if (!enabled) {
      setSetting("notificationsEnabled", false);
      return;
    }
    if (typeof Notification === "undefined") {
      setMessage("Notifications are not available in this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    setSetting("notificationsEnabled", permission === "granted");
    setMessage(permission === "granted" ? "Optional notifications are on." : "Notification permission was not granted.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ziya-goals-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("A local copy of your goals and context data was created.");
  }

  return (
    <details className="phase2-disclosure phase2-privacy">
      <summary><span><ShieldCheck size={18} /><strong>Privacy & nudges</strong><small>Optional controls and local data</small></span><ChevronRight size={18} /></summary>
      <div className="phase2-disclosure-body">
        <p className="phase2-helper">Location is checked only when requested. Receipt photos are not uploaded or saved by this feature.</p>
        <label className="phase2-switch-row"><span><strong>Contextual nudges</strong><small>Low-frequency prompts based on goals and confirmed context.</small></span><input type="checkbox" checked={state.settings.nudgesEnabled} onChange={(event) => setSetting("nudgesEnabled", event.target.checked)} /></label>
        <label className="phase2-switch-row"><span><strong>Notifications</strong><small>Optional prompts when the app is open and permission is granted.</small></span><input type="checkbox" checked={state.settings.notificationsEnabled} onChange={(event) => toggleNotifications(event.target.checked)} /></label>
        <label className="phase2-switch-row"><span><strong>Keep receipt text</strong><small>Save confirmed text locally. Photos still are not stored.</small></span><input type="checkbox" checked={state.settings.saveReceiptText} onChange={(event) => setSetting("saveReceiptText", event.target.checked)} /></label>
        <div className="phase2-data-actions">
          <button type="button" onClick={exportData}><FileText size={17} />Export my data</button>
          <button type="button" onClick={() => onChange((current) => {
            const removed = current.activities.filter((item) => item.source === "location-confirmed").map((item) => item.id);
            return createPhase2DeletionPatch(current, "activity", removed, { currentContext: null, activities: current.activities.filter((item) => item.source !== "location-confirmed") });
          })}><Trash2 size={17} />Delete location history</button>
          <button type="button" onClick={() => onChange((current) => createPhase2DeletionPatch(current, "restaurantMeal", current.restaurantMeals.map((item) => item.id), { restaurantMeals: [] }))}><Trash2 size={17} />Delete meal history</button>
          <button type="button" onClick={() => onChange((current) => createPhase2DeletionPatch(current, "receiptReview", current.receiptReviews.map((item) => item.id), { receiptReviews: [] }))}><Trash2 size={17} />Clear receipt reviews</button>
        </div>
        {message && <p className="phase2-status" role="status">{message}</p>}
      </div>
    </details>
  );
}
