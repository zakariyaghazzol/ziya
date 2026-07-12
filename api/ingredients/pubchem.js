const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = globalThis.__ziyaPubChemCache || new Map();
globalThis.__ziyaPubChemCache = cache;

function send(response, status, body) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  response.status(status).json(body);
}

function getQuery(request) {
  const value = request.query?.query || new URL(request.url, "http://localhost").searchParams.get("query") || "";
  return String(value).replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const upstream = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (upstream.status === 404) return null;
    if (!upstream.ok) throw new Error(`PubChem request failed: ${upstream.status}`);
    return await upstream.json();
  } finally {
    clearTimeout(timer);
  }
}

function sourceRecord(cid, query) {
  return {
    id: `pubchem-${cid || encodeURIComponent(query)}`,
    label: "PubChem",
    title: cid ? `PubChem Compound CID ${cid}` : `PubChem search for ${query}`,
    organization: "NIH National Library of Medicine",
    url: cid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}` : `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(query)}`,
    sourceType: "database",
    note: "Chemical identity, synonyms, and compound properties. PubChem is not used by Ziya as a health-risk rating source."
  };
}

module.exports = async function lookupPubChem(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    send(response, 405, { code: "METHOD_NOT_ALLOWED" });
    return;
  }

  const query = getQuery(request);
  if (query.length < 2) {
    send(response, 400, { code: "INVALID_QUERY" });
    return;
  }

  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    send(response, 200, { ...cached.data, cache: "hit" });
    return;
  }

  try {
    const encoded = encodeURIComponent(query);
    const cidPayload = await fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/cids/JSON`);
    const cids = [...new Set(cidPayload?.IdentifierList?.CID || [])].slice(0, 10);
    if (!cids.length) {
      const data = { found: false, query, ambiguous: false, synonyms: [], properties: null, source: sourceRecord(null, query) };
      cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      send(response, 404, data);
      return;
    }

    if (cids.length > 1) {
      const data = {
        found: true,
        query,
        ambiguous: true,
        candidateCids: cids,
        synonyms: [],
        properties: null,
        source: sourceRecord(null, query),
        note: "Multiple PubChem compounds matched this name; no single compound was selected."
      };
      cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      send(response, 200, data);
      return;
    }

    const cid = cids[0];
    const [propertyPayload, synonymPayload] = await Promise.all([
      fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/Title,IUPACName,MolecularFormula,MolecularWeight,InChIKey/JSON`),
      fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`)
    ]);
    const property = propertyPayload?.PropertyTable?.Properties?.[0] || {};
    const synonyms = synonymPayload?.InformationList?.Information?.[0]?.Synonym || [];
    const data = {
      found: true,
      query,
      ambiguous: false,
      cid,
      synonyms: [...new Set(synonyms.map(String))].slice(0, 40),
      properties: {
        title: property.Title || null,
        iupacName: property.IUPACName || null,
        molecularFormula: property.MolecularFormula || null,
        molecularWeight: property.MolecularWeight || null,
        inchiKey: property.InChIKey || null
      },
      source: sourceRecord(cid, query)
    };
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    send(response, 200, data);
  } catch (error) {
    send(response, 502, { code: "PUBCHEM_UNAVAILABLE", message: "Chemical identity data is unavailable right now." });
  }
};

