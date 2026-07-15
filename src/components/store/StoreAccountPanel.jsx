import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Package, Mail, Phone, LogOut, Loader2, CheckCircle2, Clock, CircleDollarSign, ShoppingBag, CalendarCheck, Share2 } from "lucide-react";
import { fetchStoreCustomerProducts, fetchStoreCustomerOrders } from "@/lib/storeCustomerAuth";
import StoreOrderCard from "@/components/store/StoreOrderCard";
import StoreAccountSettings from "@/components/store/StoreAccountSettings";
import BecomeAffiliateModal from "@/components/store/BecomeAffiliateModal";

const STATUS_STYLES = {
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  contacted: { label: "Contacted", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  fulfilled: { label: "Fulfilled", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border/40" },
};

function ProductRow({ p, brandColor }) {
  const st = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
  const progress = p.listing && p.listing.totalShares > 0
    ? Math.min(100, (p.listing.soldShares / p.listing.totalShares) * 100)
    : 0;
  // Amount stays due until the deal is fulfilled AND the store has approved payment.
  const settled = p.paymentApproved;
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.listing?.imageGradient || "from-orange-500 to-amber-500"} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold truncate">{p.listingTitle}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {p.listing?.category || "—"} · {p.spots} spot{p.spots > 1 ? "s" : ""} reserved
          </p>

          {p.listing && p.listing.totalShares > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Deal progress</span>
                <span>{p.listing.soldShares}/{p.listing.totalShares} filled</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: brandColor }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs">
              <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Amount due</span>
            </div>
            {settled ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid · ${p.amountDue.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm font-display font-bold" style={{ color: brandColor }}>
                ${p.amountDue.toLocaleString()}
              </span>
            )}
          </div>
          {!settled && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {p.dealFulfilled
                ? "Deal is full — awaiting payment confirmation from the store."
                : "Due once the deal fills up and the store confirms your payment."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoreAccountPanel({ open, onClose, marketplaceId, customer, setCustomer, brandColor = "#f97316", onLogout, initialTab = "account", affiliateEnabled = false, affiliatePath, affiliateSettings = null, storeBaseUrl = "" }) {
  const navigate = useNavigate();
  const goToAffiliate = () => { onClose(); if (affiliatePath) navigate(affiliatePath); };
  const [tab, setTab] = useState(initialTab);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  // Product a customer is applying to promote — opens BecomeAffiliateModal in-place
  // (no navigation, so it works on custom domains / proxied stores).
  const [promoteListing, setPromoteListing] = useState(null);

  // Build a minimal listing object from an order to feed the affiliate modal.
  const becomeAffiliate = (order) => {
    const item = (order.items || [])[0];
    if (!item) return;
    setPromoteListing({
      id: item.listingId,
      softwareName: item.listingTitle,
      imageGradient: item.imageGradient,
      affiliateCommissionRate: item.affiliateCommissionRate,
    });
  };

  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

  // Load orders + reservations whenever the panel opens (both tabs use the summary).
  useEffect(() => {
    if (!open || !marketplaceId) return;
    setLoading(true);
    Promise.all([
      fetchStoreCustomerOrders(marketplaceId),
      fetchStoreCustomerProducts(marketplaceId),
    ])
      .then(([o, p]) => { setOrders(o); setProducts(p); })
      .finally(() => setLoading(false));
  }, [open, marketplaceId]);

  const deliveredCount = orders.filter((o) => o.status === "completed").length;
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + (o.total || 0), 0);

  if (!open) return null;

  const tabs = [
    { id: "account", label: "My Account", icon: User },
    { id: "products", label: "My Products", icon: Package },
  ];

  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-background border-l border-border/40 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: brandColor }}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{customer?.fullName || "Customer"}</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{customer?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border/40 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "text-white" : "text-muted-foreground hover:bg-secondary/50"}`}
                style={active ? { background: brandColor } : {}}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "account" ? (
            <div className="space-y-3">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-border/40 bg-card/60 p-3 text-center">
                  <p className="text-lg font-display font-bold" style={{ color: brandColor }}>{orders.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Orders</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/60 p-3 text-center">
                  <p className="text-lg font-display font-bold text-emerald-400">{deliveredCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Delivered</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/60 p-3 text-center">
                  <p className="text-lg font-display font-bold">${totalSpent.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Spent</p>
                </div>
              </div>
              <button onClick={() => setTab("products")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: brandColor }}>
                <Package className="w-4 h-4" /> View My Products
              </button>
              {affiliateEnabled && (
                <button onClick={goToAffiliate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-secondary/40"
                  style={{ borderColor: `${brandColor}55`, color: brandColor }}>
                  <Share2 className="w-4 h-4" /> Affiliate Dashboard
                </button>
              )}
              <StoreAccountSettings
                marketplaceId={marketplaceId}
                customer={customer}
                brandColor={brandColor}
                onUpdated={(c) => setCustomer?.((prev) => ({ ...prev, ...c }))}
              />
              <button onClick={() => { onClose(); onLogout?.(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : orders.length === 0 && products.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">You haven't purchased any products yet.</p>
                  <p className="text-xs mt-1">Your orders and reservations will appear here.</p>
                </div>
              ) : (
                <>
                  {orders.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" /> Purchases
                      </p>
                      {orders.map((o) => <StoreOrderCard key={o.id} order={o} brandColor={brandColor} affiliateEnabled={affiliateEnabled} onBecomeAffiliate={becomeAffiliate} />)}
                    </div>
                  )}
                  {products.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" /> Reserved Deals
                      </p>
                      {products.map((p) => <ProductRow key={p.id} p={p} brandColor={brandColor} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply to promote a purchased product — in-place, no navigation */}
      <BecomeAffiliateModal
        open={!!promoteListing}
        onClose={() => setPromoteListing(null)}
        marketplaceId={marketplaceId}
        listing={promoteListing}
        storeBaseUrl={storeBaseUrl}
        affiliateSettings={affiliateSettings}
        brandColor={brandColor}
      />
    </div>
  );
}