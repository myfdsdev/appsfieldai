import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import BeamBackground from "@/components/auth/BeamBackground";
import { toast } from "@/components/ui/use-toast";

const DEFAULT_LOGO = "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png";

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
    <div className="no-global-input-style min-h-screen w-full relative overflow-hidden flex flex-col lg:flex-row text-white">
      <BeamBackground />

      {/* Brand logo top-left */}
      <Link to="/" className="absolute top-8 left-8 z-20 inline-flex items-center gap-2.5">
        <img src={branding.logo || DEFAULT_LOGO} alt={brandName} className="h-9 max-w-[160px] object-contain" />
        {!branding.logo && (
          <span className="font-display font-bold text-2xl text-white tracking-tight">{brandName}</span>
        )}
      </Link>

      {/* Left showcase area */}
      <div className="relative z-10 flex-1 hidden lg:flex flex-col items-center justify-center px-12">
        <div className="text-center select-none">
          <span className="block text-[10px] tracking-[0.5em] text-red-300/60 font-medium uppercase mb-2">Powering the future of</span>
          <h2 className="font-display font-extrabold text-6xl xl:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-red-200 via-red-400 to-red-600 tracking-tight">
            {brandName}
          </h2>
        </div>
      </div>

      {/* Right login card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 lg:py-0 lg:pr-16">
        <div className="w-full max-w-[460px] bg-white/[0.05] backdrop-blur-2xl rounded-[28px] border border-white/10 p-8 sm:p-12 shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_20px_90px_-20px_rgba(239,68,68,0.3)] ring-1 ring-inset ring-white/[0.03]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <img src={branding.logo || DEFAULT_LOGO} alt={brandName} className="h-8 max-w-[140px] object-contain" />
          </div>

          <h1 className="text-xl font-bold text-white mb-6">Sign in to {brandName}</h1>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-sm font-medium mb-5 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-3 text-white/40">or</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300/60" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400/50"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300/60" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-400"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-red-400 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold text-white rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30"
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

          <p className="text-center text-sm text-white/50 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-red-400 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}