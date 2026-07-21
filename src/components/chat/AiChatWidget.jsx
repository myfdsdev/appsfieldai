import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

const MASCOT_IMAGE = "https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/137122e9e_ai.png";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[82%] ${isUser ? "order-1" : ""}`}>
        <div className={`rounded-xl px-3 py-2 text-xs ${isUser ? "bg-orange-500 text-white rounded-br-sm" : "bg-secondary rounded-bl-sm"}`}>
          {isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <ReactMarkdown className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize agent conversation on first open
  const initConversation = async () => {
    if (initialized) return;
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin();
      return;
    }
    const existing = await base44.agents.listConversations({ agent_name: "appsfield_help_agent" });
    if (existing.length > 0) {
      const convo = await base44.agents.getConversation(existing[0].id);
      setConversation(convo);
      setMessages(convo.messages || []);
    } else {
      const convo = await base44.agents.createConversation({
        agent_name: "appsfield_help_agent",
        metadata: { name: "AppsField Help Agent", description: "Get help using the app's features" },
      });
      setConversation(convo);
    }
    setInitialized(true);
  };

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
    await base44.agents.addMessage(conversation, { role: "user", content });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleToggle = () => {
    if (!open) {
      initConversation();
    }
    setOpen(!open);
  };

  const quickPrompts = [
    "How do I set up a custom domain?",
    "How do I enable PayPal payments?",
    "How do I configure the Deal Maker agent?",
  ];

  return (
    <>
      {/* Floating Mascot Button */}
      <motion.button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <img
          src={MASCOT_IMAGE}
          alt="AI Assistant"
          className="w-full h-full object-contain drop-shadow-md"
        />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping bg-orange-400/20" />
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-card border border-border/40 rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-secondary/40">
              <div className="flex items-center gap-2.5">
                <img src={MASCOT_IMAGE} alt="" className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="text-sm font-semibold">AppsField Help Agent</h3>
                  <p className="text-[10px] text-muted-foreground">Help with your app's features & settings</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {!initialized ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-3">
                  <img src={MASCOT_IMAGE} alt="" className="w-14 h-14 object-contain mb-3" />
                  <p className="text-xs text-muted-foreground mb-3">How can I help you today?</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setNewMsg(prompt)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-orange-500/15 hover:text-orange-400 transition-colors text-muted-foreground border border-border/30"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <MessageBubble message={msg} />
                    </motion.div>
                  ))}
                  {sending && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-secondary rounded-xl rounded-bl-sm px-3 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30">
              <div className="flex items-end gap-2">
                <Textarea
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="min-h-[36px] max-h-[100px] h-[36px] text-xs resize-none rounded-xl bg-secondary/40 border-border/40"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMsg.trim() || sending}
                  size="icon"
                  className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 flex-shrink-0"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}