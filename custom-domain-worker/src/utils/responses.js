// JSON + error response helpers with permissive CORS (the admin API is called
// from the browser by the AppsfieldAI dashboard).

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

export function errorJson(message, status = 400, extra = {}) {
  return json({ success: false, error: message, ...extra }, status);
}

// Plain-text response for public (visitor-facing) domain errors.
export function textResponse(message, status = 200) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
