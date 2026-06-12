import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Plus, ExternalLink, AlertCircle, CheckCircle, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function VendorDashboard() {
  const navigate = useNavigate();

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
  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const rejectedVendors = vendors.filter((v) => v.status === "rejected");

  const { data: listings = [] } = useQuery({
    queryKey: ["myVendorListings"],
    queryFn: () => base44.entities.SaaSListing.filter({ ownerUserId: currentUser?.id }, "-created_date", 50),
    enabled: !!currentUser?.id,
  });

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Vendor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your vendor profiles and SaaS listings.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/vendor/register")} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5">
            <Plus className="w-4 h-4" /> Register on New Marketplace
          </Button>
        </div>
      </motion.div>

      {/* Status cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: "Approved", count: approvedVendors.length, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Pending", count: pendingVendors.length, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Rejected", count: rejectedVendors.length, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-4 rounded-xl bg-card/40 border border-border/40 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-lg font-display font-semibold">{item.count}</p>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approved vendor profiles */}
      {approvedVendors.length > 0 && (
        <div>
          <h3 className="text-base font-display font-semibold mb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-violet-400" /> Active Vendor Profiles
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {approvedVendors.map((v) => (
              <Card key={v.id} className="border-border/40 bg-card/60 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Store className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-display">{v.vendorName}</CardTitle>
                        <p className="text-[10px] text-muted-foreground">{v.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/sell")} size="sm" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-xs h-8">
                    <Plus className="w-3 h-3 mr-1" /> Submit New SaaS Listing
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Listings */}
      <div>
        <h3 className="text-base font-display font-semibold mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-400" /> My SaaS Listings
        </h3>
        {listings.length === 0 ? (
          <div className="text-center py-8 rounded-xl bg-card/40 border border-border/40">
            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No listings yet. Start by submitting your first SaaS product!</p>
            <Button onClick={() => navigate("/sell")} variant="outline" size="sm" className="mt-3 border-border/40 rounded-lg">
              <Plus className="w-3 h-3 mr-1" /> List a SaaS
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {listings.map((l) => (
              <Card key={l.id} className="border-border/40 bg-card/60 backdrop-blur-xl hover:border-violet-500/20 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-display">{l.title}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">{l.category}</p>
                    </div>
                    <Badge className={`text-[9px] border ${
                      l.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      l.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>{l.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/saas/${l.id}`)} className="h-7 text-[10px]">
                    <ExternalLink className="w-3 h-3 mr-1" /> View
                  </Button>
                  <p className="text-[11px] text-muted-foreground self-center ml-auto">${Number(l.fullPrice || 0).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending applications */}
      {pendingVendors.length > 0 && (
        <div>
          <h3 className="text-base font-display font-semibold mb-3 flex items-center gap-2 text-amber-400">
            <Clock className="w-4 h-4" /> Pending Applications
          </h3>
          <div className="space-y-2">
            {pendingVendors.map((v) => (
              <div key={v.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Store className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{v.vendorName}</p>
                  <p className="text-[10px] text-muted-foreground">Applied {new Date(v.appliedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}