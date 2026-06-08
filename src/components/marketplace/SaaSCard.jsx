import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Clock, Gavel, Shield, Bot, Zap, BadgeCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

function CountdownTimer({ endDate }) {
  const target = new Date(endDate).getTime();
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  const urgent = days === 0 && hours < 6;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${urgent ? "text-red-400" : "text-amber-400"}`}>
      <Clock className="w-3 h-3" />
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
    </div>
  );
}

function RiskBadge({ score }) {
  const config = score <= 3 
    ? { label: "Low Risk", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
    : score <= 6 
    ? { label: "Medium Risk", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
    : { label: "High Risk", color: "bg-red-500/10 text-red-400 border-red-500/20" };

  return (
    <Badge className={`text-[10px] border ${config.color} flex items-center gap-1`}>
      <Shield className="w-3 h-3" /> {config.label} ({score}/10)
    </Badge>
  );
}

function AIScoreBadge({ score }) {
  return (
    <Badge className="text-[10px] border bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1">
      <Bot className="w-3 h-3" /> AI Score {score}%
    </Badge>
  );
}

export default function SaaSCard({ listing, delay = 0, onBuyShare, onBuyFullOwnership }) {
  const navigate = useNavigate();
  const { title, category, fullPrice, sharePrice, totalShares, soldShares, monthlyRevenue, growthRate, rating, imageGradient, status, auctionEndsAt, riskScore, aiScore } = listing;
  const isSold = status === "sold";
  const sharesLeft = totalShares - soldShares;
  const sharePercent = (soldShares / totalShares) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 flex flex-col"
    >
      {/* Image / Header */}
      <div
        className={`h-36 bg-gradient-to-br ${imageGradient} relative flex items-center justify-center overflow-hidden cursor-pointer`}
        onClick={() => navigate(`/saas/${listing.id}`)}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        <span className="relative text-white font-display font-bold text-xl text-center px-4 leading-tight drop-shadow-lg">{title}</span>

        {/* Hover overlay with "View Details" */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250">
          <div className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-5 py-2 rounded-full shadow-lg">
            <ExternalLink className="w-4 h-4" />
            View Details
          </div>
        </div>

        {status === "auction" && (
          <Badge className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] border-0 flex items-center gap-1">
            <Gavel className="w-3 h-3" /> Auction
          </Badge>
        )}
        {isSold && (
          <Badge className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] border-0 flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" /> Sold
          </Badge>
        )}
        {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white font-display font-bold text-2xl tracking-widest border-2 border-white/30 rounded-lg px-4 py-1 bg-black/30 backdrop-blur-sm rotate-[-8deg]">SOLD</span>
        </div>}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-white text-[11px] font-medium">{rating}</span>
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Category Row */}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] border-border/40">{category}</Badge>
        </div>

        {/* Countdown for auctions */}
        {status === "auction" && auctionEndsAt && (
          <CountdownTimer endDate={auctionEndsAt} />
        )}

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-secondary/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Full Price</p>
            <p className="text-sm font-display font-bold">${fullPrice.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Per Share</p>
            <p className="text-sm font-display font-bold text-cyan-400">${sharePrice}</p>
          </div>
        </div>

        {/* Shares Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Shares sold</span>
            <span className="font-medium">{soldShares}/{totalShares} <span className="text-muted-foreground">({sharesLeft} left)</span></span>
          </div>
          <Progress value={sharePercent} className="h-2 bg-[#2b2b2b] [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-400" />
        </div>

        {/* Revenue & Growth */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>+{growthRate}% growth</span>
          <span>${monthlyRevenue}/mo</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1 mt-auto">
          <Button size="sm" onClick={() => onBuyShare?.(listing)} disabled={isSold} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg text-[11px] h-8 disabled:opacity-40 text-white border-0">
            Buy Share
          </Button>
          <Button size="sm" variant="outline" onClick={() => onBuyFullOwnership?.(listing)} disabled={isSold} className="flex-1 border-orange-500/60 text-orange-400 hover:bg-orange-500/10 rounded-lg text-[11px] h-8 disabled:opacity-40">
            Full Ownership
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/saas/${listing.id}`)} className="rounded-lg text-[11px] h-8 px-2 text-muted-foreground hover:text-foreground">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}