// Reverse-proxy a custom-domain request to the correct AppsfieldAI origin.

import { textResponse } from "../utils/responses.js";
import { getDomain } from "./domainStore.js";

// Choose the origin for a request based on hostname, path, and the record's
// originType. Only ever returns a configured origin — never a user-supplied URL.
export function pickOrigin(env, record, url, hostname) {
  if (hostname === "admin.appsfieldai.com") return env.ADMIN_ORIGIN;
  if (url.pathname.startsWith("/functions") || url.pathname.startsWith("/base44")) return env.BASE44_ORIGIN;
  if (record && record.originType === "base44") return env.BASE44_ORIGIN;
  if (record && record.originType === "app") return env.APP_ORIGIN;
  return env.APP_ORIGIN; // default
}

// Proxy `request` to `origin`, preserving path/query/method/body, rewriting the
// Host header to the origin, and adding the given headers.
export async function proxyToOrigin(request, origin, extraHeaders = {}) {
  const originUrl = new URL(origin);
  const target = new URL(request.url);
  target.protocol = originUrl.protocol;
  target.hostname = originUrl.hostname;
  target.port = originUrl.port;
  // pathname + search are preserved from the incoming request.

  const headers = new Headers(request.headers);
  headers.set("host", originUrl.host); // upstream Host = origin, NOT the customer domain
  for (const [k, v] of Object.entries(extraHeaders)) headers.set(k, v);

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  };
  return fetch(new Request(target.toString(), init));
}

// Full public storefront flow: look up the hostname, gate on status, proxy.
export async function handlePublicRequest(request, env, url, hostname) {
  let record;
  try {
    record = await getDomain(env, hostname);
  } catch (err) {
    return textResponse("Temporary error resolving this domain. Please try again.", 503);
  }

  if (!record) {
    return textResponse("Domain not found in AppsfieldAI.", 404);
  }
  if (record.status === "pending") {
    return textResponse("Domain is still being verified. Please check your DNS and SSL status.", 409);
  }
  if (record.status === "failed") {
    return textResponse("Domain verification failed. Please reconnect your domain.", 409);
  }
  // status === "active"
  const origin = pickOrigin(env, record, url, hostname);
  const extraHeaders = {
    "x-tenant-id": record.tenantId || "",
    "x-original-host": hostname,
    "x-origin-type": record.originType || "app",
    "x-appsfield-proxy-secret": env.ORIGIN_PROXY_SECRET || "",
  };
  try {
    return await proxyToOrigin(request, origin, extraHeaders);
  } catch (err) {
    return textResponse("Upstream error serving this storefront.", 502);
  }
}
