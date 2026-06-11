import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import AiChatWindow from "@/components/chat/AiChatWindow";

export default function AiChatPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Ask me anything about SaaS listings</p>
          </div>
        </div>
      </motion.div>

      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xl h-[78vh]">
        <AiChatWindow />
      </div>
    </div>
  );
}