import React, { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import { checkoutStoreOrder, createPaypalOrder } from "@/lib/storeCustomerAuth";
import { toast } from "sonner";

// Final checkout step: pick a payment method (based on what the store enabled)
// and place the order. COD completes immediately with instructions; PayPal is
// recorded as pending until the store wires up PayPal capture.
export default function StoreCheckoutModal({ open, onClose, items, total, marketplace, customer, brandColor = "#f97316", onPlaced }) {
  const payment = marketplace?.payment || {};
  const methods = [];
  if (payment.paypalEnabled) methods.push({ id: "paypal", label: "PayPal", desc: "Pay securely with card or PayPal", icon: CreditCard });
  if (payment.codEnabled) methods.push({ id: "cod", label: "Pay Your Own Way", desc: "Bank transfer / manual payment", icon: Banknote });

  const [method, setMethod] = useState(methods[0]?.id || "");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { codInstructions }

  useEffect(() => {
    if (open) {
      setMethod(methods[0]?.id || "");
      setPhone(customer?.phone || "");
      setNotes("");
      setDone(null);
    }
  }, [open]); // eslint-disable-line

  if (!open) return null;

  const place = async () => {
    if (!method) { toast.error("This store has no payment method enabled yet."); return; }
    setLoading(true);
    try {
      const res = await checkoutStoreOrder({
        marketplaceId: marketplace.id,
        items: items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
        paymentMethod: method,
        phone,
        notes,
      });

      // PayPal → create a PayPal order and redirect the buyer to PayPal's approval page.
      // On return, the store page captures the payment via the ?paypal= param.
      if (method === "paypal") {
        const base = window.location.origin + window.location.pathname;
        const pay = await createPaypalOrder({
          marketplaceId: marketplace.id,
          orderId: res.order.id,
          returnUrl: `${base}?paypal=${res.order.id}`,
          cancelUrl: `${base}?paypal_cancel=1`,
        });
        onPlaced?.();
        window.location.href = pay.approveUrl;
        return;
      }

      setDone({ codInstructions: res.codInstructions });
      onPlaced?.();
    } catch (e) {
      toast.error(e.message || "Checkout failed. Please try again.");
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
            <h2 className="text-lg font-display font-bold">Order placed!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {method === "paypal"
                ? "Your order is recorded. The store will confirm your PayPal payment."
                : "Your order is recorded. Follow the payment instructions below."}
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
            <h2 className="text-lg font-display font-bold mb-1">Checkout</h2>
            <p className="text-xs text-muted-foreground mb-4">{items.length} item{items.length > 1 ? "s" : ""} · ${total.toLocaleString()}</p>

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
                  <div className="flex-1"><p className="text-sm font-medium">{m.label}</p><p className="text-[11px] text-muted-foreground">{m.desc}</p></div>
                  <div className={`w-4 h-4 rounded-full border-2 ${method === m.id ? "border-orange-500" : "border-border"}`}>
                    {method === m.id && <div className="w-full h-full rounded-full scale-50" style={{ background: brandColor }} />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm focus:outline-none" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1.5 block">Order notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the store should know..."
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm h-16 resize-none focus:outline-none" />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3 mb-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-display font-bold" style={{ color: brandColor }}>${total.toLocaleString()}</span>
            </div>

            <button onClick={place} disabled={loading || methods.length === 0}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background: brandColor }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Place Order
            </button>
          </>
        )}
      </div>
    </div>
  );
}