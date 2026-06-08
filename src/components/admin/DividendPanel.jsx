import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, Send, TrendingUp, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function DividendPanel() {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState(null);
  const [dividendAmount, setDividendAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: listings = [] } = useQuery({
    queryKey: ["activeListings"],
    queryFn: () => base44.entities.SaaSListing.list(),
  });

  const { data: dividends = [] } = useQuery({
    queryKey: ["dividends"],
    queryFn: () => base44.entities.Dividend.list(["-created_date"], 20),
  });

  const activeListings = listings.filter((l) => l.status === "active");

  const handleDistribute = async () => {
    if (!selectedListing || !dividendAmount || parseFloat(dividendAmount) <= 0) {
      toast.error("Please select a listing and enter a valid amount");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await base44.functions.invoke("distributeDividends", {
        listingId: selectedListing.id,
        totalAmount: parseFloat(dividendAmount),
        period: period || undefined,
      });

      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["dividends"] });
      queryClient.invalidateQueries({ queryKey: ["activeListings"] });
      toast.success(`$${dividendAmount} distributed for ${selectedListing.title}`);
    } catch (err) {
      toast.error("Distribution failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const monthlyProfit = selectedListing
    ? selectedListing.monthlyRevenue - (selectedListing.monthlyExpenses || 0)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Distribute Dividends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Listing Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Select Listing</p>
            <div className="flex flex-wrap gap-2">
              {activeListings.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedListing(l);
                    setResult(null);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    selectedListing?.id === l.id
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-border/40 bg-secondary/40 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  {l.title}
                </button>
              ))}
              {activeListings.length === 0 && (
                <p className="text-xs text-muted-foreground">No active listings</p>
              )}
            </div>
          </div>

          {selectedListing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
              {/* Listing Info */}
              <div className="rounded-xl bg-secondary/40 p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Monthly Revenue</p>
                  <p className="text-sm font-bold text-emerald-400">${selectedListing.monthlyRevenue?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Monthly Profit</p>
                  <p className="text-sm font-bold text-[#f79a1b]">${monthlyProfit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Shares</p>
                  <p className="text-sm font-bold">{selectedListing.totalShares}</p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Dividend amount ($)"
                    value={dividendAmount}
                    onChange={(e) => setDividendAmount(e.target.value)}
                    className="bg-secondary/50 border-border/30 rounded-xl h-10"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Suggested: ${monthlyProfit.toLocaleString()} (100% profit)
                  </p>
                </div>
                <Input
                  placeholder="Period (e.g. June 2026)"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-secondary/50 border-border/30 rounded-xl h-10 w-40"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    size="sm"
                    variant="outline"
                    className="text-[10px] border-border/40 rounded-lg h-7"
                    onClick={() => setDividendAmount(String(Math.round(monthlyProfit * pct / 100)))}
                  >
                    {pct}%
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] border-border/40 rounded-lg h-7"
                  onClick={() => setDividendAmount(String(monthlyProfit))}
                >
                  100%
                </Button>
              </div>

              {/* Distribute Button */}
              <Button
                onClick={handleDistribute}
                disabled={loading || !dividendAmount}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl h-10 text-white border-0"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Distribute Dividends
              </Button>
            </motion.div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Dividends Distributed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${result.totalDistributed?.toLocaleString()} distributed to {result.results?.length || 0} shareholders
                </p>
                <div className="mt-2 space-y-1">
                  {result.results?.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-muted-foreground">
                      <span>User</span>
                      <span className="text-emerald-400">+${r.amount}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Dividend History */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl mt-4">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Dividend History
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/30">
          {dividends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No dividends distributed yet</p>
          ) : (
            dividends.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{d.listingTitle}</p>
                    <p className="text-[11px] text-muted-foreground">{d.period || new Date(d.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-sm font-display font-bold text-emerald-400">${d.totalAmount?.toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}