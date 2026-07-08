import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Wallet, DollarSign, Clock, CheckCircle2, Users, Percent, CalendarClock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Modal to record a manual/wire payout for one affiliate's cleared commissions.
function PayoutModal({ affiliate, onClose, onDone }) {
  const [method, setMethod] = useState(affiliate.payoutMethod || "PayPal");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const payable = affiliate.summary?.payable || 0;

  const submit = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("affiliatePayout", {
        affiliateId: affiliate.id, payoutMethod: method, payoutReference: reference,
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Paid out $${(res.data.paidAmount || 0).toLocaleString()} to ${affiliate.fullName || affiliate.email}`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.message || "Payout failed");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-bold">Pay out {affiliate.fullName || affiliate.email}</h3>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Payable Now</p>
          <p className="text-2xl font-display font-bold text-emerald-400">${payable.toLocaleString()}</p>
        </div>

        {affiliate.payoutDetails ? (
          <div className="rounded-xl border border-border/40 bg-secondary/20 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Affiliate's payout details</p>
            <p className="text-[11px] font-medium">{affiliate.payoutMethod || "—"}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{affiliate.payoutDetails}</p>
          </div>
        ) : (
          <p className="text-[11px] text-amber-400">This affiliate hasn't added payout details yet.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
              <option>PayPal</option>
              <option>Bank Wire</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Reference (optional)</label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 text-sm h-9" placeholder="Txn / wire ref" />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">This records the payout, marks the cleared commissions as paid, and emails the affiliate. Send the actual money via your own PayPal/bank.</p>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 border-border/40 rounded-xl">Cancel</Button>
          <Button onClick={submit} disabled={busy || payable <= 0} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Mark Paid
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal to set a per-affiliate hold-window override (performance-based).
function HoldDaysModal({ affiliate, holdDaysDefault, onClose, onDone }) {
  const [days, setDays] = useState(affiliate.holdDays ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      // Reuse the review function's holdDays action — needs an application id for this affiliate.
      const res = await base44.functions.invoke("affiliateReviewApplication", {
        applicationId: affiliate.anyApplicationId, action: "holdDays", holdDays: days === "" ? "" : Number(days),
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Hold window updated");
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.message || "Failed to update");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border/40 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-bold">Hold window · {affiliate.fullName || affiliate.email}</h3>
        <p className="text-[11px] text-muted-foreground">Days a commission stays on hold before it becomes payable. Lower it for trusted, low-refund affiliates. Leave blank to use the store default ({holdDaysDefault} days).</p>
        <div>
          <label className="text-[11px] text-muted-foreground">Hold Days</label>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder={`${holdDaysDefault} (default)`} />
        </div>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 border-border/40 rounded-xl">Cancel</Button>
          <Button onClick={save} disabled={busy} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AffiliateRow({ affiliate, holdDaysDefault, onRefresh }) {
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const s = affiliate.summary || { payable: 0, hold: 0, paid: 0, refunded: 0 };

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{affiliate.fullName || "Affiliate"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{affiliate.email}</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-secondary/40 shrink-0">{affiliate.refCode}</span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2 text-center">
          <p className="text-sm font-bold text-emerald-400">${s.payable.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Payable</p>
        </div>
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2 text-center">
          <p className="text-sm font-bold text-amber-400">${s.hold.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Hold</p>
        </div>
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-2 text-center">
          <p className="text-sm font-bold text-blue-400">${s.paid.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Paid</p>
        </div>
        <div className="rounded-lg bg-secondary/40 border border-border/20 p-2 text-center">
          <p className="text-sm font-bold">${s.refunded.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Refund</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => setPayoutOpen(true)} disabled={s.payable <= 0} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-lg text-xs gap-1.5 h-8">
          <Wallet className="w-3.5 h-3.5" /> Pay Out ${s.payable.toLocaleString()}
        </Button>
        <Button onClick={() => setHoldOpen(true)} size="sm" variant="outline" className="border-border/40 rounded-lg text-xs gap-1.5 h-8">
          <CalendarClock className="w-3.5 h-3.5" /> Hold: {affiliate.holdDays ?? holdDaysDefault}d
        </Button>
      </div>

      {payoutOpen && <PayoutModal affiliate={affiliate} onClose={() => setPayoutOpen(false)} onDone={onRefresh} />}
      {holdOpen && <HoldDaysModal affiliate={affiliate} holdDaysDefault={holdDaysDefault} onClose={() => setHoldOpen(false)} onDone={onRefresh} />}
    </div>
  );
}

// Owner tab: affiliates with commission balances + manual payout controls.
export default function AffiliatePayoutsManager({ affiliates = [], applications = [], holdDaysDefault = 14, onRefresh }) {
  // Attach any application id per affiliate so the hold-days action has one to target.
  const appIdByAff = {};
  applications.forEach((a) => { if (!appIdByAff[a.affiliateId]) appIdByAff[a.affiliateId] = a.id; });
  const rows = affiliates.map((a) => ({ ...a, anyApplicationId: appIdByAff[a.id] }));

  const totalPayable = rows.reduce((sum, a) => sum + (a.summary?.payable || 0), 0);
  const totalHold = rows.reduce((sum, a) => sum + (a.summary?.hold || 0), 0);
  const totalPaid = rows.reduce((sum, a) => sum + (a.summary?.paid || 0), 0);

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No affiliates yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3 h-3" /> Payable</p>
          <p className="text-lg font-display font-bold text-emerald-400">${totalPayable.toLocaleString()}</p>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> On Hold</p>
          <p className="text-lg font-display font-bold text-amber-400">${totalHold.toLocaleString()}</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Wallet className="w-3 h-3" /> Paid Out</p>
          <p className="text-lg font-display font-bold text-blue-400">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((a) => <AffiliateRow key={a.id} affiliate={a} holdDaysDefault={holdDaysDefault} onRefresh={onRefresh} />)}
      </div>
    </div>
  );
}