import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, ChevronDown, ChevronUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChatPanel({ listing, currentUser, style }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const scrollRef = useRef(null);

  const ownerId = listing.ownerUserId;
  const isOwner = currentUser?.id === ownerId;

  // Fetch messages when expanded
  useEffect(() => {
    if (!expanded || !currentUser?.id || !listing.id) return;
    fetchMessages();
  }, [expanded, currentUser?.id, listing.id]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!expanded || !currentUser?.id || !listing.id) return;

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") {
        const msg = event.data;
        // Only show messages related to this conversation
        if (msg.listingId === listing.id &&
            (msg.senderId === currentUser.id || msg.receiverId === currentUser.id)) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg].sort(
              (a, b) => new Date(a.created_date) - new Date(b.created_date)
            );
          });
        }
      }
    });

    return unsubscribe;
  }, [expanded, currentUser?.id, listing.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter(
          { senderId: currentUser.id, listingId: listing.id },
          "created_date",
          100
        ),
        base44.entities.Message.filter(
          { receiverId: currentUser.id, listingId: listing.id },
          "created_date",
          100
        ),
      ]);
      const all = [...sent, ...received].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      setMessages(all);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setFetchError("Could not load messages. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    if (!currentUser?.id) {
      toast.error("Please log in to send messages.");
      return;
    }

    setSending(true);
    try {
      const receiver = isOwner
        ? messages.find((m) => m.senderId !== currentUser.id)?.senderId
        : ownerId;

      if (!receiver) {
        toast.error("No recipient found. Wait for a buyer to message first.");
        setSending(false);
        return;
      }

      await base44.entities.Message.create({
        senderId: currentUser.id,
        receiverId: receiver,
        listingId: listing.id,
        content: newMsg.trim(),
      });
      setNewMsg("");
      // Subscription will handle adding the message to state
    } catch (err) {
      console.error("Failed to send:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser?.id) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={style}>
      <Card className="border-violet-500/20 bg-card/60 backdrop-blur-xl">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-base font-display flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-violet-400" />
              Chat with {isOwner ? "Buyer" : "Seller"}
            </span>
            <span className="flex items-center gap-2">
              {messages.length > 0 && (
                <span className="text-[10px] font-normal bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                  {messages.length}
                </span>
              )}
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </span>
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-3 pb-4">
                <div ref={scrollRef} className="h-48 overflow-y-auto space-y-3 pr-1">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    </div>
                  ) : fetchError ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-red-400">{fetchError}</p>
                      <Button variant="link" size="sm" onClick={fetchMessages} className="text-xs mt-1">Retry</Button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                      <p className="text-xs text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === currentUser.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[85%] ${isMine ? "flex-row-reverse" : ""}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isMine ? "bg-violet-500" : "bg-secondary"}`}>
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <div className={`rounded-2xl px-3 py-2 ${isMine ? "bg-violet-500 text-white rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[9px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
                                {new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="min-h-[40px] h-10 text-xs resize-none rounded-xl bg-secondary/40 border-border/40"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMsg.trim() || sending}
                    size="icon"
                    className="w-10 h-10 rounded-xl bg-violet-500 hover:bg-violet-600 flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}