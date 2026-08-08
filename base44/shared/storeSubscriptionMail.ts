// Shared helpers for store subscription emails — used by the activation automation
// and the scheduled renewal job so both send through the store's own mailing system
// (owner SMTP, with the platform sender as fallback).

export function storeDashboardUrl(marketplace: any): string | undefined {
  if (marketplace?.customDomain) return `https://${marketplace.customDomain}/dashboard`;
  if (marketplace?.storeLink) return `${String(marketplace.storeLink).replace(/\/$/, '')}/dashboard`;
  return undefined;
}

export function billingLabel(billingType?: string): string {
  if (billingType === 'yearly') return 'Yearly';
  if (billingType === 'one_time') return 'One-time';
  return 'Monthly';
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Fire-and-forget: never let an email failure break the billing flow.
export async function sendSubscriptionEmail(opts: {
  svc: any;
  marketplace: any;
  templateKey: 'subscriptionActive' | 'subscriptionRenewal' | 'subscriptionCancelled';
  sub: any;
  extraVars?: Record<string, string>;
}) {
  const { svc, marketplace, templateKey, sub } = opts;
  if (!sub?.customerEmail) return;
  const currency = sub.currency || marketplace?.currency || 'USD';
  const accessBlock = [sub.accessUrl, sub.accessInstructions].filter(Boolean).join('\n');
  try {
    await svc.functions.invoke('sendStoreEmail', {
      marketplaceId: sub.marketplaceId,
      templateKey,
      to: sub.customerEmail,
      dashboardUrl: storeDashboardUrl(marketplace),
      vars: {
        customer_name: sub.customerName || 'there',
        plan_name: sub.planName || 'your plan',
        plan_price: `${currency} ${(Number(sub.price) || 0).toLocaleString()}`,
        billing_label: billingLabel(sub.billingType),
        next_renewal: formatDate(sub.currentPeriodEnd),
        access_block: accessBlock,
        ...(opts.extraVars || {}),
      },
    });
  } catch (_) { /* non-fatal */ }
}