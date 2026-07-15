import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
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
      {message.content && (
        <ReactMarkdown className="prose prose-invert max-w-2xl text-center text-xl sm:text-2xl leading-relaxed font-light text-white/90 [&_p]:my-1 [&_strong]:text-white [&_strong]:font-semibold">
          {message.content}
        </ReactMarkdown>
      )}
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