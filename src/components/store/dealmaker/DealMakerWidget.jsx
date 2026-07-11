import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, X, Volume2, VolumeX } from "lucide-react";
import DealMakerLeadForm from "./DealMakerLeadForm";
import DealMakerOrb from "./DealMakerOrb";
import DealMakerCharacter from "./DealMakerCharacter";
import DealMakerConversation from "./DealMakerConversation";
import { getDealMakerBgTheme } from "./dealMakerThemes";

// The Deal Maker Agent — a full-screen, boundary-less immersive experience.
// - Collapsed: a bottom-center avatar launcher with a pulsing glow + "Hey" bubble.
// - Open: the entire page dims to near-black, the agent sits centered, and the
//   conversation floats as free text (no bubble boxes). Tappable suggestion chips
//   drive the flow; a minimal glowing composer sits at the bottom.
export default function DealMakerWidget({ marketplaceId, marketplace, listings = [], brandColor = "#f97316", onShowApp, onReserve }) {
  const convoKey = marketplaceId ? `dm_convo_${marketplaceId}` : null;
  // Restore any in-progress conversation for this visitor (survives page
  // navigation / remounts within the session).
  const restored = (() => {
    if (!convoKey) return null;
    try {
      const raw = sessionStorage.getItem(convoKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [open, setOpen] = useState(false);
  const [chatting, setChatting] = useState(!!restored?.messages?.length);
  const [greeted, setGreeted] = useState(!!restored?.messages?.length);
  const [messages, setMessages] = useState(restored?.messages || []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [leadForm, setLeadForm] = useState(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef(null);
  const audioRef = useRef(null);
  // Don't auto-speak messages that were restored from a previous mount.
  const spokenRef = useRef(restored?.messages?.length || 0);

  // Persist the conversation so it survives page navigation within the session.
  useEffect(() => {
    if (!convoKey) return;
    try {
      sessionStorage.setItem(convoKey, JSON.stringify({ messages, chatting }));
    } catch { /* no-op */ }
  }, [messages, chatting, convoKey]);

  // Stop any currently-playing agent audio (both browser synthesis & aiVoice).
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Play a pre-generated audio URL (OpenAI/Gemini voice, generated inside
  // dealMakerChat in the same round-trip — no extra call, minimal lag).
  const playAudioUrl = (url) => {
    if (muted || !url) return;
    stopSpeaking();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  // Speak (TTS) a message aloud unless muted. Every provider (including Base44)
  // routes through aiVoice so the store owner's chosen voice is honored — the
  // aiVoice function caches nothing here but returns a playable url.
  // - OpenAI / Gemini → uses audioUrl from the chat response when present.
  const speak = async (text, audioUrl) => {
    if (muted || !text) return;
    if ((voiceProvider === "openai" || voiceProvider === "gemini") && audioUrl) {
      playAudioUrl(audioUrl);
      return;
    }
    try {
      stopSpeaking();
      const res = await base44.functions.invoke("aiVoice", { text, voice: dealMakerVoice });
      playAudioUrl(res?.data?.url);
    } catch { /* no-op */ }
  };

  // Auto-play each new assistant message.
  useEffect(() => {
    if (muted) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && messages.length > spokenRef.current) {
      spokenRef.current = messages.length;
      speak(last.content, last.audioUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, muted]);

  // Stop any speech when muting.
  useEffect(() => {
    if (muted) stopSpeaking();
  }, [muted]);
  const sections = marketplace?.pageSections || {};
  const dealmakerName = sections.dealMakerName || "Max";
  const dealmakerImage = sections.dealMakerImageUrl;
  const dealmakerTagline = sections.dealMakerTagline || "AI Deal Strategist";
  const layout = sections.dealMakerLayout || "centered";
  const bgOpacity = (sections.dealMakerBgOpacity ?? 5) / 100;
  const bgTheme = getDealMakerBgTheme(sections.dealMakerBgTheme);
  const voiceProvider = marketplace?.voiceProvider || "base44";
  const dealMakerVoice = marketplace?.dealMakerVoice || sections.dealMakerVoice || "river";
  const storeName = marketplace?.name || "our store";
  const ownerName = sections.dealMakerOwnerName;
  const intro =
    sections.dealMakerGreeting ||
    `Welcome to ${storeName}. I'm ${dealmakerName}${ownerName ? `, ${ownerName}'s deal maker` : ""} — I'll find you the perfect tool and the best price.`;

  // Auto-open once per session, right as the page loads.
  useEffect(() => {
    if (!marketplaceId) return;
    const key = `dm_dismissed_${marketplaceId}`;
    if (sessionStorage.getItem(key) === "1") return;
    const t = setTimeout(() => setOpen(true), 600);
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

  // Turn action tokens into an inline card attached to the just-sent assistant
  // message (product preview / demo), so everything stays inside the immersive
  // chat instead of opening an external modal.
  const handleActions = (actions = []) => {
    let card = null;
    for (const a of actions) {
      if (a.type === "SHOW_APP" && a.value) {
        const listing = listings.find((l) => l.id === a.value);
        if (listing) card = { listing, mode: "card" };
      } else if (a.type === "RUN_DEMO" && a.value) {
        const listing = listings.find((l) => l.id === a.value);
        if (listing) card = { listing, mode: "demo" };
      } else if (a.type === "OFFER_RESERVATION" && a.value) {
        const listing = listings.find((l) => l.id === a.value);
        // Attach a card with a reserve CTA (unless a demo card is already set).
        if (listing && !card) card = { listing, mode: "card", reserve: true };
      } else if (a.type === "START_CHECKOUT" && a.value) {
        const listing = listings.find((l) => l.id === a.value);
        // Kick off the in-chat guided checkout (name → email → payment → done).
        if (listing) card = { listing, mode: "checkout" };
      } else if (a.type === "CAPTURE_LEAD") {
        setLeadForm({ hot: false });
      } else if (a.type === "LOG_CUSTOM_REQUEST") {
        setLeadForm({ hot: true });
      }
    }
    if (card) {
      // Attach the card to the most recent assistant message.
      setMessages((mm) => {
        const next = [...mm];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant") { next[i] = { ...next[i], card }; break; }
        }
        return next;
      });
    }
  };

  const sendTurn = async (history) => {
    setThinking(true);
    setSuggestions([]);
    try {
      const res = await base44.functions.invoke("dealMakerChat", { marketplaceId, messages: history });
      const reply = res.data?.reply;
      if (reply) {
        // Render the message immediately and fetch/play the voice in parallel
        // (speak() handles the aiVoice call for openai/gemini, or instant
        // browser synthesis for base44) so text isn't blocked on audio.
        speak(reply);
        setMessages((mm) => {
          const next = [...mm, { role: "assistant", content: reply }];
          // Mark this message as already spoken so the auto-play effect skips it.
          spokenRef.current = next.length;
          return next;
        });
      }
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

  // "Tell me more" on a product card — keep the visitor INSIDE the chat instead
  // of opening the store's detail modal behind the full-screen overlay (which
  // looked like a frozen screen). Ask the agent to go deeper on this product.
  const handleMoreDetails = (listing) => {
    if (thinking || !listing) return;
    submitText(`Tell me more about ${listing.softwareName}`);
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
    stopSpeaking();
    if (marketplaceId) sessionStorage.setItem(`dm_dismissed_${marketplaceId}`, "1");
  };

  const reopen = () => {
    if (marketplaceId) sessionStorage.removeItem(`dm_dismissed_${marketplaceId}`);
    // Reopen right where the visitor left off — the conversation is preserved.
    // Don't re-speak old messages on reopen.
    spokenRef.current = messages.length;
    setOpen(true);
  };

  // Short teaser of the last message so a returning visitor feels they can
  // pick up right where they left off.
  const lastMsg = messages[messages.length - 1]?.content?.trim();
  const bubbleText = (() => {
    if (!lastMsg) return "Hey, I can help you!";
    const words = lastMsg.split(/\s+/);
    return words.length > 5 ? words.slice(0, 5).join(" ") + "…" : lastMsg;
  })();

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
              <p className="text-sm font-medium text-neutral-800">{bubbleText}</p>
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white" />
            </motion.div>

            <button
              onClick={reopen}
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
            {/* Glassy dim — blurs & darkens the store page behind the chat */}
            <div className="absolute inset-0 backdrop-blur-xl" style={{ backgroundColor: `rgba(5, 7, 12, ${bgOpacity})` }} />
            {/* Preset gradient theme — sits ABOVE the dim so the chosen color is always visible */}
            <div className="absolute inset-0" style={{ background: bgTheme.css }} />

            {/* Mute / unmute voice */}
            <button
              onClick={() => setMuted((m) => !m)}
              className="absolute top-6 right-20 z-20 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={muted ? "Unmute voice" : "Mute voice"}
              title={muted ? "Unmute voice" : "Mute voice"}
            >
              {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

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

            {/* CHAT (immersive) — layout depends on dealMakerLayout setting */}
            {chatting && (() => {
              const conversationEl = (
                <DealMakerConversation
                  messages={messages}
                  thinking={thinking}
                  suggestions={suggestions}
                  leadForm={leadForm}
                  submittingLead={submittingLead}
                  input={input}
                  setInput={setInput}
                  onSubmitText={submitText}
                  onSubmitLead={submitLead}
                  brandColor={brandColor}
                  scrollRef={scrollRef}
                  currency={marketplace?.currency || "USD"}
                  marketplaceId={marketplaceId}
                  marketplace={marketplace}
                  onMoreDetails={handleMoreDetails}
                  onReserve={onReserve}
                  maxWidthClass={layout === "centered" || layout === "spotlight" ? "max-w-3xl" : "max-w-xl"}
                />
              );

              // Character left / chat right (and its mirror)
              if (layout === "avatar_left" || layout === "avatar_right") {
                const charFirst = layout === "avatar_left";
                return (
                  <div className="relative z-10 flex-1 flex flex-col md:flex-row min-h-0">
                    <div className={`hidden md:flex md:w-[42%] lg:w-[38%] shrink-0 items-end justify-center px-6 pt-10 pb-4 ${charFirst ? "" : "md:order-2"}`}>
                      <DealMakerCharacter name={dealmakerName} tagline={dealmakerTagline} image={dealmakerImage} brandColor={brandColor} />
                    </div>
                    <div className={`flex-1 flex flex-col min-h-0 ${charFirst ? "" : "md:order-1"}`}>
                      {/* compact orb for mobile where the character column is hidden */}
                      <div className="md:hidden pt-8 pb-2 flex justify-center shrink-0">
                        <DealMakerOrb name={dealmakerName} tagline={dealmakerTagline} image={dealmakerImage} brandColor={brandColor} compact />
                      </div>
                      {conversationEl}
                    </div>
                  </div>
                );
              }

              // Spotlight — large character behind, chat floating over it
              if (layout === "spotlight") {
                return (
                  <div className="relative z-10 flex-1 flex flex-col min-h-0">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-8 flex justify-center opacity-30">
                      <DealMakerCharacter name={dealmakerName} tagline={dealmakerTagline} image={dealmakerImage} brandColor={brandColor} spotlight />
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                      {conversationEl}
                    </div>
                  </div>
                );
              }

              // Centered (default) — compact orb pinned near top
              return (
                <div className="relative z-10 flex-1 flex flex-col min-h-0">
                  <div className="pt-8 pb-2 flex justify-center shrink-0">
                    <DealMakerOrb name={dealmakerName} tagline={dealmakerTagline} image={dealmakerImage} brandColor={brandColor} compact />
                  </div>
                  {conversationEl}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}