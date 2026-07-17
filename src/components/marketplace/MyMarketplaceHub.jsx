import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Layout, Package, Tag, Zap, Gavel, Receipt, Users, Settings,
  Save, Globe, Layers, MessageSquare, Image, ToggleLeft, ToggleRight, PanelBottom, Palette, FileText, HelpCircle, Tags, CreditCard, Mail, ShoppingBag, ShieldCheck, Code2, Share2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SoftwareManager from "@/components/marketplace/SoftwareManager";
import CouponManager from "@/components/marketplace/CouponManager";
import CategoryManager from "@/components/marketplace/CategoryManager";
import CustomerManager from "@/components/marketplace/CustomerManager";
import DomainManager from "@/components/marketplace/DomainManager";
import PublishThemeDialog from "@/components/marketplace/PublishThemeDialog";
import HeroSectionEditor from "@/components/marketplace/HeroSectionEditor";
import FaqSectionEditor from "@/components/marketplace/FaqSectionEditor";
import CustomPagesManager from "@/components/marketplace/CustomPagesManager";
import TestimonialsManager from "@/components/marketplace/TestimonialsManager";
import FooterPagesList from "@/components/marketplace/FooterPagesList";
import TrustBadgesEditor from "@/components/marketplace/TrustBadgesEditor";
import CustomBannerEditor from "@/components/marketplace/CustomBannerEditor";
import CustomCodeEditor from "@/components/marketplace/CustomCodeEditor";
import PaymentSettingsManager from "@/components/marketplace/PaymentSettingsManager";
import EmailSettingsManager from "@/components/marketplace/EmailSettingsManager";
import StoreOrderManager from "@/components/marketplace/StoreOrderManager";
import AffiliateProgramSettings from "@/components/marketplace/AffiliateProgramSettings";
import AffiliateApplicationsManager from "@/components/marketplace/AffiliateApplicationsManager";
import DealMakerSettings from "@/components/marketplace/DealMakerSettings";
import DealMakerReport from "@/components/marketplace/DealMakerReport";
import DealMakerLeads from "@/components/marketplace/DealMakerLeads";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import StoreStylePicker from "@/components/store/StoreStylePicker";

const LANGUAGES = [
  "English", "Mandarin Chinese", "Hindi", "Spanish", "French",
  "Arabic", "Bengali", "Russian", "Portuguese", "Urdu",
  "Indonesian", "German", "Japanese", "Turkish", "Korean"
];

