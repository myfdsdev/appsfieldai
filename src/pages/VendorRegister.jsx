import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Mail, Phone, FileText, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import PlanLimitGuard, { usePlanLimits } from "@/components/PlanLimitGuard";

export default function VendorRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    marketplaceId: "",
    vendorName: "",
    email: "",
    phone: "",
    description: "",
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: marketplaces = [] } = useQuery({
    queryKey: ["multiVendorMarketplaces"],
    queryFn: () => base44.entities.Marketplace.filter({ type: "multi_vendor", status: "active" }),
  });
  const { canCreateVendor } = usePlanLimits();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.marketplaceId || !form.vendorName || !form.email) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    const payload = {
      marketplaceId: form.marketplaceId,
      userId: currentUser.id,
      vendorName: form.vendorName,
      email: form.email,
      phone: form.phone,
      description: form.description,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };
    await base44.entities.Vendor.create(payload);
    setLoading(false);
    setSubmitted(true);
    toast.success("Application submitted! Awaiting marketplace owner approval.");
  };

  if (!canCreateVendor) {
    return <PlanLimitGuard resource="vendor" onBack={() => navigate(-1)} />;
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        </motion.div>
        <h1 className="text-2xl font-display font-bold mb-2">Application Submitted!</h1>
        <p className="text-muted-foreground mb-6">The marketplace owner will review your vendor application. You'll be notified once it's approved.</p>
        <Button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-3 -ml-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-display font-bold">Become a Vendor</h1>
        <p className="text-sm text-muted-foreground mt-1">Register as a vendor on a multi-vendor marketplace to start selling your SaaS products.</p>
      </motion.div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-base font-display">Vendor Application</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {marketplaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No multi-vendor marketplaces available right now.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Select Marketplace *</label>
                <select
                  value={form.marketplaceId}
                  onChange={(e) => update("marketplaceId", e.target.value)}
                  className="w-full h-9 rounded-xl bg-secondary/50 border border-border/30 px-3 text-sm"
                >
                  <option value="">-- Choose a marketplace --</option>
                  {marketplaces.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.slug})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Business / Brand Name *</label>
                <Input value={form.vendorName} onChange={(e) => update("vendorName", e.target.value)} placeholder="e.g. DevTools Inc." className="bg-secondary/50 border-border/30 rounded-xl" />
              </div>
              <div className="flex gap-3">
                <div className="space-y-2 flex-1">
                  <label className="text-xs text-muted-foreground">Email *</label>
                  <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vendor@example.com" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 234 567 8900" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">About Your Business</label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell marketplace owners about your SaaS products and expertise..." className="bg-secondary/50 border-border/30 rounded-xl h-24" />
              </div>
              <Button onClick={handleSubmit} disabled={loading || !form.marketplaceId} className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Submit Application
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}