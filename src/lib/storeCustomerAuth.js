import { base44 } from "@/api/base44Client";

// Store-scoped customer sessions. Each marketplace keeps its own session token
// in localStorage, so a customer logged into one store is independent of others.

const tokenKey = (marketplaceId) => `store_customer_token_${marketplaceId}`;

export function getStoredToken(marketplaceId) {
  if (!marketplaceId) return null;
  return localStorage.getItem(tokenKey(marketplaceId));
}

export function setStoredToken(marketplaceId, token) {
  if (!marketplaceId) return;
  if (token) localStorage.setItem(tokenKey(marketplaceId), token);
  else localStorage.removeItem(tokenKey(marketplaceId));
}

export async function signupStoreCustomer({ marketplaceId, fullName, email, password, phone }) {
  const res = await base44.functions.invoke("storeCustomerSignup", { marketplaceId, fullName, email, password, phone });
  if (res.data?.error) throw new Error(res.data.error);
  setStoredToken(marketplaceId, res.data.token);
  return res.data.customer;
}

export async function loginStoreCustomer({ marketplaceId, email, password }) {
  const res = await base44.functions.invoke("storeCustomerLogin", { marketplaceId, email, password });
  if (res.data?.error) throw new Error(res.data.error);
  setStoredToken(marketplaceId, res.data.token);
  return res.data.customer;
}

