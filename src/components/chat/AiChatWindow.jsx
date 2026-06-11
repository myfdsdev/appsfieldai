import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? "bg-violet-500 text-white rounded-br-md"
              : "bg-secondary rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                a: ({ children, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AiChatWindow() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  // Create or load conversation
  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin("/chats");
        return;
      }

      // Try to get existing conversation
      const existing = await base44.agents.listConversations({ agent_name: "listing_bot" });
      if (existing.length > 0) {
        const convo = await base44.agents.getConversation(existing[0].id);
        setConversation(convo);
        setMessages(convo.messages || []);
      } else {
        const convo = await base44.agents.createConversation({
          agent_name: "listing_bot",
          metadata: { name: "AI Assistant Chat", description: "Chat with the SaaS listing assistant" },
        });
        setConversation(convo);
        setMessages([]);
      }
    };
    init();
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = newMsg.trim();
    if (!content || !conversation || sending) return;
    setNewMsg("");
    setSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content,
      });
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick prompts for first-time users
  const quickPrompts = [
    "What SaaS listings are available?",
    "How does bidding work?",
    "Find me a CRM listing under $500",
    "How do I list my SaaS for sale?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="font-display font-semibold text-base mb-1">AI Listing Assistant</h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs">
              Ask me about SaaS listings, pricing, features, or how the marketplace works!
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setNewMsg(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-violet-500/20 hover:text-violet-400 transition-colors text-muted-foreground border border-border/30"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
            {sending && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                </div>
              </div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/40">
        <div className="flex items-end gap-2">
          <Textarea
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about SaaS listings..."
            className="min-h-[42px] max-h-[120px] h-[42px] text-sm resize-none rounded-xl bg-secondary/40 border-border/40"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMsg.trim() || sending}
            size="icon"
            className="w-10 h-10 rounded-xl bg-violet-500 hover:bg-violet-600 flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}