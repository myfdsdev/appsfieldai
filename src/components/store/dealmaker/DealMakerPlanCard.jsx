import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Sparkles, ArrowRight, Check } from "lucide-react";

// Interactive plan/proposal card shown inside the Deal Maker chat when the agent
// drafts a custom-software plan for a visitor whose need no product matched.
// Flow: review plan → "Yes, send it to your boss" → details form → submit.
// On submit the widget saves a HOT lead and emails both the visitor and owner.
export default function DealMakerPlanCard({ plan, brandColor = "#f97316", submitting, submitted, onConfirm }) {
  const [stage, setStage] = useState("review"); // review | form
  const [form, setForm] = useState({ name: "", email: "", phone: "", businessType: "", painPoint: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSubmit = form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const features = Array.isArray(plan?.features) ? plan.features : [];

  const inputCls = "w-full h-11 rounded-xl px-4 text-sm text-white placeholder:text-white/40 focus:outline-none";
  const inputStyle = { backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-2xl overflow-hidden border shadow-2xl no-global-input-style"
      style={{ background: "rgba(12,14,20,0.8)", borderColor: "rgba(255,255,255,0.14)", backdropFilter: "blur(14px)", fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Your custom plan</p>
        </div>
        <h3 className="text-lg font-bold text-white leading-snug">{plan?.title || "Custom software"}</h3>
        {plan?.overview && <p className="text-sm text-white/70 mt-1 leading-relaxed">{plan.overview}</p>}

        {features.length > 0 && (
          <ul className="mt-4 space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: brandColor }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {submitted ? (
          <div className="mt-5 flex flex-col items-center gap-2 text-center py-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Sent to the team!</p>
            <p className="text-xs text-white/60">You'll get a confirmation email and the owner will reach out with a proposal.</p>
          </div>
        ) : stage === "review" ? (
          <div className="mt-5 space-y-2">
            <button
              onClick={() => setStage("form")}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
            >
              Yes — send this to your team <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-white/45">Or tell me what to change in the chat.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-white/60">Great — drop your details and the owner will reach out with a proposal.</p>
            <input className={inputCls} style={inputStyle} placeholder="Your name" value={form.name} onChange={set("name")} />
            <input className={inputCls} style={inputStyle} placeholder="Email address" type="email" value={form.email} onChange={set("email")} />
            <input className={inputCls} style={inputStyle} placeholder="Phone (optional)" value={form.phone} onChange={set("phone")} />
            <input className={inputCls} style={inputStyle} placeholder="Your business (optional)" value={form.businessType} onChange={set("businessType")} />
            <button
              disabled={!canSubmit || submitting}
              onClick={() => onConfirm(plan, form)}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send my request
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}