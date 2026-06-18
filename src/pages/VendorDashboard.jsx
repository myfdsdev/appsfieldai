import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Store, Plus, ExternalLink, AlertCircle, CheckCircle, Clock, Package, DollarSign, ShoppingCart, Video, MessageSquareText, Wallet, Edit3, Eye, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const tabs = [
  { key: "software", label: "My Software", icon: Package, color: "text-violet-400" },
  { key: "sales", label: "Sales", icon: BarChart3, color: "text-emerald-400" },
  { key: "demos", label: "Demo Requests", icon: Video, color: "text-blue-400" },
  { key: "reviews", label: "Reviews", icon: MessageSquareText, color: "text-yellow-400" },
  { key: "payouts", label: "Payouts", icon: Wallet, color: "text-amber-400" },
];

export default function VendorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("software");
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["myVendors"],
    queryFn: () => base44.entities.Vendor.filter({ userId: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const approvedVendors = vendors.filter((v) => v.status === "approved");

  // Auto-select first approved vendor
  useEffect(() => {
    if (approvedVendors.length > 0 && !selectedVendor) {
      setSelectedVendor(approvedVendors[0]);
    }
  }, [approvedVendors]);

  const vendorListings = useQuery({
    queryKey: ["vendorListings", selectedVendor?.id],
    queryFn: () => base44.entities.SaaSListing.filter({ vendorId: selectedVendor?.id, marketplaceId: selectedVendor?.marketplaceId }),
    enabled: !!selectedVendor?.id,
  });

  const vendorOrders = useQuery({
    queryKey: ["vendorOrders", selectedVendor?.id],
    queryFn: () => base44.entities.Order.filter({ vendorId: selectedVendor?.id, marketplaceId: selectedVendor?.marketplaceId }, "-createdAt"),
    enabled: !!selectedVendor?.id,
  });

  const vendorDemos = useQuery({
    queryKey: ["vendorDemos", selectedVendor?.id],
    queryFn: async () => {
      const listingIds = (vendorListings.data || []).map((l) => l.id);
      if (listingIds.length === 0) return [];
      const allDemos = await base44.entities.DemoRequest.filter({ marketplaceId: selectedVendor?.marketplaceId });
      return allDemos.filter((d) => listingIds.includes(d.softwareId));
    },
    enabled: !!selectedVendor?.id && (vendorListings.data || []).length > 0,
  });

  const vendorReviews = useQuery({
    queryKey: ["vendorReviews", selectedVendor?.id],
    queryFn: async () => {
      const listingIds = (vendorListings.data || []).map((l) => l.id);
      if (listingIds.length === 0) return [];
      const allReviews = await base44.entities.Review.filter({ marketplaceId: selectedVendor?.marketplaceId });
      return allReviews.filter((r) => listingIds.includes(r.softwareId));
    },
    enabled: !!selectedVendor?.id && (vendorListings.data || []).length > 0,
  });

  const vendorPayouts = useQuery({
    queryKey: ["vendorPayouts", selectedVendor?.id],
    queryFn: () => base44.entities.Payout.filter({ vendorId: selectedVendor?.id, marketplaceId: selectedVendor?.marketplaceId }, "-payoutDate"),
    enabled: !!selectedVendor?.id,
  });

  const listings = vendorListings.data || [];
  const orders = vendorOrders.data || [];
  const demos = vendorDemos.data || [];
  const reviews = vendorReviews.data || [];
  const payouts = vendorPayouts.data || [];

  const totalSales = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalCommission = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const totalEarnings = totalSales - totalCommission;
  const totalPaidOut = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingBalance = totalEarnings - totalPaidOut;

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Vendor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your software, track sales and respond to customers.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/vendor/register")} variant="outline" className="rounded-xl gap-1.5 h-9 text-xs">
            <Plus className="w-3.5 h-3.5" /> Register on New Marketplace
          </Button>
          <Button onClick={() => navigate("/sell")} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5 h-9 text-xs">
            <Plus className="w-3.5 h-3.5" /> Submit Software
          </Button>
        </div>
      </motion.div>

      {/* Vendor Selector */}
      {approvedVendors.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card/40 border border-border/40">
          <Store className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-4">You don't have any approved vendor profiles yet.</p>
          <Button onClick={() => navigate("/vendor/register")} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">Register as Vendor</Button>
        </div>
      ) : (
        <>
          {/* Vendor Selector */}
          <div className="flex gap-2 flex-wrap">
            {approvedVendors.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVendor(v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedVendor?.id === v.id
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                    : "bg-card/40 border border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                {v.vendorName}
              </button>
            ))}
          </div>

          {selectedVendor && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Sales", value: `$${totalSales.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Your Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: ShoppingCart, color: "text-violet-400", bg: "bg-violet-500/10" },
                  { label: "Pending Payout", value: `$${Math.max(0, pendingBalance).toLocaleString()}`, icon: Wallet, color: "text-amber-400", bg: "bg-amber-500/10" },
                  { label: "Listings", value: listings.length, icon: Package, color: "text-cyan-400", bg: "bg-cyan-500/10", isNum: true },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-xl bg-card/40 border border-border/40 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div>
                      <p className={`text-lg font-display font-semibold ${s.isNum ? "" : "text-sm"}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1.5 flex-wrap border-b border-border/40 pb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* My Software Tab */}
                {activeTab === "software" && (
                  <div className="space-y-3">
                    {listings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No software listed yet. <Button variant="link" onClick={() => navigate("/sell")} className="text-violet-400 p-0">Submit one now</Button></div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {listings.map((l) => (
                          <Card key={l.id} className="border-border/40 bg-card/60">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{l.softwareName || l.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`text-[9px] ${
                                    l.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                                    l.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                                  }`}>{l.status}</Badge>
                                  <span className="text-[10px] text-muted-foreground">${(l.price || l.fullPrice || 0).toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/saas/${l.id}`)} className="h-8 w-8 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sales Tab */}
                {activeTab === "sales" && (
                  <div className="space-y-3">
                    {orders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No sales recorded yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {orders.map((o) => (
                          <div key={o.id} className="bg-card/40 border border-border/40 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium">{o.softwareName || "Software"}</p>
                              <p className="text-[10px] text-muted-foreground">{o.customerName || o.customerEmail} · {new Date(o.createdAt || o.created_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">${(o.amount || 0).toLocaleString()}</p>
                              <div className="flex items-center gap-1 text-[9px]">
                                <Badge className={`${o.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"} text-[8px]`}>{o.paymentStatus}</Badge>
                                {o.commissionAmount > 0 && <span className="text-muted-foreground">-${o.commissionAmount.toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Demo Requests Tab */}
                {activeTab === "demos" && (
                  <div className="space-y-3">
                    {demos.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No demo requests received yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {demos.map((d) => (
                          <div key={d.id} className="bg-card/40 border border-border/40 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-xs font-medium">{d.customerName}</p>
                                <p className="text-[10px] text-muted-foreground">{d.customerEmail}{d.phone ? ` · ${d.phone}` : ""}</p>
                              </div>
                              <Badge className={`text-[9px] ${
                                d.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                                d.status === "scheduled" ? "bg-violet-500/10 text-violet-400" :
                                d.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
                              }`}>{d.status}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{d.softwareName} · {new Date(d.created_date).toLocaleDateString()}</p>
                            {d.message && <p className="text-[11px] text-muted-foreground mt-2 bg-secondary/30 rounded-lg p-2">{d.message}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No reviews received yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {reviews.map((r) => (
                          <div key={r.id} className="bg-card/40 border border-border/40 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{r.userName || "Anonymous"}</span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <svg key={i} className={`w-3 h-3 ${i < (r.rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                  ))}
                                </div>
                              </div>
                              <Badge className={`text-[9px] ${r.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : r.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>{r.status}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{r.softwareName} · {new Date(r.created_date).toLocaleDateString()}</p>
                            <p className="text-xs mt-2 line-clamp-2">{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payouts Tab */}
                {activeTab === "payouts" && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase">Total Earnings</p>
                        <p className="text-lg font-display font-bold text-emerald-400">${totalEarnings.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase">Paid Out</p>
                        <p className="text-lg font-display font-bold text-amber-400">${totalPaidOut.toLocaleString()}</p>
                      </div>
                    </div>
                    {payouts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No payouts processed yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {payouts.map((p) => (
                          <div key={p.id} className="bg-card/40 border border-border/40 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium">${(p.amount || 0).toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(p.payoutDate || p.created_date).toLocaleDateString()}</p>
                            </div>
                            <Badge className={`text-[9px] ${
                              p.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                              p.status === "processing" ? "bg-blue-500/10 text-blue-400" :
                              p.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                            }`}>{p.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
}