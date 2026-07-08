import React, { useState, useEffect } from "react";
import { X, Share2, Loader2, TrendingUp, Clock, Undo2, Copy, Check, Send, MessageSquare, Wallet, CheckCircle2 } from "lucide-react";
import { fetchAffiliateApplications, fetchAffiliateDashboard, applyAsAffiliate } from "@/lib/storeCustomerAuth";
import AffiliatePromotionKit from "@/components/store/AffiliatePromotionKit";
import AffiliatePayoutSettings from "@/components/store/AffiliatePayoutSettings";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  hold: { label: "On hold", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  sale: { label: "Payable", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  paid: { label: "Paid", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  refunded: { label: "Refunded", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

// Modal shown to a customer to apply to promote a product, with the owner's questions.
function ApplyModal({ listing, questions, brandColor, onClose, onApply }) {
  const [answers, setAnswers] = useState((questions || []).map((q) => ({ question: q, answer: "" })));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onApply(listing.id, answers.filter((a) => a.question));
      toast.success("Application submitted!");
      onClose();
    } catch (e) {
      toast.error(e.message || "Failed to apply");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-background border border-border/40 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold">Promote {listing.softwareName}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {(questions || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Apply to earn commission promoting this product.</p>
        ) : (
          <div className="space-y-3">
            {answers.map((a, i) => (
              <div key={i}>
                <label className="text-xs text-muted-foreground">{a.question}</label>
                <textarea
                  value={a.answer}
                  onChange={(e) => setAnswers((prev) => prev.map((x, idx) => (idx === i ? { ...x, answer: e.target.value } : x)))}
                  className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm h-20 resize-none"
                  placeholder="Your answer..."
                />
              </div>
            ))}
          </div>
        )}
        <button onClick={submit} disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-60" style={{ background: brandColor }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Application
        </button>
      </div>
    </div>
  );
}

// Inline affiliate dashboard rendered directly inside the store customer dashboard
// (earnings, promote, applications) — no slide-in drawer.
export default function StoreAffiliateSection({ marketplaceId, affiliateSettings, listings = [], storeBaseUrl, brandColor = "#f97316" }) {
  const [tab, setTab] = useState("earnings");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [appsData, setAppsData] = useState({ applications: [], refCode: null });
  const [applyListing, setApplyListing] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    if (!marketplaceId) return;
    setLoading(true);
    Promise.all([fetchAffiliateDashboard(marketplaceId), fetchAffiliateApplications(marketplaceId)])
      .then(([d, a]) => { setDashboard(d); setAppsData(a || { applications: [], refCode: null }); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [marketplaceId]);

  const refCode = appsData.refCode || dashboard?.refCode;
  const refLink = refCode ? `${storeBaseUrl}?ref=${refCode}` : null;
  const totals = dashboard?.totals || { cleared: 0, hold: 0, paid: 0, refunded: 0, sales: 0 };
  const appliedIds = new Set((appsData.applications || []).map((a) => a.listingId));
  // Products the customer can still apply to (affiliate-enabled + not already applied).
  const openProducts = listings.filter((l) => l.affiliateEnabled && !appliedIds.has(l.id));

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApply = async (listingId, answers) => {
    await applyAsAffiliate({ marketplaceId, listingId, answers });
    load();
  };

  const tabs = [
    { id: "earnings", label: "Earnings" },
    { id: "kit", label: "Promotion Kit" },
    { id: "promote", label: "Promote" },
    { id: "applications", label: "Applications" },
  ];

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4" /> Affiliate Dashboard
      </h2>
      <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
        {/* Referral link */}
        {refLink && (
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-[11px] text-muted-foreground mb-1">Your referral link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 truncate">{refLink}</div>
              <button onClick={copyLink} className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: brandColor }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border/40">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "text-white" : "text-muted-foreground hover:bg-secondary/50"}`}
              style={tab === t.id ? { background: brandColor } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : tab === "earnings" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                  <TrendingUp className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                  <p className="text-base font-display font-bold text-emerald-400">${totals.cleared.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Payable</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                  <Clock className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                  <p className="text-base font-display font-bold text-amber-400">${totals.hold.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">On hold</p>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                  <Wallet className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                  <p className="text-base font-display font-bold text-blue-400">${(totals.paid || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Paid out</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/60 p-3 text-center">
                  <Undo2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-base font-display font-bold">${totals.refunded.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Refunded</p>
                </div>
              </div>

              {dashboard?.holdDays != null && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Commissions are held for <b>{dashboard.holdDays} days</b> to cover refunds, then become payable. Payouts are sent manually by the store.
                </p>
              )}

              <AffiliatePayoutSettings marketplaceId={marketplaceId} dashboard={dashboard} brandColor={brandColor} onSaved={load} />

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Commissions</p>
                {(dashboard?.transactions || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No commissions yet. Share your link to start earning.</p>
                ) : (
                  <div className="space-y-2">
                    {dashboard.transactions.map((t) => {
                      const st = STATUS_STYLES[t.status] || STATUS_STYLES.hold;
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{t.listingTitle}</p>
                            <p className="text-[11px] text-muted-foreground">{t.commissionRate}% of ${t.orderTotal.toLocaleString()}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-sm font-semibold">${t.amount.toLocaleString()}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : tab === "kit" ? (
            <AffiliatePromotionKit applications={appsData.applications || []} brandColor={brandColor} />
          ) : tab === "promote" ? (
            <div className="space-y-3">
              {affiliateSettings?.terms && (
                <div className="rounded-xl border border-border/40 bg-secondary/20 p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Program Terms</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{affiliateSettings.terms}</p>
                </div>
              )}
              {openProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No products available to promote right now.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {openProducts.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 p-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${l.imageGradient || "from-orange-500 to-amber-500"} shrink-0 flex items-center justify-center overflow-hidden`}>
                        {l.logo ? <img src={l.logo} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.softwareName}</p>
                        <p className="text-[11px] text-emerald-400">{l.affiliateCommissionRate ?? affiliateSettings?.defaultCommissionRate ?? 30}% commission</p>
                      </div>
                      <button onClick={() => setApplyListing(l)} className="shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90" style={{ background: brandColor }}>
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(appsData.applications || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">You haven't applied to promote any products yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {appsData.applications.map((a) => {
                    const st = STATUS_STYLES[a.status] || STATUS_STYLES.pending;
                    return (
                      <div key={a.id} className="rounded-xl border border-border/40 bg-card/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{a.listingTitle}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{a.commissionRate}% commission</p>
                        {a.reviewNotes && <p className="text-[11px] text-muted-foreground italic mt-1">"{a.reviewNotes}"</p>}
                        {(a.messages || []).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Messages</p>
                            {a.messages.map((m, i) => (
                              <p key={i} className="text-[11px]"><span className="text-muted-foreground">{m.authorName || m.from}: </span>{m.text}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {applyListing && (
        <ApplyModal
          listing={applyListing}
          questions={affiliateSettings?.questions || []}
          brandColor={brandColor}
          onClose={() => setApplyListing(null)}
          onApply={handleApply}
        />
      )}
    </section>
  );
}