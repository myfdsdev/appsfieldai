import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send, User, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function QnAPanel({ listing }) {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: qnas = [], isLoading } = useQuery({
    queryKey: ["qna", listing.id],
    queryFn: () => base44.entities.QnA.filter({ listingId: listing.id }, ["-created_date"], 50),
    enabled: !!listing?.id,
  });

  const handleAsk = async () => {
    if (!question.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.QnA.create({
        listingId: listing.id,
        listingTitle: listing.title,
        question: question.trim(),
        askedByName: "Anonymous Investor",
        isAnswered: false,
      });
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["qna", listing.id] });
      toast.success("Question submitted!");
    } catch {
      toast.error("Failed to submit question.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-violet-400" />
          Q{String.fromCharCode(38)}A ({qnas.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ask a question */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask a question about this SaaS..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[44px] h-11 resize-none text-sm bg-secondary/30 border-border/30 rounded-xl"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
          <Button
            onClick={handleAsk}
            disabled={!question.trim() || submitting}
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shrink-0 h-11 px-3 text-white border-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Q&A List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : qnas.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No questions yet. Be the first to ask!
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence>
              {qnas.map((q) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-secondary/30 p-3 space-y-2"
                >
                  {/* Question */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{q.askedByName}</p>
                      <p className="text-sm mt-0.5">{q.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  {q.isAnswered && q.answer && (
                    <div className="flex gap-2 pl-8">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-emerald-400">{q.answeredByName || "Seller"}</p>
                        <p className="text-sm mt-0.5 text-muted-foreground">{q.answer}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}