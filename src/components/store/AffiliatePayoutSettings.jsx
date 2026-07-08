import React, { useState, useEffect } from "react";
import { Wallet, Save, Loader2 } from "lucide-react";
import { updateAffiliatePayout } from "@/lib/storeCustomerAuth";
import { toast } from "sonner";

// Affiliate saves how they want to get paid (PayPal / bank wire). Manual payouts:
// the store owner reads these details to send commission by hand.
export default function AffiliatePayoutSettings({ marketplaceId, dashboard, brandColor = "#f97316", onSaved }) {
  const [method, setMethod] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMethod(dashboard?.payoutMethod || "");
    setDetails(dashboard?.payoutDetails || "");
  }, [dashboard]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAffiliatePayout({ marketplaceId, payoutMethod: method, payoutDetails: details });
      toast.success("Payout details saved");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1"><Wallet className="w-3.5 h-3.5" /> Payout Details</p>
      <p className="text-[11px] text-muted-foreground mb-3">Commissions are paid manually by the store. Tell them how to send your money.</p>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-muted-foreground">Payout Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
            <option value="">Select method</option>
            <option value="PayPal">PayPal</option>
            <option value="Bank Wire">Bank Wire / Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Payout Account Details</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm h-20 resize-none" placeholder="PayPal email, or bank account / IBAN / SWIFT for wire..." />
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-60" style={{ background: brandColor }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Payout Details
        </button>
      </div>
    </div>
  );
}