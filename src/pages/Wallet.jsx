import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wallet, ArrowDownCircle, ArrowUpCircle, CreditCard, History, Plus, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.filter({ userId: user?.id }, ["-created_date"], 20),
    enabled: !!user?.id,
  });

  const balance = user?.walletBalance || 0;

  const totalDeposits = transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalPending = transactions.filter((t) => t.status === "pending").reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setLoading(true);
    await base44.auth.updateMe({ walletBalance: balance + amt });
    await base44.entities.Transaction.create({ userId: user.id, type: "deposit", amount: amt, status: "completed" });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setDepositOpen(false);
    setAmount("");
    setLoading(false);
    toast.success(`$${amt.toLocaleString()} added to your wallet`);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > balance) { toast.error("Insufficient balance"); return; }
    setLoading(true);
    await base44.auth.updateMe({ walletBalance: balance - amt });
    await base44.entities.Transaction.create({ userId: user.id, type: "withdrawal_request", amount: -amt, status: "pending" });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setWithdrawOpen(false);
    setAmount("");
    setLoading(false);
    toast.success(`Withdrawal of $${amt.toLocaleString()} requested`);
  };

  const getIcon = (type) => {
    if (type === "deposit" || type === "dividend" || type === "sale_revenue") return ArrowDownCircle;
    if (type === "withdrawal" || type === "withdrawal_request") return Send;
    return ArrowUpCircle;
  };

  const getColor = (type, status) => {
    if (type === "deposit" || type === "dividend" || type === "sale_revenue") return "text-emerald-400";
    if (status === "pending") return "text-amber-400";
    return "text-cyan-400";
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your funds, deposits, and withdrawals.</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-cyan-700 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Available Balance</p>
                <p className="text-4xl font-display font-bold mt-1">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-white/50 text-xs mt-2">{user?.email || "Wallet"}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
          </div>
          <CardContent className="p-4 flex gap-3">
            <Button onClick={() => { setAmount(""); setDepositOpen(true); }} className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl h-10 text-sm">
              <Plus className="w-4 h-4 mr-2" /> Deposit
            </Button>
            <Button onClick={() => { setAmount(""); setWithdrawOpen(true); }} variant="outline" className="flex-1 border-border/40 rounded-xl h-10 text-sm">
              <Send className="w-4 h-4 mr-2" /> Withdraw
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Deposited", value: `$${totalDeposits.toLocaleString()}`, icon: ArrowDownCircle, color: "text-emerald-400" },
          { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: ArrowUpCircle, color: "text-cyan-400" },
          { label: "Pending", value: `$${totalPending.toLocaleString()}`, icon: History, color: "text-amber-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-lg font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Transactions */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/30">
          {txLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
          ) : (
            transactions.map((t) => {
              const Icon = getIcon(t.type);
              const color = getColor(t.type, t.status);
              const prefix = t.amount >= 0 ? "+" : "";
              return (
                <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{t.type?.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(t.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${color}`}>{prefix}${Math.abs(t.amount).toLocaleString()}</p>
                    <p className={`text-[11px] capitalize ${t.status === "completed" ? "text-muted-foreground" : "text-amber-400"}`}>{t.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="bg-card border-border/40 max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Add Funds</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Amount ($)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="bg-secondary/50 border-border/30 rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleDeposit} disabled={loading} className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deposit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-card border-border/40 max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Withdraw Funds</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Amount ($)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="bg-secondary/50 border-border/30 rounded-xl" /></div>
            <p className="text-xs text-muted-foreground">Available: ${balance.toLocaleString()}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleWithdraw} disabled={loading} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}