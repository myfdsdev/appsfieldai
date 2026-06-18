import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, CheckCircle, XCircle, Clock, Mail, Phone, Store, ChevronDown, ChevronUp, Loader2, Ban, Undo2, Package, DollarSign, Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const statusBadge = (status) => {
  switch (status) {
    case "approved": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case "rejected": return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    case "suspended": return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
    default: return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  }
};

export default function VendorManagement({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [vendorSoftware, setVendorSoftware] = useState({});
  const [vendorSales, setVendorSales] = useState({});
  const [loadingSoftware, setLoadingSoftware] = useState(null);
  const [loadingSales, setLoadingSales] = useState(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors", marketplaceId],
    queryFn: () => base44.entities.Vendor.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ["marketplaceListings", marketplaceId],
    queryFn: () => base44.entities.SaaSListing.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ["marketplaceTransactions", marketplaceId],
    queryFn: () => base44.entities.Transaction.filter({}),
    enabled: !!marketplaceId,
  });

  const pending = vendors.filter((v) => v.status === "pending");
  const approved = vendors.filter((v) => v.status === "approved");
  const rejected = vendors.filter((v) => v.status === "rejected");
  const suspended = vendors.filter((v) => v.status === "suspended");

  const currentList = activeTab === "pending" ? pending : activeTab === "approved" ? approved : activeTab === "rejected" ? rejected : suspended;

  const handleAction = async (vendor, action, extra = {}) => {
    setActionLoading(vendor.id);
    const payload = {
      status: action,
      reviewedAt: new Date().toISOString(),
      ...extra,
    };
    if (action === "suspended") {
      payload.suspendedAt = new Date().toISOString();
    }
    await base44.entities.Vendor.update(vendor.id, payload);
    queryClient.invalidateQueries({ queryKey: ["vendors", marketplaceId] });
    setActionLoading(null);
    const labels = { approved: "approved", rejected: "rejected", suspended: "suspended" };
    toast.success(`${vendor.vendorName} ${labels[action] || action}.`);
  };

  const loadSoftware = async (vendor) => {
    if (vendorSoftware[vendor.id]) return;
    setLoadingSoftware(vendor.id);
    const listings = allListings.filter((l) => l.vendorId === vendor.id);
    setVendorSoftware((prev) => ({ ...prev, [vendor.id]: listings }));
    setLoadingSoftware(null);
  };

  const loadSales = async (vendor) => {
    if (vendorSales[vendor.id]) return;
    setLoadingSales(vendor.id);
    const vendorListingIds = allListings.filter((l) => l.vendorId === vendor.id).map((l) => l.id);
    const sales = allTransactions.filter((t) => vendorListingIds.includes(t.listingId) && t.type === "share_purchase" || t.type === "full_ownership_purchase");
    setVendorSales((prev) => ({ ...prev, [vendor.id]: sales }));
    setLoadingSales(null);
  };

  const onExpand = (vendor) => {
    const isOpening = expandedId !== vendor.id;
    setExpandedId(isOpening ? vendor.id : null);
    if (isOpening) {
      loadSoftware(vendor);
      loadSales(vendor);
    }
  };

  const tabs = [
    { key: "pending", label: "Pending", count: pending.length, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { key: "approved", label: "Approved", count: approved.length, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { key: "suspended", label: "Suspended", count: suspended.length, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    { key: "rejected", label: "Rejected", count: rejected.length, color: "bg-red-500/10 text-red-400 border-red-500/20" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-400" /> Vendor Management
        </h3>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key ? `${tab.color} border` : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="text-[11px] opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Vendor list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading vendors...</div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Store className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No {activeTab} vendors found.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {currentList.map((vendor) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card/40 border border-border/40 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => onExpand(vendor)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Store className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{vendor.vendorName}</p>
                      <p className="text-[11px] text-muted-foreground">{vendor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(vendor.status)}
                    {expandedId === vendor.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === vendor.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-3">
                        {/* Contact Info */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {vendor.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3 h-3" /> {vendor.phone}</div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3 h-3" /> {vendor.email}</div>
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3 h-3" /> Applied: {new Date(vendor.appliedAt).toLocaleDateString()}</div>
                          {vendor.suspendedAt && (
                            <div className="flex items-center gap-1.5 text-orange-400"><Ban className="w-3 h-3" /> Suspended: {new Date(vendor.suspendedAt).toLocaleDateString()}</div>
                          )}
                        </div>
                        {vendor.description && (
                          <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">{vendor.description}</p>
                        )}
                        {vendor.suspendedReason && (
                          <p className="text-xs text-orange-400 bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">Reason: {vendor.suspendedReason}</p>
                        )}

                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Sales</p>
                            <p className="text-lg font-display font-bold text-emerald-400">${(vendor.totalSales || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payout Balance</p>
                            <p className="text-lg font-display font-bold text-violet-400">${(vendor.payoutBalance || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Vendor Software */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" /> Software Listings
                          </h4>
                          {loadingSoftware === vendor.id ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>
                          ) : (vendorSoftware[vendor.id] || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">No software listed yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {(vendorSoftware[vendor.id] || []).map((listing) => (
                                <div key={listing.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                                  <div>
                                    <p className="text-xs font-medium">{listing.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{listing.category} · ${(listing.fullPrice || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge className={`text-[9px] ${listing.status === "active" ? "bg-emerald-500/10 text-emerald-400" : listing.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>{listing.status}</Badge>
                                    <Link to={`/saas/${listing.id}`} target="_blank"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-violet-400" /></Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Vendor Sales */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> Recent Sales
                          </h4>
                          {loadingSales === vendor.id ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>
                          ) : (vendorSales[vendor.id] || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">No sales recorded yet.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {(vendorSales[vendor.id] || []).slice(0, 10).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                                  <div>
                                    <p className="text-xs font-medium capitalize">{tx.type?.replace(/_/g, " ")}</p>
                                    <p className="text-[10px] text-muted-foreground">{new Date(tx.created_date).toLocaleDateString()}</p>
                                  </div>
                                  <span className={`text-xs font-semibold ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    ${Math.abs(tx.amount || 0).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 flex-wrap">
                          {vendor.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleAction(vendor, "approved")} disabled={actionLoading === vendor.id} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs h-8">
                                {actionLoading === vendor.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAction(vendor, "rejected")} disabled={actionLoading === vendor.id} className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-8">
                                <XCircle className="w-3 h-3 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {vendor.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => handleAction(vendor, "suspended", { suspendedReason: "Violation of marketplace terms" })} disabled={actionLoading === vendor.id} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-lg text-xs h-8">
                              <Ban className="w-3 h-3 mr-1" />Suspend
                            </Button>
                          )}
                          {vendor.status === "suspended" && (
                            <Button size="sm" onClick={() => handleAction(vendor, "approved")} disabled={actionLoading === vendor.id} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs h-8">
                              {actionLoading === vendor.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo2 className="w-3 h-3 mr-1" />}Reinstate
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}