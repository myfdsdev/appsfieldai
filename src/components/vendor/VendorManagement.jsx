import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, CheckCircle, XCircle, Clock, Mail, Phone, Store, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const statusBadge = (status) => {
  switch (status) {
    case "approved": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case "rejected": return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    default: return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  }
};

export default function VendorManagement({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors", marketplaceId],
    queryFn: () => base44.entities.Vendor.filter({ marketplaceId }),
    enabled: !!marketplaceId,
  });

  const pending = vendors.filter((v) => v.status === "pending");
  const approved = vendors.filter((v) => v.status === "approved");
  const rejected = vendors.filter((v) => v.status === "rejected");

  const currentList = activeTab === "pending" ? pending : activeTab === "approved" ? approved : rejected;

  const handleAction = async (vendor, action) => {
    setActionLoading(vendor.id);
    const payload = {
      status: action,
      reviewedAt: new Date().toISOString(),
    };
    await base44.entities.Vendor.update(vendor.id, payload);
    queryClient.invalidateQueries({ queryKey: ["vendors", marketplaceId] });
    setActionLoading(null);
    toast.success(action === "approved" ? `${vendor.vendorName} approved!` : `${vendor.vendorName} rejected.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-400" /> Vendor Management
        </h3>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {[
          { key: "pending", label: "Pending", count: pending.length, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
          { key: "approved", label: "Approved", count: approved.length, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
          { key: "rejected", label: "Rejected", count: rejected.length, color: "bg-red-500/10 text-red-400 border-red-500/20" },
        ].map((tab) => (
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
                  onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}
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
                      <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {vendor.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="w-3 h-3" /> {vendor.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3 h-3" /> {vendor.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" /> Applied: {new Date(vendor.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {vendor.description && (
                          <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">{vendor.description}</p>
                        )}

                        {vendor.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleAction(vendor, "approved")}
                              disabled={actionLoading === vendor.id}
                              className="bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs h-8"
                            >
                              {actionLoading === vendor.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(vendor, "rejected")}
                              disabled={actionLoading === vendor.id}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs h-8"
                            >
                              <XCircle className="w-3 h-3 mr-1" />Reject
                            </Button>
                          </div>
                        )}
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