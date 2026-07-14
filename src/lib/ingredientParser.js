const ALLERGEN_TERMS = new Map([
  ["milk", "milk"], ["dairy", "milk"], ["whey", "milk"], ["casein", "milk"], ["caseinate", "milk"],
  ["egg", "egg"], ["eggs", "egg"], ["albumin", "egg"],
  ["wheat", "wheat"], ["gluten", "wheat"], ["barley", "wheat"], ["rye", "wheat"], ["malt", "wheat"],
  ["soy", "soy"], ["soya", "soy"], ["soybean", "soy"], ["soybeans", "soy"],
  ["peanut", "peanut"], ["peanuts", "peanut"],
  ["tree nut", "tree nuts"], ["tree nuts", "tree nuts"], ["almond", "tree nuts"], ["almonds", "tree nuts"],
  ["cashew", "tree nuts"], ["cashews", "tree nuts"], ["walnut", "tree nuts"], ["walnuts", "tree nuts"],
  ["pecan", "tree nuts"], ["pecans", "tree nuts"], ["pistachio", "tree nuts"], ["pistachios", "tree nuts"],
  ["hazelnut", "tree nuts"], ["hazelnuts", "tree nuts"], ["macadamia", "tree nuts"], ["brazil nut", "tree nuts"],
  ["sesame", "sesame"], ["sesame seed", "sesame"], ["sesame seeds", "sesame"],
  ["fish", "fish"], ["anchovy", "fish"], ["tuna", "fish"], ["salmon", "fish"], ["cod", "fish"],
  ["shellfish", "shellfish"], ["shrimp", "shellfish"], ["crab", "shellfish"], ["lobster", "shellfish"], ["crayfish", "shellfish"]
]);

const QUALIFIER_PARENTS = /^(?:whey|lecithin|flour|starch|casein|caseinate|milk solids?|protein|oil)$/i;
const NOISE_PATTERNS = [
  /\b(?:manufactured|distributed|marketed|packed|produced)\s+by\b/i,
  /\b(?:company|corporation|corp\.?|inc\.?|llc|ltd\.?|all rights reserved|trademark)\b/i,
  /(?:https?:\/\/|www\.|\.com\b|customer service|questions? or comments?|visit us|call us)/i,
  /\b(?:street|road|avenue|boulevard|suite|postal|zip code|u\.?s\.?a\.?)\b/i,
  /\b(?:nutrition facts?|serving size|calories|directions?|storage instructions?|barcode|recycl(?:e|ing))\b/i,
  /\b\d{5}(?:-\d{4})?\b/,
  /(?:\+?\d[\d\s().-]{7,}\d)/
];

function cleanText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    .trim();
}

function foldAccents(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeIngredientName(value) {
  let normalized = foldAccents(cleanText(value))
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\bflavours?\b/gi, (match) => match.toLowerCase().endsWith("s") ? "flavors" : "flavor")
    .replace(/\bflavouring(s)?\b/gi, (_, plural) => plural ? "flavorings" : "flavoring")
    .replace(/\bcolours?\b/gi, (match) => match.toLowerCase().endsWith("s") ? "colors" : "color")
    .replace(/^\s*(?:ingredients?|ingredient list)\s*[:\-]?\s*/i, "")
    .replace(/^\s*(?:contains?\s+)?(?:less than\s+)?\d+(?:\.\d+)?\s*%\s*(?:or less)?\s*(?:of)?\s*/i, "")
    .replace(/^\s*(?:contains\s+)?(?:two|2)\s*%\s*or\s*less\s*(?:of)?\s*/i, "")
    .replace(/^\s*(?:less than\s+(?:two|2)\s*%\s*(?:of)?\s*)/i, "")
    .replace(/\s+\d+(?:[.,]\d+)?\s*%\s*$/i, "")
    .replace(/^\s*[a-z]{2}:\s*/i, "")
    .replace(/[\u2022\u25aa\u25e6]/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s*-\s*/g, "-")
    .replace(/^[\s:;,*._-]+|[\s:;,*._-]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

  if (/^e\s*\d{3,4}[a-z]?$/i.test(normalized)) normalized = normalized.replace(/^e\s*/i, "e");
  normalized = normalized.replace(/^mono-and diglycerides$/, "mono- and diglycerides");
  if (normalized === "natural flavours") normalized = "natural flavors";
  if (normalized === "artificial flavours") normalized = "artificial flavors";
  return normalized;
}

function splitTopLevel(value, delimiters = new Set([",", ";", "\u060c"])) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
    if (depth === 0 && delimiters.has(char)) {
      const part = value.slice(start, index).trim();
      if (part) parts.push(part);
      start = index + 1;
    }
  }
  const finalPart = value.slice(start).trim();
  if (finalPart) parts.push(finalPart);
  return parts;
}

