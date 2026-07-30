// Outbound "platform provisioning" webhook.
//
// When a JVZoo sale/refund/reversal happens, we notify an external provider app
// (the AI generation / SaaS app) so it can register or deregister the user's access.
//
// The external app exposes:
//   POST /api/v1/platform/provision    ← on purchase (grant access)
//   POST /api/v1/platform/suspend      ← on refund/chargeback (revoke access)
//   POST /api/v1/platform/reactivate   ← on reversal (restore access)
//
// Config: base URL + enabled flag come from AppConfig.platformWebhook (admin-editable
// under Admin → Settings → Webhook). The shared secret comes from the
// PLATFORM_WEBHOOK_SECRET app secret and is sent in the X-Platform-Secret header.

export interface PlatformWebhookConfig {
  enabled: boolean;
  baseUrl: string;
}

// Loads the platform webhook config from AppConfig (key: 'main').
export async function loadPlatformWebhookConfig(base44): Promise<PlatformWebhookConfig> {
  try {
    const cfgs = await base44.asServiceRole.entities.AppConfig.filter({ key: 'main' });
    const pw = cfgs[0]?.platformWebhook || {};
    return {
      enabled: !!pw.enabled,
      baseUrl: (pw.baseUrl || '').trim().replace(/\/+$/, ''),
    };
  } catch (_) {
    return { enabled: false, baseUrl: '' };
  }
}

type PlatformAction = 'provision' | 'suspend' | 'reactivate';

// Sends a single provisioning event to the external app. Never throws — logs and
// returns a status object so the caller (JVZoo IPN) can't be broken by it.
export async function sendPlatformEvent(
  base44,
  action: PlatformAction,
  payload: { email: string; name?: string; product?: string; plan?: string },
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> {
  const { enabled, baseUrl } = await loadPlatformWebhookConfig(base44);
  if (!enabled || !baseUrl) {
    return { ok: false, skipped: true };
  }
  const secret = Deno.env.get('PLATFORM_WEBHOOK_SECRET') || '';
  if (!secret) {
    console.error('platformWebhook: PLATFORM_WEBHOOK_SECRET is not set');
    return { ok: false, error: 'missing_secret' };
  }
  if (!payload.email) {
    return { ok: false, error: 'missing_email' };
  }

  const url = `${baseUrl}/api/v1/platform/${action}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': secret,
      },
      body: JSON.stringify({
        // The external app validates on `ownerEmail`; we also send `email` for compatibility.
        ownerEmail: payload.email,
        email: payload.email,
        name: payload.name || '',
        product: payload.product || '',
        plan: payload.plan || '',
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`platformWebhook ${action} failed (${res.status}): ${text}`);
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    console.error(`platformWebhook ${action} error:`, e.message);
    return { ok: false, error: e.message };
  }
}