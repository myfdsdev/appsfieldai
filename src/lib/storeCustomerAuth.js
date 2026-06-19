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