// Persist an affiliate referral code per store (cookie-like, survives navigation
// and page reloads). Captured from the ?ref= param on any store page, then passed
// into checkout so the referring affiliate is credited for the sale.

const refKey = (marketplaceId) => `store_affiliate_ref_${marketplaceId}`;

// Read ?ref= from the current URL (if present).
export function getRefFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("ref") || null;
  } catch {
    return null;
  }
}

// Save the affiliate ref code for a store so it survives until checkout.
export function saveAffiliateRef(marketplaceId, refCode) {
  if (!marketplaceId || !refCode) return;
  try {
    localStorage.setItem(refKey(marketplaceId), refCode);
  } catch { /* ignore */ }
}

// Read the stored affiliate ref code for a store.
export function getAffiliateRef(marketplaceId) {
  if (!marketplaceId) return null;
  try {
    return localStorage.getItem(refKey(marketplaceId)) || null;
  } catch {
    return null;
  }
}

// Clear the stored ref (e.g. after a successful attributed order).
export function clearAffiliateRef(marketplaceId) {
  if (!marketplaceId) return;
  try {
    localStorage.removeItem(refKey(marketplaceId));
  } catch { /* ignore */ }
}