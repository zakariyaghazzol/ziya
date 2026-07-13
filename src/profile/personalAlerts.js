import { normalizeKnowledgeKey, resolveLocalIngredientKnowledge } from "../knowledge/ingredientKnowledge";
import { sanitizeProfile } from "./profileStore";

const ALLERGY_TERMS = Object.freeze({
  milk: ["milk", "dairy", "whey", "casein", "caseinate", "lactose", "cream", "cheese", "butter"],
  eggs: ["egg", "eggs", "albumen", "egg white", "egg yolk"],
  fish: ["fish", "anchovy", "cod", "salmon", "tuna", "tilapia"],
  shellfish: ["shellfish", "shrimp", "prawn", "crab", "lobster", "crayfish"],
  "tree nuts": ["tree nut", "tree nuts", "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia", "brazil nut"],
  peanuts: ["peanut", "peanuts", "groundnut"],
  wheat: ["wheat", "wheat flour", "semolina", "durum"],
  soy: ["soy", "soya", "soybean", "soy lecithin"],
  sesame: ["sesame", "tahini"]
});

const DIET_CONFLICTS = Object.freeze({
  vegetarian: ["gelatin", "gelatine", "beef", "pork", "chicken", "turkey", "lamb", "fish", "anchovy", "shellfish", "lard"],
  vegan: ["milk", "whey", "casein", "lactose", "cream", "cheese", "butter", "egg", "honey", "gelatin", "gelatine", "beef", "pork", "chicken", "fish", "shellfish", "lard"],
  "gluten-free": ["wheat", "barley", "rye", "malt", "gluten", "semolina", "durum"],
  "dairy-free": ["milk", "whey", "casein", "caseinate", "lactose", "cream", "cheese", "butter"],
  halal: ["pork", "lard", "gelatin", "gelatine", "alcohol"],
  kosher: ["pork", "lard", "shellfish", "shrimp", "prawn", "crab", "lobster"]
});

function asArray(value) {
  return Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
}

function cleanCandidate(value) {
  return String(value || "").replace(/^\w{2}:/, "").trim();
}

function phraseMatches(textValue, termValue) {
  const text = ` ${normalizeKnowledgeKey(textValue)} `;
  const term = normalizeKnowledgeKey(termValue);
  return Boolean(term && text.includes(` ${term} `));
}

function productIngredientCandidates(product) {
  const values = [
    ...asArray(product.ingredients).flatMap((item) => [item?.name, item?.originalLabelText, item?.normalizedLabelText]),
    ...asArray(product.inactiveIngredients),
    product.activeIngredient,
    ...asArray(product.additives?.tags),
    ...(Array.isArray(product.additives) ? product.additives : [])
  ].map(cleanCandidate).filter(Boolean);
  return [...new Set(values)];
}

function productAllergenText(product) {
  const raw = asArray(product.allergens).join(" ").trim();
  if (!raw || /^(?:no |none|not listed|not available)/i.test(raw) || product.fieldConfidence?.allergens === "Missing") return "";
  return raw;
}

function ingredientIdentity(candidate, category) {
  const knowledge = resolveLocalIngredientKnowledge(candidate, { category });
  const keys = new Set([
    normalizeKnowledgeKey(candidate),
    normalizeKnowledgeKey(knowledge.canonicalName),
    knowledge.id,
    ...asArray(knowledge.aliases).map(normalizeKnowledgeKey)
  ].filter(Boolean));
  return { candidate, knowledge, keys };
}

function preferenceMatchesIngredient(preference, identities) {
  const preferenceKnowledge = resolveLocalIngredientKnowledge(preference.canonicalName || preference.originalInput || preference.label);
  const keys = new Set([
    preference.key,
    preference.knowledgeId,
    normalizeKnowledgeKey(preference.canonicalName),
    normalizeKnowledgeKey(preference.originalInput),
    normalizeKnowledgeKey(preferenceKnowledge.canonicalName),
    preferenceKnowledge.id,
    ...asArray(preferenceKnowledge.aliases).map(normalizeKnowledgeKey)
  ].filter(Boolean));
  return identities.find((identity) => [...keys].some((key) => identity.keys.has(key)));
}

