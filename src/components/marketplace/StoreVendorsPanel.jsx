import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, CheckCircle, XCircle, Clock, Mail, Phone, Store, ChevronDown, ChevronUp, Loader2, Ban, Undo2, Package, ExternalLink } from "lucide-react";
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

const listingStatusBadge = (status) => {
  const map = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return <Badge className={`text-[9px] border ${map[status] || ""}`}>{status}</Badge>;
};

// Store-scoped vendor management for the marketplace owner. Approve/reject/suspend
// vendors, see all products with who the vendor is, and approve pending vendor products.
export default function StoreVendorsPanel({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("vendors");
  const [vendorTab, setVendorTab] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["storeVendors", marketplaceId],
    queryFn: () => base44.entities.Vendor.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["storeVendorListings", marketplaceId],
    queryFn: () => base44.entities.SaaSListing.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));

  const pending = vendors.filter((v) => v.status === "pending");
  const approved = vendors.filter((v) => v.status === "approved");
  const rejected = vendors.filter((v) => v.status === "rejected");
  const suspended = vendors.filter((v) => v.status === "suspended");
  const currentVendorList = { pending, approved, suspended, rejected }[vendorTab];

  // Products submitted by a vendor that still need owner approval.
  const pendingProducts = listings.filter((l) => l.vendorId && (l.status === "pending" || l.status === "draft"));

  const handleVendorAction = async (vendor, status, extra = {}) => {
    setActionLoading(vendor.id);
    const payload = { status, reviewedAt: new Date().toISOString(), ...extra };
    if (status === "suspended") payload.suspendedAt = new Date().toISOString();
    await base44.entities.Vendor.update(vendor.id, payload);
    queryClient.invalidateQueries({ queryKey: ["storeVendors", marketplaceId] });
    setActionLoading(null);
    toast.success(`${vendor.vendorName} ${status}.`);
  };

  const handleProductAction = async (listing, status) => {
    setActionLoading(listing.id);
    await base44.entities.SaaSListing.update(listing.id, { status });
    queryClient.invalidateQueries({ queryKey: ["storeVendorListings", marketplaceId] });
    setActionLoading(null);
    toast.success(`${listing.softwareName} ${status === "active" ? "approved & published" : status}.`);
  };

  const vendorTabs = [
    { key: "pending", label: "Pending", count: pending.length },
    { key: "approved", label: "Approved", count: approved.length },
    { key: "suspended", label: "Suspended", count: suspended.length },
    { key: "rejected", label: "Rejected", count: rejected.length },
  ];

  return (
    <div className="space-y-5">
      {/* Top tabs */}
      <div className="flex items-center gap-2 border-b border-border/40">
        {[
          { id: "vendors", label: "Vendors", icon: Users },
          { id: "approvals", label: `Product Approvals${pendingProducts.length ? ` (${pendingProducts.length})` : ""}`, icon: Package },
          { id: "listings", label: "All Products", icon: Store },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === id ? "border-orange-500 text-orange-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* VENDORS */}
      {tab === "vendors" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {vendorTabs.map((t) => (
              <button key={t.key} onClick={() => setVendorTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${vendorTab === t.key ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}>
                {t.label} <span className="text-[11px] opacity-70">({t.count})</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading vendors...</div>
          ) : currentVendorList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-30" /> No {vendorTab} vendors.
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {currentVendorList.map((vendor) => {
                  const vendorListings = listings.filter((l) => l.vendorId === vendor.id);
                  return (
                    <motion.div key={vendor.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-card/40 border border-border/40 rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Store className="w-4 h-4 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{vendor.vendorName}</p>
                            <p className="text-[11px] text-muted-foreground">{vendor.email} · {vendorListings.length} product{vendorListings.length === 1 ? "" : "s"}</p>
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
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3 h-3" /> {vendor.email}</div>
                                {vendor.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3 h-3" /> {vendor.phone}</div>}
                                {vendor.appliedAt && <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3 h-3" /> Applied {new Date(vendor.appliedAt).toLocaleDateString()}</div>}
                              </div>
                              {vendor.description && <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">{vendor.description}</p>}

                              {vendorListings.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Their products</p>
                                  {vendorListings.map((l) => (
                                    <div key={l.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                                      <p className="text-xs font-medium truncate">{l.softwareName}</p>
                                      {listingStatusBadge(l.status)}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2 pt-1 flex-wrap">
                                {vendor.status === "pending" && (
                                  <>
                                    <Button size="sm" onClick={() => handleVendorAction(vendor, "approved")} disabled={actionLoading === vendor.id} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs h-8">
                                      {actionLoading === vendor.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}Approve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleVendorAction(vendor, "rejected")} disabled={actionLoading === vendor.id} className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-8">
                                      <XCircle className="w-3 h-3 mr-1" />Reject
                                    </Button>
                                  </>
                                )}
                                {vendor.status === "approved" && (
                                  <Button size="sm" variant="outline" onClick={() => handleVendorAction(vendor, "suspended")} disabled={actionLoading === vendor.id} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-lg text-xs h-8">
                                    <Ban className="w-3 h-3 mr-1" />Suspend
                                  </Button>
                                )}
                                {(vendor.status === "suspended" || vendor.status === "rejected") && (
                                  <Button size="sm" onClick={() => handleVendorAction(vendor, "approved")} disabled={actionLoading === vendor.id} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs h-8">
                                    {actionLoading === vendor.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo2 className="w-3 h-3 mr-1" />}Reinstate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT APPROVALS */}
      {tab === "approvals" && (
        <div className="space-y-2">
          {pendingProducts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" /> No vendor products awaiting approval.
            </div>
          ) : pendingProducts.map((l) => (
            <div key={l.id} className="bg-card/40 border border-border/40 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{l.softwareName}</p>
                <p className="text-[11px] text-muted-foreground">
                  by {vendorById[l.vendorId]?.vendorName || "Unknown vendor"} · ${(l.price || 0).toLocaleString()}{l.category ? ` · ${l.category}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {listingStatusBadge(l.status)}
                <Link to={`/saas/${l.id}`} target="_blank"><Button size="sm" variant="ghost" className="h-8 text-[10px]"><ExternalLink className="w-3 h-3 mr-1" />View</Button></Link>
                <Button size="sm" onClick={() => handleProductAction(l, "active")} disabled={actionLoading === l.id} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs h-8">
                  {actionLoading === l.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleProductAction(l, "rejected")} disabled={actionLoading === l.id} className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-8">
                  <XCircle className="w-3 h-3 mr-1" />Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALL PRODUCTS with who is the vendor */}
      {tab === "listings" && (
        <div className="space-y-2">
          {listings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No products in this store yet.</div>
          ) : listings.map((l) => (
            <div key={l.id} className="bg-card/40 border border-border/40 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{l.softwareName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {l.vendorId ? (
                    <span className="text-orange-400">Vendor: {vendorById[l.vendorId]?.vendorName || "Unknown"}</span>
                  ) : (
                    <span>Store owner</span>
                  )}
                  {l.category ? ` · ${l.category}` : ""} · ${(l.price || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {listingStatusBadge(l.status)}
                <Link to={`/saas/${l.id}`} target="_blank"><ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-orange-400" /></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}