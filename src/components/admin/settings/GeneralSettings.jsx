import React, { useState, useEffect, useRef } from "react";
import { Settings, Save, Upload, Loader2, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <Label className="text-sm text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-foreground/80">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default function GeneralSettings() {
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const [supportEmail, setSupportEmail] = useState("");
  const [platformDomain, setPlatformDomain] = useState("");
  const [detectedDomain, setDetectedDomain] = useState("");
  const [domainSource, setDomainSource] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("");
  const [defaultShares, setDefaultShares] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [requireListingApproval, setRequireListingApproval] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (user.requireListingApproval !== undefined) setRequireListingApproval(user.requireListingApproval);
      } catch { /* use defaults */ }
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const cfg = configs?.[0];
        if (cfg?.platformDomain) setPlatformDomain(cfg.platformDomain);
        if (cfg?.siteName) setSiteName(cfg.siteName);
        if (cfg?.supportEmail) setSupportEmail(cfg.supportEmail);
        if (cfg?.appLogoUrl) setLogoUrl(cfg.appLogoUrl);
        if (cfg?.appFaviconUrl) setFaviconUrl(cfg.appFaviconUrl);
      } catch { /* none yet */ }
      try {
        const res = await base44.functions.invoke("getPlatformDomain", {});
        setDetectedDomain(res.data?.platformDomain || "");
        setDomainSource(res.data?.source || "");
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const handleUpload = async (file, setUrl, setUploading) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUrl(file_url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ requireListingApproval });
      const cleanDomain = platformDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
      const payload = {
        platformDomain: cleanDomain,
        siteName,
        supportEmail,
        appLogoUrl: logoUrl,
        appFaviconUrl: faviconUrl,
      };
      const configs = await base44.entities.AppConfig.filter({ key: "main" });
      if (configs?.[0]) await base44.entities.AppConfig.update(configs[0].id, payload);
      else await base44.entities.AppConfig.create({ key: "main", ...payload });
      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
          <p className="text-sm text-muted-foreground">Site configuration and defaults</p>
        </div>
      </div>

      {/* Site Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Site Name">
          <Input
            placeholder="SaaSShare"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Support Email">
          <Input
            placeholder="support@yourdomain.com"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
      </div>

      {/* Platform Domain */}
      <Field label="Platform Domain">
        <Input
          placeholder="saasshare.app"
          value={platformDomain}
          onChange={(e) => setPlatformDomain(e.target.value)}
          className="h-10 bg-secondary/40 border-border/50 font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Base domain for customer stores — used for subdomains (<code className="font-mono">store.{platformDomain || "saasshare.app"}</code>) and custom-domain DNS targets.
          {detectedDomain && (
            <span className="block mt-1">
              Auto-detected: <code className="font-mono text-blue-400">{detectedDomain}</code>
              <span className="text-muted-foreground/70"> ({domainSource === "configured" ? "from this setting" : domainSource === "auto_detected" ? "from your live Base44 custom domain" : "default — set your domain above"})</span>
            </span>
          )}
        </p>
      </Field>

      {/* App Branding */}
      <div className="pt-2 border-t border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3">App Branding</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* App Logo */}
          <Field label="App Logo">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="h-10 bg-secondary/40 border-border/50"
                />
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], setLogoUrl, setUploadingLogo)} />
                <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()} className="h-8">
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">PNG or SVG recommended.</p>
          </Field>

          {/* App Favicon */}
          <Field label="Favicon">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="https://example.com/favicon.png"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  className="h-10 bg-secondary/40 border-border/50"
                />
                <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], setFaviconUrl, setUploadingFavicon)} />
                <Button type="button" variant="outline" size="sm" disabled={uploadingFavicon} onClick={() => faviconInputRef.current?.click()} className="h-8">
                  {uploadingFavicon ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Square image, 32×32 or 64×64px (PNG/ICO).</p>
          </Field>
        </div>
      </div>

      {/* Defaults */}
      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <Field label="Default Auction Duration (days)">
          <Input
            placeholder="7"
            type="number"
            value={auctionDuration}
            onChange={(e) => setAuctionDuration(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Default Total Shares">
          <Input
            placeholder="1000"
            type="number"
            value={defaultShares}
            onChange={(e) => setDefaultShares(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
      </div>

      {/* Toggles */}
      <div className="pt-4 border-t border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3">Site Controls</h3>
        <div className="divide-y divide-border/20">
          <ToggleRow label="Maintenance Mode" checked={maintenanceMode} onChange={setMaintenanceMode} />
          <ToggleRow label="Enable Registration" checked={enableRegistration} onChange={setEnableRegistration} />
          <ToggleRow label="Require Listing Approval" checked={requireListingApproval} onChange={setRequireListingApproval} />
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}