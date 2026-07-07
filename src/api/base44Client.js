import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { getStoreKeyFromHost, getCustomDomainFromHost } from '@/lib/storeHost';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// When the app is served from a customer store subdomain or their own custom domain
// (via the Render reverse-proxy), API/function calls must go DIRECTLY to the Base44
// backend — not relative to the current origin, which would route them back through
// the proxy and time out (504). On the main app host, keep the relative origin ('').
const isProxiedStoreHost =
  typeof window !== 'undefined' && (getStoreKeyFromHost() || getCustomDomainFromHost());
const serverUrl = isProxiedStoreHost ? 'https://app.appsfieldai.com' : '';

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl
});