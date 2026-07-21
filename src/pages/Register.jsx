import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import GoogleIcon from "@/components/GoogleIcon";
import BeamBackground from "@/components/auth/BeamBackground";

const DEFAULT_LOGO = "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/eb8ee9b31_3d-ai-robot-character-chat-bot-wink-mascot-icon.png";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [branding, setBranding] = useState({ logo: "", siteName: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillEmail = params.get("email");
    if (prefillEmail) setEmail(prefillEmail);
    base44.entities.AppConfig.filter({ key: "main" })
      .then((cfgs) => {
        const cfg = cfgs?.[0];
        if (cfg) setBranding({ logo: cfg.appLogoUrl || "", siteName: cfg.siteName || "" });
      })
      .catch(() => {});
  }, []);

  const brandName = branding.siteName || "AppsFieldAI";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, full_name: fullName, role: "seller" });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      base44.functions.invoke("notifyAdminRegister", {
        fullName,
        email,
        role: "seller",
        registeredAt: new Date().toISOString(),
      }).catch(() => {});
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      toast({ title: "Account created!", description: "Registration successful. Redirecting..." });
      setTimeout(() => { window.location.href = "/"; }, 600);
    } catch (err) {
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
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
          <span className="block text-[10px] tracking-[0.15em] text-orange-300/60 font-medium uppercase mb-2">Launch Your Own AI Apps Selling Business With</span>
          <h2 className="font-display font-extrabold text-6xl xl:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-orange-100 via-orange-400 to-orange-600 tracking-tight">
            {brandName}
          </h2>
        </div>
      </div>

      {/* Right card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 lg:py-0 lg:pr-16">
        <div className="w-full max-w-[460px] bg-white/[0.05] backdrop-blur-2xl rounded-[28px] border border-white/10 p-8 sm:p-12 shadow-[0_0_0_1px_rgba(249,115,22,0.08),0_20px_90px_-20px_rgba(249,115,22,0.3)] ring-1 ring-inset ring-white/[0.03]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <img src={branding.logo || DEFAULT_LOGO} alt={brandName} className="h-8 max-w-[140px] object-contain" />
          </div>

          {showOtp ? (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Verify your email</h1>
              <p className="text-sm text-white/50 mb-6">We sent a code to {email}</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full h-12 font-semibold text-white rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-500/30"
                onClick={handleVerify}
                disabled={loading || otpCode.length < 6}
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify"}
              </Button>
              <p className="text-center text-sm text-white/50 mt-6">
                Didn't receive the code?{" "}
                <button onClick={handleResend} className="text-orange-400 font-medium hover:underline">Resend</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-6">Create your {brandName} account</h1>

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
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300/60" aria-hidden="true" />
                  <input
                    id="fullName" type="text" autoComplete="name" autoFocus
                    placeholder="John Doe" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400/50"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300/60" aria-hidden="true" />
                  <input
                    id="email" type="email" autoComplete="email"
                    placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400/50"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300/60" aria-hidden="true" />
                  <input
                    id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400/50"
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

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300/60" aria-hidden="true" />
                  <input
                    id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
                    placeholder="••••••••" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400/50"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold text-white rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-500/30"
                  disabled={loading}
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-white/50 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-400 font-medium hover:underline">Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}