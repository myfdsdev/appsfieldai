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

// Reserve spots on a listing as the logged-in store customer.
export async function reserveStoreSpot({ marketplaceId, listingId, spots, phone, message }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in to reserve a spot");
  const res = await base44.functions.invoke("storeCustomerReserve", { marketplaceId, token, listingId, spots, phone, message });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.reservation;
}

// Place a store order (cart checkout) as the logged-in store customer.
export async function checkoutStoreOrder({ marketplaceId, items, paymentMethod, phone, notes }) {
  const token = getStoredToken(marketplaceId);
  if (!token) throw new Error("Please sign in to checkout");
  const res = await base44.functions.invoke("storeCheckout", { marketplaceId, token, items, paymentMethod, phone, notes });
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