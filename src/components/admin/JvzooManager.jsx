import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShoppingBag, Save, Copy, Check, RefreshCw, ShieldCheck, ShieldAlert, Trash2, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// The public IPN endpoint JVZoo posts to. Uses the app's own origin so it
// works on the custom domain automatically.
const IPN_URL = `${window.location.origin}/functions/jvzooIpn`;

export default function JvzooManager() {
  const queryClient = useQueryClient();
  const [secretKey, setSecretKey] = useState("");
  const [configId, setConfigId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["jvzooConfig"],
    queryFn: async () => {
      const rows = await base44.entities.AppConfig.filter({ key: "jvzoo" });
      return rows[0] || null;
    },
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["jvzooSales"],
    queryFn: () => base44.entities.JvzooSale.list("-created_date", 100),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: () => base44.entities.SubscriptionPlan.list("sortOrder"),
  });

  useEffect(() => {
    if (config) {
      setSecretKey(config.jvzooSecretKey || "");
      setConfigId(config.id);
    }
  }, [config]);

  const handleSaveSecret = async () => {
    setSaving(true);
    if (configId) {
      await base44.entities.AppConfig.update(configId, { jvzooSecretKey: secretKey });
    } else {
      const created = await base44.entities.AppConfig.create({ key: "jvzoo", jvzooSecretKey: secretKey });
      setConfigId(created.id);
    }
    queryClient.invalidateQueries({ queryKey: ["jvzooConfig"] });
    toast.success("JVZoo secret key saved");
    setSaving(false);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(IPN_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async (s) => {
    await base44.entities.JvzooSale.delete(s.id);
    queryClient.invalidateQueries({ queryKey: ["jvzooSales"] });
    toast.success("Transaction deleted");
  };

  const planName = (id) => plans.find((p) => p.id === id)?.name || (id ? "Unknown Plan" : "—");

  const txBadge = (t) => {
    if (t === "SALE" || t === "BILL") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (t === "RFND" || t === "CGBK" || t === "CANCEL-REBILL") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-secondary text-muted-foreground border-border/30";
  };

  return (
    <div className="space-y-5">
      {/* Config Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
              <ShoppingBag className="w-4 h-4 text-amber-400" />JVZoo IPN Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Your IPN / Webhook URL</label>
              <p className="text-[11px] text-muted-foreground mb-1.5">Paste this into your JVZoo product's <span className="text-foreground">IPN Settings</span> field.</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={IPN_URL} className="bg-[#252525] border-border/30 rounded-xl text-xs font-mono" />
                <button onClick={copyUrl} className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/30 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">JVZoo IPN Secret Key</label>
              <p className="text-[11px] text-muted-foreground mb-1.5">Must match the secret key set in your JVZoo product IPN settings. Used to verify incoming requests.</p>
              <div className="flex items-center gap-2">
                <Input value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="MyJVZIPNSecretKey" className="bg-[#252525] border-border/30 rounded-xl text-xs" />
                <Button onClick={handleSaveSecret} disabled={saving} className="bg-amber-600 hover:bg-amber-700 rounded-xl text-xs gap-1.5 shrink-0">
                  <Save className="w-3.5 h-3.5" />Save
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <Link2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground">Map each JVZoo product to a plan by setting the <span className="text-foreground">JVZoo Product ID</span> on the plan (Admin → Plans). When a sale arrives, that plan is auto-assigned to the customer.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Card className="border-border/40 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
              <RefreshCw className="w-4 h-4 text-amber-400" />JVZoo Transactions
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] ml-2">{sales.length}</Badge>
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ["jvzooSales"] })} className="text-muted-foreground hover:text-foreground h-8 text-xs"><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</Button>
          </CardHeader>
          <CardContent className="divide-y divide-border/20">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
            ) : sales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No JVZoo transactions yet. They'll appear here once JVZoo starts posting to your IPN URL.</p>
            ) : sales.map((s) => (
              <div key={s.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{s.ccustname || "Unknown"}</p>
                    <span className="text-xs text-muted-foreground">{s.ccustemail}</span>
                    <Badge className={`text-[10px] border ${txBadge(s.ctransaction)}`}>{s.ctransaction}</Badge>
                    {s.verified ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400"><ShieldCheck className="w-3 h-3" />Verified</span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400"><ShieldAlert className="w-3 h-3" />Unverified</span>
                    )}
                  </div>
                  <p className="text-xs text-violet-400">{s.cprodtitle || "—"} <span className="text-muted-foreground">(#{s.cproditem})</span></p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {s.ctransamount > 0 && <span className="text-[11px] text-amber-400">${s.ctransamount?.toLocaleString()}</span>}
                    <span className="text-[11px] text-muted-foreground">Plan: <span className="text-foreground">{planName(s.assignedPlanId)}</span></span>
                    <span className="text-[10px] text-muted-foreground">{new Date(s.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 text-[11px] shrink-0"><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}