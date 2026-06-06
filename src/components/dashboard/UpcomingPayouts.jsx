import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, DollarSign } from "lucide-react";

const payouts = [
  { name: "AI Content Writer", amount: "$128.00", date: "Jun 15, 2026", daysLeft: 9 },
  { name: "CRM Dashboard Pro", amount: "$85.00", date: "Jun 20, 2026", daysLeft: 14 },
  { name: "Real Estate Agent SaaS", amount: "$62.40", date: "Jun 22, 2026", daysLeft: 16 },
];

export default function UpcomingPayouts() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
            Upcoming Payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payouts.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-border/20">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.date} · {p.daysLeft} days</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-display font-bold text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
                {p.amount}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Total upcoming: <span className="text-foreground font-medium">$275.40</span>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}