// Request a password-reset code emailed to the customer (always resolves,
// even for unknown emails, so we don't reveal which accounts exist).
export async function requestStoreCustomerPasswordReset({ marketplaceId, email }) {
  const res = await base44.functions.invoke("storeCustomerResetPassword", { step: "request", marketplaceId, email });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Confirm the emailed code and set a new password.
export async function confirmStoreCustomerPasswordReset({ marketplaceId, email, code, newPassword }) {
  const res = await base44.functions.invoke("storeCustomerResetPassword", { step: "confirm", marketplaceId, email, code, newPassword });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Request a passwordless login link emailed to the customer (always resolves,
// even for unknown emails, so we don't reveal which accounts exist).
export async function requestStoreCustomerMagicLink({ marketplaceId, email }) {
  // Pass the exact store base the user is on (origin + the /store/:slug prefix,
  // minus any trailing /dashboard) so the emailed link lands on THIS store's
  // dashboard — works for slug routes, subdomains and custom domains alike.
  let returnBase = "";
  if (typeof window !== "undefined") {
    const path = window.location.pathname.replace(/\/dashboard\/?$/, "");
    returnBase = `${window.location.origin}${path}`.replace(/\/$/, "");
  }
  const res = await base44.functions.invoke("storeCustomerMagicLink", { step: "request", marketplaceId, email, returnUrl: returnBase });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Verify a login token from a magic link and start a session.
export async function verifyStoreCustomerMagicLink({ marketplaceId, loginToken }) {
  const res = await base44.functions.invoke("storeCustomerMagicLink", { step: "verify", marketplaceId, loginToken });
  if (res.data?.error) throw new Error(res.data.error);
  setStoredToken(marketplaceId, res.data.token);
  return res.data.customer;
}

export async function fetchStoreCustomer(marketplaceId) {
  const token = getStoredToken(marketplaceId);
  if (!token) return null;
  try {
    const res = await base44.functions.invoke("storeCustomerMe", { marketplaceId, token });
    if (res.data?.error || !res.data?.customer) {
      setStoredToken(marketplaceId, null);
      return null;
    }
    return res.data.customer;
  } catch {
    return null;
  }
}

export function logoutStoreCustomer(marketplaceId) {
  setStoredToken(marketplaceId, null);
}

// Update the customer's profile (name, phone, avatar) and optionally reset password.
export async function updateStoreCustomerProfile({ marketplaceId, fullName, phone, avatarUrl, currentPassword, newPassword }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in");
  const res = await base44.functions.invoke("storeCustomerUpdateProfile", { marketplaceId, token, fullName, phone, avatarUrl, currentPassword, newPassword });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.customer;
}

// Reserve spots on a listing as the logged-in store customer.
export async function reserveStoreSpot({ marketplaceId, listingId, spots, phone, message }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in to reserve a spot");
  const res = await base44.functions.invoke("storeCustomerReserve", { marketplaceId, token, listingId, spots, phone, message });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.reservation;
}

// Place a store order (cart checkout). Works for logged-in customers AND guests:
// guests pass name + email (no session required) and get a fresh token back.
export async function checkoutStoreOrder({ marketplaceId, items, paymentMethod, fullName, email, phone, notes, refCode }) {
  const token = getStoredToken(marketplaceId) || undefined;
  const res = await base44.functions.invoke("storeCheckout", { marketplaceId, token, items, paymentMethod, fullName, email, phone, notes, refCode });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// ── Store subscription plans ──

// The store's public subscription plans, plus the signed-in customer's own subscriptions.
export async function fetchStorePlans(marketplaceId) {
  const token = getStoredToken(marketplaceId) || undefined;
  const res = await base44.functions.invoke("storeSubscriptions", { marketplaceId, token });
  if (res.data?.error) return { plans: [], subscriptions: [], unlockedProducts: [] };
  return { plans: res.data.plans || [], subscriptions: res.data.subscriptions || [], unlockedProducts: res.data.unlockedProducts || [] };
}

// Subscribe to a store plan. Works for signed-in customers and guests (name + email),
// and returns the StoreOrder used to charge the first billing cycle.
export async function subscribeToStorePlan({ marketplaceId, planId, paymentMethod, fullName, email, phone }) {
  const token = getStoredToken(marketplaceId) || undefined;
  const res = await base44.functions.invoke("storeSubscribe", { marketplaceId, token, planId, paymentMethod, fullName, email, phone });
  if (res.data?.error) throw new Error(res.data.error);
  // Guests get a session token back — log them in so the subscription shows in their account.
  if (res.data.token) setStoredToken(marketplaceId, res.data.token);
  return res.data;
}

// Request access to a product included with the customer's active plan.
export async function requestProductAccess({ marketplaceId, listingId }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in");
  const res = await base44.functions.invoke("storeProductAccess", { marketplaceId, token, listingId });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.access;
}

// Cancel one of the customer's own subscriptions.
export async function cancelStoreSubscription({ marketplaceId, subscriptionId }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in");
  const res = await base44.functions.invoke("storeSubscriptions", { marketplaceId, token, action: "cancel", subscriptionId });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.subscription;
}

// Create a PayPal order for a pending StoreOrder and get the approval URL to redirect to.
// Accepts an explicit token (guest checkout) falling back to the stored session.
export async function createPaypalOrder({ marketplaceId, orderId, returnUrl, cancelUrl, token }) {
  const useToken = token || getStoredToken(marketplaceId);
  if (!useToken) throw new Error("Please sign in to pay");
  const res = await base44.functions.invoke("storePaypalCreateOrder", { marketplaceId, token: useToken, orderId, returnUrl, cancelUrl });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Capture a PayPal payment after the buyer approves and returns to the store.
export async function capturePaypalOrder({ marketplaceId, paypalOrderId }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in");
  const res = await base44.functions.invoke("storePaypalCapture", { marketplaceId, token, paypalOrderId });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Create a Stripe Checkout Session for a pending StoreOrder and get the hosted checkout URL.
// Accepts an explicit token (guest checkout) falling back to the stored session.
export async function createStripeCheckout({ marketplaceId, orderId, returnUrl, cancelUrl, token }) {
  const useToken = token || getStoredToken(marketplaceId);
  if (!useToken) throw new Error("Please sign in to pay");
  const res = await base44.functions.invoke("storeStripeCreateCheckout", { marketplaceId, token: useToken, orderId, returnUrl, cancelUrl });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Confirm a Stripe payment after the buyer returns to the store from Stripe Checkout.
export async function confirmStripeOrder({ marketplaceId, orderId }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in");
  const res = await base44.functions.invoke("storeStripeConfirm", { marketplaceId, token, orderId });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Create a Razorpay Order for a pending StoreOrder. Returns the details needed to
// open the Razorpay Checkout popup (no page redirect). Accepts an explicit token
// (guest checkout) falling back to the stored session.
export async function createRazorpayOrder({ marketplaceId, orderId, token }) {
  const useToken = token || getStoredToken(marketplaceId);
  if (!useToken) throw new Error("Please sign in to pay");
  const res = await base44.functions.invoke("storeRazorpayCreateOrder", { marketplaceId, token: useToken, orderId });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Verify a Razorpay payment after the buyer completes the Checkout popup.
export async function verifyRazorpayOrder({ marketplaceId, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, token }) {
  const useToken = token || getStoredToken(marketplaceId);
  if (!useToken) throw new Error("Please sign in");
  const res = await base44.functions.invoke("storeRazorpayVerify", { marketplaceId, token: useToken, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Fetch the store customer's reserved products with live status.
export async function fetchStoreCustomerProducts(marketplaceId) {
  const token = getStoredToken(marketplaceId);
  if (!token) return [];
  const res = await base44.functions.invoke("storeCustomerProducts", { marketplaceId, token });
  if (res.data?.error) return [];
  return res.data.products || [];
}

// Fetch the store customer's purchased orders (cart checkout) with delivery info.
export async function fetchStoreCustomerOrders(marketplaceId) {
  const token = getStoredToken(marketplaceId);
  if (!token) return [];
  const res = await base44.functions.invoke("storeCustomerOrders", { marketplaceId, token });
  if (res.data?.error) return [];
  return res.data.orders || [];
}

// ── Affiliate program (store customer) ──

// The affiliate's applications, referral code, and (for approved products) promotion kits.
export async function fetchAffiliateApplications(marketplaceId) {
  const token = getStoredToken(marketplaceId);
  if (!token) return { applications: [], refCode: null };
  const res = await base44.functions.invoke("affiliateApplications", { marketplaceId, token });
  if (res.data?.error) return { applications: [], refCode: null };
  return res.data;
}

// The affiliate's earnings dashboard (cleared, held, refunded, transaction history).
export async function fetchAffiliateDashboard(marketplaceId) {
  const token = getStoredToken(marketplaceId);
  if (!token) return null;
  const res = await base44.functions.invoke("affiliateDashboard", { marketplaceId, token });
  if (res.data?.error) return null;
  return res.data;
}

// Apply to promote a product as an affiliate.
export async function applyAsAffiliate({ marketplaceId, listingId, answers }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in to apply");
  let res;
  try {
    res = await base44.functions.invoke("affiliateApply", { marketplaceId, token, listingId, answers });
  } catch (err) {
    // Non-2xx (e.g. 400) throws — surface the server's real error message.
    const serverError = err?.response?.data?.error;
    throw new Error(serverError || err.message || "Could not submit your application.");
  }
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Save the affiliate's payout method + details (PayPal email, bank/wire info).
export async function updateAffiliatePayout({ marketplaceId, payoutMethod, payoutDetails }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in");
  let res;
  try {
    res = await base44.functions.invoke("affiliateUpdatePayout", { marketplaceId, token, payoutMethod, payoutDetails });
  } catch (err) {
    // Non-2xx (e.g. 404 "not an affiliate yet") throws — surface the server's real error message.
    const serverError = err?.response?.data?.error;
    throw new Error(serverError || err.message || "Could not save your payout details.");
  }
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}