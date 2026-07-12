const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = globalThis.__ziyaPubMedCache || new Map();
globalThis.__ziyaPubMedCache = cache;

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
    if (!upstream.ok) throw new Error(`PubMed request failed: ${upstream.status}`);
    return await upstream.json();
  } finally {
    clearTimeout(timer);
  }
}

function classifyCitation(publicationTypes = []) {
  const types = publicationTypes.map((value) => String(value).toLowerCase());
  if (types.some((value) => value.includes("systematic review") || value === "meta-analysis")) return "review";
  if (types.some((value) => value.includes("review"))) return "review";
  if (types.some((value) => value.includes("government publication") || value.includes("guideline"))) return "regulatory";
  if (types.some((value) => value.includes("clinical trial") || value.includes("observational"))) return "human";
  if (types.some((value) => value.includes("animal") || value.includes("in vivo"))) return "animal";
  return "unknown";
}

function sourceRecord(query) {
  return {
    id: `pubmed-${encodeURIComponent(query)}`,
    label: "PubMed",
    title: `PubMed literature search for ${query}`,
    organization: "NIH National Library of Medicine",
    url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${query}"`)}`,
    sourceType: "database",
    note: "Citation metadata only; Ziya does not infer a study conclusion from a title alone."
  };
}

module.exports = async function searchPubMed(request, response) {
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
    const searchPhrase = query.replace(/["\[\]{}]/g, " ").replace(/\s+/g, " ").trim();
    const searchTerm = `"${searchPhrase}"[Title/Abstract] AND (review[Publication Type] OR toxicology[Title/Abstract] OR safety[Title/Abstract] OR exposure[Title/Abstract] OR regulation[Title/Abstract])`;
    const params = new URLSearchParams({ db: "pubmed", retmode: "json", retmax: "5", sort: "relevance", tool: "ziya", term: searchTerm });
    const searchPayload = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`);
    const ids = searchPayload?.esearchresult?.idlist || [];
    let citations = [];
    if (ids.length) {
      const summaryParams = new URLSearchParams({ db: "pubmed", retmode: "json", tool: "ziya", id: ids.join(",") });
      const summaryPayload = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams}`);
      citations = ids.map((pmid) => summaryPayload?.result?.[pmid]).filter(Boolean).map((item) => ({
        pmid: String(item.uid),
        title: String(item.title || "Untitled PubMed record").replace(/<[^>]+>/g, ""),
        journal: item.fulljournalname || item.source || "PubMed",
        year: String(item.pubdate || "").match(/\d{4}/)?.[0] || null,
        authors: (item.authors || []).slice(0, 3).map((author) => author.name).filter(Boolean),
        sourceType: classifyCitation(item.pubtypelist || []),
        url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`
      }));
    }
    const data = { query, citations, source: sourceRecord(query) };
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    send(response, 200, data);
  } catch {
    send(response, 502, { code: "PUBMED_UNAVAILABLE", message: "Study metadata is unavailable right now." });
  }
};
