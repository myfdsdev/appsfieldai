import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, X, Send, Loader2, MessageCircle } from "lucide-react";
import DealMakerMessage from "./DealMakerMessage";
import DealMakerLeadForm from "./DealMakerLeadForm";
import DealMakerHero from "./DealMakerHero";

// The Deal Maker Agent widget for a store page.
// - Auto-pops open a few seconds after the store loads, showing the welcome hero.
// - The welcome hero and the chat share ONE centered box: "Start the conversation"
//   swaps the hero content for the chat in place — no separate chat panel.
// - When closed, collapses to a small pulsing pill so the visitor can reopen it.
export default function DealMakerWidget({ marketplaceId, marketplace, listings = [], brandColor = "#f97316", onShowApp, onReserve }) {
  const [open, setOpen] = useState(false); // whether the centered box is visible
  const [chatting, setChatting] = useState(false); // hero view vs. chat view inside the box
  const [greeted, setGreeted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [leadForm, setLeadForm] = useState(null); // { hot: bool } when the agent asks for contact details
  const [submittingLead, setSubmittingLead] = useState(false);
  const scrollRef = useRef(null);
  const dealmakerName = marketplace?.pageSections?.dealMakerName || "Max";
  const dealmakerImage = marketplace?.pageSections?.dealMakerImageUrl;

  // Auto-open the centered box (on the hero view) once per session, shortly after mount.
  useEffect(() => {
    if (!marketplaceId) return;
    const key = `dm_dismissed_${marketplaceId}`;
    if (sessionStorage.getItem(key) === "1") return;
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [marketplaceId]);

  // Visitor starts chatting from the hero → swap to the chat view inside the same box.
  const startChat = () => setChatting(true);

  // Send the opening greeting the first time the chat view is shown.
  useEffect(() => {
    if (chatting && !greeted) {
      setGreeted(true);
      sendTurn([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatting]);

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
      {/* Collapsed "Ask me anything" bar — centered, with a slow glow pulse */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="dm-pill"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[min(440px,calc(100vw-2rem))]"
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

      {/* One centered box — holds BOTH the welcome hero and the chat */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              key="dm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* The single glass box — holds BOTH the welcome hero and the chat.
                Height animates smoothly between the two states via layout. */}
            <motion.div
              key="dm-box"
              layout
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative w-full max-w-lg rounded-3xl overflow-hidden border border-white/15 bg-white/[0.07] backdrop-blur-2xl shadow-2xl shadow-black/60"
            >
              {/* Glass sheen highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <AnimatePresence mode="wait" initial={false}>
                {!chatting ? (
                  <motion.div
                    key="hero"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.32, ease: "easeInOut" }}
                  >
                    <DealMakerHero marketplace={marketplace} brandColor={brandColor} onStart={startChat} onDismiss={close} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.32, ease: "easeInOut" }}
                    className="flex flex-col h-[min(640px,calc(100vh-2rem))]"
                  >
                    {/* Floating header — no bar, avatar + name row with corner X */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                          {dealmakerImage ? (
                            <img src={dealmakerImage} alt={dealmakerName} className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">
                          <span className="font-bold">{dealmakerName}</span>
                          <span className="text-white/60 font-normal"> · {marketplace?.pageSections?.dealMakerTagline || "Dealmaker"} · {marketplace?.name || "Store"}</span>
                        </p>
                      </div>
                      <button onClick={close} className="p-1.5 -mr-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Messages — free-flowing, older bubbles fade out (history kept, reachable by scrolling up) */}
                    <div className="relative flex-1 min-h-0">
                      {/* top fade mask so scrolled-up history softly disappears */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 z-10 bg-gradient-to-b from-black/25 to-transparent" />
                      <div ref={scrollRef} className="h-full overflow-y-auto px-6 py-4 space-y-5">
                      {messages.length === 0 && thinking && (
                        <div className="flex items-center gap-2 text-xs text-white/50 px-1">
                          <MessageCircle className="w-4 h-4" /> {dealmakerName} is getting ready…
                        </div>
                      )}
                      {messages.map((m, i) => {
                        // Only the newest ~3 messages stay fully visible; older ones fade.
                        const distance = messages.length - 1 - i;
                        const fade = distance <= 2 ? 1 : Math.max(0.28, 1 - (distance - 2) * 0.22);
                        return <DealMakerMessage key={i} message={m} brandColor={brandColor} fade={fade} />;
                      })}
                      {thinking && messages.length > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
                          </div>
                        </div>
                      )}
                      {leadForm && (
                        <DealMakerLeadForm hot={leadForm.hot} brandColor={brandColor} submitting={submittingLead} onSubmit={submitLead} />
                      )}
                      </div>
                    </div>

                    {/* Composer — large centered floating pill */}
                    <div className="px-6 pb-6 pt-2 shrink-0">
                      <div className="relative flex items-center">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && send()}
                          placeholder="Type your reply…"
                          className="w-full h-14 rounded-full bg-white/90 border border-white/40 backdrop-blur-md pl-6 pr-16 text-[15px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-lg"
                          style={{ "--tw-ring-color": brandColor }}
                        />
                        <button
                          onClick={send}
                          disabled={thinking || !input.trim()}
                          className="absolute right-2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                          style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}bb)` }}
                        >
                          {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}