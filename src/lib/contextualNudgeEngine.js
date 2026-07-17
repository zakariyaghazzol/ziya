import { getLocationContextMeta } from "../data/locationContextTypes";

const NUDGE_COOLDOWN_MS = 18 * 60 * 60 * 1000;
const CONTEXT_MAX_AGE_MS = 3 * 60 * 60 * 1000;

function recentlyDismissed(id, dismissed = [], now = new Date()) {
  const entry = dismissed.find((item) => item.id === id);
  return entry && new Date(now).getTime() - Date.parse(entry.dismissedAt) < 7 * 86400000;
}

function contextNudge(context, weeklySummary, now) {
  if (!context) return null;
  const detectedAt = Date.parse(context.detectedAt);
  if (!Number.isFinite(detectedAt) || new Date(now).getTime() - detectedAt > CONTEXT_MAX_AGE_MS) return null;
  const meta = getLocationContextMeta(context.type);
  if (context.type === "gym") {
    if (context.confirmed) return null;
    const goal = weeklySummary?.goals?.find((item) => item.templateId === "gym_visits");
    return {
      id: `place:gym:${context.placeId}`,
      kind: "positive",
      title: "Gym visit detected",
      message: goal ? `Confirm this visit to support your ${goal.target}-visit weekly goal.` : meta.prompt,
      action: "Confirm visit",
      actionType: "confirm-place"
    };
  }
  if (context.type === "fast_food") {
    const goal = weeklySummary?.goals?.find((item) => item.templateId === "fast_food_limit");
    return {
      id: `place:fast-food:${context.placeId}`,
      kind: "choice",
      title: "Want help choosing?",
      message: goal && goal.remaining > 0
        ? `This can still fit your week. You have ${goal.remaining} ${goal.unit} available in your flexible goal.`
        : "This can still fit your week. Compare options using the label data available.",
      action: "Compare a meal",
      actionType: "open-restaurant"
    };
  }
  if (context.type === "grocery") {
    return {
      id: `place:grocery:${context.placeId}`,
      kind: "choice",
      title: "At the grocery store?",
      message: "Want to scan a few products before checkout?",
      action: "Open scanner",
      actionType: "open-scan"
    };
  }
  if (["restaurant", "cafe"].includes(context.type)) {
    return {
      id: `place:restaurant:${context.placeId}`,
      kind: "choice",
      title: context.name || meta.label,
      message: "Want to compare a menu item with your current goals?",
      action: "Compare a meal",
      actionType: "open-restaurant"
    };
  }
  return null;
}

function trendNudge(weeklySummary) {
  const reached = weeklySummary?.goals?.find((goal) => goal.status === "reached");
  if (reached) {
    return {
      id: `trend:${reached.templateId}:${weeklySummary.window.startKey}`,
      kind: "positive",
      title: "A weekly goal is on track",
      message: `${reached.label}: ${reached.summary.toLowerCase()}.`,
      action: "View week",
      actionType: "open-week"
    };
  }
  const sugarScans = (weeklySummary?.activities || []).filter((item) => item.type === "product_scanned" && Number(item.metadata?.sugar) >= 10).length;
  if (sugarScans >= 3) {
    return {
      id: `trend:sugar-scans:${weeklySummary.window.startKey}`,
      kind: "pattern",
      title: "A pattern you may want to track",
      message: "You scanned several higher-sugar products this week. A flexible sugar goal can help you compare the pattern.",
      action: "View goals",
      actionType: "open-goals"
    };
  }
  return null;
}

export function buildContextualNudge({ phase2State, weeklySummary, now = new Date() }) {
  if (!phase2State?.settings?.nudgesEnabled) return null;
  const candidates = [contextNudge(phase2State.currentContext, weeklySummary, now), trendNudge(weeklySummary)].filter(Boolean);
  const available = candidates.find((item) => !recentlyDismissed(item.id, phase2State.dismissedNudges, now));
  if (!available) return null;
  const recentNudge = (phase2State.activities || []).find((item) => item.type === "nudge_shown");
  if (recentNudge && new Date(now).getTime() - Date.parse(recentNudge.occurredAt) < NUDGE_COOLDOWN_MS && recentNudge.metadata?.nudgeId !== available.id) return null;
  return available;
}

export function canSendContextNotification(settings) {
  return Boolean(settings?.notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted");
}
