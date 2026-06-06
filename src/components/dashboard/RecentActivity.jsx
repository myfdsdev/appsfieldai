import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, TrendingDown, TrendingUp, Gift } from "lucide-react";

const activities = [
  { action: "Bought shares", item: "AI Content Writer", detail: "5 shares", time: "2h ago", type: "buy" },
  { action: "Dividend received", item: "CRM Dashboard Pro", detail: "$45.00", time: "5h ago", type: "dividend" },
  { action: "Sold shares", item: "E-com Analytics", detail: "2 shares", time: "1d ago", type: "sell" },
  { action: "Auction won", item: "Real Estate Agent SaaS", detail: "3 shares", time: "2d ago", type: "win" },
  { action: "Monthly payout", item: "AI Content Writer", detail: "$128.00", time: "3d ago", type: "payout" },
];

const typeConfig = {
  buy: { icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500" },
  sell: { icon: TrendingDown, color: "text-amber-400", bg: "bg-amber-500" },
  dividend: { icon: Gift, color: "text-violet-400", bg: "bg-violet-500" },
  win: { icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500" },
  payout: { icon: Gift, color: "text-pink-400", bg: "bg-pink-500" },
};

export default function RecentActivity() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/20">
            {activities.map((a, i) => {
              const cfg = typeConfig[a.type];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg}/10 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm">{a.action} <span className="font-medium text-foreground/90">{a.item}</span></p>
                      <p className="text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{a.detail}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}