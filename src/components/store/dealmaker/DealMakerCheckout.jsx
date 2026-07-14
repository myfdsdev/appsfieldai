import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, CreditCard, ArrowRight, User, Mail, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStoreCustomer } from "@/hooks/useStoreCustomer";
import { signupStoreCustomer, loginStoreCustomer } from "@/lib/storeCustomerAuth";

// In-chat guided checkout. Renders right inside the Deal Maker conversation.
// Steps: 0) sign up / log in on the store  →  1) name + email  →
// 2) full-price vs share-price (if both exist)  →  3) payment method  →
// processes via dealMakerCheckout backend fn.
// Never navigates the page; PayPal/Stripe open in a new tab.
export default function DealMakerCheckout({ listing, marketplaceId, marketplace, brandColor = "#f97316", currency = "USD" }) {
  const { customer, loading: customerLoading, setCustomer } = useStoreCustomer(marketplaceId);
  const [step, setStep] = useState("info"); // auth | info | price | pay | processing | done
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [priceMode, setPriceMode] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Store signup/login gate (shown before checkout when not logged in).
  const [authMode, setAuthMode] = useState("signup"); // signup | login
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const fmt = (n) =>
    n == null ? null : new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const fullPrice = listing.price ?? listing.discountPrice ?? null;
  const sharePrice = listing.sharePrice ?? null;
  const hasBoth = fullPrice != null && sharePrice != null && sharePrice > 0 && sharePrice !== fullPrice;

  const payment = marketplace?.payment || {};
  const methods = [];
  if (payment.paypalEnabled) methods.push({ id: "paypal", label: "PayPal" });
  // Stripe runs on the platform keys, so it's always available store-wide.
  methods.push({ id: "stripe", label: "Card (Stripe)" });
  if (payment.codEnabled) methods.push({ id: "cod", label: payment.codInstructions ? "Manual payment" : "Pay manually" });

  // Once we know the customer, prefill their details and skip the info step.
  React.useEffect(() => {
    if (customer) {
      setName(customer.fullName || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
    }
  }, [customer]);

  const proceedAfterInfo = () => {
    setStep(hasBoth ? "price" : "pay");
    if (!hasBoth) setPriceMode("full");
  };

  const submitInfo = () => {
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email.");
    proceedAfterInfo();
  };

  const setA = (k) => (e) => setAuthForm((f) => ({ ...f, [k]: e.target.value }));

  const submitAuth = async (e) => {
    e?.preventDefault?.();
    setAuthError("");
    if (authMode === "signup" && !authForm.fullName.trim()) return setAuthError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email.trim())) return setAuthError("Please enter a valid email.");
    if (authForm.password.length < 6) return setAuthError("Password must be at least 6 characters.");
    setAuthLoading(true);
    try {
      const c = authMode === "signup"
        ? await signupStoreCustomer({ marketplaceId, fullName: authForm.fullName.trim(), email: authForm.email.trim(), password: authForm.password, phone: authForm.phone.trim() })
        : await loginStoreCustomer({ marketplaceId, email: authForm.email.trim(), password: authForm.password });
      setCustomer(c);
      setName(c.fullName || "");
      setEmail(c.email || "");
      setPhone(c.phone || "");
      proceedAfterInfo();
    } catch (err) {
      setAuthError(err.message || "Something went wrong — try again.");
    }
    setAuthLoading(false);
  };

  const process = async (method) => {
    setStep("processing");
    setError("");
    try {
      const res = await base44.functions.invoke("dealMakerCheckout", {
        marketplaceId,
        listingId: listing.id,
        priceMode: priceMode || "full",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        paymentMethod: method,
        returnUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      const data = res.data || {};
      if (data.error) { setError(data.error); setStep("pay"); return; }
      // PayPal / Stripe → open the payment page in a new tab, keep the chat open.
      if (data.approveUrl) window.open(data.approveUrl, "_blank", "noopener");
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e.message || "Something went wrong — try again.");
      setStep("pay");
    }
  };

  const inputCls =
    "w-full h-11 rounded-xl px-4 text-sm text-white placeholder:text-white/40 focus:outline-none";
  const inputStyle = { backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-2xl overflow-hidden border shadow-2xl no-global-input-style"
      style={{ background: "rgba(12,14,20,0.8)", borderColor: "rgba(255,255,255,0.14)", backdropFilter: "blur(14px)", fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4" style={{ color: brandColor }} />
          <p className="text-sm font-semibold text-white">Checkout</p>
        </div>

        {/* Sign up / log in gate — required before checkout when not logged in */}
        {step === "info" && !customerLoading && !customer && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-sm font-semibold text-white">{authMode === "signup" ? "Create your account" : "Welcome back"}</p>
              <p className="text-xs text-white/55 mt-0.5">{authMode === "signup" ? `Sign up to ${marketplace?.name || "the store"} to continue to checkout.` : "Log in to continue to checkout."}</p>
            </div>
            <form onSubmit={submitAuth} className="space-y-3">
              {authMode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input className={inputCls + " pl-10"} style={inputStyle} placeholder="Full name" value={authForm.fullName} onChange={setA("fullName")} />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input className={inputCls + " pl-10"} style={inputStyle} type="email" placeholder="Email address" value={authForm.email} onChange={setA("email")} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input className={inputCls + " pl-10"} style={inputStyle} type="password" placeholder="Password" value={authForm.password} onChange={setA("password")} />
              </div>
              {authMode === "signup" && (
                <input className={inputCls} style={inputStyle} placeholder="Phone (optional)" value={authForm.phone} onChange={setA("phone")} />
              )}
              {authError && <p className="text-xs text-red-400">{authError}</p>}
              <button type="submit" disabled={authLoading} className="w-full h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}>
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {authMode === "signup" ? "Sign Up & Continue" : "Log In & Continue"}
              </button>
            </form>
            <p className="text-center text-xs text-white/55">
              {authMode === "signup" ? "Already have an account?" : "New here?"}{" "}
              <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }} className="font-semibold" style={{ color: brandColor }}>
                {authMode === "signup" ? "Log in" : "Create one"}
              </button>
            </p>
          </div>
        )}

        {step === "info" && customerLoading && (
          <div className="py-6 flex flex-col items-center gap-3 text-white/70">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: brandColor }} />
          </div>
        )}

        {step === "info" && !customerLoading && customer && (
          <div className="space-y-4">
            {/* Product summary — name, description & price */}
            <div className="rounded-xl p-4 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-start gap-3">
                {listing.logo ? (
                  <img src={listing.logo} alt={listing.softwareName} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}>
                    <span className="text-white font-bold text-lg">{listing.softwareName?.[0] || "?"}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{listing.softwareName}</p>
                  {listing.shortDescription && (
                    <p className="text-xs text-white/55 mt-0.5 line-clamp-2 leading-snug">{listing.shortDescription}</p>
                  )}
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-xs text-white/50">{hasBoth ? "From" : "Price"}</span>
                <div className="flex items-baseline gap-2">
                  {listing.price != null && listing.discountPrice != null && listing.discountPrice < listing.price && (
                    <span className="text-xs text-white/40 line-through">{fmt(listing.price)}</span>
                  )}
                  <span className="text-lg font-extrabold" style={{ color: brandColor }}>
                    {fmt(hasBoth ? Math.min(fullPrice, sharePrice) : (listing.discountPrice ?? fullPrice))}
                  </span>
                </div>
              </div>
            </div>

            <input className={inputCls} style={inputStyle} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} style={inputStyle} placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} style={inputStyle} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={submitInfo} className="w-full h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "price" && (
          <div className="space-y-3">
            <p className="text-xs text-white/60">Two ways to get this — pick what fits you:</p>
            <button onClick={() => { setPriceMode("full"); setStep("pay"); }} className="w-full text-left rounded-xl border border-white/15 hover:bg-white/5 px-4 py-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Buy in full</span>
                <span className="text-sm font-bold" style={{ color: brandColor }}>{fmt(fullPrice)}</span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">Own it outright, one payment.</p>
            </button>
            <button onClick={() => { setPriceMode("share"); setStep("pay"); }} className="w-full text-left rounded-xl border border-white/15 hover:bg-white/5 px-4 py-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Reserve a spot</span>
                <span className="text-sm font-bold" style={{ color: brandColor }}>{fmt(sharePrice)}</span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">Grab a single share at the lower per-spot price.</p>
            </button>
          </div>
        )}

        {step === "pay" && (
          <div className="space-y-3">
            <p className="text-xs text-white/60">How would you like to pay?</p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {methods.map((m) => (
              <button key={m.id} onClick={() => process(m.id)} className="w-full h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-white border border-white/15 hover:bg-white/5 transition-colors">
                {m.label}
              </button>
            ))}
          </div>
        )}

        {step === "processing" && (
          <div className="py-6 flex flex-col items-center gap-3 text-white/70">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: brandColor }} />
            <p className="text-sm">Setting up your order…</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-4 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            <p className="text-sm font-semibold text-white">You're all set, {name.split(" ")[0]}!</p>
            <p className="text-xs text-white/60 leading-relaxed">
              {result?.approveUrl
                ? "Finish payment in the tab that just opened. Your order and access will appear in your store account once payment completes."
                : "Your order is confirmed — it's now in your store account, and we've emailed you the details."}
            </p>
            {result?.codInstructions && (
              <p className="text-xs text-white/50 whitespace-pre-wrap mt-1 border-t border-white/10 pt-3">{result.codInstructions}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}