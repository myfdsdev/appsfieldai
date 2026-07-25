import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DealMakerProductCard from "./DealMakerProductCard";
import DealMakerDetailsCard from "./DealMakerDetailsCard";
import DealMakerCheckout from "./DealMakerCheckout";
import DealMakerPlanCard from "./DealMakerPlanCard";

// A boundary-less chat line for the immersive full-page mode.
// No bubble box — text simply floats in space. Agent text is centered and large;
// the visitor's own replies sit to the right, dimmer, smaller, like an echo.
export default function DealMakerFloatingMessage({ message, brandColor = "#6366f1", fade = 1, currency = "USD", marketplaceId, marketplace, onMoreDetails, onReserve, onConfirmPlan, planSubmitting, planSubmitted, onAction }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: fade * 0.95, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex justify-end"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <p
          className="text-right text-lg sm:text-xl font-semibold max-w-[85%] text-white"
          style={{ textShadow: `0 0 16px ${brandColor}, 0 1px 3px rgba(0,0,0,0.6)` }}
        >
          {message.content}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: fade, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-4"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {message.content && (() => {
        // Structured content (lists, tables, headings) reads far better
        // left-aligned at a normal size than centered & large.
        const structured = /(^|\n)\s*([-*+]\s|\d+\.\s|#{1,6}\s|\|)/.test(message.content);
        const base =
          "prose prose-invert prose-sm sm:prose-base max-w-2xl font-light text-white/90 " +
          "[&_p]:my-1 [&_strong]:text-white [&_strong]:font-semibold " +
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 " +
          "[&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold " +
          "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
          "[&_th]:border [&_th]:border-white/20 [&_th]:bg-white/10 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-white " +
          "[&_td]:border [&_td]:border-white/15 [&_td]:px-3 [&_td]:py-1.5 [&_a]:text-white [&_a]:underline";
        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={structured ? `${base} text-left w-full` : `${base} text-center text-xl sm:text-2xl leading-relaxed`}
          >
            {message.content}
          </ReactMarkdown>
        );
      })()}
      {message.card?.listing && message.card.mode === "details" && (
        <DealMakerDetailsCard
          listing={message.card.listing}
          brandColor={brandColor}
          currency={currency}
          onAction={onAction}
        />
      )}
      {message.card?.listing && message.card.mode !== "checkout" && message.card.mode !== "details" && (
        <DealMakerProductCard
          listing={message.card.listing}
          mode={message.card.mode}
          brandColor={brandColor}
          currency={currency}
          onMoreDetails={onMoreDetails}
          onReserve={message.card.reserve ? onReserve : undefined}
        />
      )}
      {message.card?.listing && message.card.mode === "checkout" && (
        <DealMakerCheckout
          listing={message.card.listing}
          marketplaceId={marketplaceId}
          marketplace={marketplace}
          brandColor={brandColor}
          currency={currency}
        />
      )}
      {message.plan && (
        <DealMakerPlanCard
          plan={message.plan}
          brandColor={brandColor}
          submitting={planSubmitting}
          submitted={planSubmitted}
          onConfirm={onConfirmPlan}
        />
      )}
    </motion.div>
  );
}