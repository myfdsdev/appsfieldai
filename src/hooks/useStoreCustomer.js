import { useState, useEffect, useCallback } from "react";
import { fetchStoreCustomer, logoutStoreCustomer, getStoredToken } from "@/lib/storeCustomerAuth";

// Tracks the logged-in store customer for a given marketplace.
export function useStoreCustomer(marketplaceId) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!marketplaceId) { setLoading(false); return; }
    setLoading(true);
    if (!getStoredToken(marketplaceId)) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    const c = await fetchStoreCustomer(marketplaceId);
    setCustomer(c);
    setLoading(false);
  }, [marketplaceId]);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(() => {
    logoutStoreCustomer(marketplaceId);
    setCustomer(null);
  }, [marketplaceId]);

  return { customer, loading, refresh, logout, setCustomer };
}