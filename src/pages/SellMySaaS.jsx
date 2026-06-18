import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Upload, Info, CheckCircle, Loader2, AlertCircle, Store, Clock, FileText, Percent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AIValuationTool from "@/components/marketplace/AIValuationTool";
import PlanLimitGuard from "@/components/PlanLimitGuard";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const CATEGORIES = ["CRM", "AI & ML", "Analytics", "E-commerce", "Marketing", "Productivity", "Finance"];

export default function SellMySaaS() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [revenueProofFile, setRevenueProofFile] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [marketplaceId, setMarketplaceId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedListing, setSubmittedListing] = useState(null);
  const [form, setForm] = useState({
    title: "", category: "CRM", description: "", sellerName: "",
    fullPrice: "", sharePrice: "", totalShares: "50",
    monthlyRevenue: "", monthlyExpenses: "", growthRate: "",
    features: "", auctionDuration: "",
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });
  const { canCreateListing } = usePlanLimits();

  const { data: approvedVendors = [] } = useQuery({
    queryKey: ["myApprovedVendors"],
    queryFn: () => base44.entities.Vendor.filter({ userId: currentUser?.id, status: "approved" }),
    enabled: !!currentUser?.id,
  });

  const updateForm = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!form.title.trim()) newErrors.title = "SaaS name is required";
      if (!form.description.trim()) newErrors.description = "Description is required";
      if (!form.sellerName.trim()) newErrors.sellerName = "Seller name is required";
    }
    if (stepNum === 2) {
      if (!form.fullPrice || parseFloat(form.fullPrice) <= 0) newErrors.fullPrice = "Full price is required";
      if (!form.sharePrice || parseFloat(form.sharePrice) <= 0) newErrors.sharePrice = "Share price is required";
      if (!form.monthlyRevenue || parseFloat(form.monthlyRevenue) <= 0) newErrors.monthlyRevenue = "Monthly revenue is required";
      if (form.monthlyExpenses === "" || parseFloat(form.monthlyExpenses) < 0) newErrors.monthlyExpenses = "Monthly expenses is required";
      if (!form.auctionDuration || parseInt(form.auctionDuration) < 1) newErrors.auctionDuration = "Auction duration is required";
      if (!form.totalShares || parseInt(form.totalShares) < 1) newErrors.totalShares = "Total shares is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (nextStep) => {
    const currentStep = nextStep - 1;
    if (validateStep(currentStep)) setStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      toast.error("Please complete all required pricing fields before submitting.");
      setStep(2);
      return;
    }
    // Backend validation - security check
    try {
      const validation = await base44.functions.invoke("validatePlanLimits", { resourceType: "listing" });
      if (!validation.allowed) {
        toast.error(validation.message || "Plan limit reached. Please upgrade your plan.");
        return;
      }
    } catch (e) {
      toast.error("Failed to validate plan limits");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const auctionDurationMs = (parseInt(form.auctionDuration) || 7) * 86400000;
      const auctionEndsAt = new Date(Date.now() + auctionDurationMs).toISOString();

      // Check if admin approval is required
      let status = "pending";
      try {
        const admins = await base44.entities.User.filter({ role: "admin" }, null, 1);
        if (admins.length > 0) {
          status = admins[0].requireListingApproval === false ? "active" : "pending";
        }
      } catch { /* fallback to pending */ }

      let proofUrls = [];
      if (revenueProofFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: revenueProofFile });
        proofUrls = [file_url];
      }
      let productImages = [];
      if (productImageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: productImageFile });
        productImages = [file_url];
      }

      // Determine vendor and marketplace context
      let vendorId = null;
      let listingMarketplaceId = marketplaceId || null;
      if (approvedVendors.length > 0) {
        const vendor = listingMarketplaceId
          ? approvedVendors.find(v => v.marketplaceId === listingMarketplaceId)
          : approvedVendors[0];
        if (vendor) {
          vendorId = vendor.id;
          listingMarketplaceId = vendor.marketplaceId;
        }
      }

      const listing = await base44.entities.SaaSListing.create({
        softwareName: form.title,
        category: form.category,
        shortDescription: form.description?.slice(0, 200) || "",
        fullDescription: form.description || "",
        sellerName: form.sellerName,
        fullPrice: parseFloat(form.fullPrice) || 0,
        sharePrice: parseFloat(form.sharePrice) || 0,
        totalShares: parseInt(form.totalShares) || 50,
        monthlyRevenue: parseFloat(form.monthlyRevenue) || 0,
        monthlyExpenses: parseFloat(form.monthlyExpenses) || 0,
        growthRate: parseFloat(form.growthRate) || 0,
        features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : [],
        status,
        auctionEndsAt,
        ownerId: user.id,
        marketplaceId: listingMarketplaceId,
        vendorId,
        revenueProofFiles: proofUrls,
        screenshots: productImages,
        imageGradient: "from-orange-600 to-amber-600",
      });

      toast.success(status === "active"
        ? "Your SaaS listing is now live on the marketplace!"
        : "Your SaaS listing is submitted for admin approval."
      );
      // Notify admins of new listing
      if (status === "pending") {
        try {
          await base44.functions.invoke("notifyAdminNewListing", {
            listingTitle: form.title,
            listingId: listing.id,
            sellerName: form.sellerName,
          });
        } catch (_) {}
      }
      setSubmittedListing({ title: form.title, status });
      setShowSuccess(true);
    } catch (err) {
      toast.error("Failed to submit listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name) => errors[name] ? "border-red-500/50" : "";

  if (!canCreateListing) {
    return <PlanLimitGuard resource="listing" onBack={() => navigate(-1)} />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Sell My SaaS</h1>
        <p className="text-sm text-muted-foreground mt-1">List your SaaS business for full sale or fractional ownership.</p>
      </motion.div>

      {/* Multi-vendor marketplace selector */}
      {approvedVendors.length > 0 && (
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
          <Store className="w-5 h-5 text-violet-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-400">Approved Vendor</p>
            <p className="text-[11px] text-muted-foreground">
              {approvedVendors.length === 1
                ? `Listing on: ${approvedVendors[0].vendorName}`
                : "Select marketplace for this listing:"}
            </p>
          </div>
          {approvedVendors.length > 1 && (
            <select
              value={marketplaceId}
              onChange={(e) => setMarketplaceId(e.target.value)}
              className="bg-secondary/50 border border-border/30 rounded-lg px-2 py-1 text-xs"
            >
              <option value="">-- Select --</option>
              {approvedVendors.map((v) => (
                <option key={v.id} value={v.marketplaceId}>{v.vendorName}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step >= s ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : "bg-secondary/50 text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-orange-500" : "bg-secondary/50"}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-base font-display">SaaS Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">SaaS Name *</Label>
                <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g., Real Estate Agent SaaS" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("title")}`} />
                {errors.title && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                    <SelectTrigger className="w-full h-9 rounded-xl bg-secondary/50 border border-border/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Seller Name *</Label>
                  <Input value={form.sellerName} onChange={(e) => updateForm("sellerName", e.target.value)} placeholder="Your name or company" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("sellerName")}`} />
                  {errors.sellerName && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.sellerName}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Description *</Label>
                <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Describe your SaaS business..." className={`bg-secondary/50 border-border/30 rounded-xl h-24 ${fieldError("description")}`} />
                {errors.description && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Key Features (comma separated)</Label>
                <Textarea value={form.features} onChange={(e) => updateForm("features", e.target.value)} placeholder="Lead Management, Analytics, Email Integration" className="bg-secondary/50 border-border/30 rounded-xl h-20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Product Image / Screenshot</Label>
                <Input type="file" accept="image/*" onChange={(e) => setProductImageFile(e.target.files?.[0] || null)} className="bg-secondary/50 border-border/30 rounded-xl text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-orange-500/20 file:text-orange-400" />
                {productImageFile && <p className="text-[11px] text-emerald-400">Selected: {productImageFile.name}</p>}
              </div>
              <Button onClick={() => handleNext(2)} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">Next Step</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-base font-display">Pricing and Financials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Full Ownership Price ($) *</Label>
                  <Input type="number" value={form.fullPrice} onChange={(e) => updateForm("fullPrice", e.target.value)} placeholder="5000" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("fullPrice")}`} />
                  {errors.fullPrice && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fullPrice}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Price Per Share ($) *</Label>
                  <Input type="number" value={form.sharePrice} onChange={(e) => updateForm("sharePrice", e.target.value)} placeholder="100" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("sharePrice")}`} />
                  {errors.sharePrice && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.sharePrice}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Total Shares *</Label>
                  <Input type="number" value={form.totalShares} onChange={(e) => updateForm("totalShares", e.target.value)} placeholder="50" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("totalShares")}`} />
                  {errors.totalShares && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.totalShares}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Monthly Revenue ($) *</Label>
                  <Input type="number" value={form.monthlyRevenue} onChange={(e) => updateForm("monthlyRevenue", e.target.value)} placeholder="1200" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("monthlyRevenue")}`} />
                  {errors.monthlyRevenue && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.monthlyRevenue}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Monthly Expenses ($) *</Label>
                  <Input type="number" value={form.monthlyExpenses} onChange={(e) => updateForm("monthlyExpenses", e.target.value)} placeholder="300" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("monthlyExpenses")}`} />
                  {errors.monthlyExpenses && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.monthlyExpenses}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Growth Rate (%)</Label>
                  <Input type="number" value={form.growthRate} onChange={(e) => updateForm("growthRate", e.target.value)} placeholder="18" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Auction Duration (days) *</Label>
                  <Input type="number" value={form.auctionDuration} onChange={(e) => updateForm("auctionDuration", e.target.value)} placeholder="e.g., 7" className={`bg-secondary/50 border-border/30 rounded-xl ${fieldError("auctionDuration")}`} />
                  {errors.auctionDuration && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.auctionDuration}</p>}
                </div>
              </div>
              <AIValuationTool
                formData={form}
                onApplyValuation={({ fullPrice, sharePrice }) => {
                  updateForm("fullPrice", Math.round(fullPrice).toString());
                  updateForm("sharePrice", Math.round(sharePrice).toString());
                  toast.success("AI suggested prices applied!");
                }}
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="border-border/40 rounded-xl">Back</Button>
                <Button onClick={() => handleNext(3)} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">Next Step</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-base font-display">Review and Submit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-secondary/30 p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.title || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Category</span><span className="font-medium">{form.category}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Full Price</span><span className="font-medium">${Number(form.fullPrice || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Share Price × {form.totalShares} shares</span><span className="font-medium">${form.sharePrice || "0"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Monthly Revenue</span><span className="font-medium text-emerald-400">${Number(form.monthlyRevenue || 0).toLocaleString()}/mo</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Monthly Expenses</span><span className="font-medium text-red-400">${Number(form.monthlyExpenses || 0).toLocaleString()}/mo</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Auction Duration</span><span className="font-medium">{form.auctionDuration || 7} days</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Revenue Proof File</Label>
                <Input type="file" onChange={(e) => setRevenueProofFile(e.target.files?.[0] || null)} className="bg-secondary/50 border-border/30 rounded-xl text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-orange-500/20 file:text-orange-400" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="border-border/40 rounded-xl">Back</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  List My SaaS
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
        <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Listing Guidelines</p>
          All SaaS listings are reviewed within 24 hours. You must verify revenue through bank statements or payment processor screenshots. SaaSShare charges a 5% commission on completed sales.
        </div>
      </div>

      {/* Success Confirmation Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md border-border/40 bg-card/95 backdrop-blur-xl rounded-2xl p-0 overflow-hidden">
          {/* Success Gradient Bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
          
          <div className="p-6 pt-5 space-y-5">
            <DialogHeader className="space-y-3">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <DialogTitle className="text-center font-display text-lg">
                {submittedListing?.status === "active" ? "Your SaaS is Live! 🎉" : "Submitted for Review"}
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                {submittedListing?.status === "active"
                  ? `"${submittedListing?.title}" is now live on the marketplace.`
                  : `"${submittedListing?.title}" has been submitted successfully.`}
              </DialogDescription>
            </DialogHeader>

            {/* Info Cards */}
            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">24-Hour Review</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All listings are reviewed by our team within 24 hours.</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Revenue Verification</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Provide bank statements or payment processor screenshots to verify your revenue.</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">5% Commission</p>
                  <p className="text-xs text-muted-foreground mt-0.5">SaaSShare charges a 5% commission on each completed sale.</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-border/40 rounded-xl"
                onClick={() => {
                  setShowSuccess(false);
                  setStep(1);
                  setForm({ title: "", category: "CRM", description: "", sellerName: "", fullPrice: "", sharePrice: "", totalShares: "50", monthlyRevenue: "", monthlyExpenses: "", growthRate: "", features: "", auctionDuration: "" });
                  setRevenueProofFile(null);
                  setProductImageFile(null);
                }}
              >
                List Another
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl"
                onClick={() => {
                  setShowSuccess(false);
                  navigate("/investments");
                }}
              >
                <ArrowRight className="w-4 h-4 mr-1.5" />
                View My Investments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}