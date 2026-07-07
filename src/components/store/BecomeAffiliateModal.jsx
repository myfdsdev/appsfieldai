import React, { useState, useEffect } from "react";
import { X, Loader2, Share2, TrendingUp, Copy, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { applyAsAffiliate, fetchAffiliateApplications } from "@/lib/storeCustomerAuth";
import { toast } from "sonner";

// Lets a customer become an affiliate for a specific product they purchased.
// Shows the product info, generates the referral URL, and submits an application
// for the store owner's approval. If already applied/approved, it reflects that state.
export default function BecomeAffiliateModal({
  open,
  onClose,
  marketplaceId,
  listing,          // { id, softwareName, ... } — the product to promote
  storeBaseUrl,     // base URL for building the referral link
  affiliateSettings,
  brandColor = "#f97316",
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [application, setApplication] = useState(null); // existing application for this product
  const [refCode, setRefCode] = useState(null);

  const questions = affiliateSettings?.questions || [];
  const commissionRate = listing?.affiliateCommissionRate ?? affiliateSettings?.defaultCommissionRate ?? 30;

  // Load whether the customer already applied to (or is approved for) this product.
  useEffect(() => {
    if (!open || !marketplaceId || !listing) return;
    setLoading(true);
    setAnswers({});
    fetchAffiliateApplications(marketplaceId)
      .then((res) => {
        setRefCode(res?.refCode || null);
        const existing = (res?.applications || []).find((a) => a.listingId === listing.id) || null;
        setApplication(existing);
      })
      .finally(() => setLoading(false));
  }, [open, marketplaceId, listing]);

  if (!open || !listing) return null;

  const status = application?.status;
  const refUrl = refCode ? `${storeBaseUrl}/saas/${listing.id}?ref=${refCode}` : null;

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.success("Referral link copied");
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const answerList = questions.map((q) => ({ question: q, answer: answers[q] || "" }));
      const res = await applyAsAffiliate({ marketplaceId, listingId: listing.id, answers: answerList });
      setApplication(res.application);
      setRefCode(res.affiliate?.refCode || refCode);
      toast.success("Application submitted for approval!");
    } catch (e) {
      toast.error(e.message || "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>

        {/* Product header */}
        <div className="flex items-center gap-3 mb-5 pr-6">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${listing.imageGradient || "from-orange-500 to-amber-500"} shrink-0`} />
          <div className="min-w-0">
            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: brandColor }}>
              <Share2 className="w-3.5 h-3.5" /> Promote this product
            </p>
            <h2 className="text-lg font-display font-bold truncate">{listing.softwareName}</h2>
          </div>
        </div>

        <div className="rounded-xl border p-3 mb-5 flex items-center gap-2" style={{ borderColor: `${brandColor}30`, background: `${brandColor}0d` }}>
          <TrendingUp className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
          <p className="text-sm">
            Earn <span className="font-bold" style={{ color: brandColor }}>{commissionRate}% commission</span> on every sale made through your link.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : status === "approved" ? (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-3">
              <CheckCircle2 className="w-4 h-4" /> You're approved — start sharing!
            </div>
            {refUrl && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Your referral link</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={refUrl} className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-xs" />
                  <button onClick={() => copy(refUrl)} className="p-2.5 rounded-xl text-white shrink-0" style={{ background: brandColor }}>
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <a href={refUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs mt-2 hover:underline" style={{ color: brandColor }}>
                  <ExternalLink className="w-3.5 h-3.5" /> Open link
                </a>
              </div>
            )}
          </div>
        ) : status === "pending" ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm font-semibold">Application submitted</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your request to promote this product is awaiting the store owner's approval. You'll get your referral link once approved.
            </p>
          </div>
        ) : status === "rejected" ? (
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-red-400">Application not approved</p>
            <p className="text-xs text-muted-foreground mt-1">The store owner didn't approve your application for this product.</p>
          </div>
        ) : (
          <div>
            {questions.length > 0 && (
              <div className="space-y-3 mb-4">
                {questions.map((q) => (
                  <div key={q}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{q}</label>
                    <textarea
                      value={answers[q] || ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm h-16 resize-none focus:outline-none"
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
              </div>
            )}
            <button onClick={submit} disabled={submitting}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
              style={{ background: brandColor }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Apply for Approval
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              The store owner reviews your request before you can start promoting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}