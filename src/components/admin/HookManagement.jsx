import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Image, Upload, Trash2, Sparkles, Save, RotateCcw, Check, 
  Palette, LayoutTemplate, Type, Monitor, ShoppingCart, Gavel,
  Search, Filter, Grid3X3, List, Plus, X, Eye, Download
} from "lucide-react";
import { toast } from "sonner";

export default function HookManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("marketplace");
  const [formData, setFormData] = useState({
    heroSettings: {},
    marketplaceSettings: {},
    liveAuctionSettings: {},
    listingCardSettings: {},
    imageLibrary: []
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStyle, setAiStyle] = useState("dark_saaS");
  const [aiAspectRatio, setAiAspectRatio] = useState("16:9");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);
  const [targetField, setTargetField] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const { data: presets, isLoading } = useQuery({
    queryKey: ["contentPresetSettings"],
    queryFn: async () => {
      const items = await base44.entities.ContentPresetSettings.list();
      return items[0] || null;
    }
  });

  useEffect(() => {
    if (presets) {
      setFormData({
        heroSettings: presets.heroSettings || getDefaultHeroSettings(),
        marketplaceSettings: presets.marketplaceSettings || getDefaultMarketplaceSettings(),
        liveAuctionSettings: presets.liveAuctionSettings || getDefaultAuctionSettings(),
        listingCardSettings: presets.listingCardSettings || getDefaultCardSettings(),
        imageLibrary: presets.imageLibrary || []
      });
    } else {
      setFormData({
        heroSettings: getDefaultHeroSettings(),
        marketplaceSettings: getDefaultMarketplaceSettings(),
        liveAuctionSettings: getDefaultAuctionSettings(),
        listingCardSettings: getDefaultCardSettings(),
        imageLibrary: []
      });
    }
  }, [presets]);

  const getDefaultHeroSettings = () => ({
    badge: "Welcome to the Marketplace",
    headline: "Discover & Invest in Premium SaaS Businesses",
    subheadline: "Your gateway to profitable digital assets",
    description: "Browse curated SaaS listings, join live auctions, and acquire profitable businesses with transparent financials and verified revenue.",
    primaryButtonText: "Explore Marketplace",
    secondaryButtonText: "View Live Auctions",
    bgType: "gradient",
    gradientStart: "#b43c0a",
    gradientMiddle: "#7c2a06",
    gradientEnd: "#0a0603",
    gradientDirection: "radial",
    gradientIntensity: 35,
    bgOpacity: 100,
    bgImageUrl: ""
  });

  const getDefaultMarketplaceSettings = () => ({
    sectionTitle: "Browse SaaS Listings",
    sectionSubtitle: "Find Your Perfect Investment",
    sectionDescription: "Explore our curated collection of profitable SaaS businesses",
    searchPlaceholder: "Search by name, category, or keywords...",
    categoryFilterLabel: "All Categories",
    sortFilterLabel: "Sort By",
    emptyStateTitle: "No listings found",
    emptyStateMessage: "Try adjusting your search or filters",
    ctaButtonText: "View All Listings",
    thumbnailUrl: ""
  });

  const getDefaultAuctionSettings = () => ({
    sectionTitle: "Live Auctions",
    sectionSubtitle: "Bid in Real-Time",
    sectionDescription: "Participate in live auctions for premium SaaS businesses",
    cardTitleFormat: "{name} - Auction",
    countdownLabel: "Ends In",
    bidButtonText: "Place Bid",
    reserveButtonText: "Reserve Spot",
    detailsButtonText: "View Details",
    emptyStateTitle: "No active auctions",
    emptyStateMessage: "Check back later for new auction opportunities",
    thumbnailUrl: ""
  });

  const getDefaultCardSettings = () => ({
    featuredBadgeText: "Featured",
    reserveSpotButtonText: "Reserve Spot",
    requestAcquisitionButtonText: "Request Acquisition",
    placeBidButtonText: "Place Bid",
    viewDetailsButtonText: "View Details",
    soldBadgeText: "Sold",
    closedBadgeText: "Closed",
    revenueLabel: "Monthly Revenue",
    riskScoreLabel: "Risk Score",
    defaultThumbnailUrl: "",
    categoryThumbnailUrl: ""
  });

  const handleFieldChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isSuperAdmin) {
      toast.error("Only admins can save content presets");
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.id
      };

      if (presets?.id) {
        await base44.entities.ContentPresetSettings.update(presets.id, dataToSave);
      } else {
        await base44.entities.ContentPresetSettings.create(dataToSave);
      }

      queryClient.invalidateQueries({ queryKey: ["contentPresetSettings"] });
      toast.success("Content presets saved successfully");
      setHasChanges(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save content presets");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setFormData({
      heroSettings: getDefaultHeroSettings(),
      marketplaceSettings: getDefaultMarketplaceSettings(),
      liveAuctionSettings: getDefaultAuctionSettings(),
      listingCardSettings: getDefaultCardSettings(),
      imageLibrary: formData.imageLibrary
    });
    setHasChanges(true);
    toast.success("Reset to default values");
  };

  const handleImageUpload = async (section, field, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleFieldChange(section, field, file_url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleAiGenerate = async (section, field) => {
    setTargetField({ section, field });
    setAiDialogOpen(true);
    setAiImageUrl(null);
  };

  const handleAiGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setAiGenerating(true);
    try {
      const stylePrompts = {
        dark_saaS: "dark SaaS dashboard, modern tech interface, sleek design, professional, dark theme with orange accents",
        "3d_mockup": "3D software mockup, isometric view, clean minimal design, floating UI elements, modern tech",
        futuristic: "futuristic marketplace, holographic interface, neon lights, cyberpunk aesthetic, advanced technology",
        minimal_tech: "minimalist tech design, clean lines, plenty of whitespace, modern typography, simple color palette",
        appsumo: "AppSumo style, bold colors, deal-focused, energetic, conversion-optimized design"
      };

      const enhancedPrompt = `${aiPrompt}, ${stylePrompts[aiStyle] || stylePrompts.dark_saaS}, aspect ratio ${aiAspectRatio}, high quality, professional`;

      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: enhancedPrompt
      });

      setAiImageUrl(url);
      toast.success("Image generated successfully");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate image");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseAiImage = async () => {
    if (aiImageUrl && targetField) {
      handleFieldChange(targetField.section, targetField.field, aiImageUrl);
      setAiDialogOpen(false);
      setAiImageUrl(null);
      toast.success("Image applied successfully");
    }
  };

  const handleSaveToLibrary = async () => {
    if (aiImageUrl) {
      const newImage = {
        id: Date.now().toString(),
        url: aiImageUrl,
        name: `AI Generated ${new Date().toLocaleDateString()}`,
        category: "ai_generated",
        uploadedAt: new Date().toISOString()
      };
      setFormData(prev => ({
        ...prev,
        imageLibrary: [...prev.imageLibrary, newImage]
      }));
      setHasChanges(true);
      toast.success("Image saved to library");
    }
  };

  const renderHeroEditor = () => (
    <div className="space-y-6">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Type className="w-4 h-4 text-violet-400" />Hero Text Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Hero Badge</Label>
            <Input
              value={formData.heroSettings.badge || ""}
              onChange={(e) => handleFieldChange("heroSettings", "badge", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Welcome to the Marketplace"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hero Headline</Label>
            <Input
              value={formData.heroSettings.headline || ""}
              onChange={(e) => handleFieldChange("heroSettings", "headline", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Discover & Invest in Premium SaaS Businesses"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hero Subheadline</Label>
            <Input
              value={formData.heroSettings.subheadline || ""}
              onChange={(e) => handleFieldChange("heroSettings", "subheadline", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Your gateway to profitable digital assets"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hero Description</Label>
            <Textarea
              value={formData.heroSettings.description || ""}
              onChange={(e) => handleFieldChange("heroSettings", "description", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              rows={3}
              placeholder="Browse curated SaaS listings..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Primary Button Text</Label>
              <Input
                value={formData.heroSettings.primaryButtonText || ""}
                onChange={(e) => handleFieldChange("heroSettings", "primaryButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Explore Marketplace"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Secondary Button Text</Label>
              <Input
                value={formData.heroSettings.secondaryButtonText || ""}
                onChange={(e) => handleFieldChange("heroSettings", "secondaryButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="View Live Auctions"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Palette className="w-4 h-4 text-pink-400" />Hero Background Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Background Type</Label>
            <Select
              value={formData.heroSettings.bgType || "gradient"}
              onValueChange={(v) => handleFieldChange("heroSettings", "bgType", v)}
            >
              <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.heroSettings.bgType === "gradient" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Start Color</Label>
                  <Input
                    type="color"
                    value={formData.heroSettings.gradientStart || "#b43c0a"}
                    onChange={(e) => handleFieldChange("heroSettings", "gradientStart", e.target.value)}
                    className="bg-[#252525] border-border/30 rounded-xl mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Middle Color</Label>
                  <Input
                    type="color"
                    value={formData.heroSettings.gradientMiddle || "#7c2a06"}
                    onChange={(e) => handleFieldChange("heroSettings", "gradientMiddle", e.target.value)}
                    className="bg-[#252525] border-border/30 rounded-xl mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Color</Label>
                  <Input
                    type="color"
                    value={formData.heroSettings.gradientEnd || "#0a0603"}
                    onChange={(e) => handleFieldChange("heroSettings", "gradientEnd", e.target.value)}
                    className="bg-[#252525] border-border/30 rounded-xl mt-1 h-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Gradient Direction</Label>
                <Select
                  value={formData.heroSettings.gradientDirection || "radial"}
                  onValueChange={(v) => handleFieldChange("heroSettings", "gradientDirection", v)}
                >
                  <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radial">Radial</SelectItem>
                    <SelectItem value="to right">Left to Right</SelectItem>
                    <SelectItem value="to bottom">Top to Bottom</SelectItem>
                    <SelectItem value="diagonal">Diagonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Intensity: {formData.heroSettings.gradientIntensity}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.heroSettings.gradientIntensity || 35}
                  onChange={(e) => handleFieldChange("heroSettings", "gradientIntensity", parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Opacity: {formData.heroSettings.bgOpacity}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.heroSettings.bgOpacity || 100}
                  onChange={(e) => handleFieldChange("heroSettings", "bgOpacity", parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiGenerate("heroSettings", "bgImageUrl")}
              className="border-border/40 rounded-xl text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
              AI Generate Background
            </Button>
            {formData.heroSettings.bgImageUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFieldChange("heroSettings", "bgImageUrl", "")}
                  className="border-border/40 rounded-xl text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                  Remove
                </Button>
                <img src={formData.heroSettings.bgImageUrl} alt="Hero BG" className="w-20 h-12 object-cover rounded-lg border border-border/30" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Eye className="w-4 h-4 text-cyan-400" />Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative rounded-xl overflow-hidden h-64 flex items-center justify-center p-8"
            style={{
              background: formData.heroSettings.bgType === "gradient"
                ? `${formData.heroSettings.gradientDirection === 'radial' ? 'radial' : 'linear'}-gradient(${formData.heroSettings.gradientDirection === 'radial' ? 'circle' : formData.heroSettings.gradientDirection}, ${formData.heroSettings.gradientStart}, ${formData.heroSettings.gradientMiddle}, ${formData.heroSettings.gradientEnd})`
                : formData.heroSettings.bgType === "image" && formData.heroSettings.bgImageUrl
                ? `url(${formData.heroSettings.bgImageUrl}) center/cover`
                : formData.heroSettings.gradientEnd || "#0a0603",
              opacity: (formData.heroSettings.bgOpacity || 100) / 100
            }}
          >
            <div className="text-center space-y-4 relative z-10">
              {formData.heroSettings.badge && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                  {formData.heroSettings.badge}
                </Badge>
              )}
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                {formData.heroSettings.headline || "Hero Headline"}
              </h2>
              <p className="text-sm text-gray-300 max-w-md">
                {formData.heroSettings.description || "Hero description text"}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl text-xs">
                  {formData.heroSettings.primaryButtonText || "Primary CTA"}
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl text-xs">
                  {formData.heroSettings.secondaryButtonText || "Secondary CTA"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketplaceEditor = () => (
    <div className="space-y-6">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <LayoutTemplate className="w-4 h-4 text-cyan-400" />Marketplace Section Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Section Title</Label>
            <Input
              value={formData.marketplaceSettings.sectionTitle || ""}
              onChange={(e) => handleFieldChange("marketplaceSettings", "sectionTitle", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Browse SaaS Listings"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Section Subtitle</Label>
            <Input
              value={formData.marketplaceSettings.sectionSubtitle || ""}
              onChange={(e) => handleFieldChange("marketplaceSettings", "sectionSubtitle", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Find Your Perfect Investment"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Section Description</Label>
            <Textarea
              value={formData.marketplaceSettings.sectionDescription || ""}
              onChange={(e) => handleFieldChange("marketplaceSettings", "sectionDescription", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              rows={2}
              placeholder="Explore our curated collection..."
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Search Placeholder</Label>
            <Input
              value={formData.marketplaceSettings.searchPlaceholder || ""}
              onChange={(e) => handleFieldChange("marketplaceSettings", "searchPlaceholder", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Search by name, category, or keywords..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Category Filter Label</Label>
              <Input
                value={formData.marketplaceSettings.categoryFilterLabel || ""}
                onChange={(e) => handleFieldChange("marketplaceSettings", "categoryFilterLabel", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="All Categories"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sort Filter Label</Label>
              <Input
                value={formData.marketplaceSettings.sortFilterLabel || ""}
                onChange={(e) => handleFieldChange("marketplaceSettings", "sortFilterLabel", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Sort By"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">CTA Button Text</Label>
            <Input
              value={formData.marketplaceSettings.ctaButtonText || ""}
              onChange={(e) => handleFieldChange("marketplaceSettings", "ctaButtonText", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="View All Listings"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAuctionEditor = () => (
    <div className="space-y-6">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Gavel className="w-4 h-4 text-amber-400" />Live Auction Section Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Section Title</Label>
            <Input
              value={formData.liveAuctionSettings.sectionTitle || ""}
              onChange={(e) => handleFieldChange("liveAuctionSettings", "sectionTitle", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Live Auctions"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Section Subtitle</Label>
            <Input
              value={formData.liveAuctionSettings.sectionSubtitle || ""}
              onChange={(e) => handleFieldChange("liveAuctionSettings", "sectionSubtitle", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Bid in Real-Time"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Bid Button Text</Label>
              <Input
                value={formData.liveAuctionSettings.bidButtonText || ""}
                onChange={(e) => handleFieldChange("liveAuctionSettings", "bidButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Place Bid"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reserve Button Text</Label>
              <Input
                value={formData.liveAuctionSettings.reserveButtonText || ""}
                onChange={(e) => handleFieldChange("liveAuctionSettings", "reserveButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Reserve Spot"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCardEditor = () => (
    <div className="space-y-6">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <ShoppingCart className="w-4 h-4 text-violet-400" />SaaS Listing Card Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Featured Badge Text</Label>
            <Input
              value={formData.listingCardSettings.featuredBadgeText || ""}
              onChange={(e) => handleFieldChange("listingCardSettings", "featuredBadgeText", e.target.value)}
              className="bg-[#252525] border-border/30 rounded-xl mt-1"
              placeholder="Featured"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Reserve Spot Button</Label>
              <Input
                value={formData.listingCardSettings.reserveSpotButtonText || ""}
                onChange={(e) => handleFieldChange("listingCardSettings", "reserveSpotButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Reserve Spot"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Acquisition Button</Label>
              <Input
                value={formData.listingCardSettings.requestAcquisitionButtonText || ""}
                onChange={(e) => handleFieldChange("listingCardSettings", "requestAcquisitionButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Request Acquisition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Place Bid Button</Label>
              <Input
                value={formData.listingCardSettings.placeBidButtonText || ""}
                onChange={(e) => handleFieldChange("listingCardSettings", "placeBidButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="Place Bid"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">View Details Button</Label>
              <Input
                value={formData.listingCardSettings.viewDetailsButtonText || ""}
                onChange={(e) => handleFieldChange("listingCardSettings", "viewDetailsButtonText", e.target.value)}
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                placeholder="View Details"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMediaLibrary = () => (
    <div className="space-y-6">
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Image className="w-4 h-4 text-pink-400" />Media Library
            <Badge className="ml-auto bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
              {formData.imageLibrary?.length || 0} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search images..." className="bg-[#252525] border-border/30 rounded-xl pl-9" />
            </div>
            <Button variant="outline" size="sm" className="border-border/40 rounded-xl">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter
            </Button>
          </div>
          {formData.imageLibrary && formData.imageLibrary.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {formData.imageLibrary.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border/30">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No images in library yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload or AI generate images to build your library</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Hook Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Edit marketplace content dynamically without code changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="border-border/40 rounded-xl text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-[#d93025] hover:bg-[#c62828] rounded-xl text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-border/40 rounded-xl p-1">
          <TabsTrigger value="marketplace" className="data-[state=active]:bg-[#d93025] data-[state=active]:text-white rounded-lg text-xs">
            <Monitor className="w-3.5 h-3.5 mr-1.5" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="hero" className="data-[state=active]:bg-[#d93025] data-[state=active]:text-white rounded-lg text-xs">
            <Palette className="w-3.5 h-3.5 mr-1.5" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="auctions" className="data-[state=active]:bg-[#d93025] data-[state=active]:text-white rounded-lg text-xs">
            <Gavel className="w-3.5 h-3.5 mr-1.5" />
            Live Auctions
          </TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-[#d93025] data-[state=active]:text-white rounded-lg text-xs">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Card Presets
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-[#d93025] data-[state=active]:text-white rounded-lg text-xs">
            <Image className="w-3.5 h-3.5 mr-1.5" />
            Media Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-5">
          {renderMarketplaceEditor()}
        </TabsContent>
        <TabsContent value="hero" className="mt-5">
          {renderHeroEditor()}
        </TabsContent>
        <TabsContent value="auctions" className="mt-5">
          {renderAuctionEditor()}
        </TabsContent>
        <TabsContent value="cards" className="mt-5">
          {renderCardEditor()}
        </TabsContent>
        <TabsContent value="library" className="mt-5">
          {renderMediaLibrary()}
        </TabsContent>
      </Tabs>

      {/* AI Image Generator Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              AI Image Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Prompt</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="bg-[#252525] border-border/30 rounded-xl mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Style</Label>
                <Select value={aiStyle} onValueChange={setAiStyle}>
                  <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark_saaS">Dark SaaS Dashboard</SelectItem>
                    <SelectItem value="3d_mockup">3D Software Mockup</SelectItem>
                    <SelectItem value="futuristic">Futuristic Marketplace</SelectItem>
                    <SelectItem value="minimal_tech">Minimal Tech</SelectItem>
                    <SelectItem value="appsumo">AppSumo Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
                <Select value={aiAspectRatio} onValueChange={setAiAspectRatio}>
                  <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {aiImageUrl && (
              <div className="rounded-xl overflow-hidden border border-border/30">
                <img src={aiImageUrl} alt="Generated" className="w-full h-auto" />
              </div>
            )}

            {aiGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Generating image...</span>
                  <span>AI Processing</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)} className="border-border/40 rounded-xl">
              Cancel
            </Button>
            {aiImageUrl ? (
              <>
                <Button variant="outline" onClick={handleSaveToLibrary} className="border-border/40 rounded-xl">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Save to Library
                </Button>
                <Button onClick={handleUseAiImage} className="bg-[#d93025] hover:bg-[#c62828] rounded-xl">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Use Image
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAiGenerateImage}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="bg-violet-600 hover:bg-violet-700 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {aiGenerating ? "Generating..." : "Generate"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}