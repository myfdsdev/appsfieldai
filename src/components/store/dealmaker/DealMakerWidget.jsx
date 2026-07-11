import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import DealMakerFloatingMessage from "./DealMakerFloatingMessage";
import DealMakerLeadForm from "./DealMakerLeadForm";
import DealMakerOrb from "./DealMakerOrb";
import DealMakerSuggestions from "./DealMakerSuggestions";

// The Deal Maker Agent — a full-screen, boundary-less immersive experience.
// - Collapsed: a bottom-center avatar launcher with a pulsing glow + "Hey" bubble.
// - Open: the entire page dims to near-black, the agent sits centered, and the
//   conversation floats as free text (no bubble boxes). Tappable suggestion chips
//   drive the flow; a minimal glowing composer sits at the bottom.
export default function DealMakerWidget({ marketplaceId, marketplace, listings = [], brandColor = "#f97316", onShowApp, onReserve }) {
  const [open, setOpen] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [leadForm, setLeadForm] = useState(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const scrollRef = useRef(null);
  const sections = marketplace?.pageSections || {};
  const dealmakerName = sections.dealMakerName || "Max";
  const dealmakerImage = sections.dealMakerImageUrl;
  const dealmakerTagline = sections.dealMakerTagline || "AI Deal Strategist";
  const storeName = marketplace?.name || "our store";
  const ownerName = sections.dealMakerOwnerName;
  const intro =
    sections.dealMakerGreeting ||
    `Welcome to ${storeName}. I'm ${dealmakerName}${ownerName ? `, ${ownerName}'s deal maker` : ""} — I'll find you the perfect tool and the best price.`;

  // Auto-open once per session, shortly after mount.
  useEffect(() => {
    if (!marketplaceId) return;
    const key = `dm_dismissed_${marketplaceId}`;
    if (sessionStorage.getItem(key) === "1") return;
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [marketplaceId]);

  const startChat = () => setChatting(true);

  // First time the chat view shows, send the opening greeting.
  useEffect(() => {
    if (chatting && !greeted) {
      setGreeted(true);
      sendTurn([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatting]);

  useEffect(() => {
    if (!chatting) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, leadForm, suggestions, chatting]);

  const handleActions = (actions = []) => {
    for (const a of actions) {
      if ((a.type === "SHOW_APP" || a.type === "RUN_DEMO") && a.value) {
        const listing = listings.find((l) => l.id === a.value);
        if (listing) onShowApp?.(listing);
      } else if (a.type === "OFFER_RESERVATION" && a.value) {
        const listing = listings.find((l) => l.id === a.value);
        if (listing) onReserve?.(listing);
      } else if (a.type === "CAPTURE_LEAD") {
        setLeadForm({ hot: false });
      } else if (a.type === "LOG_CUSTOM_REQUEST") {
        setLeadForm({ hot: true });
      }
    }
  };

  const sendTurn = async (history) => {
    setThinking(true);
    setSuggestions([]);
    try {
      const res = await base44.functions.invoke("dealMakerChat", { marketplaceId, messages: history });
      const reply = res.data?.reply;
      if (reply) setMessages((mm) => [...mm, { role: "assistant", content: reply }]);
      handleActions(res.data?.actions);
      setSuggestions(res.data?.suggestions || []);
    } catch {
      setMessages((mm) => [...mm, { role: "assistant", content: "Give me one sec — mind sending that again?" }]);
    }
    setThinking(false);
  };

  const submitText = (text) => {
    const t = (text ?? input).trim();
    if (!t || thinking) return;
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setSuggestions([]);
    sendTurn(next);
  };

  const submitLead = async (form) => {
    setSubmittingLead(true);
    const summary = messages.map((mm) => `${mm.role === "user" ? "Visitor" : dealmakerName}: ${mm.content}`).join("\n");
    try {
      await base44.functions.invoke("dealMakerChat", {
        action: leadForm.hot ? "log_custom_request" : "capture_lead",
        marketplaceId,
        lead: { ...form, summary },
      });
      setLeadForm(null);
      setMessages((mm) => [...mm, { role: "assistant", content: `Got it — ${form.name || "you're"} all set. ${storeName} will be in touch soon.` }]);
    } catch {
      setMessages((mm) => [...mm, { role: "assistant", content: "Hmm, that didn't go through — try once more?" }]);
    }
    setSubmittingLead(false);
  };

  const close = () => {
    setOpen(false);
    if (marketplaceId) sessionStorage.setItem(`dm_dismissed_${marketplaceId}`, "1");
  };

  if (!marketplaceId) return null;

  return (
    <>
      {/* Collapsed launcher — bottom-center avatar with pulsing glow + a "Hey" bubble */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="dm-pill"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-3"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative rounded-2xl rounded-b-md bg-white px-4 py-2.5 shadow-xl shadow-black/30 max-w-[220px]"
            >
              <p className="text-sm font-medium text-neutral-800">Hey, I can help you!</p>
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white" />
            </motion.div>

            <button
              onClick={() => setOpen(true)}
              className="relative w-16 h-16 shrink-0 transition-transform hover:scale-105"
              aria-label="Chat with the Deal Maker"
            >
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: brandColor }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: brandColor }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
              />
              <span
                className="relative w-full h-full rounded-full p-[2px] flex items-center justify-center shadow-lg"
                style={{ background: `conic-gradient(from 0deg, ${brandColor}, #22d3ee, ${brandColor})` }}
              >
                <span className="w-full h-full rounded-full overflow-hidden bg-[#0b0f1a] flex items-center justify-center">
                  {dealmakerImage ? (
                    <img src={dealmakerImage} alt={dealmakerName} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-white" />
                  )}
                </span>
              </span>
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b0f1a]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive full-page mode — the whole page dims, agent centered, floating chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dm-immersive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col"
          >
            {/* Glassy dim — page stays ~3% visible through a soft blur */}
            <div className="absolute inset-0 bg-[#05070c]/[0.9] backdrop-blur-xl" />
            {/* Ambient center glow field */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full blur-[150px] opacity-45"
                style={{ background: `radial-gradient(circle, ${brandColor}, transparent 68%)` }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-[110px] opacity-30"
                style={{ background: `radial-gradient(circle, #22d3ee, transparent 70%)` }}
              />
            </div>

            {/* Close */}
            <button
              onClick={close}
              className="absolute top-6 right-6 z-20 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* WELCOME (before chatting) — centered orb + greeting + CTA */}
            {!chatting && (
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
                <DealMakerOrb name={dealmakerName} tagline={dealmakerTagline} image={dealmakerImage} brandColor={brandColor} />
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6 max-w-xl text-lg sm:text-xl font-light leading-relaxed text-white/80"
                >
                  {intro}
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startChat}
                  className="mt-9 px-10 py-4 rounded-full text-white font-semibold shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)`, boxShadow: `0 10px 40px -8px ${brandColor}88` }}
                >
                  Start the conversation
                </motion.button>
              </div>
            )}

            {/* CHAT (immersive) — compact orb pinned near top, floating conversation, glow composer */}
            {chatting && (
              <div className="relative z-10 flex-1 flex flex-col min-h-0">
                <div className="pt-8 pb-2 flex justify-center shrink-0">
                  <DealMakerOrb name={dealmakerName} tagline={dealmakerTagline} image={dealmakerImage} brandColor={brandColor} compact />
                </div>

                {/* Free-floating conversation — no boundary box */}
                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6">
                  <div className="mx-auto max-w-3xl w-full py-8 space-y-6">
                    {messages.map((mm, i) => {
                      // Older messages fade so the latest reads as active.
                      const distance = messages.length - 1 - i;
                      const fade = Math.max(0.35, 1 - distance * 0.18);
                      return <DealMakerFloatingMessage key={i} message={mm} brandColor={brandColor} fade={fade} />;
                    })}

                    {thinking && (
                      <div className="flex justify-center">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" />
                        </div>
                      </div>
                    )}

                    {!thinking && !leadForm && (
                      <DealMakerSuggestions suggestions={suggestions} brandColor={brandColor} onPick={submitText} disabled={thinking} />
                    )}

                    {leadForm && (
                      <div className="max-w-md mx-auto">
                        <DealMakerLeadForm hot={leadForm.hot} brandColor={brandColor} submitting={submittingLead} onSubmit={submitLead} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Minimal glowing composer */}
                <div className="shrink-0 px-6 pb-8 pt-2">
                  <div className="no-global-input-style mx-auto max-w-2xl relative flex items-center">
                    <div
                      className="absolute inset-0 rounded-full blur-lg opacity-40"
                      style={{ background: `linear-gradient(90deg, ${brandColor}, #22d3ee)` }}
                    />
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitText()}
                      placeholder="Type your reply…"
                      className="relative w-full h-14 rounded-full pl-6 pr-16 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}
                    />
                    <button
                      onClick={() => submitText()}
                      disabled={thinking || !input.trim()}
                      className="absolute right-2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
                    >
                      {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}