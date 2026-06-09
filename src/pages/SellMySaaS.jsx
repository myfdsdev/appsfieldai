import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, DollarSign, Info, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AIValuationTool from "@/components/marketplace/AIValuationTool";

const CATEGORIES = ["CRM", "AI & ML", "Analytics", "E-commerce", "Marketing", "Productivity", "Finance"];

export default function SellMySaaS() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revenueProofFile, setRevenueProofFile] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [form, setForm] = useState({
    title: "", category: "CRM", description: "", sellerName: "",
    fullPrice: "", sharePrice: "", totalShares: "50",
    monthlyRevenue: "", monthlyExpenses: "", growthRate: "",
    features: "", auctionDuration: "7",
  });

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const auctionDurationMs = (parseInt(form.auctionDuration) || 7) * 86400000;
      const auctionEndsAt = new Date(Date.now() + auctionDurationMs).toISOString();

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

      await base44.entities.SaaSListing.create({
        title: form.title,
        category: form.category,
        description: form.description,
        sellerName: form.sellerName,
        fullPrice: parseFloat(form.fullPrice) || 0,
        sharePrice: parseFloat(form.sharePrice) || 0,
        totalShares: parseInt(form.totalShares) || 50,
        monthlyRevenue: parseFloat(form.monthlyRevenue) || 0,
        monthlyExpenses: parseFloat(form.monthlyExpenses) || 0,
        growthRate: parseFloat(form.growthRate) || 0,
        features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : [],
        status: "pending",
        auctionEndsAt,
        ownerUserId: user.id,
        revenueProofFiles: proofUrls,
        images: productImages,
        imageGradient: "from-violet-600 to-purple-700",
      });

      setSubmitted(true);
      toast.success("Your SaaS listing is submitted for admin approval.");
    } catch (err) {
      toast.error("Failed to submit listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-display font-bold">Listing Submitted!</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">Your SaaS listing is submitted for admin approval. It will appear in the marketplace once approved.</p>
        <Button className="mt-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl" onClick={() => { setSubmitted(false); setStep(1); setForm({ title: "", category: "CRM", description: "", sellerName: "", fullPrice: "", sharePrice: "", totalShares: "50", monthlyRevenue: "", monthlyExpenses: "", growthRate: "", features: "", auctionDuration: "7" }); setRevenueProofFile(null); setProductImageFile(null); }}>
          List Another SaaS
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Sell My SaaS</h1>
        <p className="text-sm text-muted-foreground mt-1">List your SaaS business for full sale or fractional ownership.</p>
      </motion.div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step >= s ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white" : "bg-secondary/50 text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-violet-500" : "bg-secondary/50"}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-base font-display">SaaS Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">SaaS Name</Label>
                <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g., Real Estate Agent SaaS" className="bg-secondary/50 border-border/30 rounded-xl" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <select value={form.category} onChange={(e) => updateForm("category", e.target.value)} className="w-full h-9 rounded-xl bg-secondary/50 border border-border/30 px-3 text-sm">
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Seller Name</Label>
                  <Input value={form.sellerName} onChange={(e) => updateForm("sellerName", e.target.value)} placeholder="Your name or company" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Describe your SaaS business..." className="bg-secondary/50 border-border/30 rounded-xl h-24" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Key Features (comma separated)</Label>
                <Input value={form.features} onChange={(e) => updateForm("features", e.target.value)} placeholder="Lead Management, Analytics, Email Integration" className="bg-secondary/50 border-border/30 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Product Image / Screenshot</Label>
                <Input type="file" accept="image/*" onChange={(e) => setProductImageFile(e.target.files?.[0] || null)} className="bg-secondary/50 border-border/30 rounded-xl text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-violet-500/20 file:text-violet-400" />
              </div>
              <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Next Step</Button>
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
                  <Label className="text-xs">Full Ownership Price ($)</Label>
                  <Input type="number" value={form.fullPrice} onChange={(e) => updateForm("fullPrice", e.target.value)} placeholder="5000" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Price Per Share ($)</Label>
                  <Input type="number" value={form.sharePrice} onChange={(e) => updateForm("sharePrice", e.target.value)} placeholder="100" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Total Shares</Label>
                  <Input type="number" value={form.totalShares} onChange={(e) => updateForm("totalShares", e.target.value)} placeholder="50" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Monthly Revenue ($)</Label>
                  <Input type="number" value={form.monthlyRevenue} onChange={(e) => updateForm("monthlyRevenue", e.target.value)} placeholder="1200" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Monthly Expenses ($)</Label>
                  <Input type="number" value={form.monthlyExpenses} onChange={(e) => updateForm("monthlyExpenses", e.target.value)} placeholder="300" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Growth Rate (%)</Label>
                  <Input type="number" value={form.growthRate} onChange={(e) => updateForm("growthRate", e.target.value)} placeholder="18" className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Auction Duration (days)</Label>
                  <Input type="number" value={form.auctionDuration} onChange={(e) => updateForm("auctionDuration", e.target.value)} placeholder="7" className="bg-secondary/50 border-border/30 rounded-xl" />
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
                <Button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Next Step</Button>
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
                <Input type="file" onChange={(e) => setRevenueProofFile(e.target.files?.[0] || null)} className="bg-secondary/50 border-border/30 rounded-xl text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-violet-500/20 file:text-violet-400" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="border-border/40 rounded-xl">Back</Button>
                <Button onClick={handleSubmit} disabled={loading || !form.title} className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  List My SaaS
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-start gap-3 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
        <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Listing Guidelines</p>
          All SaaS listings are reviewed within 24 hours. You must verify revenue through bank statements or payment processor screenshots. SaaSShare charges a 5% commission on completed sales.
        </div>
      </div>
    </div>
  );
}