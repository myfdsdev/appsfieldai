import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Palette, Tag, Settings, Globe, Mail, Shield, FileText, ArrowLeft, Save, Sparkles } from "lucide-react";
import DomainManager from "@/components/marketplace/DomainManager";
import DealMakerSettings from "@/components/marketplace/DealMakerSettings";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import StoreStylePicker from "@/components/store/StoreStylePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "style", label: "Store Style", icon: Sparkles },
  { id: "domain", label: "Domain", icon: Globe },
  { id: "dealmaker", label: "Deal Maker", icon: Sparkles },
  { id: "pages", label: "Legal Pages", icon: FileText },
  { id: "policies", label: "Approvals", icon: Shield },
];

export default function MarketplaceSettings({ marketplace, onBack }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: marketplace?.name || "",
    slug: marketplace?.slug || "",
    type: marketplace?.type || "single_vendor",
    currency: marketplace?.currency || "USD",
    timezone: marketplace?.timezone || "UTC",
    supportEmail: marketplace?.supportEmail || "",
    branding: {
      logo: marketplace?.branding?.logo || "",
      favicon: marketplace?.branding?.favicon || "",
      primaryColor: marketplace?.branding?.primaryColor || "#7c3aed",
      accentColor: marketplace?.branding?.accentColor || "#06b6d4",
    },
    settings: {
      requireListingApproval: marketplace?.settings?.requireListingApproval ?? true,
      requireVendorApproval: marketplace?.settings?.requireVendorApproval ?? true,
      requireSoftwareApproval: marketplace?.settings?.requireSoftwareApproval ?? true,
      requireReviewApproval: marketplace?.settings?.requireReviewApproval ?? false,
      allowAuctions: marketplace?.settings?.allowAuctions ?? false,
      allowBidding: marketplace?.settings?.allowBidding ?? true,
      commissionRate: marketplace?.settings?.commissionRate ?? 0,
      termsPage: marketplace?.settings?.termsPage || "",
      privacyPage: marketplace?.settings?.privacyPage || "",
      refundPolicy: marketplace?.settings?.refundPolicy || "",
    },
    pageSections: {
      ...(marketplace?.pageSections || {}),
      dealMakerEnabled: marketplace?.pageSections?.dealMakerEnabled ?? true,
      dealMakerName: marketplace?.pageSections?.dealMakerName || "",
      dealMakerOwnerName: marketplace?.pageSections?.dealMakerOwnerName || "",
      dealMakerNiche: marketplace?.pageSections?.dealMakerNiche || "",
      dealMakerGuarantee: marketplace?.pageSections?.dealMakerGuarantee || "",
      dealMakerGreeting: marketplace?.pageSections?.dealMakerGreeting || "",
      dealMakerKnowledge: marketplace?.pageSections?.dealMakerKnowledge || "",
    },
  });

  const update = (field, value) => setForm(d => ({ ...d, [field]: value }));
  const updateBranding = (field, value) => setForm(d => ({ ...d, branding: { ...d.branding, [field]: value } }));
  const updateSettings = (field, value) => setForm(d => ({ ...d, settings: { ...d.settings, [field]: value } }));
  const updatePageSections = (field, value) => setForm(d => ({ ...d, pageSections: { ...d.pageSections, [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Marketplace.update(marketplace.id, form);
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    setSaving(false);
    toast.success("Settings saved!");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h2 className="text-xl font-display font-bold">{marketplace?.name} Settings</h2>
          <p className="text-xs text-muted-foreground">{marketplace?.slug}.yourdomain.com</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><Icon className="w-4 h-4" />{tab.label}</button>
          );
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-6 space-y-4">

        {/* General Tab */}
        {activeTab === "general" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground">Marketplace Name</label><Input value={form.name} onChange={e => update("name", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">URL Slug</label><Input value={form.slug} onChange={e => update("slug", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <select value={form.type} onChange={e => update("type", e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  <option value="single_vendor">Single Vendor</option><option value="multi_vendor">Multi-Vendor</option>
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Currency</label>
                <select value={form.currency} onChange={e => update("currency", e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                  <option value="USD">USD ($)</option><option value="INR">INR (₹)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Timezone</label><Input value={form.timezone} onChange={e => update("timezone", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Support Email</label><Input value={form.supportEmail} onChange={e => update("supportEmail", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="support@example.com" /></div>
            </div>
          </>
        )}

        {/* Branding Tab */}
        {activeTab === "branding" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Logo</label>
                <div className="mt-1"><R2ImageUpload value={form.branding.logo} onChange={(url) => updateBranding("logo", url)} campaignId="store-logo" placeholder="https://..." /></div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Favicon</label>
                <div className="mt-1"><R2ImageUpload value={form.branding.favicon} onChange={(url) => updateBranding("favicon", url)} campaignId="store-favicon" placeholder="https://..." /></div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Primary Color</label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={form.branding.primaryColor} onChange={e => updateBranding("primaryColor", e.target.value)} className="w-12 h-10 p-0.5 bg-secondary/50 border-border/30 rounded-xl" />
                  <Input value={form.branding.primaryColor} onChange={e => updateBranding("primaryColor", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Accent Color</label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={form.branding.accentColor} onChange={e => updateBranding("accentColor", e.target.value)} className="w-12 h-10 p-0.5 bg-secondary/50 border-border/30 rounded-xl" />
                  <Input value={form.branding.accentColor} onChange={e => updateBranding("accentColor", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/30" style={{ background: `linear-gradient(135deg, ${form.branding.primaryColor}15, ${form.branding.accentColor}15)` }}>
              <p className="text-xs text-muted-foreground mb-2">Color Preview</p>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-xl" style={{ background: form.branding.primaryColor }} />
                <div className="w-10 h-10 rounded-xl" style={{ background: form.branding.accentColor }} />
                {form.branding.logo && <img src={form.branding.logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white" />}
              </div>
            </div>
          </>
        )}

        {/* Store Style Tab */}
        {activeTab === "style" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Each style completely changes your store's look — fonts, header size and product layout. Pick one, then save.</p>
            <StoreStylePicker value={form.pageSections.storeStyle} onChange={(slug) => updatePageSections("storeStyle", slug)} />
          </div>
        )}

        {/* Domain Tab */}
        {activeTab === "domain" && (
          <DomainManager marketplace={marketplace} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] })} />
        )}

        {/* Deal Maker Tab */}
        {activeTab === "dealmaker" && (
          <DealMakerSettings deal={form.pageSections} onChange={updatePageSections} />
        )}

        {/* Legal Pages Tab */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Terms & Conditions</label>
              <Textarea value={form.settings.termsPage} onChange={e => updateSettings("termsPage", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-32" placeholder="Write your terms & conditions..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Privacy Policy</label>
              <Textarea value={form.settings.privacyPage} onChange={e => updateSettings("privacyPage", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-32" placeholder="Write your privacy policy..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Refund Policy</label>
              <Textarea value={form.settings.refundPolicy} onChange={e => updateSettings("refundPolicy", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-32" placeholder="Write your refund policy..." />
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === "policies" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { key: "requireListingApproval", label: "Require Listing Approval", desc: "Review SaaS listings before they go live" },
                { key: "requireVendorApproval", label: "Require Vendor Approval", desc: "Approve vendors before they can list" },
                { key: "requireSoftwareApproval", label: "Require Software Approval", desc: "Verify software before listing" },
                { key: "requireReviewApproval", label: "Require Review Approval", desc: "Moderate user reviews" },
                { key: "allowAuctions", label: "Allow Auctions", desc: "Enable auction-style listings" },
                { key: "allowBidding", label: "Allow Bidding", desc: "Enable bidding on listings" },
              ].map(opt => (
                <label key={opt.key} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input type="checkbox" checked={!!form.settings[opt.key]} onChange={e => updateSettings(opt.key, e.target.checked)} className="mt-0.5 accent-violet-500" />
                  <div><p className="text-sm font-medium">{opt.label}</p><p className="text-[11px] text-muted-foreground">{opt.desc}</p></div>
                </label>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Commission Rate (%)</label>
              <Input type="number" value={form.settings.commissionRate} onChange={e => updateSettings("commissionRate", parseFloat(e.target.value) || 0)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 w-32" />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border/30 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl gap-1.5"><Save className="w-4 h-4" />Save Settings</Button>
        </div>
      </motion.div>
    </div>
  );
}