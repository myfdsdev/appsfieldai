import React, { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import { subscribeToStorePlan, createPaypalOrder, createStripeCheckout, createRazorpayOrder, verifyRazorpayOrder } from "@/lib/storeCustomerAuth";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { toast } from "sonner";

// Subscribe to one of the store's own plans. The first billing cycle is charged
// through the store's existing payment methods (PayPal / Stripe / Razorpay / manual).
export default function StoreSubscribeModal({ open, onClose, plan, marketplace, customer, brandColor = "#f97316", onSubscribed }) {
  const payment = marketplace?.payment || {};
  const methods = [];
  if (payment.paypalEnabled) methods.push({ id: "paypal", label: "PayPal", desc: "Pay securely with card or PayPal", icon: CreditCard });
  if (payment.stripeEnabled) methods.push({ id: "stripe", label: "Credit / Debit Card", desc: "Pay securely with card via Stripe", icon: CreditCard });
  if (payment.razorpayEnabled) methods.push({ id: "razorpay", label: "Razorpay", desc: "Card, UPI & netbanking via Razorpay", icon: CreditCard });
  if (payment.codEnabled) methods.push({ id: "cod", label: "Pay Your Own Way", desc: "Bank transfer / manual payment", icon: Banknote });

  const [method, setMethod] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const isGuest = !customer;
  const currency = marketplace?.currency || "USD";
  const cycle = plan?.billingType === "one_time" ? "one-time" : plan?.billingType === "yearly" ? "per year" : "per month";

  useEffect(() => {
    if (open) {
      setMethod(methods[0]?.id || "");
      setFullName(customer?.fullName || "");
      setEmail(customer?.email || "");
      setPhone(customer?.phone || "");
      setDone(null);
    }
  }, [open]); // eslint-disable-line

  if (!open || !plan) return null;

  const subscribe = async () => {
    if (!method) { toast.error("This store has no payment method enabled yet."); return; }
    if (!fullName.trim()) { toast.error("Please enter your name."); return; }
    if (isGuest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Please enter a valid email."); return; }
    setLoading(true);
    try {
      const res = await subscribeToStorePlan({
        marketplaceId: marketplace.id,
        planId: plan.id,
        paymentMethod: method,
        fullName: fullName.trim(),
        email: isGuest ? email.trim() : undefined,
        phone,
      });
      const guestToken = res.token;
      const base = window.location.origin + window.location.pathname;

      if (method === "paypal") {
        const pay = await createPaypalOrder({
          marketplaceId: marketplace.id, orderId: res.order.id,
          returnUrl: `${base}?paypal=${res.order.id}`, cancelUrl: `${base}?paypal_cancel=1`, token: guestToken,
        });
        onSubscribed?.();
        window.location.href = pay.approveUrl;
        return;
      }

      if (method === "stripe") {
        const pay = await createStripeCheckout({
          marketplaceId: marketplace.id, orderId: res.order.id,
          returnUrl: `${base}?stripe=${res.order.id}`, cancelUrl: `${base}?stripe_cancel=1`, token: guestToken,
        });
        onSubscribed?.();
        window.location.href = pay.checkoutUrl;
        return;
      }

      if (method === "razorpay") {
        const rzpOrder = await createRazorpayOrder({ marketplaceId: marketplace.id, orderId: res.order.id, token: guestToken });
        const resp = await openRazorpayCheckout({ order: rzpOrder, brandColor });
        await verifyRazorpayOrder({
          marketplaceId: marketplace.id, orderId: res.order.id,
          razorpayPaymentId: resp.razorpay_payment_id, razorpayOrderId: resp.razorpay_order_id,
          razorpaySignature: resp.razorpay_signature, token: guestToken,
        });
        setDone({});
        onSubscribed?.();
        return;
      }

      setDone({ codInstructions: res.codInstructions });
      onSubscribed?.();
    } catch (e) {
      toast.error(e.message || "Could not start your subscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-display font-bold">You're all set!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {method === "cod"
                ? "Your subscription is recorded and activates once your payment is confirmed."
                : "Payment received — your subscription is active."}
            </p>
            {method === "cod" && done.codInstructions && (
              <div className="mt-4 text-left rounded-xl bg-secondary/40 border border-border/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Payment Instructions</p>
                <p className="text-sm whitespace-pre-wrap">{done.codInstructions}</p>
              </div>
            )}
            <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: brandColor }}>Done</button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-display font-bold mb-1">Subscribe to {plan.name}</h2>
            <p className="text-xs text-muted-foreground mb-4">{currency} {plan.price} {cycle}</p>

            <div className="space-y-2 mb-4">
              <label className="text-xs text-muted-foreground">Payment Method</label>
              {methods.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  This store hasn't enabled any payment method yet.
                </div>
              ) : methods.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${method === m.id ? "border-orange-500 bg-orange-500/10" : "border-border/40 hover:border-border"}`}>
                  <m.icon className="w-5 h-5 shrink-0" style={{ color: brandColor }} />
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{m.label}</p><p className="text-[11px] text-muted-foreground">{m.desc}</p></div>
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm focus:outline-none" />
            </div>
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!isGuest} type="email" placeholder="you@email.com"
                className={`w-full px-3 py-2.5 rounded-xl border border-border/40 text-sm focus:outline-none ${isGuest ? "bg-secondary/60" : "bg-secondary/40 text-muted-foreground cursor-not-allowed"}`} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1.5 block">Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm focus:outline-none" />
            </div>

            <button onClick={subscribe} disabled={loading || methods.length === 0}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background: brandColor }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Subscribe
            </button>
          </>
        )}
      </div>
    </div>
  );
}