function addAlert(alerts, alert) {
  const key = `${alert.kind}:${normalizeKnowledgeKey(alert.title)}`;
  if (!alerts.some((item) => item.key === key)) alerts.push({ ...alert, key });
}

function findConflict(candidates, terms) {
  return candidates.find((candidate) => terms.some((term) => phraseMatches(candidate, term)));
}

export function getPersonalAlerts(product, profileValue) {
  const profile = sanitizeProfile(profileValue);
  const candidates = productIngredientCandidates(product);
  const identities = candidates.map((candidate) => ingredientIdentity(candidate, product.category));
  const allergens = productAllergenText(product);
  const combinedEvidence = [...candidates, allergens].filter(Boolean);
  const alerts = [];
  let missingPreferenceData = false;

  profile.allergies.forEach((allergy) => {
    const terms = ALLERGY_TERMS[allergy.key] || [allergy.label, allergy.originalInput];
    const match = findConflict(combinedEvidence, terms);
    if (match) {
      addAlert(alerts, {
        kind: "allergy",
        level: "high",
        title: allergy.label,
        message: "Contains your marked allergen.",
        matchedValue: match,
        label: "Allergy alert"
      });
    } else if (!candidates.length && !allergens) {
      missingPreferenceData = true;
    }
  });

  profile.avoidedIngredients.forEach((preference) => {
    const match = preferenceMatchesIngredient(preference, identities);
    if (match) {
      addAlert(alerts, {
        kind: "avoid",
        level: "medium",
        title: preference.label,
        message: "This is on your avoid list.",
        matchedValue: match.candidate,
        label: "Avoid list"
      });
    } else if (!candidates.length) {
      missingPreferenceData = true;
    }
  });

  profile.watchlistIngredients.forEach((preference) => {
    const match = preferenceMatchesIngredient(preference, identities);
    if (match) {
      addAlert(alerts, {
        kind: "watchlist",
        level: "info",
        title: preference.label,
        message: "On your watchlist.",
        matchedValue: match.candidate,
        label: "Watchlist"
      });
    } else if (!candidates.length) {
      missingPreferenceData = true;
    }
  });

  profile.dietPreferences.forEach((preference) => {
    if (preference === "low sodium") {
      const sodium = Number(product.nutrition?.sodium);
      if (Number.isFinite(sodium) && sodium >= 400) {
        addAlert(alerts, { kind: "preference", level: "medium", title: "High sodium", message: "May not match your low-sodium preference.", matchedValue: `${sodium} mg`, label: "Preference" });
      } else if (!Number.isFinite(sodium)) missingPreferenceData = true;
      return;
    }
    if (preference === "low sugar") {
      const sugar = Number(product.nutrition?.sugar);
      if (Number.isFinite(sugar) && sugar >= 10) {
        addAlert(alerts, { kind: "preference", level: "medium", title: "Sugar", message: "May not match your low-sugar preference.", matchedValue: `${sugar} g`, label: "Preference" });
      } else if (!Number.isFinite(sugar)) missingPreferenceData = true;
      return;
    }
    const terms = DIET_CONFLICTS[preference] || [];
    const match = findConflict(combinedEvidence, terms);
    if (match) {
      const verificationOnly = ["halal", "kosher"].includes(preference);
      addAlert(alerts, {
        kind: "preference",
        level: "medium",
        title: preference.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        message: verificationOnly ? "May need verification for this preference." : `May not match your ${preference} preference.`,
        matchedValue: match,
        label: "Preference"
      });
    } else if (!candidates.length && !allergens) {
      missingPreferenceData = true;
    }
  });

  if (missingPreferenceData && (profile.allergies.length || profile.dietPreferences.length || profile.avoidedIngredients.length || profile.watchlistIngredients.length)) {
    addAlert(alerts, {
      kind: "data",
      level: "info",
      title: "Label data needed",
      message: "Not enough label data to check all of your preferences.",
      label: "Needs label"
    });
  }

  const order = { allergy: 0, avoid: 1, preference: 2, watchlist: 3, data: 4 };
  return alerts.sort((a, b) => order[a.kind] - order[b.kind]);
}
