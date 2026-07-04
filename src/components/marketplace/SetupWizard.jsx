import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Store, Palette, Tag, Settings, Rocket, Check, Type, ChevronLeft, ChevronRight, Plus, X, Building2, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BuildingStoreOverlay from "@/components/marketplace/BuildingStoreOverlay";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

const TEMPLATES = [
  { id: "default", name: "Standard", desc: "Clean, professional layout for SaaS marketplaces", gradient: "from-violet-600 to-cyan-600", primaryColor: "#7c3aed", accentColor: "#06b6d4" },
  { id: "minimal", name: "Minimal", desc: "Lightweight, fast-loading design", gradient: "from-slate-600 to-slate-800", primaryColor: "#475569", accentColor: "#1e293b" },
  { id: "bold", name: "Bold", desc: "Vibrant colors and striking typography", gradient: "from-orange-500 to-rose-500", primaryColor: "#f97316", accentColor: "#f43f5e" },
  { id: "enterprise", name: "Enterprise", desc: "Corporate-grade with advanced layouts", gradient: "from-blue-600 to-indigo-600", primaryColor: "#2563eb", accentColor: "#4f46e5" },
];

const PRESET_CATEGORIES = ["CRM", "Analytics", "Marketing", "AI & ML", "Dev Tools", "Design", "Finance", "HR", "Security", "E-commerce", "Productivity", "Communication"];

const steps = [
  { id: "type", label: "Type", icon: Building2 },
  { id: "template", label: "Template", icon: Palette },
  { id: "branding", label: "Branding", icon: Type },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "review", label: "Review", icon: Check },
];

