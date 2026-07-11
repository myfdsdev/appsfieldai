import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

// A boundary-less chat line for the immersive full-page mode.
// No bubble box — text simply floats in space. Agent text is centered and large;
// the visitor's own replies sit to the right, dimmer, smaller, like an echo.
export default function DealMakerFloatingMessage({ message, brandColor = "#6366f1", fade = 1 }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: fade * 0.9, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex justify-end"
      >
        <p
          className="text-right text-lg sm:text-xl font-medium max-w-[85%]"
          style={{ color: brandColor }}
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
      className="flex justify-center"
    >
      <ReactMarkdown className="prose prose-invert max-w-2xl text-center text-xl sm:text-2xl leading-relaxed font-light text-white/90 [&_p]:my-1 [&_strong]:text-white [&_strong]:font-semibold">
        {message.content}
      </ReactMarkdown>
    </motion.div>
  );
}