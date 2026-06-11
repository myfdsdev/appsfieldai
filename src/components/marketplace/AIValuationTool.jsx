import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, TrendingUp, DollarSign, BarChart3, Target, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function AIValuationTool({ formData, onApplyValuation }) {
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const getValuation = async () => {
    setLoading(true);
    setError(null);
    try {
      const revenue = parseFloat(formData.monthlyRevenue) || 0;
      const expenses = parseFloat(formData.monthlyExpenses) || 0;
      const profit = revenue - expenses;
      const growth = parseFloat(formData.growthRate) || 0;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a SaaS valuation expert. Analyze this SaaS business and provide a detailed valuation.

SaaS Name: ${formData.title || "N/A"}
Category: ${formData.category || "N/A"}
Monthly Revenue: $${revenue.toLocaleString()}
Monthly Expenses: $${expenses.toLocaleString()}
Monthly Profit: $${profit.toLocaleString()}
Growth Rate: ${growth}%
Description: ${formData.description || "N/A"}

Based on current market multiples (typically 30-50x MRR for profitable SaaS), provide a realistic valuation. Consider:
- The SaaS valuation multiple depends on growth rate: <10% growth = 20-30x MRR, 10-30% = 30-40x, >30% = 40-60x
- Profit margin (profit/revenue) impacts valuation
- Category influences buyer demand

Respond with this exact JSON structure only, no other text:
{
  "estimated_full_price": number (total valuation in USD),
  "estimated_share_price": number (per share, roughly full_price / 50),
  "valuation_multiple": number (the MRR multiple used),
  "confidence": "low" | "medium" | "high",
  "summary": "1-2 sentence summary in Hindi explaining the valuation",
  "breakdown": "3-4 bullet points explaining key factors affecting this valuation (in Hindi)"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_full_price: { type: "number" },
            estimated_share_price: { type: "number" },
            valuation_multiple: { type: "number" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string" },
            breakdown: { type: "string" },
          },
          required: ["estimated_full_price", "estimated_share_price", "valuation_multiple", "confidence", "summary", "breakdown"],
        },
      });

      setValuation(result);
      setExpanded(true);
    } catch (err) {
      setError("Valuation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confidenceColors = {
    low: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-orange-500/20 bg-orange-500/5 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-display font-semibold">AI SaaS Valuation</h3>
                <p className="text-[11px] text-muted-foreground">Get a data-driven price suggestion</p>
              </div>
            </div>
            <Button
              onClick={getValuation}
              disabled={loading || (!formData.monthlyRevenue && !formData.monthlyExpenses)}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-xs h-8"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              {valuation ? "Re-Analyze" : "Get Valuation"}
            </Button>
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <AnimatePresence>
            {valuation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-orange-500/20">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                      <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <p className="text-lg font-display font-bold text-emerald-400">${valuation.estimated_full_price?.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Est. Full Price</p>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                      <BarChart3 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-display font-bold text-blue-400">${valuation.estimated_share_price?.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Est. Share Price</p>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-display font-bold text-amber-400">{valuation.valuation_multiple}x</p>
                      <p className="text-[10px] text-muted-foreground">MRR Multiple</p>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-3 text-center">
                      <Target className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${confidenceColors[valuation.confidence]}`}>
                        {valuation.confidence?.toUpperCase()}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">Confidence</p>
                    </div>
                  </div>

                  <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 mb-2">
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? "Hide" : "Show"} Analysis
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">{valuation.summary}</p>
                        <div className="text-xs text-muted-foreground whitespace-pre-line bg-secondary/30 rounded-xl p-3">{valuation.breakdown}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={() => onApplyValuation({
                      fullPrice: valuation.estimated_full_price,
                      sharePrice: valuation.estimated_share_price,
                    })}
                    size="sm"
                    variant="outline"
                    className="mt-3 border-orange-500/30 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-xl text-xs h-8"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Apply Suggested Prices
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}