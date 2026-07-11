import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

// A single free-floating chat bubble in the Deal Maker widget.
// `fade` (0..1) dims older messages so only the most recent few read as active.
export default function DealMakerMessage({ message, brandColor, fade = 1 }) {
  const isUser = message.role === "user";
  // Older messages shrink slightly as they fade upward.
  const scale = 0.94 + fade * 0.06;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: fade, y: 0, scale }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ transformOrigin: isUser ? "right center" : "left center" }}
    >
      <div
        className={`rounded-3xl px-5 py-3.5 text-[16px] leading-relaxed backdrop-blur-md ${
          isUser
            ? "text-white rounded-br-lg max-w-[75%]"
            : "bg-white/10 border border-white/15 text-white/95 rounded-bl-lg max-w-[80%]"
        }`}
        style={isUser ? { background: `linear-gradient(135deg, ${brandColor}, ${brandColor}bb)` } : undefined}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_p]:my-0.5">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}