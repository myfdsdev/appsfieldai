import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

// A single free-floating chat bubble in the Deal Maker widget.
// `fade` (0..1) dims older messages so only the most recent few read as active.
export default function DealMakerMessage({ message, brandColor, fade = 1 }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: fade, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed border backdrop-blur-md ${
          isUser
            ? "text-white rounded-br-sm border-white/20"
            : "bg-white/[0.04] text-white/90 rounded-bl-sm border-white/[0.06]"
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