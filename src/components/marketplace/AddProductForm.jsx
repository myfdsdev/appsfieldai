import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Package, DollarSign, Image, Rocket, Save, Plus, X,
  Clock, Users, ShoppingCart, Layers, Info, KeyRound, Link2, Share2, MousePointerClick
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import MediaPickerModal from "@/components/marketplace/MediaPickerModal";
import PromotionKitEditor from "@/components/marketplace/PromotionKitEditor";

const TABS = [
  { id: "details", label: "Details", icon: Package },
  { id: "deal", label: "Deal Setup", icon: DollarSign },
  { id: "media", label: "Media & Features", icon: Image },
  { id: "affiliate", label: "Affiliate", icon: Share2 },
  { id: "publish", label: "Publish", icon: Rocket },
];

const GRADIENTS = [
  "from-violet-600 to-indigo-600",
  "from-orange-500 to-rose-500",
  "from-emerald-500 to-teal-500",
  "from-blue-600 to-cyan-500",
  "from-pink-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-slate-600 to-slate-800",
  "from-red-500 to-pink-500",
];

export default function AddProductForm({ marketplaceId, listing, onClose, categories = [] }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [screenshotInput, setScreenshotInput] = useState("");
  const [screenshotPicker, setScreenshotPicker] = useState(false);

  const isEditing = !!listing?.id;

  const [form, setForm] = useState({
    softwareName: "",
    shortDescription: "",
    fullDescription: "",
    category: "",
    dealType: "group_deal",
    price: 0,
    sharePrice: 0,
    totalShares: 10,
    noDayLimit: false,
    dealDurationDays: 7,
    dealStatus: "live",
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    growthRate: 0,
    logo: "",
    screenshots: [],
    demoVideoUrl: "",
    features: [],
    tags: [],
    imageGradient: GRADIENTS[0],
    sellerName: "",
    pricingType: "paid",
    status: "pending",
    isBestSeller: false,
    isLifetimeDeal: false,
    usageLimits: "",
    supportInfo: "",
    refundPolicy: "",
    redemptionInstructions: "",
    delivery: { accessUrl: "", instructions: "" },
    customButton: { enabled: false, label: "", url: "", openInNewTab: true },
    affiliateEnabled: false,
    affiliateCommissionRate: 30,
    affiliateCommissionRule: "",
    promotionKit: { images: [], videos: [], emailSwipes: [], llmDescription: "" },
  });

  useEffect(() => {
    if (listing) {
      setForm({
        softwareName: listing.softwareName || "",
        shortDescription: listing.shortDescription || "",
        fullDescription: listing.fullDescription || "",
        category: listing.category || "",
        dealType: listing.dealType || "group_deal",
        price: listing.price || 0,
        sharePrice: listing.sharePrice || 0,
        totalShares: listing.totalShares || 10,
        noDayLimit: listing.noDayLimit || false,
        dealDurationDays: listing.dealDurationDays || 7,
        dealStatus: listing.dealStatus || "live",
        monthlyRevenue: listing.monthlyRevenue || 0,
        monthlyExpenses: listing.monthlyExpenses || 0,
        growthRate: listing.growthRate || 0,
        logo: listing.logo || "",
        screenshots: listing.screenshots || [],
        demoVideoUrl: listing.demoVideoUrl || "",
        features: listing.features || [],
        tags: listing.tags || [],
        imageGradient: listing.imageGradient || GRADIENTS[0],
        sellerName: listing.sellerName || "",
        pricingType: listing.pricingType || "paid",
        status: listing.status || "pending",
        isBestSeller: listing.isBestSeller || false,
        isLifetimeDeal: listing.isLifetimeDeal || false,
        usageLimits: listing.usageLimits || "",
        supportInfo: listing.supportInfo || "",
        refundPolicy: listing.refundPolicy || "",
        redemptionInstructions: listing.redemptionInstructions || "",
        delivery: {
          accessUrl: listing.delivery?.accessUrl || "",
          instructions: listing.delivery?.instructions || "",
        },
        customButton: {
          enabled: listing.customButton?.enabled || false,
          label: listing.customButton?.label || "",
          url: listing.customButton?.url || "",
          openInNewTab: listing.customButton?.openInNewTab ?? true,
        },
        affiliateEnabled: listing.affiliateEnabled || false,
        affiliateCommissionRate: listing.affiliateCommissionRate ?? 30,
        affiliateCommissionRule: listing.affiliateCommissionRule || "",
        promotionKit: {
          images: listing.promotionKit?.images || [],
          videos: listing.promotionKit?.videos || [],
          emailSwipes: listing.promotionKit?.emailSwipes || [],
          llmDescription: listing.promotionKit?.llmDescription || "",
        },
      });
    }
  }, [listing]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Auto-calculate share price when total price or total spots changes
  const handlePriceChange = (totalPrice) => {
    update("price", totalPrice);
    if (form.totalShares > 0) update("sharePrice", Math.round((totalPrice / form.totalShares) * 100) / 100);
  };

  const handleSpotsChange = (spots) => {
    update("totalShares", spots);
    if (form.price > 0 && spots > 0) update("sharePrice", Math.round((form.price / spots) * 100) / 100);
  };

  const addFeature = () => {
    if (featureInput.trim() && !form.features.includes(featureInput.trim())) {
      update("features", [...form.features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      update("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addScreenshot = () => {
    if (screenshotInput.trim()) {
      update("screenshots", [...form.screenshots, screenshotInput.trim()]);
      setScreenshotInput("");
    }
  };

  const handleSave = async (asDraft = false) => {
    if (!form.softwareName.trim()) { toast.error("Software name is required"); return; }
    setSaving(true);

    const dealEndDate = form.noDayLimit ? null : new Date(Date.now() + form.dealDurationDays * 86400000).toISOString();

    const payload = {
      ...form,
      marketplaceId,
      dealStartDate: new Date().toISOString(),
      dealEndDate,
      soldShares: listing?.soldShares || 0,
      status: asDraft ? "draft" : (isEditing ? form.status : "pending"),
    };

    if (isEditing) {
      await base44.entities.SaaSListing.update(listing.id, payload);
      toast.success("Product updated!");
    } else {
      const user = await base44.auth.me();
      payload.ownerId = user.id;
      payload.sellerName = payload.sellerName || user.full_name || "Anonymous";
      await base44.entities.SaaSListing.create(payload);
      toast.success("Product created!");
    }

    queryClient.invalidateQueries({ queryKey: ["softwareListings", marketplaceId] });
    setSaving(false);
    onClose();
  };

  const categoryList = categories.length > 0
    ? categories.map(c => c.name || c)
    : ["AI & ML", "CRM", "Analytics", "E-commerce", "Marketing", "Productivity", "Finance", "Developer Tools", "Design Tools"];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-display font-bold">{isEditing ? "Edit Product" : "Add New Product"}</h2>
          <p className="text-xs text-muted-foreground">Configure your SaaS deal listing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-6 space-y-5">

        {/* TAB: Details */}
        {activeTab === "details" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Software Name *</label>
              <Input value={form.softwareName} onChange={e => update("softwareName", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="e.g. SuperCRM Pro" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Short Description</label>
              <Input value={form.shortDescription} onChange={e => update("shortDescription", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="One-line tagline for the product" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Full Description</label>
              <Textarea value={form.fullDescription} onChange={e => update("fullDescription", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-28" placeholder="Detailed description of the software..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  <option value="">Select category</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Seller Name</label>
                <Input value={form.sellerName} onChange={e => update("sellerName", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="Your name or company" />
              </div>
            </div>

            {/* Product Delivery */}
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-semibold">Product Delivery</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Access info sent to the customer once you mark their order as delivered.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Product Access URL</label>
                  <Input value={form.delivery.accessUrl} onChange={e => update("delivery", { ...form.delivery, accessUrl: e.target.value })} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="https://app.yoursoftware.com/access" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Access Instructions</label>
                  <Textarea value={form.delivery.instructions} onChange={e => update("delivery", { ...form.delivery, instructions: e.target.value })} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-20" placeholder="Login details, license key, redemption steps..." />
                </div>
              </div>
            </div>

            {/* Buyer-facing policies — shown clearly on the product page */}
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-semibold">What Buyers See</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Displayed on the product page so buyers know exactly what's included.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Plan Limits</label>
                  <Input value={form.usageLimits} onChange={e => update("usageLimits", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="e.g. 5 users, 10,000 credits/mo, 3 seats" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Support Included</label>
                  <Input value={form.supportInfo} onChange={e => update("supportInfo", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="e.g. Email support, 24h response" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Refund Policy</label>
                  <Textarea value={form.refundPolicy} onChange={e => update("refundPolicy", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-16" placeholder="e.g. 7-day money-back guarantee, no questions asked" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Redemption Instructions</label>
                  <Textarea value={form.redemptionInstructions} onChange={e => update("redemptionInstructions", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-16" placeholder="How the buyer activates access after purchase" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: Deal Setup */}
        {activeTab === "deal" && (
          <>
            {/* Deal Type */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Deal Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "group_deal", icon: Users, label: "Group Deal", desc: "Split cost among multiple buyers" },
                  { id: "single_purchase", icon: ShoppingCart, label: "Single Purchase", desc: "One buyer pays full price" },
                  { id: "both", icon: Layers, label: "Both Options", desc: "Group deal + single buy option" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => update("dealType", opt.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.dealType === opt.id ? "border-orange-500 bg-orange-500/10" : "border-border/40 hover:border-border"}`}>
                    <opt.icon className={`w-5 h-5 mb-1.5 ${form.dealType === opt.id ? "text-orange-400" : "text-muted-foreground"}`} />
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Button — redirect URL instead of the default Buy button */}
            <div className="p-4 rounded-xl border-2 border-orange-500/30 bg-orange-500/5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.customButton.enabled} onChange={e => update("customButton", { ...form.customButton, enabled: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-orange-400" />
                  <div>
                    <p className="text-sm font-semibold">Custom Button (redirect to a URL)</p>
                    <p className="text-[10px] text-muted-foreground">Replace the default Buy button with your own button that opens any link — an external offer or landing page</p>
                  </div>
                </div>
              </label>

              {form.customButton.enabled && (
                <div className="space-y-3 mt-3 pt-3 border-t border-orange-500/20">
                  <div>
                    <label className="text-xs text-muted-foreground">Button Label</label>
                    <Input value={form.customButton.label} onChange={e => update("customButton", { ...form.customButton, label: e.target.value })} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="e.g. Check Our Offer" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Redirect URL</label>
                    <Input value={form.customButton.url} onChange={e => update("customButton", { ...form.customButton, url: e.target.value })} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="https://yourbrand.com/offer" />
                  </div>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <input type="checkbox" checked={form.customButton.openInNewTab} onChange={e => update("customButton", { ...form.customButton, openInNewTab: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">Open in a new tab</p>
                      <p className="text-[10px] text-muted-foreground">Keep the store open when the button is clicked</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Total Price ($)</label>
                <Input type="number" value={form.price} onChange={e => handlePriceChange(parseFloat(e.target.value) || 0)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
              </div>
              {(form.dealType === "group_deal" || form.dealType === "both") && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Total Spots</label>
                    <Input type="number" value={form.totalShares} onChange={e => handleSpotsChange(parseInt(e.target.value) || 1)} min={1} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
                  </div>
                </>
              )}
            </div>

            {(form.dealType === "group_deal" || form.dealType === "both") && (
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-medium">Price per spot: <span className="font-bold">${form.sharePrice}</span></span>
                  <span className="text-muted-foreground">× {form.totalShares} spots = ${form.price}</span>
                </div>
              </div>
            )}

            {/* Deal Duration */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Deal Duration</label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors mb-3">
                <input type="checkbox" checked={form.noDayLimit} onChange={e => update("noDayLimit", e.target.checked)} className="accent-orange-500" />
                <div>
                  <p className="text-sm font-medium">No time limit</p>
                  <p className="text-[10px] text-muted-foreground">Deal stays open until all spots are filled</p>
                </div>
              </label>
              {!form.noDayLimit && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input type="number" value={form.dealDurationDays} onChange={e => update("dealDurationDays", parseInt(e.target.value) || 1)} min={1} className="bg-secondary/50 border-border/30 rounded-xl w-24" />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Listing Badges</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input type="checkbox" checked={form.isBestSeller} onChange={e => update("isBestSeller", e.target.checked)} className="accent-orange-500 w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium">🏆 Best Seller</p>
                    <p className="text-[10px] text-muted-foreground">Show this listing on the Best Sellers page</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input type="checkbox" checked={form.isLifetimeDeal} onChange={e => update("isLifetimeDeal", e.target.checked)} className="accent-orange-500 w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium">♾️ Lifetime Deal</p>
                    <p className="text-[10px] text-muted-foreground">Show this listing on the Lifetime Deals page</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Monthly Revenue ($)</label>
                <Input type="number" value={form.monthlyRevenue} onChange={e => update("monthlyRevenue", parseFloat(e.target.value) || 0)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Monthly Expenses ($)</label>
                <Input type="number" value={form.monthlyExpenses} onChange={e => update("monthlyExpenses", parseFloat(e.target.value) || 0)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Growth Rate (%)</label>
                <Input type="number" value={form.growthRate} onChange={e => update("growthRate", parseFloat(e.target.value) || 0)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
              </div>
            </div>

          </>
        )}

        {/* TAB: Media & Features */}
        {activeTab === "media" && (
          <>
            {/* Card Gradient */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Card Background</label>
              <div className="flex gap-2 flex-wrap">
                {GRADIENTS.map(g => (
                  <button key={g} onClick={() => update("imageGradient", g)}
                    className={`w-14 h-10 rounded-lg bg-gradient-to-br ${g} transition-all ${form.imageGradient === g ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`} />
                ))}
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="text-xs text-muted-foreground">Logo</label>
              <div className="mt-1">
                <R2ImageUpload value={form.logo} onChange={v => update("logo", v)} campaignId="product-logo" />
              </div>
            </div>

            {/* Screenshots */}
            <div>
              <label className="text-xs text-muted-foreground">Screenshots</label>
              <div className="flex gap-2 mt-1">
                <Input value={screenshotInput} onChange={e => setScreenshotInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addScreenshot()} className="bg-secondary/50 border-border/30 rounded-xl" placeholder="Paste image URL" />
                <Button onClick={() => setScreenshotPicker(true)} variant="outline" className="rounded-xl border-border/40 shrink-0 gap-1.5 text-xs"><Image className="w-4 h-4" /> Browse</Button>
                <Button onClick={addScreenshot} variant="outline" size="icon" className="rounded-xl border-border/40"><Plus className="w-4 h-4" /></Button>
              </div>
              {form.screenshots.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.screenshots.map((s, i) => (
                    <div key={i} className="relative group">
                      <img src={s} alt="" className="w-16 h-12 rounded-lg object-cover border border-border/30" />
                      <button onClick={() => update("screenshots", form.screenshots.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demo Video */}
            <div>
              <label className="text-xs text-muted-foreground">Demo Video</label>
              <div className="mt-1">
                <R2ImageUpload value={form.demoVideoUrl} onChange={v => update("demoVideoUrl", v)} campaignId="product-video" accept="video/*" placeholder="https://youtube.com/... or pick a video" />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="text-xs text-muted-foreground">Key Features</label>
              <div className="flex gap-2 mt-1">
                <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addFeature()} className="bg-secondary/50 border-border/30 rounded-xl" placeholder="Add a feature" />
                <Button onClick={addFeature} variant="outline" size="icon" className="rounded-xl border-border/40"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-400" onClick={() => update("features", form.features.filter((_, j) => j !== i))}>
                    {f} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs text-muted-foreground">Tags</label>
              <div className="flex gap-2 mt-1">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} className="bg-secondary/50 border-border/30 rounded-xl" placeholder="Add a tag" />
                <Button onClick={addTag} variant="outline" size="icon" className="rounded-xl border-border/40"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] cursor-pointer hover:bg-red-500/10 hover:text-red-400" onClick={() => update("tags", form.tags.filter((_, j) => j !== i))}>
                    {t} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB: Affiliate */}
        {activeTab === "affiliate" && (
          <>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
              <input type="checkbox" checked={form.affiliateEnabled} onChange={e => update("affiliateEnabled", e.target.checked)} className="accent-orange-500 w-4 h-4" />
              <div>
                <p className="text-sm font-medium">Open for affiliates</p>
                <p className="text-[10px] text-muted-foreground">Let approved affiliates promote this product and earn commission</p>
              </div>
            </label>

            {form.affiliateEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Commission Rate (%)</label>
                    <Input type="number" value={form.affiliateCommissionRate} onChange={e => update("affiliateCommissionRate", parseFloat(e.target.value) || 0)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="30" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Commission Rules / Notes</label>
                  <Textarea value={form.affiliateCommissionRule} onChange={e => update("affiliateCommissionRule", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-16" placeholder="e.g. Paid after 14-day refund window, minimum $50 payout, no incentivized traffic" />
                </div>

                <div className="pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-4 h-4 text-orange-400" />
                    <p className="text-sm font-semibold">Promotion Kit</p>
                  </div>
                  <PromotionKitEditor value={form.promotionKit} onChange={v => update("promotionKit", v)} />
                </div>
              </>
            )}
          </>
        )}

        {/* TAB: Publish */}
        {activeTab === "publish" && (
          <>
            <h3 className="text-base font-display font-semibold">Review Your Listing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase">Product</p>
                <p className="text-sm font-medium">{form.softwareName || "—"}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase">Category</p>
                <p className="text-sm font-medium">{form.category || "—"}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase">Deal Type</p>
                <p className="text-sm font-medium capitalize">{form.dealType.replace(/_/g, " ")}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase">Total Price</p>
                <p className="text-sm font-medium">${form.price.toLocaleString()}</p>
              </div>
              {(form.dealType !== "single_purchase") && (
                <>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Per Spot</p>
                    <p className="text-sm font-medium text-orange-400">${form.sharePrice}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Total Spots</p>
                    <p className="text-sm font-medium">{form.totalShares}</p>
                  </div>
                </>
              )}
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                <p className="text-sm font-medium">{form.noDayLimit ? "No limit" : `${form.dealDurationDays} days`}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase">Features</p>
                <p className="text-sm font-medium">{form.features.length} features</p>
              </div>
            </div>

            {/* Card Preview */}
            <div className="p-4 rounded-xl border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase mb-2">Card Preview</p>
              <div className={`h-24 rounded-xl bg-gradient-to-br ${form.imageGradient} flex items-center justify-center`}>
                <span className="text-white font-display font-bold text-lg drop-shadow-lg">{form.softwareName || "Product Name"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => handleSave(true)} variant="outline" disabled={saving} className="flex-1 border-border/40 rounded-xl">
                <Save className="w-4 h-4 mr-1.5" /> Save as Draft
              </Button>
              <Button onClick={() => handleSave(false)} disabled={saving} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white border-0">
                <Rocket className="w-4 h-4 mr-1.5" /> {isEditing ? "Update & Publish" : "Submit for Review"}
              </Button>
            </div>
          </>
        )}

        {/* Bottom Navigation (except Publish tab) */}
        {activeTab !== "publish" && (
          <div className="pt-4 border-t border-border/30 flex justify-between">
            <Button variant="outline" onClick={onClose} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={() => {
              const idx = TABS.findIndex(t => t.id === activeTab);
              if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
            }} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white border-0">
              Next Step
            </Button>
          </div>
        )}
      </motion.div>

      <MediaPickerModal
        open={screenshotPicker}
        onClose={() => setScreenshotPicker(false)}
        onSelect={(url) => update("screenshots", [...form.screenshots, url])}
        campaignId="product-screenshot"
        defaultTab="image"
      />
    </div>
  );
}