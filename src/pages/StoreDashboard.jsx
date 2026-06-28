import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store, User, Mail, Phone, Package, ShoppingBag, CalendarCheck, Loader2, ArrowLeft, LogOut, CheckCircle2, Clock, CircleDollarSign, KeyRound, ExternalLink } from "lucide-react";
import { getStoreKeyFromHost, getCustomDomainFromHost } from "@/lib/storeHost";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { fetchStoreCustomerOrders, fetchStoreCustomerProducts } from "@/lib/storeCustomerAuth";
import StoreOrderCard from "@/components/store/StoreOrderCard";

const RES_STATUS = {
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  contacted: { label: "Contacted", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  fulfilled: { label: "Fulfilled", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border/40" },
};

function ReservationRow({ p, brandColor }) {
  const st = RES_STATUS[p.status] || RES_STATUS.pending;
  const settled = p.paymentApproved;
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold truncate">{p.listingTitle}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>{st.label}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {p.listing?.category || "—"} · {p.spots} spot{p.spots > 1 ? "s" : ""} reserved
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CircleDollarSign className="w-3.5 h-3.5" /> Amount due
        </span>
        {settled ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid · ${p.amountDue.toLocaleString()}
          </span>
        ) : (
          <span className="text-sm font-display font-bold" style={{ color: brandColor }}>${p.amountDue.toLocaleString()}</span>
        )}
      </div>

      {/* Product access — shown once the deal is fulfilled and access info is delivered */}
      {p.delivery && (
        <div className="mt-3 pt-3 border-t border-border/30 rounded-xl bg-emerald-500/[0.04] -mx-1 px-3 pb-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Product Access
          </p>
          {p.delivery.accessUrl && (
            <a href={p.delivery.accessUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline break-all" style={{ color: brandColor }}>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {p.delivery.accessUrl}
            </a>
          )}
          {p.delivery.instructions && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1.5">{p.delivery.instructions}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoreDashboard() {
  const { slug: slugParam } = useParams();
  const navigate = useNavigate();
  const customDomain = getCustomDomainFromHost();
  const slug = slugParam || getStoreKeyFromHost();
  const storeBasePath = slugParam ? `/store/${slugParam}` : "";

  const [marketplace, setMarketplace] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);

  const marketplaceId = marketplace?.id;
  const { customer, loading: customerLoading, logout } = useStoreCustomer(marketplaceId);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setStoreLoading(true);
    base44.functions
      .invoke("getMarketplacePublic", { slug, customDomain })
      .then((res) => { if (active) setMarketplace(res.data?.marketplace || null); })
      .finally(() => active && setStoreLoading(false));
    return () => { active = false; };
  }, [slug, customDomain]);

  useEffect(() => {
    if (!marketplaceId || !customer) return;
    setDataLoading(true);
    Promise.all([
      fetchStoreCustomerOrders(marketplaceId),
      fetchStoreCustomerProducts(marketplaceId),
    ])
      .then(([o, p]) => { setOrders(o); setProducts(p); })
      .finally(() => setDataLoading(false));
  }, [marketplaceId, customer]);

  const brandColor = marketplace?.branding?.primaryColor || "#f97316";

  if (storeLoading || customerLoading) {
    return (
      <div className="min-h-screen flex justify-center pt-32 bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not signed in → send back to the store to log in.
  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold">Please sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in on the store to view your dashboard.</p>
        <button onClick={() => navigate(storeBasePath || "/")}
          className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: brandColor }}>
          Back to store
        </button>
      </div>
    );
  }

  const deliveredCount = orders.filter((o) => o.status === "completed").length;
  const totalSpent = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + (o.total || 0), 0);

  const stats = [
    { label: "Orders", value: orders.length, color: brandColor },
    { label: "Delivered", value: deliveredCount, color: "#34d399" },
    { label: "Reservations", value: products.length, color: "#38bdf8" },
    { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, color: "#e5e7eb" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate(storeBasePath || "/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> {marketplace?.name || "Store"}
          </button>
          <button onClick={() => { logout(); navigate(storeBasePath || "/"); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Greeting */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: brandColor }}>
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Welcome, {customer.fullName || "there"}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/40 bg-card/60 p-4">
              <p className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Purchases */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4" /> My Purchases
              </h2>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/40 py-10 text-center text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No purchases yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {orders.map((o) => <StoreOrderCard key={o.id} order={o} brandColor={brandColor} />)}
                </div>
              )}
            </section>

            {/* Reservations */}
            {products.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                  <CalendarCheck className="w-4 h-4" /> Reserved Deals
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {products.map((p) => <ReservationRow key={p.id} p={p} brandColor={brandColor} />)}
                </div>
              </section>
            )}

            {/* Profile */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <User className="w-4 h-4" /> My Account
              </h2>
              <div className="rounded-2xl border border-border/40 bg-card/60 p-5 grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[11px] text-muted-foreground">Email</p><p className="text-sm">{customer.email || "—"}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[11px] text-muted-foreground">Full name</p><p className="text-sm">{customer.fullName || "—"}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div><p className="text-[11px] text-muted-foreground">Phone</p><p className="text-sm">{customer.phone || "—"}</p></div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}