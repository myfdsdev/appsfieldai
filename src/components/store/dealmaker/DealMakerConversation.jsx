import React from "react";
import { Send, Loader2 } from "lucide-react";
import DealMakerFloatingMessage from "./DealMakerFloatingMessage";
import DealMakerLeadForm from "./DealMakerLeadForm";
import DealMakerSuggestions from "./DealMakerSuggestions";
import DealMakerMicButton from "./DealMakerMicButton";

// Shared conversation surface used by every Deal Maker layout.
// The latest agent message stays vertically centered — older lines scroll up
// out of the center thanks to the flexible top/bottom spacers.
export default function DealMakerConversation({
  messages,
  thinking,
  suggestions,
  leadForm,
  submittingLead,
  input,
  setInput,
  onSubmitText,
  onSubmitLead,
  brandColor,
  scrollRef,
  currency = "USD",
  marketplaceId,
  marketplace,
  onMoreDetails,
  onReserve,
  onConfirmPlan,
  planSubmitting,
  planSubmitted,
  speaking = false,
  maxWidthClass = "max-w-3xl",
}) {
  const font = { fontFamily: "'Outfit', sans-serif" };
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full relative" style={font}>
      {/* Free-floating conversation — no boundary box. A flex column with an
          auto-growing top spacer keeps the newest message near the vertical
          center while short, then lets older lines scroll up naturally. */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6">
        <div className={`mx-auto ${maxWidthClass} w-full min-h-full flex flex-col justify-end pb-10 pt-24`}>
          <div className="space-y-6">
            {messages.map((mm, i) => {
              const distance = messages.length - 1 - i;
              const fade = Math.max(0.35, 1 - distance * 0.18);
              return (
                <DealMakerFloatingMessage
                  key={i}
                  message={mm}
                  brandColor={brandColor}
                  fade={fade}
                  currency={currency}
                  marketplaceId={marketplaceId}
                  marketplace={marketplace}
                  onMoreDetails={onMoreDetails}
                  onReserve={onReserve}
                  onConfirmPlan={onConfirmPlan}
                  planSubmitting={planSubmitting}
                  planSubmitted={planSubmitted}
                  onAction={onSubmitText}
                />
              );
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
              <DealMakerSuggestions suggestions={suggestions} brandColor={brandColor} onPick={onSubmitText} disabled={thinking} />
            )}

            {leadForm && (
              <div className="max-w-md mx-auto">
                <DealMakerLeadForm hot={leadForm.hot} brandColor={brandColor} submitting={submittingLead} onSubmit={onSubmitLead} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Minimal glowing composer with mic */}
      <div className="relative z-10 shrink-0 px-6 pb-8 pt-2">
        <div className={`no-global-input-style mx-auto ${maxWidthClass} relative flex items-center`}>
          <div
            className="absolute inset-0 rounded-full blur-lg opacity-40"
            style={{ background: `linear-gradient(90deg, ${brandColor}, #22d3ee)` }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmitText()}
            placeholder="Type your reply…"
            className="relative w-full h-14 rounded-full pl-6 pr-28 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", ...font }}
          />
          <DealMakerMicButton
            brandColor={brandColor}
            disabled={thinking}
            onTranscript={(text) => onSubmitText(text)}
          />
          <button
            onClick={() => onSubmitText()}
            disabled={thinking || !input.trim()}
            className="absolute right-2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${brandColor}, #22d3ee)` }}
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}