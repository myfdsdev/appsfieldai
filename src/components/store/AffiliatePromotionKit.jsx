import React, { useState } from "react";
import { Megaphone, Copy, Check, Download, Mail, Video, Image as ImageIcon, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "sonner";

function CopyBtn({ text, brandColor }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-[11px] font-medium hover:opacity-90" style={{ background: brandColor }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

// One approved product's full promotion kit: banners, videos, email swipes, AI brief.
function ProductKit({ app, brandColor }) {
  const [open, setOpen] = useState(false);
  const kit = app.promotionKit || {};
  const hasKit = (kit.images?.length || kit.videos?.length || kit.emailSwipes?.length || kit.llmDescription);

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.listing?.imageGradient || "from-orange-500 to-amber-500"} shrink-0 flex items-center justify-center overflow-hidden`}>
          {app.listing?.logo ? <img src={app.listing.logo} alt="" className="w-full h-full object-cover" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{app.listingTitle}</p>
          <p className="text-[11px] text-emerald-400">{app.commissionRate}% commission</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-4 border-t border-border/30 pt-3">
          {!hasKit && <p className="text-xs text-muted-foreground text-center py-4">No promotion materials added for this product yet.</p>}

          {/* Images */}
          {kit.images?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2"><ImageIcon className="w-3.5 h-3.5" /> Banners & Creatives</p>
              <div className="grid grid-cols-2 gap-2">
                {kit.images.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border/30">
                    <img src={url} alt="" className="w-full h-24 object-cover" />
                    <a href={url} download target="_blank" rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium gap-1.5">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {kit.videos?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2"><Video className="w-3.5 h-3.5" /> Promo Videos</p>
              <div className="space-y-1.5">
                {kit.videos.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/30 p-2">
                    <a href={url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs truncate hover:underline" style={{ color: brandColor }}>{url}</a>
                    <CopyBtn text={url} brandColor={brandColor} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Swipes */}
          {kit.emailSwipes?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2"><Mail className="w-3.5 h-3.5" /> Email Swipes</p>
              <div className="space-y-2">
                {kit.emailSwipes.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border/30 bg-secondary/30 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="flex-1 min-w-0 text-xs font-medium truncate">{s.subject || "(no subject)"}</p>
                      <CopyBtn text={`Subject: ${s.subject}\n\n${s.body}`} brandColor={brandColor} />
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-4">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Brief */}
          {kit.llmDescription && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5" /> AI Copy Brief</p>
              <div className="rounded-lg border border-border/30 bg-secondary/30 p-3">
                <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-5 mb-2">{kit.llmDescription}</p>
                <CopyBtn text={kit.llmDescription} brandColor={brandColor} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The affiliate's Promotion Kit tab — marketing materials for every approved product.
export default function AffiliatePromotionKit({ applications = [], brandColor = "#f97316" }) {
  const approved = applications.filter((a) => a.status === "approved");

  if (approved.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No promotion kits yet.</p>
        <p className="text-xs mt-1">Once a product application is approved, its marketing materials appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approved.map((a) => <ProductKit key={a.id} app={a} brandColor={brandColor} />)}
    </div>
  );
}