const Toggle = ({ value, onChange }) => (
  <button onClick={e => { e.stopPropagation(); onChange(!value); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${value ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-secondary/50 text-muted-foreground border border-border/30"}`}>
    {value ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
    {value ? "Enabled" : "Disabled"}
  </button>
);

const SectionCard = ({ title, icon: Icon, enabled, onToggle, children }) => (
  <div className={`rounded-xl border transition-all ${enabled ? "border-orange-500/20 bg-orange-500/5" : "border-border/30 bg-secondary/20"}`}>
    <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? "bg-orange-500/20" : "bg-secondary/50"}`}>
          <Icon className={`w-4 h-4 ${enabled ? "text-orange-400" : "text-muted-foreground"}`} />
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <Toggle value={enabled} onChange={onToggle} />
    </div>
    {enabled && children && <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">{children}</div>}
  </div>
);

const NAV_GROUPS = [
  {
    label: "Page", items: [
      { id: "page_settings", label: "Page Settings", icon: Layout },
      { id: "store_style", label: "Store Style", icon: Palette },
      { id: "deal_maker", label: "Deal Maker Agent", icon: Sparkles },
      { id: "testimonials", label: "Testimonials", icon: MessageSquare },
      { id: "custom_pages", label: "Custom Pages", icon: FileText },
    ]
  },
  {
    label: "Products", items: [
      { id: "products", label: "Products", icon: Package },
      { id: "orders", label: "Orders", icon: ShoppingBag },
      { id: "categories", label: "Categories", icon: Tags },
      { id: "coupons", label: "Coupons", icon: Tag },
      { id: "deals", label: "Deals", icon: Zap },
      { id: "auctions", label: "Auctions", icon: Gavel },
      { id: "tax", label: "Tax Information", icon: Receipt },
      { id: "customers", label: "Customers", icon: Users },
      { id: "affiliates", label: "Affiliates", icon: Share2 },
    ]
  },
  {
    label: "Store", items: [
      { id: "domain", label: "Custom Domain", icon: Globe },
      { id: "payment", label: "Payment Settings", icon: CreditCard },
      { id: "email", label: "Email Settings", icon: Mail },
      { id: "store_settings", label: "Marketplace Settings", icon: Settings },
    ]
  }
];

export default function MyMarketplaceHub({ marketplace, onBack }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("page_settings");
  const [dealMakerSubTab, setDealMakerSubTab] = useState("settings");
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  // "Publish to Theme" is an admin-only capability.
  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const [pageForm, setPageForm] = useState({
    storeStyle: marketplace?.pageSections?.storeStyle || "",
    headerEnabled: marketplace?.pageSections?.headerEnabled ?? true,
    headerTitle: marketplace?.pageSections?.headerTitle || "",
    headerSubtitle: marketplace?.pageSections?.headerSubtitle || "",
    headerImageUrl: marketplace?.pageSections?.headerImageUrl || "",
    headerLogoUrl: marketplace?.pageSections?.headerLogoUrl || "",
    heroSideImageUrl: marketplace?.pageSections?.heroSideImageUrl || "",
    heroSideImagePosition: marketplace?.pageSections?.heroSideImagePosition || "right",
    heroBadgeText: marketplace?.pageSections?.heroBadgeText || "",
    heroCtaText: marketplace?.pageSections?.heroCtaText || "",
    heroBgType: marketplace?.pageSections?.heroBgType || "gradient",
    heroGradientStart: marketplace?.pageSections?.heroGradientStart || "",
    heroGradientEnd: marketplace?.pageSections?.heroGradientEnd || "",
    heroSolidColor: marketplace?.pageSections?.heroSolidColor || "",
    heroBgOpacity: marketplace?.pageSections?.heroBgOpacity ?? 100,
    productsEnabled: marketplace?.pageSections?.productsEnabled ?? true,
    productsSectionTitle: marketplace?.pageSections?.productsSectionTitle || "",
    testimonialsEnabled: marketplace?.pageSections?.testimonialsEnabled ?? false,
    testimonialsTitle: marketplace?.pageSections?.testimonialsTitle || "",
    faqEnabled: marketplace?.pageSections?.faqEnabled ?? false,
    faqTitle: marketplace?.pageSections?.faqTitle || "",
    faqs: marketplace?.pageSections?.faqs || [],
    customBoxesEnabled: marketplace?.pageSections?.customBoxesEnabled ?? false,
    customBannerEnabled: marketplace?.pageSections?.customBannerEnabled ?? false,
    customBannerImageUrl: marketplace?.pageSections?.customBannerImageUrl || "",
    customBannerTitle: marketplace?.pageSections?.customBannerTitle || "",
    customBannerSubtitle: marketplace?.pageSections?.customBannerSubtitle || "",
    customBannerTextPosition: marketplace?.pageSections?.customBannerTextPosition || "center",
    trustBadgesEnabled: marketplace?.pageSections?.trustBadgesEnabled ?? false,
    trustBadgesTitle: marketplace?.pageSections?.trustBadgesTitle || "",
    trustBadges: marketplace?.pageSections?.trustBadges || [],
    footerEnabled: marketplace?.pageSections?.footerEnabled ?? true,
    footerText: marketplace?.pageSections?.footerText || "",
    footerLogoUrl: marketplace?.pageSections?.footerLogoUrl || "",
    dealMakerEnabled: marketplace?.pageSections?.dealMakerEnabled ?? true,
    dealMakerName: marketplace?.pageSections?.dealMakerName || "",
    dealMakerImageUrl: marketplace?.pageSections?.dealMakerImageUrl || "",
    dealMakerTagline: marketplace?.pageSections?.dealMakerTagline || "",
    dealMakerOwnerName: marketplace?.pageSections?.dealMakerOwnerName || "",
    dealMakerNiche: marketplace?.pageSections?.dealMakerNiche || "",
    dealMakerGuarantee: marketplace?.pageSections?.dealMakerGuarantee || "",
    dealMakerGreeting: marketplace?.pageSections?.dealMakerGreeting || "",
    dealMakerKnowledge: marketplace?.pageSections?.dealMakerKnowledge || "",
    socialLinks: marketplace?.pageSections?.socialLinks || {},
    customCodeHead: marketplace?.pageSections?.customCodeHead || "",
    customCodeBody: marketplace?.pageSections?.customCodeBody || "",
  });

  const [storeForm, setStoreForm] = useState({
    name: marketplace?.name || "",
    slug: marketplace?.slug || "",
    storeLink: marketplace?.storeLink || "",
    subdomain: marketplace?.subdomain || "",
    customDomain: marketplace?.customDomain || "",
    language: marketplace?.language || "English",
    branding: {
      logo: marketplace?.branding?.logo || "",
      logoDark: marketplace?.branding?.logoDark || "",
      favicon: marketplace?.branding?.favicon || "",
    },
  });

  const [taxForm, setTaxForm] = useState({
    taxEnabled: marketplace?.taxInfo?.taxEnabled ?? false,
    taxName: marketplace?.taxInfo?.taxName || "",
    taxRate: marketplace?.taxInfo?.taxRate || 0,
    taxNumber: marketplace?.taxInfo?.taxNumber || "",
    taxCountry: marketplace?.taxInfo?.taxCountry || "",
    includeTaxInPrice: marketplace?.taxInfo?.includeTaxInPrice ?? false,
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ["hubListings", marketplace?.id],
    queryFn: () => base44.entities.SaaSListing.filter({ marketplaceId: marketplace?.id }),
    enabled: !!marketplace?.id && (activeTab === "deals" || activeTab === "auctions"),
  });

  const deals = allListings.filter(l => l.dealType === "group_deal" || l.dealType === "both");
  const auctions = allListings.filter(l => l.status === "auction");

  const handleSavePage = async () => {
    setSaving(true);
    await base44.entities.Marketplace.update(marketplace.id, { pageSections: pageForm });
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    toast.success("Page settings saved!");
    setSaving(false);
  };

  const handleSaveStore = async () => {
    setSaving(true);
    await base44.entities.Marketplace.update(marketplace.id, {
      name: storeForm.name,
      slug: storeForm.slug,
      storeLink: storeForm.storeLink,
      subdomain: storeForm.subdomain,
      customDomain: storeForm.customDomain,
      language: storeForm.language,
      branding: { ...marketplace.branding, ...storeForm.branding },
    });
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    toast.success("Marketplace settings saved!");
    setSaving(false);
  };

  const handleSaveTax = async () => {
    setSaving(true);
    await base44.entities.Marketplace.update(marketplace.id, { taxInfo: taxForm });
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    toast.success("Tax information saved!");
    setSaving(false);
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="space-y-4">
          <p className="text-xs font-semibold text-orange-400 truncate px-2">{marketplace?.name}</p>
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-1">{group.label}</p>
              {group.items.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all mb-0.5 ${activeTab === id ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

          {/* PAGE SETTINGS */}
          {activeTab === "page_settings" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Page Settings</h2>
              <p className="text-sm text-muted-foreground">Control which sections appear on your marketplace page.</p></div>
              <div className="space-y-3">
                <SectionCard title="Hero Section" icon={Image}
                  enabled={pageForm.headerEnabled} onToggle={() => setPageForm(f => ({ ...f, headerEnabled: !f.headerEnabled }))}>
                  <HeroSectionEditor form={pageForm} setForm={setPageForm} marketplace={marketplace} />
                </SectionCard>
                <SectionCard title="Product Sections" icon={Package}
                  enabled={pageForm.productsEnabled} onToggle={() => setPageForm(f => ({ ...f, productsEnabled: !f.productsEnabled }))}>
                  <div><label className="text-xs text-muted-foreground">Section Title</label><Input value={pageForm.productsSectionTitle} onChange={e => setPageForm(f => ({ ...f, productsSectionTitle: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="Featured Deals" /></div>
                </SectionCard>
                <SectionCard title="Testimonials" icon={MessageSquare}
                  enabled={pageForm.testimonialsEnabled} onToggle={() => setPageForm(f => ({ ...f, testimonialsEnabled: !f.testimonialsEnabled }))}>
                  <div><label className="text-xs text-muted-foreground">Section Title</label><Input value={pageForm.testimonialsTitle} onChange={e => setPageForm(f => ({ ...f, testimonialsTitle: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="What our customers say" /></div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-muted-foreground">Manage the customer quotes shown in this section.</p>
                    <Button onClick={() => setActiveTab("testimonials")} variant="outline" size="sm" className="border-border/40 rounded-lg gap-1.5 text-xs shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" /> Manage Testimonials
                    </Button>
                  </div>
                </SectionCard>
                <SectionCard title="FAQ Section" icon={HelpCircle}
                  enabled={pageForm.faqEnabled} onToggle={() => setPageForm(f => ({ ...f, faqEnabled: !f.faqEnabled }))}>
                  <FaqSectionEditor form={pageForm} setForm={setPageForm} />
                </SectionCard>
                <SectionCard title="Custom Section Boxes" icon={Layers}
                  enabled={pageForm.customBoxesEnabled} onToggle={() => setPageForm(f => ({ ...f, customBoxesEnabled: !f.customBoxesEnabled }))}>
                  <p className="text-xs text-muted-foreground">Custom content boxes can be managed from your Admin Hub.</p>
                </SectionCard>
                <SectionCard title="Custom Banner" icon={Image}
                  enabled={pageForm.customBannerEnabled} onToggle={() => setPageForm(f => ({ ...f, customBannerEnabled: !f.customBannerEnabled }))}>
                  <CustomBannerEditor form={pageForm} setForm={setPageForm} />
                </SectionCard>
                <SectionCard title="Trust & Policy Badges" icon={ShieldCheck}
                  enabled={pageForm.trustBadgesEnabled} onToggle={() => setPageForm(f => ({ ...f, trustBadgesEnabled: !f.trustBadgesEnabled }))}>
                  <TrustBadgesEditor form={pageForm} setForm={setPageForm} />
                </SectionCard>
                <SectionCard title="Footer" icon={PanelBottom}
                  enabled={pageForm.footerEnabled} onToggle={() => setPageForm(f => ({ ...f, footerEnabled: !f.footerEnabled }))}>
                  <div><label className="text-xs text-muted-foreground">Footer Text</label><Textarea value={pageForm.footerText} onChange={e => setPageForm(f => ({ ...f, footerText: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-20 resize-none" placeholder="© 2025 Your Store. All rights reserved." /></div>
                  <div>
                    <label className="text-xs text-muted-foreground">Footer Logo (optional — falls back to store logo)</label>
                    <div className="mt-1"><R2ImageUpload value={pageForm.footerLogoUrl} onChange={url => setPageForm(f => ({ ...f, footerLogoUrl: url }))} campaignId="store-footer-logo" placeholder="https://..." /></div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><Share2 className="w-3.5 h-3.5" /> Social Media Links</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"].map(key => (
                        <Input
                          key={key}
                          value={pageForm.socialLinks?.[key] || ""}
                          onChange={e => setPageForm(f => ({ ...f, socialLinks: { ...(f.socialLinks || {}), [key]: e.target.value } }))}
                          className="bg-secondary/50 border-border/30 rounded-xl text-xs"
                          placeholder={key.charAt(0).toUpperCase() + key.slice(1) + " URL"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-muted-foreground">Add custom pages (Privacy, Terms…) as footer links.</p>
                    <Button onClick={() => setActiveTab("custom_pages")} variant="outline" size="sm" className="border-border/40 rounded-lg gap-1.5 text-xs shrink-0">
                      <FileText className="w-3.5 h-3.5" /> Add Custom Page
                    </Button>
                  </div>
                  <FooterPagesList marketplaceId={marketplace?.id} />
                </SectionCard>

                {/* Custom Code — always available (no enable toggle needed; empty = nothing runs) */}
                <div className="rounded-xl border border-border/30 bg-secondary/20">
                  <div className="flex items-center gap-2.5 p-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">Custom Code (Pixels & Scripts)</span>
                      <p className="text-[11px] text-muted-foreground">FB / Google pixel, analytics, verification tags</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 border-t border-border/20 pt-3">
                    <CustomCodeEditor form={pageForm} setForm={setPageForm} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSavePage} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
                  <Save className="w-4 h-4" /> Save Page Settings
                </Button>
                {isAdmin && (
                  <Button onClick={() => setPublishOpen(true)} variant="outline" className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10 rounded-xl gap-1.5">
                    <Palette className="w-4 h-4" /> Publish to Theme
                  </Button>
                )}
              </div>
              {isAdmin && (
                <p className="text-[11px] text-muted-foreground">
                  Publishing saves these sections as a reusable store theme template you can apply to other stores later.
                </p>
              )}
            </div>
          )}

          {/* STORE STYLE */}
          {activeTab === "store_style" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Store Style</h2>
              <p className="text-sm text-muted-foreground">Pick a complete visual style — it changes your fonts, header size and product layout. Save to apply it live.</p></div>
              <StoreStylePicker value={pageForm.storeStyle} onChange={(slug) => setPageForm(f => ({ ...f, storeStyle: slug }))} />
              <Button onClick={handleSavePage} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
                <Save className="w-4 h-4" /> Save Store Style
              </Button>
            </div>
          )}

          {/* DEAL MAKER AGENT */}
          {activeTab === "deal_maker" && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-display font-bold">Deal Maker Agent</h2>
                  <p className="text-sm text-muted-foreground">Train the AI sales closer that greets visitors, matches them to products and captures leads.</p>
                </div>
                <SectionCard title="Enabled on store" icon={Sparkles}
                  enabled={pageForm.dealMakerEnabled}
                  onToggle={() => setPageForm(f => ({ ...f, dealMakerEnabled: !f.dealMakerEnabled }))} />
              </div>

              {/* Sub-tabs: Settings / Report */}
              <div className="flex items-center gap-2 border-b border-border/40">
                {[
                  { id: "settings", label: "Settings", icon: Settings },
                  { id: "report", label: "Deal Maker Report", icon: MessageSquare },
                  { id: "leads", label: "Leads", icon: Users },
                ].map(({ id, label, icon: TabIcon }) => (
                  <button
                    key={id}
                    onClick={() => setDealMakerSubTab(id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      dealMakerSubTab === id ? "border-orange-500 text-orange-400" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {dealMakerSubTab === "settings" && (
                <>
                  <div className="bg-card/60 border border-border/40 rounded-2xl p-6">
                    <DealMakerSettings deal={pageForm} onChange={(field, value) => setPageForm(f => ({ ...f, [field]: value }))} />
                  </div>
                  <Button onClick={handleSavePage} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
                    <Save className="w-4 h-4" /> Save Deal Maker
                  </Button>
                </>
              )}

              {dealMakerSubTab === "report" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Every visitor conversation with your Deal Maker, with captured details and an AI conclusion.</p>
                  <DealMakerReport marketplaceId={marketplace?.id} />
                </div>
              )}

              {dealMakerSubTab === "leads" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Every lead captured across chats, custom-build requests and checkout — buyers are marked as customers, hot prospects as potential buyers.</p>
                  <DealMakerLeads marketplaceId={marketplace?.id} />
                </div>
              )}
            </div>
          )}

          {/* TESTIMONIALS */}
          {activeTab === "testimonials" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Testimonials</h2>
              <p className="text-sm text-muted-foreground">Add and manage customer quotes shown in your store's testimonials section.</p></div>
              <TestimonialsManager marketplaceId={marketplace?.id} />
            </div>
          )}

          {/* CUSTOM PAGES */}
          {activeTab === "custom_pages" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Custom Pages</h2>
              <p className="text-sm text-muted-foreground">Create store pages like Privacy Policy, Terms of Service, and more.</p></div>
              <CustomPagesManager marketplaceId={marketplace?.id} />
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === "products" && (
            <div><h2 className="text-lg font-display font-bold mb-4">Products</h2>
            <SoftwareManager marketplaceId={marketplace?.id} /></div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Orders</h2>
              <p className="text-sm text-muted-foreground">Store orders placed through the cart and checkout.</p></div>
              <StoreOrderManager marketplaceId={marketplace?.id} />
            </div>
          )}

          {/* CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Categories</h2>
              <p className="text-sm text-muted-foreground">Add or remove product categories shown on your store page.</p></div>
              <CategoryManager marketplaceId={marketplace?.id} />
            </div>
          )}

          {/* COUPONS */}
          {activeTab === "coupons" && (
            <div><h2 className="text-lg font-display font-bold mb-4">Coupons</h2>
            <CouponManager marketplaceId={marketplace?.id} /></div>
          )}

          {/* DEALS */}
          {activeTab === "deals" && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-bold">Group Deals</h2>
              {deals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No group deals yet. Create products with Group Deal type.</p>
                </div>
              ) : deals.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/60">
                  <div><p className="text-sm font-medium">{d.softwareName}</p>
                  <p className="text-xs text-muted-foreground">{d.soldShares || 0}/{d.totalShares} spots sold · ${d.sharePrice}/spot</p></div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${d.dealStatus === "live" ? "bg-emerald-500/10 text-emerald-400" : d.dealStatus === "funded" ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground"}`}>{d.dealStatus || "live"}</span>
                </div>
              ))}
            </div>
          )}

          {/* AUCTIONS */}
          {activeTab === "auctions" && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-bold">Auctions</h2>
              {auctions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
                  <Gavel className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No auctions running. Set a product status to "auction" to start one.</p>
                </div>
              ) : auctions.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/60">
                  <div><p className="text-sm font-medium">{a.softwareName}</p>
                  <p className="text-xs text-muted-foreground">Ends {a.auctionEndsAt ? new Date(a.auctionEndsAt).toLocaleDateString() : "—"}</p></div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-medium">Auction</span>
                </div>
              ))}
            </div>
          )}

          {/* TAX */}
          {activeTab === "tax" && (
            <div className="space-y-5">
              <h2 className="text-lg font-display font-bold">Tax Information</h2>
              <div className="bg-card/60 border border-border/40 rounded-2xl p-6 space-y-4">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input type="checkbox" checked={taxForm.taxEnabled} onChange={e => setTaxForm(f => ({ ...f, taxEnabled: e.target.checked }))} className="accent-orange-500 w-4 h-4" />
                  <div><p className="text-sm font-medium">Enable Tax Collection</p><p className="text-[11px] text-muted-foreground">Add tax to purchases on this marketplace</p></div>
                </label>
                {taxForm.taxEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-muted-foreground">Tax Name</label><Input value={taxForm.taxName} onChange={e => setTaxForm(f => ({ ...f, taxName: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="VAT, GST, Sales Tax..." /></div>
                    <div><label className="text-xs text-muted-foreground">Tax Rate (%)</label><Input type="number" value={taxForm.taxRate} onChange={e => setTaxForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                    <div><label className="text-xs text-muted-foreground">Tax / Business Number</label><Input value={taxForm.taxNumber} onChange={e => setTaxForm(f => ({ ...f, taxNumber: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="e.g. GST123456" /></div>
                    <div><label className="text-xs text-muted-foreground">Country</label><Input value={taxForm.taxCountry} onChange={e => setTaxForm(f => ({ ...f, taxCountry: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="India, US, UK..." /></div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50">
                        <input type="checkbox" checked={taxForm.includeTaxInPrice} onChange={e => setTaxForm(f => ({ ...f, includeTaxInPrice: e.target.checked }))} className="accent-orange-500 w-4 h-4" />
                        <div><p className="text-sm font-medium">Include tax in displayed price</p><p className="text-[11px] text-muted-foreground">Tax shown as included rather than added at checkout</p></div>
                      </label>
                    </div>
                  </div>
                )}
                <Button onClick={handleSaveTax} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
                  <Save className="w-4 h-4" /> Save Tax Settings
                </Button>
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {activeTab === "customers" && (
            <div><h2 className="text-lg font-display font-bold mb-4">Customers</h2>
            <CustomerManager marketplaceId={marketplace?.id} /></div>
          )}

          {/* AFFILIATES */}
          {activeTab === "affiliates" && (
            <div className="space-y-5">
              <div><h2 className="text-lg font-display font-bold">Affiliates</h2>
              <p className="text-sm text-muted-foreground">Configure your affiliate program and review who applies to promote your products.</p></div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Program Settings</p>
                <AffiliateProgramSettings marketplace={marketplace} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Applications</p>
                <AffiliateApplicationsManager marketplaceId={marketplace?.id} />
              </div>
            </div>
          )}

          {/* CUSTOM DOMAIN */}
          {activeTab === "domain" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Custom Domain</h2>
              <p className="text-sm text-muted-foreground">Connect your own domain or use a free subdomain.</p></div>
              <DomainManager marketplace={marketplace} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] })} />
            </div>
          )}

          {/* PAYMENT SETTINGS */}
          {activeTab === "payment" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Payment Settings</h2>
              <p className="text-sm text-muted-foreground">Configure how customers pay on your store — PayPal and Cash on Delivery.</p></div>
              <PaymentSettingsManager marketplace={marketplace} />
            </div>
          )}

          {/* EMAIL SETTINGS */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-display font-bold">Email Settings</h2>
              <p className="text-sm text-muted-foreground">Set up your SMTP server and customize transactional email templates.</p></div>
              <EmailSettingsManager marketplace={marketplace} />
            </div>
          )}

          {/* STORE SETTINGS */}
          {activeTab === "store_settings" && (
            <div className="space-y-5">
              <h2 className="text-lg font-display font-bold">Marketplace Settings</h2>
              <div className="bg-card/60 border border-border/40 rounded-2xl p-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Store Identity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-muted-foreground">Store Name</label><Input value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                    <div><label className="text-xs text-muted-foreground">Store Slug</label><Input value={storeForm.slug} onChange={e => setStoreForm(f => ({ ...f, slug: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                    <div>
                      <label className="text-xs text-muted-foreground">Store Logo (Light Mode)</label>
                      <div className="mt-1"><R2ImageUpload value={storeForm.branding.logo} onChange={url => setStoreForm(f => ({ ...f, branding: { ...f.branding, logo: url } }))} campaignId="store-logo" placeholder="https://..." /></div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Store Logo (Dark Mode)</label>
                      <div className="mt-1"><R2ImageUpload value={storeForm.branding.logoDark} onChange={url => setStoreForm(f => ({ ...f, branding: { ...f.branding, logoDark: url } }))} campaignId="store-logo-dark" placeholder="https://..." /></div>
                      <p className="text-[11px] text-muted-foreground mt-1">Falls back to the light logo if empty.</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Favicon</label>
                      <div className="mt-1"><R2ImageUpload value={storeForm.branding.favicon} onChange={url => setStoreForm(f => ({ ...f, branding: { ...f.branding, favicon: url } }))} campaignId="store-favicon" placeholder="https://..." /></div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Domain & Links</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-muted-foreground">Store Link</label><Input value={storeForm.storeLink} onChange={e => setStoreForm(f => ({ ...f, storeLink: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="https://mystore.com" /></div>
                    <div><label className="text-xs text-muted-foreground">Custom Domain</label><Input value={storeForm.customDomain} onChange={e => setStoreForm(f => ({ ...f, customDomain: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="deals.mybrand.com" /></div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Subdomain</label>
                      <div className="flex items-center mt-1">
                        <Input value={storeForm.subdomain} onChange={e => setStoreForm(f => ({ ...f, subdomain: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-r-none rounded-l-xl" placeholder="mystore" />
                        <span className="bg-secondary border border-l-0 border-border/30 rounded-r-xl px-3 h-9 flex items-center text-xs text-muted-foreground">.saasshare.app</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Localization</p>
                  <div className="max-w-xs">
                    <label className="text-xs text-muted-foreground">Store Language</label>
                    <select value={storeForm.language} onChange={e => setStoreForm(f => ({ ...f, language: e.target.value }))} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={handleSaveStore} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
                  <Save className="w-4 h-4" /> Save Settings
                </Button>
              </div>
            </div>
          )}

        </motion.div>
      </div>

      <PublishThemeDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        marketplace={marketplace}
        pageSections={pageForm}
      />
    </div>
  );
}