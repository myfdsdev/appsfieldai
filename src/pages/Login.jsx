import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const DEFAULT_LOGO = "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4 py-10 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]" />

      <div className="w-full max-w-md relative">
        {/* Brand logo (centered) */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-7">
            <img
              src={branding.logo || DEFAULT_LOGO}
              alt={branding.siteName || "SaaSShare"}
              className="h-11 max-w-[200px] object-contain"
            />
            {!branding.logo && (
              <span className="font-display font-bold text-2xl text-foreground tracking-tight">
                {branding.siteName ? (
                  branding.siteName
                ) : (
                  <>SaaS<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Share</span></>
                )}
              </span>
            )}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Log in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-[#111116] rounded-2xl border border-white/8 p-8 shadow-2xl shadow-black/40">
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium mb-6"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111116] px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-medium bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
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
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}