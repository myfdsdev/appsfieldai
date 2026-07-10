import React from "react";
import ReactMarkdown from "react-markdown";

// A single chat bubble in the Deal Maker widget.
export default function DealMakerMessage({ message, brandColor }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "text-white rounded-br-sm"
            : "bg-secondary/70 text-foreground rounded-bl-sm"
        }`}
        style={isUser ? { background: brandColor } : undefined}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-0.5">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}