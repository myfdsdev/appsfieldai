import React, { useEffect, useState } from "react";
import { Check, Loader2, Star, CreditCard } from "lucide-react";
import { fetchStorePlans, cancelStoreSubscription } from "@/lib/storeCustomerAuth";
import StoreSubscribeModal from "@/components/store/StoreSubscribeModal";
import { toast } from "sonner";

const STATUS_LABEL = {
  pending: "Awaiting payment",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
  expired: "Expired",
};

// Customer-facing subscription plans for a store: the plan cards plus the
// customer's own subscription state when they're signed in.
export default function StorePlansSection({ marketplace, customer, brandColor = "#f97316", pal, refreshCustomer }) {
  const cardStyle = pal
    ? { background: pal.card || pal.surface, borderColor: pal.cardBorder, color: pal.text }
    : undefined;
  const mutedStyle = pal ? { color: `${pal.text}99` } : undefined;
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const currency = marketplace?.currency || "USD";
  const marketplaceId = marketplace?.id;

  const load = ({ silent } = {}) => {
    if (!marketplaceId) return;
    if (!silent) setLoading(true);
    fetchStorePlans(marketplaceId)
      .then((res) => { setPlans(res.plans || []); setSubscriptions(res.subscriptions || []); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [marketplaceId, customer?.id]); // eslint-disable-line

  const cancel = async (sub) => {
    try {
      await cancelStoreSubscription({ marketplaceId, subscriptionId: sub.id });
      toast.success("Subscription cancelled.");
      load();
    } catch (e) {
      toast.error(e.message || "Could not cancel.");
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (plans.length === 0 && subscriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 py-10 text-center text-muted-foreground">
        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">This store doesn't offer subscription plans yet.</p>
      </div>
    );
  }

  const liveSubs = subscriptions.filter((s) => s.status === "active" || s.status === "pending");

  return (
    <div className="space-y-6">
      {liveSubs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Subscription</h3>
          {liveSubs.map((s) => (
            <div key={s.id} className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3"
              style={{ borderColor: `${brandColor}40`, background: `${brandColor}0a` }}>
              <div>
                <p className="font-display font-bold">{s.planName}</p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABEL[s.status] || s.status} · {s.currency} {s.price} {s.billingType === "one_time" ? "one-time" : s.billingType === "yearly" ? "per year" : "per month"}
                  {s.currentPeriodEnd ? ` · renews ${new Date(s.currentPeriodEnd).toLocaleDateString()}` : ""}
                </p>
              </div>
              <button onClick={() => cancel(s)} className="text-xs px-3 py-1.5 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => {
            const subscribed = subscriptions.some((s) => s.planId === p.id && s.status === "active");
            return (
              <div key={p.id} className={`rounded-2xl border p-5 flex flex-col ${pal ? "" : "bg-card/60"}`}
                style={{ ...(cardStyle || {}), ...(p.highlighted ? { borderColor: brandColor } : (pal ? {} : { borderColor: "hsl(var(--border) / 0.4)" })) }}>
                {p.highlighted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 self-start text-white" style={{ background: brandColor }}>
                    <Star className="w-3 h-3" /> Most popular
                  </span>
                )}
                <p className="font-display font-bold">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground mt-1" style={mutedStyle}>{p.description}</p>}
                <p className="mt-3">
                  <span className="text-2xl font-display font-bold" style={{ color: brandColor }}>{currency} {p.price}</span>
                  <span className="text-xs text-muted-foreground ml-1" style={mutedStyle}>
                    {p.billingType === "one_time" ? "one-time" : p.billingType === "yearly" ? "/year" : "/month"}
                  </span>
                </p>
                <ul className="mt-3 space-y-1.5 flex-1">
                  {p.productLimit !== 0 && (
                    <li className="flex items-start gap-2 text-xs text-muted-foreground" style={mutedStyle}>
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: brandColor }} />
                      {p.productLimit === -1 ? "Unlimited products" : `${p.productLimit} products included`}
                    </li>
                  )}
                  {(p.features || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground" style={mutedStyle}>
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: brandColor }} /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setSelected(p)} disabled={subscribed}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  style={{ background: brandColor }}>
                  {subscribed ? "Subscribed" : p.billingType === "one_time" ? "Buy Plan" : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <StoreSubscribeModal
        open={!!selected}
        plan={selected}
        marketplace={marketplace}
        customer={customer}
        brandColor={brandColor}
        pal={pal}
        onClose={() => { setSelected(null); load({ silent: true }); }}
        onSubscribed={() => { refreshCustomer?.(); load({ silent: true }); }}
      />
    </div>
  );
}