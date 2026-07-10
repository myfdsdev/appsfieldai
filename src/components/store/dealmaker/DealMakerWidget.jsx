import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, X, Send, Loader2, MessageCircle } from "lucide-react";
import DealMakerMessage from "./DealMakerMessage";
import DealMakerLeadForm from "./DealMakerLeadForm";
import DealMakerHero from "./DealMakerHero";

// The Deal Maker Agent widget for a store page.
// - Auto-pops open a few seconds after the store loads.
// - When closed, collapses to a small pulsing pill at the top so the visitor can reopen it.
// - Talks to the dealMakerChat backend function and reacts to its [ACTION:...] tokens.
export default function DealMakerWidget({ marketplaceId, marketplace, listings = [], brandColor = "#f97316", onShowApp, onReserve }) {
  const [open, setOpen] = useState(false);
  const [hero, setHero] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [leadForm, setLeadForm] = useState(null); // { hot: bool } when the agent asks for contact details
  const [submittingLead, setSubmittingLead] = useState(false);
  const scrollRef = useRef(null);
  const dealmakerName = marketplace?.pageSections?.dealMakerName || "Max";
  const dealmakerImage = marketplace?.pageSections?.dealMakerImageUrl;

  // Auto-open the centered welcome hero once per session, shortly after mount.
  useEffect(() => {
    if (!marketplaceId) return;
    const key = `dm_dismissed_${marketplaceId}`;
    if (sessionStorage.getItem(key) === "1") return;
    const t = setTimeout(() => setHero(true), 2500);
    return () => clearTimeout(t);
  }, [marketplaceId]);

  // Visitor starts chatting from the centered hero → open the chat panel.
  const startChat = () => {
    setHero(false);
    setOpen(true);
  };

  // Dismiss the hero → collapse to the reopen pill (don't nag again this session).
  const dismissHero = () => {
    setHero(false);
    if (marketplaceId) sessionStorage.setItem(`dm_dismissed_${marketplaceId}`, "1");
  };

  // Send the opening greeting the first time the panel opens.
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      sendTurn([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, leadForm]);

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
    try {
      const res = await base44.functions.invoke("dealMakerChat", { marketplaceId, messages: history });
      const reply = res.data?.reply;
      if (reply) setMessages((m) => [...m, { role: "assistant", content: reply }]);
      handleActions(res.data?.actions);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Give me one sec — mind sending that again?" }]);
    }
    setThinking(false);
  };

  const send = () => {
    const text = input.trim();
    if (!text || thinking) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    sendTurn(next);
  };

  const submitLead = async (form) => {
    setSubmittingLead(true);
    const summary = messages.map((m) => `${m.role === "user" ? "Visitor" : dealmakerName}: ${m.content}`).join("\n");
    try {
      await base44.functions.invoke("dealMakerChat", {
        action: leadForm.hot ? "log_custom_request" : "capture_lead",
        marketplaceId,
        lead: { ...form, summary },
      });
      setLeadForm(null);
      setMessages((m) => [...m, { role: "assistant", content: `Got it — ${form.name || "you're"} all set. ${marketplace?.name || "We"}'ll be in touch soon.` }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, that didn't go through — try once more?" }]);
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
      {/* Centered futuristic welcome hero */}
      <AnimatePresence>
        {hero && (
          <DealMakerHero
            marketplace={marketplace}
            brandColor={brandColor}
            onStart={startChat}
            onDismiss={dismissHero}
          />
        )}
      </AnimatePresence>

      {/* Collapsed "Ask me anything" bar — centered, with a slow glow pulse */}
      <AnimatePresence>
        {!open && !hero && (
          <motion.div
            key="dm-pill"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[min(440px,calc(100vw-2rem))]"
          >
            <button
              onClick={() => setOpen(true)}
              className="dm-glow-pulse group relative w-full flex items-center gap-3 pl-5 pr-4 py-4 rounded-full bg-[#0b0f1a] border border-white/10 text-left transition-transform hover:scale-[1.01]"
              style={{ "--dm-glow": brandColor }}
            >
              <span className="flex-1 text-base text-white/60">Ask me anything…</span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ background: brandColor }}
              >
                <Send className="w-4 h-4" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded chat panel — bottom right */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dm-panel"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-4 right-4 z-[60] w-[min(400px,calc(100vw-2rem))] h-[min(560px,calc(100vh-2rem))] flex flex-col rounded-3xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-black/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: brandColor }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {dealmakerImage ? (
                    <img src={dealmakerImage} alt={dealmakerName} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{dealmakerName}</p>
                  <p className="text-[11px] text-white/80 leading-tight">{marketplace?.pageSections?.dealMakerTagline || "Dealmaker"} · {marketplace?.name || "Store"}</p>
                </div>
              </div>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.length === 0 && thinking && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <MessageCircle className="w-4 h-4" /> {dealmakerName} is getting ready…
                </div>
              )}
              {messages.map((m, i) => (
                <DealMakerMessage key={i} message={m} brandColor={brandColor} />
              ))}
              {thinking && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-secondary/70 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}
              {leadForm && (
                <DealMakerLeadForm hot={leadForm.hot} brandColor={brandColor} submitting={submittingLead} onSubmit={submitLead} />
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border/50 p-2.5 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type your reply…"
                className="flex-1 h-10 rounded-xl bg-secondary/60 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ "--tw-ring-color": brandColor }}
              />
              <button
                onClick={send}
                disabled={thinking || !input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                style={{ background: brandColor }}
              >
                {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}