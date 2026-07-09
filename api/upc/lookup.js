module.exports = async function lookupUpc(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ code: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    let body = request.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const barcode = String(body.upc || "").replace(/[^\dA-Za-z]/g, "");
    if (!barcode) {
      response.status(400).json({ code: "INVALID_UPC" });
      return;
    }

    const upstream = await fetch("https://api.upcitemdb.com/prod/trial/lookup", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ upc: barcode })
    });

    const text = await upstream.text();
    response.status(upstream.status);
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    response.send(text);
  } catch {
    response.status(502).json({ code: "LOOKUP_UNAVAILABLE" });
  }
};
