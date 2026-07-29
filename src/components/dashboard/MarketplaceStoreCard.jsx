import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Zap, ExternalLink, LayoutDashboard, Globe, Trash2, User as UserIcon, Mail, Flame, DollarSign, Bell, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Per-store card showing a cover thumbnail, active-deal & revenue stats, and a
// notification badge when recent slot/software purchases came in. Loads its own
// stats so the parent list stays light.
export default function MarketplaceStoreCard({ m, i, plan, owner, isAdmin, platformDomain, storeUrl, onManage, onVisit, onDelete }) {
  // Cover banner should use an actual cover/hero image — never the logo (the logo
  // has its own dedicated box below), otherwise the logo gets stretched across the banner.
  const cover = m.pageSections?.headerImageUrl || m.pageSections?.heroBgImageUrl || "";

  // When no cover image is set, fall back to the store's hero theme from page settings.
  const ps = m.pageSections || {};
  const themeBg = (() => {
    if (ps.heroBgType === "solid" && ps.heroSolidColor) {
      return { background: ps.heroSolidColor };
    }
    if (ps.heroBgType === "gradient" && (ps.heroGradientStart || ps.heroGradientEnd)) {
      const start = ps.heroGradientStart || "#7c3aed";
      const end = ps.heroGradientEnd || "#06b6d4";
      return { background: `linear-gradient(135deg, ${start}, ${end})` };
    }
    return null;
  })();

  const { data: stats } = useQuery({
    queryKey: ["storeCardStats", m.id],
    queryFn: async () => {
      const [listings, orders, reservations] = await Promise.all([
        base44.entities.SaaSListing.filter({ marketplaceId: m.id }),
        base44.entities.StoreOrder.filter({ marketplaceId: m.id }),
        base44.entities.DealReservations.filter({ marketplaceId: m.id }),
      ]);
      return { listings, orders, reservations };
    },
    staleTime: 60_000,
  });

  const computed = useMemo(() => {
    if (!stats) return null;
    const activeDeals = stats.listings.filter(l => l.dealStatus === "live" || l.status === "active" || l.status === "approved").length;
    const revenue = stats.orders
      .filter(o => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + (o.total || 0), 0)
      + stats.reservations.filter(r => r.paymentApproved).reduce((sum, r) => sum + (r.amountDue || 0), 0);
    // "New" purchases in the last 7 days = slot reservations or software orders.
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = [...stats.orders, ...stats.reservations]
      .filter(x => new Date(x.created_date).getTime() > weekAgo).length;
    return { activeDeals, revenue, recentCount, currency: m.currency || "USD" };
  }, [stats, m.currency]);

  const fmtMoney = (n) => {
    const sym = computed?.currency === "INR" ? "₹" : computed?.currency === "EUR" ? "€" : "$";
    return `${sym}${(n || 0).toLocaleString()}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl hover:border-violet-500/30 transition-all overflow-hidden">
        {/* Cover thumbnail — uses cover image, else the store's hero theme, else default gradient */}
        <div
          className={`relative h-28 w-full ${!cover && !themeBg ? "bg-gradient-to-br from-violet-600/40 via-card to-cyan-600/30" : ""}`}
          style={!cover && themeBg ? themeBg : undefined}
        >
          {cover && (
            <img src={cover} alt={m.name} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/20 to-black/20" />
          {(m.pageSections?.headerTitle || m.name) && (
            <p className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm font-display font-semibold text-white drop-shadow-lg line-clamp-2">
              {m.pageSections?.headerTitle || m.name}
            </p>
          )}
          <div className="absolute top-2 right-2 flex gap-1.5">
            {computed?.recentCount > 0 && (
              <Badge className="text-[10px] border bg-orange-500/90 text-white border-orange-400 flex items-center gap-1 shadow-lg">
                <Bell className="w-2.5 h-2.5" />{computed.recentCount} new
              </Badge>
            )}
            <Badge className={`text-[10px] border ${m.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : m.status === "draft" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}>{m.status}</Badge>
          </div>
        </div>

        <CardHeader className="pt-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${m.branding?.logo ? "min-w-10 max-w-24 bg-white/5 px-1.5" : "w-10 bg-gradient-to-br from-violet-600 to-cyan-600"}`}>
              {m.branding?.logo ? <img src={m.branding.logo} alt="" className="h-full w-auto max-w-full object-contain" /> : <Store className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-display truncate">{m.name}</CardTitle>
              <p className="text-[11px] text-muted-foreground truncate">{platformDomain || "app"}/store/{m.subdomain || m.slug}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl bg-secondary/40 border border-border/30 p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Flame className="w-3 h-3 text-orange-400" />Active Deals</div>
              <p className="text-lg font-display font-bold mt-0.5">{computed ? computed.activeDeals : "—"}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 border border-border/30 p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><DollarSign className="w-3 h-3 text-emerald-400" />Revenue</div>
              <p className="text-lg font-display font-bold mt-0.5 text-emerald-400">{computed ? fmtMoney(computed.revenue) : "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{m.type === "multi_vendor" ? "Multi-Vendor" : "Single Vendor"}</span>
            {plan && <span className="flex items-center gap-1 text-violet-400"><Zap className="w-3 h-3" />{plan.name}</span>}
            {m.template && <span className="capitalize">{m.template}</span>}
            {m.created_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
          </div>

          {m.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {m.categories.slice(0, 3).map(c => <Badge key={c} variant="secondary" className="text-[9px]">{c}</Badge>)}
              {m.categories.length > 3 && <Badge variant="secondary" className="text-[9px]">+{m.categories.length - 3}</Badge>}
            </div>
          )}

          {isAdmin && (
            <div className="mb-3 p-2 rounded-lg bg-secondary/40 border border-border/40 space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><UserIcon className="w-3 h-3" />{owner?.full_name || "Unknown owner"}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail className="w-3 h-3" />{owner?.email || "—"}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => onManage(m)} className="h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 hover:from-orange-600 hover:to-amber-600"><LayoutDashboard className="w-3 h-3 mr-1" />Manage</Button>
            <Button size="sm" variant="ghost" onClick={() => onVisit(m)} className="h-8 text-xs"><ExternalLink className="w-3 h-3 mr-1" />Visit</Button>
            {isAdmin && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(m)} className="h-8 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}