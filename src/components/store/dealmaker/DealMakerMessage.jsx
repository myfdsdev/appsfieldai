import React from "react";
import ReactMarkdown from "react-markdown";

// A single chat bubble in the Deal Maker widget.
export default function DealMakerMessage({ message, brandColor }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed border backdrop-blur-md ${
          isUser
            ? "text-white rounded-br-sm border-white/20"
            : "bg-white/10 text-white/90 rounded-bl-sm border-white/10"
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
    </div>
  );
}