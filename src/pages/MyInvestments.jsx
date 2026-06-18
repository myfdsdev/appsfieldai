import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, Clock, PieChart as PieIcon, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PortfolioChart from "@/components/investments/PortfolioChart";

export default function MyInvestments() {
  const { data: sharePurchases = [], isLoading: loadingShares } = useQuery({
    queryKey: ["mySharePurchases"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SharePurchase.filter({ userId: user.id }, ["-created_date"], 100);
    },
  });

  const { data: fullOwnerships = [], isLoading: loadingOwnership } = useQuery({
    queryKey: ["myFullOwnerships"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.OwnershipPurchase.filter({ userId: user.id }, ["-created_date"], 50);
    },
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["myTransactions"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Transaction.filter({ userId: user.id }, ["-created_date"], 50);
    },
  });

  // Build holdings grouped by listingId
  const holdings = useMemo(() => {
    const grouped = {};
    sharePurchases.forEach((p) => {
      if (!grouped[p.listingId]) {
        grouped[p.listingId] = {
          listingId: p.listingId,
          title: "SaaS Listing",
          totalShares: 0,
          totalInvested: 0,
          avgPricePerShare: 0,
        };
      }
      grouped[p.listingId].totalShares += p.sharesBought || 0;
      grouped[p.listingId].totalInvested += p.totalAmount || 0;
    });
    // Calculate avg price
    Object.values(grouped).forEach((h) => {
      h.avgPricePerShare = h.totalShares > 0 ? Math.round(h.totalInvested / h.totalShares) : 0;
    });
    return Object.values(grouped);
  }, [sharePurchases]);

  // Fetch listing titles for holdings
  const { data: listingTitles = {} } = useQuery({
    queryKey: ["listingTitles", holdings.map((h) => h.listingId)],
    queryFn: async () => {
      const titles = {};
      await Promise.all(
        holdings.map(async (h) => {
          try {
            const items = await base44.entities.SaaSListing.filter({ id: h.listingId });
            if (items[0]) titles[h.listingId] = items[0].softwareName;
          } catch { /* listing may be deleted */ }
        })
      );
      return titles;
    },
    enabled: holdings.length > 0,
  });

  // Enrich holdings with titles
  const enrichedHoldings = useMemo(() =>
    holdings.map((h) => ({
      ...h,
      title: listingTitles[h.listingId] || `Listing ${h.listingId.slice(0, 6)}`,
    })),
  [holdings, listingTitles]);

  const totalFullOwnership = fullOwnerships.reduce((s, p) => s + (p.fullPrice || 0), 0);
  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.totalInvested, 0) + totalFullOwnership;
  const totalShares = enrichedHoldings.reduce((s, h) => s + h.totalShares, 0);
  const estimatedValue = totalInvested * 1.15; // placeholder: 15% growth assumption
  const profit = estimatedValue - totalInvested;
  const profitPct = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(1) : "0";

  const isLoading = loadingShares || loadingOwnership || loadingTx;

  const txTypeMeta = {
    share_purchase: { label: "Share Purchase", color: "text-cyan-400", icon: ArrowDownRight },
    full_ownership_purchase: { label: "Full Ownership", color: "text-violet-400", icon: ArrowDownRight },
    deposit: { label: "Deposit", color: "text-emerald-400", icon: ArrowUpRight },
    withdrawal: { label: "Withdrawal", color: "text-red-400", icon: ArrowDownRight },
    dividend: { label: "Dividend", color: "text-emerald-400", icon: ArrowUpRight },
    sale_revenue: { label: "Sale Revenue", color: "text-amber-400", icon: ArrowUpRight },
  };

  const paymentMethodLabel = (t) => {
    // If the transaction is a purchase with listing info, assume wallet unless Stripe
    if (t.type === "share_purchase" || t.type === "full_ownership_purchase") return "Wallet";
    if (t.type === "deposit") return "Stripe";
    return "System";
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">My Investments</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your SaaS portfolio performance.</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invested", value: `$${totalInvested.toLocaleString()}`, icon: DollarSign, grad: "from-violet-500 to-purple-500" },
          { label: "Est. Portfolio Value", value: `$${estimatedValue.toLocaleString()}`, icon: BarChart3, grad: "from-cyan-500 to-teal-500" },
          { label: "Total Profit", value: `${profit >= 0 ? "+" : ""}$${profit.toLocaleString()}`, icon: TrendingUp, grad: "from-emerald-500 to-green-500", extra: `${profitPct}%` },
          { label: "Total Shares", value: totalShares, icon: PieIcon, grad: "from-amber-500 to-orange-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl h-full">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                {s.extra && <p className="text-xs text-emerald-400 mt-0.5">{s.extra}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Portfolio Chart + Holdings */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PortfolioChart holdings={enrichedHoldings} />

        {/* Holdings List */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-base font-display">My Holdings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : enrichedHoldings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No investments yet. Browse the marketplace to get started!
              </div>
            ) : (
              enrichedHoldings.map((h, i) => {
                const pctOfPortfolio = totalInvested > 0 ? ((h.totalInvested / totalInvested) * 100).toFixed(0) : 0;
                const colors = ["from-violet-500 to-purple-500", "from-cyan-500 to-teal-500", "from-emerald-500 to-green-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500"];
                return (
                  <motion.div
                    key={h.listingId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center shrink-0`}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{h.title}</p>
                        <Badge variant="outline" className="text-[10px] border-border/40 shrink-0 ml-2">{pctOfPortfolio}%</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{h.totalShares} shares</span>
                        <span>·</span>
                        <span>Avg ${h.avgPricePerShare}/share</span>
                      </div>
                      <Progress value={Number(pctOfPortfolio)} className="h-1 mt-2 bg-[#2b2b2b] [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-purple-500" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-display font-bold">${h.totalInvested.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">invested</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Ownership Purchases */}
      {fullOwnerships.length > 0 && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-base font-display">Full Ownership Purchases</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border/30">
            {fullOwnerships.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.listingTitle || `Listing ${(p.listingId || "").slice(0, 6)}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">Full Ownership</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(p.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-display font-bold">${(p.fullPrice || 0).toLocaleString()}</p>
                  <p className="text-[11px] text-emerald-400 capitalize">{p.status || "completed"}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-base font-display">Transaction History</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border/30">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No transactions yet.</div>
          ) : (
            transactions.slice(0, 20).map((t, i) => {
              const meta = txTypeMeta[t.type] || { label: t.type, color: "text-muted-foreground", icon: Clock };
              const isPositive = t.amount > 0;
              return (
                <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                      <meta.icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{meta.label}</p>
                        {t.listingTitle && <p className="text-xs text-muted-foreground truncate">{t.listingTitle}</p>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[10px] border ${t.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : t.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{t.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">{paymentMethodLabel(t)}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{t.type === "share_purchase" || t.type === "full_ownership_purchase" ? "-" : ""}${Math.abs(t.amount).toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}