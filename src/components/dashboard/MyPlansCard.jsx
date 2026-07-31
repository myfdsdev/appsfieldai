import React from "react";
import { Package, CheckCircle, Infinity as InfinityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Shows every plan the user currently holds (primary + JVZoo-stacked) as a
// transactions-style list, e.g. "AppsfieldAI Bundle" + "Bundle Bump".
export default function MyPlansCard({ plans = [], primaryPlanId }) {
  if (!plans.length) return null;

  const fmt = (v) => (v === -1 ? "Unlimited" : v);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-400" /> My Plans
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] ml-1">{plans.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/30">
        {plans.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.id === primaryPlanId && (
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px]">Primary</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                  {(p.storeLimit === -1 || (p.storeLimit ?? 0) > 0) && (
                    <span className="flex items-center gap-0.5">{p.storeLimit === -1 ? <InfinityIcon className="w-3 h-3" /> : p.storeLimit} stores</span>
                  )}
                  {(p.productLimit === -1 || (p.productLimit ?? 0) > 0) && (
                    <span className="flex items-center gap-0.5">· {p.productLimit === -1 ? <InfinityIcon className="w-3 h-3" /> : p.productLimit} products</span>
                  )}
                  {p.dfyAllowed && (p.dfyProductLimit === -1 || (p.dfyProductLimit ?? 0) > 0) && (
                    <span className="flex items-center gap-0.5">· {p.dfyProductLimit === -1 ? <InfinityIcon className="w-3 h-3" /> : p.dfyProductLimit} DFY</span>
                  )}
                </div>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] flex items-center gap-1 shrink-0">
              <CheckCircle className="w-2.5 h-2.5" /> Active
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}