function splitStatementSources(value) {
  return value
    .replace(/[.]+$/g, "")
    .split(/\s*(?:,|;|\band\/?or\b|\band\b|\bor\b)\s*/i)
    .map(normalizeIngredientName)
    .filter(Boolean);
}

function splitNestedItems(value) {
  return splitTopLevel(value).flatMap((part) => part.split(/\s+and\/?or\s+|\s+or\s+/i)).map((part) => part.trim()).filter(Boolean);
}

function applyParentContext(child, parent) {
  const normalizedChild = normalizeIngredientName(child);
  const normalizedParent = normalizeIngredientName(parent);
  if (/\boil\b/.test(normalizedParent) && /^(?:canola|soybean|sunflower|safflower|cottonseed|corn|olive|palm|coconut|avocado|peanut|sesame)$/.test(normalizedChild)) {
    return `${normalizedChild} oil`;
  }
  return normalizedChild;
}

function allergenFor(value) {
  return ALLERGEN_TERMS.get(normalizeIngredientName(value)) || null;
}

function isGarbage(value) {
  const normalized = normalizeIngredientName(value);
  if (!normalized) return "empty or symbol-only fragment";
  if (/^e\d{3,4}[a-z]?$/i.test(normalized)) return null;
  if (NOISE_PATTERNS.some((pattern) => pattern.test(value))) return "manufacturer, address, instruction, or packaging fragment";
  if (/^(?:tm|r|co|inc|llc|ltd|usa|usage)$/i.test(normalized)) return "packaging or legal fragment";
  if (/^(?:\d+|[a-z]?\d+[a-z]?)$/i.test(normalized)) return "number-only fragment";
  const letters = (value.match(/\p{L}/gu) || []).length;
  const digits = (value.match(/\d/g) || []).length;
  if (digits >= 4 && digits >= letters) return "number-dominated fragment";
  if (normalized.length > 120) return "fragment is too long to be one ingredient";
  if (normalized.length < 2) return "low-information fragment";
  return null;
}

function extractParenthetical(value) {
  const closingFor = { "(": ")", "[": "]" };
  const stack = [];
  let open = -1;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (closingFor[char]) {
      if (!stack.length) open = index;
      stack.push(closingFor[char]);
    } else if (stack.length && char === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length && open >= 0) {
        return { base: `${value.slice(0, open)} ${value.slice(index + 1)}`.trim(), inside: value.slice(open + 1, index), start: open, end: index };
      }
    }
  }
  return { base: value, inside: "", start: -1, end: -1 };
}

function splitImplicitBracketTail(value) {
  const match = String(value || "").match(/^(.+?\[[^\[\]]+\])\s+([^,;]+)$/);
  return match ? [match[1].trim(), match[2].trim()] : [value];
}

function splitFunctionChildren(value) {
  const match = String(value || "").match(/^([^:]{2,48}):\s*(.+)$/);
  if (!match) return null;
  const parent = normalizeIngredientName(match[1]);
  if (!/^(?:emulsifiers?|emulsifiants?|stabilizers?|stabilisants?|flavorings?|aromes?|colorings?|colorants?)$/.test(parent)) return null;
  return { parent: match[1].trim(), children: splitNestedItems(match[2]) };
}

