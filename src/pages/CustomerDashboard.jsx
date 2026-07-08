import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShoppingCart, Heart, Star, ExternalLink, Loader2, Video, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserAccountSettings from "@/components/dashboard/UserAccountSettings";

export default function CustomerDashboard() {
  const [tab, setTab] = useState("overview");
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["myOrders", currentUser?.id],
    queryFn: () => base44.entities.Order.filter({ customerId: currentUser?.id }, "-createdAt"),
    enabled: !!currentUser?.id,
  });

  const { data: favorites = [], isLoading: favsLoading } = useQuery({
    queryKey: ["myFavorites", currentUser?.id],
    queryFn: () => base44.entities.Favorite.filter({ userId: currentUser?.id }, "-created_date"),
    enabled: !!currentUser?.id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["myReviews", currentUser?.id],
    queryFn: () => base44.entities.Review.filter({ userId: currentUser?.id }, "-created_date"),
    enabled: !!currentUser?.id,
  });

  const { data: demos = [] } = useQuery({
    queryKey: ["myDemos", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return base44.entities.DemoRequest.filter({ customerEmail: currentUser.email }, "-created_date");
    },
    enabled: !!currentUser?.email,
  });

  const totalSpent = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">My Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Your profile, purchases, favorites, reviews, and demo requests.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40">
        {[
          { id: "overview", label: "Overview", icon: ShoppingCart },
          { id: "account", label: "Account", icon: User },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "account" ? (
        <UserAccountSettings user={currentUser} />
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { label: "Favorites", value: favorites.length, icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
              { label: "Reviews", value: reviews.length, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
              { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-card/40 border border-border/40 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-display font-semibold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Orders */}
          <div>
            <h3 className="text-base font-display font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-cyan-400" /> My Purchases</h3>
            {ordersLoading ? (
              <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-card/40 border border-border/40 text-sm text-muted-foreground">No purchases yet. Browse the marketplace!</div>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="bg-card/40 border border-border/40 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{o.softwareName || "Software"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.createdAt || o.created_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${(o.amount || 0).toLocaleString()}</p>
                      <Badge className={`text-[9px] ${o.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400" : o.paymentStatus === "refunded" ? "bg-slate-500/10 text-slate-400" : "bg-amber-500/10 text-amber-400"}`}>{o.paymentStatus}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <div>
            <h3 className="text-base font-display font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400" /> Favorites</h3>
            {favsLoading ? (
              <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-card/40 border border-border/40 text-sm text-muted-foreground">No favorites saved yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {favorites.map((f) => (
                  <div key={f.id} className="bg-card/40 border border-border/40 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{f.listingTitle || "Software"}</span>
                    <a href={`/saas/${f.listingId}`} className="text-muted-foreground hover:text-violet-400"><ExternalLink className="w-3.5 h-3.5" /></a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demo Requests */}
          <div>
            <h3 className="text-base font-display font-semibold mb-3 flex items-center gap-2"><Video className="w-4 h-4 text-blue-400" /> My Demo Requests</h3>
            {demos.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-card/40 border border-border/40 text-sm text-muted-foreground">No demo requests yet.</div>
            ) : (
              <div className="space-y-2">
                {demos.map((d) => (
                  <div key={d.id} className="bg-card/40 border border-border/40 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{d.softwareName}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(d.created_date).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`text-[9px] ${
                      d.status === "scheduled" ? "bg-violet-500/10 text-violet-400" :
                      d.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                      d.status === "cancelled" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                    }`}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}