import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

const DEFAULT_LOGO = "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png";

const chatBubbles = [
  "Of course, let's...",
  "I can help you with that.",
  "Give me just one second, okay?",
  "I'll need to verify your identity first, though.",
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({ logo: "", siteName: "" });

  useEffect(() => {
    base44.entities.AppConfig.filter({ key: "main" })
      .then((cfgs) => {
        const cfg = cfgs?.[0];
        if (cfg) setBranding({ logo: cfg.appLogoUrl || "", siteName: cfg.siteName || "" });
      })
      .catch(() => {});
  }, []);

  const brandName = branding.siteName || "SaaSShare";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }
    if (!password) { setError("Password is required"); return; }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Fire-and-forget admin notification
      base44.functions.invoke("notifyAdminLogin", {
        fullName: email,
        email: email,
        role: "user",
        loginTime: new Date().toISOString(),
      }).catch(() => {});
      toast({ title: "Welcome back!", description: "Login successful. Redirecting..." });

      // Redirect to intended page or default to / (Dashboard with marketplace)
      const urlParams = new URLSearchParams(window.location.search);
      const from = urlParams.get("from");
      const redirectUrl = from ? decodeURIComponent(from) : "/";
      setTimeout(() => { window.location.href = redirectUrl; }, 600);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Invalid login credentials") || msg.includes("invalid")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(msg || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get("from");
    const redirectUrl = from ? decodeURIComponent(from) : "/";
    base44.auth.loginWithProvider("google", redirectUrl);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col lg:flex-row bg-gradient-to-br from-[#eaf1ff] via-[#e6ecff] to-[#dfe4ff]">
      {/* Soft ambient gradient blobs */}
      <div className="pointer-events-none absolute -bottom-40 -left-20 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-indigo-300/40 via-purple-300/30 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-200/40 blur-[120px]" />
      {/* Flowing wave accent */}
      <svg className="pointer-events-none absolute bottom-0 left-0 w-full h-2/3 opacity-50" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
        <path d="M0 420 C 320 300 540 520 760 400 C 980 280 1180 460 1440 340 L 1440 600 L 0 600 Z" fill="url(#waveGrad)" />
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1440" y2="600" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5b4fc" stopOpacity="0.5" />
            <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand logo top-left */}
      <Link to="/" className="absolute top-8 left-8 z-20 inline-flex items-center gap-2.5">
        <img src={branding.logo || DEFAULT_LOGO} alt={brandName} className="h-9 max-w-[160px] object-contain" />
        {!branding.logo && (
          <span className="font-display font-bold text-2xl text-slate-800 tracking-tight">{brandName}</span>
        )}
      </Link>

      {/* Left showcase area */}
      <div className="relative z-10 flex-1 hidden lg:flex flex-col items-center justify-center px-12">
        {/* Chat bubbles */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/3 flex flex-col items-end gap-2.5">
          {chatBubbles.map((text, i) => (
            <div key={i} className="px-4 py-2 rounded-2xl rounded-tr-sm bg-white/50 backdrop-blur-sm border border-white/60 text-slate-500 text-sm shadow-sm">
              {text}
            </div>
          ))}
        </div>
        {/* Big faded brand wordmark */}
        <div className="text-center select-none">
          <span className="block text-[10px] tracking-[0.5em] text-slate-400/70 font-medium uppercase mb-1">The</span>
          <h2 className="font-display font-extrabold text-7xl xl:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-500/70 to-purple-500/60 tracking-tight">
            {brandName.toLowerCase()}
          </h2>
          <span className="block text-[10px] tracking-[0.5em] text-slate-400/70 font-medium uppercase mt-1">Future</span>
        </div>
      </div>

      {/* Right login card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 lg:py-0 lg:pr-16">
        <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-xl rounded-3xl border border-white/70 p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.35)]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <img src={branding.logo || DEFAULT_LOGO} alt={brandName} className="h-8 max-w-[140px] object-contain" />
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-6">Sign in to {brandName}</h1>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-sm font-medium mb-5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400">or</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-11 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-indigo-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-lg shadow-indigo-500/30"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}