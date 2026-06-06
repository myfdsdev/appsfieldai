import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gavel, Clock, Flame } from "lucide-react";

const liveAuctions = [
  { name: "AI Content Writer", currentBid: "$1,850", shares: 15, progress: 72, endsIn: "2h 14m", hot: true },
  { name: "SaaS Analytics Pro", currentBid: "$3,200", shares: 8, progress: 45, endsIn: "5h 30m", hot: true },
  { name: "Marketing Automator", currentBid: "$980", shares: 25, progress: 88, endsIn: "45m", hot: false },
];

export default function LiveAuctionsCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-400" />
            Live Auctions
          </CardTitle>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">{liveAuctions.length} active</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {liveAuctions.map((a) => (
            <div key={a.name} className="space-y-2 p-3 rounded-lg bg-white/[0.02] border border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.name}</span>
                  {a.hot && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                </div>
                <span className="text-sm font-display font-bold text-violet-300">{a.currentBid}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{a.shares} shares available</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.endsIn}</span>
              </div>
              <Progress value={a.progress} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}