export default function SetupWizard({ marketplace, onComplete, onCancel }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);

  // Real platform domain (e.g. saasshare.app) for the store URL preview, set by the admin.
  const { data: platformDomain } = useQuery({
    queryKey: ["platformDomain"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getPlatformDomain", {});
      return res.data?.platformDomain || "yourdomain.com";
    },
    staleTime: Infinity,
  });
  const [data, setData] = useState({
    type: marketplace?.type || "single_vendor",
    template: marketplace?.template || "default",
    name: marketplace?.name || "",
    slug: marketplace?.slug || "",
    description: marketplace?.description || "",
    branding: {
      primaryColor: marketplace?.branding?.primaryColor || "#7c3aed",
      accentColor: marketplace?.branding?.accentColor || "#06b6d4",
      logo: marketplace?.branding?.logo || "",
      favicon: marketplace?.branding?.favicon || "",
    },
    categories: marketplace?.categories || [],
    customCategory: "",
    settings: {
      requireListingApproval: marketplace?.settings?.requireListingApproval ?? true,
      requireVendorApproval: marketplace?.settings?.requireVendorApproval ?? true,
      requireSoftwareApproval: marketplace?.settings?.requireSoftwareApproval ?? true,
    },
    supportEmail: marketplace?.supportEmail || "",
    currency: marketplace?.currency || "USD",
    timezone: marketplace?.timezone || "UTC",
    payment: {
      paypalEnabled: marketplace?.payment?.paypalEnabled ?? false,
      paypalEmail: marketplace?.payment?.paypalEmail || "",
    },
  });

  const update = (field, value) => setData(d => ({ ...d, [field]: value }));
  const updateBranding = (field, value) => setData(d => ({ ...d, branding: { ...d.branding, [field]: value } }));
  const updateSettings = (field, value) => setData(d => ({ ...d, settings: { ...d.settings, [field]: value } }));
  const updatePayment = (field, value) => setData(d => ({ ...d, payment: { ...d.payment, [field]: value } }));

  // Picking a template applies its color theme to the branding.
  const selectTemplate = (t) => {
    update("template", t.id);
    setData(d => ({ ...d, branding: { ...d.branding, primaryColor: t.primaryColor, accentColor: t.accentColor } }));
  };

  const addCategory = () => {
    const cat = data.customCategory.trim();
    if (cat && !data.categories.includes(cat)) {
      update("categories", [...data.categories, cat]);
      update("customCategory", "");
    }
  };
  const toggleCategory = (cat) => {
    if (data.categories.includes(cat)) update("categories", data.categories.filter(c => c !== cat));
    else update("categories", [...data.categories, cat]);
  };
  const removeCategory = (cat) => update("categories", data.categories.filter(c => c !== cat));

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      type: data.type,
      template: data.template,
      description: data.description,
      branding: data.branding,
      categories: data.categories,
      settings: data.settings,
      supportEmail: data.supportEmail,
      currency: data.currency,
      timezone: data.timezone,
      payment: data.payment,
      status: "active",
    };
    if (marketplace?.id) {
      await base44.entities.Marketplace.update(marketplace.id, payload);
    } else {
      setBuilding(true);
      // Inherit the global default store page content for new marketplaces
      let pageSections;
      try {
        const defaults = await base44.entities.StorePageDefault.filter({ key: "default" });
        pageSections = defaults?.[0]?.pageSections;
      } catch { /* no default configured — skip */ }
      // Seed the hero theme colors from the chosen branding so the new store's
      // hero matches the selected color theme out of the box.
      const seededPageSections = {
        ...(pageSections || {}),
        heroBgType: "gradient",
        heroGradientStart: `${data.branding.primaryColor}33`,
        heroGradientEnd: "#0a0603",
      };
      const created = await base44.entities.Marketplace.create({
        ...payload,
        pageSections: seededPageSections,
        name: data.name,
        slug: data.slug,
        ownerId: (await base44.auth.me()).id,
      });
      // Auto-build store content (hero copy, FAQs, testimonials, product import) from the description.
      if (data.description.trim()) {
        try {
          await base44.functions.invoke("autoBuildStore", { marketplaceId: created.id });
        } catch (err) {
          console.error("autoBuildStore failed:", err);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    setSaving(false);
    setBuilding(false);
    toast.success(marketplace?.id ? "Marketplace updated!" : "Marketplace launched!");
    onComplete?.();
  };

  const nextStep = () => step < steps.length - 1 && setStep(step + 1);
  const prevStep = () => step > 0 && setStep(step - 1);
  const CurrentIcon = steps[step].icon;

  return (
    <div className="max-w-3xl mx-auto">
      {building && <BuildingStoreOverlay storeName={data.name} />}
      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < step;
          const isCurrent = i === step;
          return (
            <React.Fragment key={s.id}>
              <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isDone ? "bg-violet-500/10 text-violet-400 cursor-pointer" : isCurrent ? "bg-violet-600 text-white" : "bg-secondary/50 text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{s.label}
              </button>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-violet-500/30" : "bg-border"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-6">

          {/* Step 0: Type */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-violet-400" />Choose Marketplace Type</h3>
              <div className="grid grid-cols-2 gap-4">
                {[{ id: "single_vendor", icon: Store, label: "Single Vendor", desc: "You sell your own SaaS products directly" }, { id: "multi_vendor", icon: Users, label: "Multi-Vendor", desc: "Allow other sellers to list SaaS products" }].map(opt => (
                  <button key={opt.id} onClick={() => update("type", opt.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${data.type === opt.id ? "border-violet-500 bg-violet-500/10" : "border-border/40 hover:border-border"}`}>
                    <opt.icon className={`w-8 h-8 mb-2 ${data.type === opt.id ? "text-violet-400" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {!marketplace?.id && (
                <>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div><label className="text-xs text-muted-foreground">Name</label><Input value={data.name} onChange={e => { update("name", e.target.value); update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="My SaaS Store" /></div>
                    <div><label className="text-xs text-muted-foreground">Slug</label><Input value={data.slug} onChange={e => update("slug", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="my-saas-store" /></div>
                  </div>
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                    <div className="flex items-center gap-2">
                      <img src="https://media.base44.com/images/public/6a2402b3a9b98ed1e7bf2a16/137122e9e_ai.png" alt="Marketplace Agent" className="w-7 h-7 object-contain shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-violet-400 leading-tight">Marketplace Agent</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">AI-powered store builder</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 mb-2">Describe your marketplace in a sentence or two and the Marketplace Agent will use it to auto-build your store — crafting a compelling headline, FAQs, testimonials, and matching the right products for you.</p>
                    <Textarea value={data.description} onChange={e => update("description", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl h-20 resize-none" placeholder="e.g. A marketplace for AI & marketing SaaS lifetime deals aimed at indie founders and small agencies..." />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 1: Template */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-violet-400" />Choose Template</h3>
              <div className="grid grid-cols-2 gap-4">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => selectTemplate(t)} className={`p-4 rounded-xl border-2 text-left transition-all ${data.template === t.id ? "border-violet-500 bg-violet-500/10" : "border-border/40 hover:border-border"}`}>
                    <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${t.gradient} mb-2 flex items-center justify-center`}><span className="text-white font-display font-bold text-sm">{t.name}</span></div>
                    <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
              {/* Heading preview for the chosen template */}
              {(() => {
                const tpl = TEMPLATES.find(t => t.id === data.template);
                if (!tpl) return null;
                return (
                  <div className="rounded-xl border border-border/30 overflow-hidden">
                    <p className="text-xs text-muted-foreground px-4 pt-3">Heading Preview</p>
                    <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${data.branding.primaryColor}26, ${data.branding.accentColor}26)` }}>
                      <span className="inline-block text-[10px] font-medium px-2.5 py-1 rounded-full mb-2" style={{ background: `${data.branding.primaryColor}33`, color: data.branding.primaryColor }}>{tpl.name} Theme</span>
                      <h2 className="text-2xl font-display font-bold" style={{ color: data.branding.primaryColor }}>{data.name || "Your Marketplace"}</h2>
                      <p className="text-xs text-muted-foreground mt-1">Discover the best SaaS lifetime deals</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2"><Type className="w-5 h-5 text-violet-400" />Branding</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Primary Color</label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" value={data.branding.primaryColor} onChange={e => updateBranding("primaryColor", e.target.value)} className="w-12 h-10 p-0.5 bg-secondary/50 border-border/30 rounded-xl" />
                    <Input value={data.branding.primaryColor} onChange={e => updateBranding("primaryColor", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Accent Color</label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" value={data.branding.accentColor} onChange={e => updateBranding("accentColor", e.target.value)} className="w-12 h-10 p-0.5 bg-secondary/50 border-border/30 rounded-xl" />
                    <Input value={data.branding.accentColor} onChange={e => updateBranding("accentColor", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Logo</label>
                  <div className="mt-1">
                    <R2ImageUpload value={data.branding.logo} onChange={(url) => updateBranding("logo", url)} campaignId="store-logo" placeholder="https://example.com/logo.png" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Favicon</label>
                  <div className="mt-1">
                    <R2ImageUpload value={data.branding.favicon} onChange={(url) => updateBranding("favicon", url)} campaignId="store-favicon" placeholder="https://example.com/favicon.png" />
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border/30" style={{ background: `linear-gradient(135deg, ${data.branding.primaryColor}15, ${data.branding.accentColor}15)` }}>
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg" style={{ background: data.branding.primaryColor }} />
                  <div className="w-8 h-8 rounded-lg" style={{ background: data.branding.accentColor }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2"><Tag className="w-5 h-5 text-violet-400" />Select Categories</h3>
              <div className="flex gap-2">
                <Input value={data.customCategory} onChange={e => update("customCategory", e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} className="bg-secondary/50 border-border/30 rounded-xl" placeholder="Add a custom category" />
                <Button onClick={addCategory} variant="outline" className="border-border/40 rounded-xl"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.categories.map(c => (
                  <span key={c} onClick={() => removeCategory(c)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors">{c}<X className="w-3 h-3" /></span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Suggested categories:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_CATEGORIES.filter(c => !data.categories.includes(c)).map(c => (
                  <button key={c} onClick={() => toggleCategory(c)} className="px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground text-xs hover:bg-violet-500/10 hover:text-violet-400 transition-colors">{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2"><Settings className="w-5 h-5 text-violet-400" />Marketplace Settings</h3>
              <div className="space-y-3">
                {[
                  { key: "requireListingApproval", label: "Require listing approval", desc: "Review SaaS listings before they go live" },
                  { key: "requireSoftwareApproval", label: "Require software approval", desc: "Verify software before it can be listed" },
                ].map(opt => (
                  <label key={opt.key} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <input type="checkbox" checked={!!data.settings[opt.key]} onChange={e => updateSettings(opt.key, e.target.checked)} className="mt-0.5 accent-violet-500" />
                    <div><p className="text-sm font-medium">{opt.label}</p><p className="text-[11px] text-muted-foreground">{opt.desc}</p></div>
                  </label>
                ))}
              </div>

              {/* Vendor settings — only relevant for multi-vendor marketplaces */}
              <AnimatePresence initial={false}>
                {data.type === "multi_vendor" && (
                  <motion.div
                    key="vendor-settings"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-400" />
                        <p className="text-sm font-semibold">Vendor Settings</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">Vendor</span>
                      </div>
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <input type="checkbox" checked={!!data.settings.requireVendorApproval} onChange={e => updateSettings("requireVendorApproval", e.target.checked)} className="mt-0.5 accent-violet-500" />
                        <div><p className="text-sm font-medium">Require vendor approval</p><p className="text-[11px] text-muted-foreground">Approve vendors before they can list products</p></div>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Store Payment Settings */}
              <div className="rounded-xl border border-border/30 bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-400" />
                  <p className="text-sm font-semibold">Store Payment Settings</p>
                </div>
                <label className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input type="checkbox" checked={!!data.payment.paypalEnabled} onChange={e => updatePayment("paypalEnabled", e.target.checked)} className="mt-0.5 accent-violet-500" />
                  <div><p className="text-sm font-medium">Enable PayPal</p><p className="text-[11px] text-muted-foreground">Accept payments from customers via PayPal</p></div>
                </label>
                {data.payment.paypalEnabled && (
                  <div>
                    <label className="text-xs text-muted-foreground">PayPal Email</label>
                    <Input value={data.payment.paypalEmail} onChange={e => updatePayment("paypalEmail", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="payments@yourstore.com" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Support Email</label><Input value={data.supportEmail} onChange={e => update("supportEmail", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="support@example.com" /></div>
                <div><label className="text-xs text-muted-foreground">Currency</label>
                  <select value={data.currency} onChange={e => update("currency", e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                    <option value="USD">USD ($)</option><option value="INR">INR (₹)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2"><Check className="w-5 h-5 text-emerald-400" />Review & Launch</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-secondary/30"><p className="text-[10px] text-muted-foreground uppercase">Type</p><p className="font-medium">{data.type === "multi_vendor" ? "Multi-Vendor" : "Single Vendor"}</p></div>
                <div className="p-3 rounded-xl bg-secondary/30"><p className="text-[10px] text-muted-foreground uppercase">Template</p><p className="font-medium capitalize">{data.template}</p></div>
                <div className="p-3 rounded-xl bg-secondary/30"><p className="text-[10px] text-muted-foreground uppercase">Categories</p><p className="font-medium">{data.categories.length || "None"}</p></div>
                <div className="p-3 rounded-xl bg-secondary/30"><p className="text-[10px] text-muted-foreground uppercase">Currency</p><p className="font-medium">{data.currency}</p></div>
              </div>
              {!marketplace?.id && (
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-sm font-medium text-violet-400"><Rocket className="w-4 h-4 inline mr-1" />{data.name}</p>
                  <p className="text-[11px] text-muted-foreground">{data.slug}.{platformDomain || "yourdomain.com"}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border/30">
            <Button variant="outline" onClick={onCancel} className="border-border/40 rounded-xl">Cancel</Button>
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" onClick={prevStep} className="border-border/40 rounded-xl gap-1"><ChevronLeft className="w-4 h-4" />Back</Button>}
              {step < steps.length - 1 ? (
                <Button onClick={nextStep} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1">Next<ChevronRight className="w-4 h-4" /></Button>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1"><Rocket className="w-4 h-4" />{marketplace?.id ? "Save & Close" : "Launch Marketplace"}</Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}