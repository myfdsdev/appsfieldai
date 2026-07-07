import { useState, useEffect, useCallback } from "react";

// Client-side, per-marketplace shopping cart persisted in localStorage so a
// store visitor's cart survives reloads and is isolated per store.
const cartKey = (marketplaceId) => `store_cart_${marketplaceId}`;

function readCart(marketplaceId) {
  if (!marketplaceId) return [];
  try {
    return JSON.parse(localStorage.getItem(cartKey(marketplaceId)) || "[]");
  } catch {
    return [];
  }
}

// Deal price prefers the owner-edited `price` field; falls back to
// spots × per-spot price for older group deals that never set `price`.
export function listingPrice(listing) {
  if (listing?.price && listing.price > 0) return listing.price;
  return (listing?.sharePrice || 0) * (listing?.totalShares || 0);
}

export function useStoreCart(marketplaceId) {
  const [items, setItems] = useState([]);

  useEffect(() => { setItems(readCart(marketplaceId)); }, [marketplaceId]);

  const persist = useCallback((next) => {
    setItems(next);
    if (marketplaceId) localStorage.setItem(cartKey(marketplaceId), JSON.stringify(next));
  }, [marketplaceId]);

  const addItem = useCallback((listing, qty = 1) => {
    const next = readCart(marketplaceId);
    const existing = next.find((i) => i.listingId === listing.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      next.push({
        listingId: listing.id,
        listingTitle: listing.softwareName || "Untitled",
        unitPrice: listingPrice(listing),
        imageGradient: listing.imageGradient || "",
        logo: listing.logo || listing.screenshots?.[0] || "",
        category: listing.category || "",
        quantity: qty,
      });
    }
    persist(next);
  }, [marketplaceId, persist]);

  const updateQty = useCallback((listingId, qty) => {
    const next = readCart(marketplaceId)
      .map((i) => (i.listingId === listingId ? { ...i, quantity: Math.max(1, qty) } : i));
    persist(next);
  }, [marketplaceId, persist]);

  const removeItem = useCallback((listingId) => {
    persist(readCart(marketplaceId).filter((i) => i.listingId !== listingId));
  }, [marketplaceId, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return { items, addItem, updateQty, removeItem, clear, count, total };
}