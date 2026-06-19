import React, { useState } from "react";
import { X, Loader2, User, Mail, Lock, Phone } from "lucide-react";
import { signupStoreCustomer, loginStoreCustomer } from "@/lib/storeCustomerAuth";

// Store-scoped customer signup/login. Accounts are tied to this marketplace only.
export default function StoreAuthModal({ open, onClose, marketplace, brandColor = "#f97316", onAuthed, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => { if (open) { setMode(initialMode); setError(""); } }, [open, initialMode]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const customer = mode === "signup"
        ? await signupStoreCustomer({ marketplaceId: marketplace.id, ...form })
        : await loginStoreCustomer({ marketplaceId: marketplace.id, email: form.email, password: form.password });
      onAuthed?.(customer);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm focus:outline-none focus:ring-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border/40 rounded-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ background: brandColor }}>
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-display font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "signup" ? `Join ${marketplace.name} to apply for deals.` : `Sign in to ${marketplace.name}.`}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className={inputCls} placeholder="Full name" value={form.fullName} onChange={set("fullName")} style={{ "--tw-ring-color": brandColor }} />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className={inputCls} type="email" placeholder="Email" required value={form.email} onChange={set("email")} style={{ "--tw-ring-color": brandColor }} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className={inputCls} type="password" placeholder="Password" required value={form.password} onChange={set("password")} style={{ "--tw-ring-color": brandColor }} />
          </div>
          {mode === "signup" && (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className={inputCls} placeholder="Phone (optional)" value={form.phone} onChange={set("phone")} style={{ "--tw-ring-color": brandColor }} />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: brandColor }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signup" ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} className="font-semibold" style={{ color: brandColor }}>
            {mode === "signup" ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}