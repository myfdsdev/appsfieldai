import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";

export default function AITipCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <Card className="border-border/40 bg-gradient-to-br from-violet-500/5 via-cyan-500/5 to-emerald-500/5 backdrop-blur-xl border-violet-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5 relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">AI Insight</span>
          </div>
          <p className="text-sm leading-relaxed mb-3">
            AI-driven SaaS businesses in your portfolio show <span className="text-emerald-400 font-medium">32% higher growth</span> than traditional tools. 
            Consider increasing your stake in the AI & ML category to maximize returns this quarter.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Based on market analysis of 1,200+ SaaS listings
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}