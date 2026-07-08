import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Check, X, Send, Percent, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AffiliatePayoutsManager from "@/components/marketplace/AffiliatePayoutsManager";

const badgeColors = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function ApplicationCard({ app, affiliate, onChanged }) {
  const [rate, setRate] = useState(app.commissionRate ?? "");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const call = async (payload, successMsg) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("affiliateReviewApplication", { applicationId: app.id, ...payload });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(successMsg);
      onChanged();
    } catch (e) {
      toast.error(e.message || "Failed");
    }
    setBusy(false);
  };

  const decide = (status) => call({ action: "decision", status, commissionRate: rate }, `Application ${status}`);
  const saveRate = () => call({ action: "commission", commissionRate: rate }, "Commission rate updated");
  const sendReply = () => {
    if (!reply.trim()) return;
    call({ action: "reply", text: reply }, "Message sent");
    setReply("");
  };

  return (
    <div className="bg-card/40 border border-border/40 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium">{app.affiliateName || affiliate?.fullName || "Affiliate"}</p>
          <p className="text-[11px] text-muted-foreground">{app.affiliateEmail || affiliate?.email} · applied for <span className="text-foreground">{app.listingTitle}</span></p>
        </div>
        <Badge className={`text-[10px] border capitalize ${badgeColors[app.status] || ""}`}>{app.status}</Badge>
      </div>

      {(app.answers || []).length > 0 && (
        <div className="space-y-2 mb-3 rounded-xl border border-border/40 bg-secondary/20 p-3">
          {app.answers.map((a, i) => (
            <div key={i}>
              <p className="text-[11px] font-medium text-orange-400">{a.question}</p>
              <p className="text-xs text-muted-foreground">{a.answer || "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Percent className="w-3 h-3" /> Commission Rate</label>
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="bg-secondary/50 border-border/30 rounded-lg text-xs h-8 w-24 mt-1" placeholder="30" />
        </div>
        {app.status === "pending" ? (
          <>
            <Button onClick={() => decide("approved")} disabled={busy} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-lg text-xs gap-1.5 h-8"><Check className="w-3.5 h-3.5" /> Approve</Button>
            <Button onClick={() => decide("rejected")} disabled={busy} size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs gap-1.5 h-8"><X className="w-3.5 h-3.5" /> Reject</Button>
          </>
        ) : (
          <Button onClick={saveRate} disabled={busy} size="sm" variant="outline" className="border-border/40 rounded-lg text-xs gap-1.5 h-8"><Percent className="w-3.5 h-3.5" /> Update Rate</Button>
        )}
      </div>

      {(app.messages || []).length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-xl border border-border/40 bg-secondary/20 p-3 max-h-40 overflow-y-auto">
          {app.messages.map((m, i) => (
            <div key={i} className={`text-xs ${m.from === "owner" ? "text-right" : ""}`}>
              <span className="text-[10px] text-muted-foreground">{m.authorName || m.from}</span>
              <p className={`inline-block px-2.5 py-1 rounded-lg ${m.from === "owner" ? "bg-orange-500/15 text-orange-300" : "bg-secondary/60"}`}>{m.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <Input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} className="bg-secondary/50 border-border/30 rounded-lg text-xs h-8" placeholder="Message the affiliate..." />
        <Button onClick={sendReply} disabled={busy || !reply.trim()} size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-lg h-8 w-8 p-0 shrink-0"><Send className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

export default function AffiliateApplicationsManager({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("applications");
  const { data, isLoading } = useQuery({
    queryKey: ["marketplaceAffiliates", marketplaceId],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMarketplaceAffiliates", { marketplaceId });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    enabled: !!marketplaceId,
  });

  const applications = data?.applications || [];
  const affiliates = data?.affiliates || [];
  const holdDaysDefault = data?.holdDaysDefault ?? 14;
  const affById = Object.fromEntries(affiliates.map((a) => [a.id, a]));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["marketplaceAffiliates", marketplaceId] });

  const pending = applications.filter((a) => a.status === "pending").length;
  const totalPayable = affiliates.reduce((sum, a) => sum + (a.summary?.payable || 0), 0);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
          <p className="text-lg font-display font-bold text-amber-400">{pending}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Affiliates</p>
          <p className="text-lg font-display font-bold text-emerald-400">{affiliates.length}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payable Now</p>
          <p className="text-lg font-display font-bold text-emerald-400">${totalPayable.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/40">
        {[
          { id: "applications", label: `Applications${pending ? ` (${pending})` : ""}` },
          { id: "payouts", label: "Affiliates & Payouts" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-orange-500 text-orange-400" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.id === "payouts" && <Wallet className="w-3.5 h-3.5 inline mr-1.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "applications" ? (
        applications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No affiliate applications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} affiliate={affById[app.affiliateId]} onChanged={refresh} />
            ))}
          </div>
        )
      ) : (
        <AffiliatePayoutsManager
          affiliates={affiliates}
          applications={applications}
          holdDaysDefault={holdDaysDefault}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}