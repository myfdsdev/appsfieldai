import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";

const portfolioData = [
  { name: "AI Content Writer", shares: 20, value: 2000, revenue: 400, growth: 32, color: "bg-violet-500" },
  { name: "CRM Dashboard Pro", shares: 5, value: 2500, revenue: 500, growth: 24, color: "bg-cyan-500" },
  { name: "Real Estate Agent SaaS", shares: 12, value: 1200, revenue: 240, growth: 18, color: "bg-emerald-500" },
  { name: "E-com Analytics", shares: 8, value: 800, revenue: 160, growth: 15, color: "bg-amber-500" },
  { name: "Marketing Automator", shares: 0, value: 0, revenue: 0, growth: 0, color: "bg-pink-500" },
];

export default function PortfolioChart() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            Portfolio Performance
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-border/40">This Month</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground text-xs">{p.shares} shares · ${p.revenue}/mo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={p.growth * 2} className="h-2 flex-1 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-cyan-500" />
                  <span className="text-xs font-medium text-emerald-400 w-10 text-right">+{p.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}