import React, { useState } from "react";
import { X, Loader2, User, Mail, Lock, Phone, KeyRound, ArrowLeft, MailCheck } from "lucide-react";
import {
  signupStoreCustomer,
  loginStoreCustomer,
  requestStoreCustomerPasswordReset,
  confirmStoreCustomerPasswordReset,
  requestStoreCustomerMagicLink,
} from "@/lib/storeCustomerAuth";

// Store-scoped customer auth. Accounts are tied to this marketplace only.
// Default sign-in is passwordless: enter your email → we email a login link.
// A "use password instead" fallback keeps classic email+password login/signup.
export default function StoreAuthModal({ open, onClose, marketplace, brandColor = "#f97316", onAuthed, initialMode = "magic" }) {
  // modes: magic | login | signup | forgot
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Forgot-password flow state
  const [resetStep, setResetStep] = useState("request"); // request | confirm
  const [resetForm, setResetForm] = useState({ code: "", newPassword: "" });
  const [notice, setNotice] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
      setNotice("");
      setResetStep("request");
      setResetForm({ code: "", newPassword: "" });
      setMagicSent(false);
    }
  }, [open, initialMode]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setReset = (k) => (e) => setResetForm((f) => ({ ...f, [k]: e.target.value }));

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setNotice("");
    setMagicSent(false);
    setResetStep("request");
    setResetForm({ code: "", newPassword: "" });
  };

  // Email-only passwordless login link.
  const submitMagic = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestStoreCustomerMagicLink({ marketplaceId: marketplace.id, email: form.email });
      setMagicSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

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

  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (resetStep === "request") {
        await requestStoreCustomerPasswordReset({ marketplaceId: marketplace.id, email: form.email });
        setNotice("If an account exists for that email, we've sent a 6-digit reset code. Check your inbox.");
        setResetStep("confirm");
      } else {
        await confirmStoreCustomerPasswordReset({
          marketplaceId: marketplace.id,
          email: form.email,
          code: resetForm.code,
          newPassword: resetForm.newPassword,
        });
        setNotice("Password updated! You can now log in.");
        setMode("login");
        setForm((f) => ({ ...f, password: "" }));
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm focus:outline-none focus:ring-1";

  const title = mode === "signup" ? "Create your account"
    : mode === "forgot" ? "Reset your password"
    : mode === "login" ? "Log in with password"
    : "Sign in";
  const subtitle = mode === "signup"
    ? `Join ${marketplace.name} to apply for deals.`
    : mode === "forgot"
      ? (resetStep === "request" ? "Enter your email to get a reset code." : "Enter the code we emailed and your new password.")
      : mode === "login"
        ? `Sign in to ${marketplace.name}.`
        : `Enter your email and we'll send you a secure login link.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border/40 rounded-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ background: brandColor }}>
            {mode === "forgot" ? <KeyRound className="w-6 h-6 text-white" />
              : mode === "magic" ? <MailCheck className="w-6 h-6 text-white" />
              : <User className="w-6 h-6 text-white" />}
          </div>
          <h2 className="text-lg font-display font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {/* ── Passwordless magic-link (default) ── */}
        {mode === "magic" && (
          magicSent ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `${brandColor}1a` }}>
                <MailCheck className="w-7 h-7" style={{ color: brandColor }} />
              </div>
              <p className="text-sm font-semibold mb-1">Check your email</p>
              <p className="text-xs text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{form.email}</span>, we've sent a secure login link. Open it to sign in — no password needed.
              </p>
              <button type="button" onClick={() => setMagicSent(false)} className="mt-4 text-xs font-medium" style={{ color: brandColor }}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={submitMagic} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input className={inputCls} type="email" name="email" autoComplete="email" placeholder="Email" required value={form.email} onChange={set("email")} style={{ "--tw-ring-color": brandColor }} />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: brandColor }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send me a login link
              </button>

              <div className="flex items-center justify-center gap-3 pt-1 text-xs text-muted-foreground">
                <button type="button" onClick={() => switchMode("login")} className="hover:text-foreground">Use password</button>
                <span className="opacity-40">·</span>
                <button type="button" onClick={() => switchMode("signup")} className="hover:text-foreground">Create account</button>
              </div>
            </form>
          )
        )}

        {/* ── Forgot password ── */}
        {mode === "forgot" && (
          <form onSubmit={submitReset} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className={inputCls} type="email" name="email" autoComplete="email" placeholder="Email" required value={form.email} onChange={set("email")} disabled={resetStep === "confirm"} style={{ "--tw-ring-color": brandColor }} />
            </div>

            {resetStep === "confirm" && (
              <>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className={inputCls} inputMode="numeric" name="code" placeholder="6-digit code" required value={resetForm.code} onChange={setReset("code")} style={{ "--tw-ring-color": brandColor }} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className={inputCls} type="password" name="new-password" autoComplete="new-password" placeholder="New password" required value={resetForm.newPassword} onChange={setReset("newPassword")} style={{ "--tw-ring-color": brandColor }} />
                </div>
              </>
            )}

            {notice && <p className="text-xs text-emerald-500">{notice}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: brandColor }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {resetStep === "request" ? "Send reset code" : "Reset password"}
            </button>

            <button type="button" onClick={() => switchMode("login")} className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pt-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
            </button>
          </form>
        )}

        {/* ── Password login / signup ── */}
        {(mode === "login" || mode === "signup") && (
          <>
            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className={inputCls} name="name" autoComplete="name" placeholder="Full name" value={form.fullName} onChange={set("fullName")} style={{ "--tw-ring-color": brandColor }} />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input className={inputCls} type="email" name="email" autoComplete="email" placeholder="Email" required value={form.email} onChange={set("email")} style={{ "--tw-ring-color": brandColor }} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input className={inputCls} type="password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Password" required value={form.password} onChange={set("password")} style={{ "--tw-ring-color": brandColor }} />
              </div>
              {mode === "login" && (
                <div className="flex items-center justify-between -mt-1">
                  <button type="button" onClick={() => switchMode("magic")} className="text-xs font-medium" style={{ color: brandColor }}>
                    Email me a login link
                  </button>
                  <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-medium" style={{ color: brandColor }}>
                    Forgot password?
                  </button>
                </div>
              )}
              {mode === "signup" && (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className={inputCls} name="phone" autoComplete="tel" placeholder="Phone (optional)" value={form.phone} onChange={set("phone")} style={{ "--tw-ring-color": brandColor }} />
                </div>
              )}

              {notice && <p className="text-xs text-emerald-500">{notice}</p>}
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
              <button onClick={() => switchMode(mode === "signup" ? "login" : "signup")} className="font-semibold" style={{ color: brandColor }}>
                {mode === "signup" ? "Log in" : "Create one"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}