function parseNode(segment, parentName = null, depth = 0, rejectedFragments = []) {
  const sourceName = cleanText(segment);
  const functionChildren = splitFunctionChildren(sourceName);
  const rawName = functionChildren?.parent || sourceName;
  const rejectionReason = isGarbage(rawName);
  if (rejectionReason) {
    rejectedFragments.push({ rawName, normalizedName: normalizeIngredientName(rawName), rejectionReason });
    return null;
  }

  const parenthetical = extractParenthetical(rawName);
  const normalizedName = normalizeIngredientName(parenthetical.base);
  if (!normalizedName) return null;
  const node = {
    rawName,
    normalizedName,
    parentName,
    children: [],
    qualifiers: [],
    allergenSources: [],
    sourceSegment: parentName ? "sub_ingredient" : "direct",
    depth
  };

  if (parenthetical.inside) {
    const nestedItems = splitNestedItems(parenthetical.inside);
    const qualifierAllergens = nestedItems.map(allergenFor).filter(Boolean);
    const parentLooksLikeQualifier = QUALIFIER_PARENTS.test(normalizedName) && qualifierAllergens.length === nestedItems.length;
    if (parentLooksLikeQualifier) {
      node.allergenSources = [...new Set(qualifierAllergens)];
      node.qualifiers = node.allergenSources.map((source) => ({ type: "allergen_source", value: source }));
    } else {
      node.children = nestedItems
        .map((item) => parseNode(applyParentContext(item, normalizedName), normalizedName, depth + 1, rejectedFragments))
        .filter(Boolean);
    }
  }

  if (functionChildren?.children.length) {
    node.children.push(...functionChildren.children
      .map((item) => parseNode(item, normalizedName, depth + 1, rejectedFragments))
      .filter(Boolean));
  }

  const directAllergen = allergenFor(normalizedName);
  if (directAllergen) node.allergenSources = [...new Set([...node.allergenSources, directAllergen])];
  return node;
}

function removeAndCollectStatements(rawText) {
  const containsStatements = [];
  const advisoryStatements = [];
  let working = rawText;
  const patterns = [
    {
      type: "facility_trace",
      regex: /(?:^|[.\n;])\s*((?:made|processed|produced|packed)\s+in\s+(?:a\s+)?facility\s+that\s+also\s+processes\s+([^.;\n]+))/gi,
      target: advisoryStatements
    },
    {
      type: "advisory_trace",
      regex: /(?:^|[.\n;])\s*((?:may\s+(?:also\s+)?contain|may\s+include)\s+([^.;\n]+))/gi,
      target: advisoryStatements
    },
    {
      type: "contains_statement",
      regex: /(?:^|[.\n;])\s*(contains\s*:\s*([^.;\n]+))/gi,
      target: containsStatements
    }
  ];

  for (const pattern of patterns) {
    working = working.replace(pattern.regex, (match, statement, sources) => {
      pattern.target.push({ rawText: statement.trim(), type: pattern.type, sources: [...new Set(splitStatementSources(sources))] });
      return " ";
    });
  }
  return { working, containsStatements, advisoryStatements };
}

export function flattenParsedIngredients(parsed) {
  const flattened = [];
  function visit(node) {
    flattened.push(node);
    node.children.forEach(visit);
  }
  (parsed?.directIngredients || []).forEach(visit);
  return flattened;
}

export function parseIngredientList(input) {
  const rawText = Array.isArray(input) ? input.map((item) => item?.text || item?.name || item).filter(Boolean).join(", ") : cleanText(input);
  const { working, containsStatements, advisoryStatements } = removeAndCollectStatements(rawText);
  const directText = working
    .replace(/^\s*(?:ingredients?|ingredient list)\s*[:\-]\s*/i, "")
    .replace(/\n+/g, ",")
    .trim();
  const rejectedFragments = [];
  const directIngredients = splitTopLevel(directText)
    .flatMap(splitImplicitBracketTail)
    .map((segment) => parseNode(segment, null, 0, rejectedFragments))
    .filter(Boolean);

  return {
    rawText,
    directIngredients,
    containsStatements,
    advisoryStatements,
    rejectedFragments
  };
}
