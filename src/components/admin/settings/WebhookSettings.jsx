import React, { useState, useEffect } from "react";
import { Webhook, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Admin config for the outbound provisioning webhook.
// On a JVZoo sale the app POSTs the customer name & email to the external app so it
// can register the user; on refund/chargeback it calls suspend to deregister them.
export default function WebhookSettings() {
  const [enabled, setEnabled] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const pw = configs?.[0]?.platformWebhook || {};
        setEnabled(!!pw.enabled);
        setBaseUrl(pw.baseUrl || "");
      } catch { /* none yet */ }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, "");
      const payload = { platformWebhook: { enabled, baseUrl: cleanUrl } };
      const configs = await base44.entities.AppConfig.filter({ key: "main" });
      if (configs?.[0]) await base44.entities.AppConfig.update(configs[0].id, payload);
      else await base44.entities.AppConfig.create({ key: "main", ...payload });
      toast.success("Webhook settings saved.");
    } catch {
      toast.error("Failed to save webhook settings.");
    } finally {
      setSaving(false);
    }
  };

  const cleanUrl = baseUrl.trim().replace(/\/+$/, "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Webhook className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Webhook</h2>
          <p className="text-sm text-muted-foreground">Provision access on an external app when a JVZoo sale is made</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-border/30">
        <div>
          <span className="text-sm font-medium text-foreground/90">Enable provisioning webhook</span>
          <p className="text-xs text-muted-foreground">When on, JVZoo sales register the user and refunds deregister them on the external app.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">External App Base URL</Label>
        <Input
          placeholder="https://ai-local-business-schema-generato-backend.onrender.com"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="h-10 bg-secondary/40 border-border/50 font-mono"
        />
        <p className="text-xs text-muted-foreground">
          The app will call these endpoints on this base URL:
        </p>
        <div className="text-xs font-mono text-muted-foreground/90 bg-secondary/40 rounded-lg p-3 space-y-1">
          <div><span className="text-emerald-400">POST</span> {cleanUrl || "{baseUrl}"}/api/v1/platform/provision <span className="text-muted-foreground/60">← on purchase</span></div>
          <div><span className="text-orange-400">POST</span> {cleanUrl || "{baseUrl}"}/api/v1/platform/suspend <span className="text-muted-foreground/60">← on refund</span></div>
          <div><span className="text-blue-400">POST</span> {cleanUrl || "{baseUrl}"}/api/v1/platform/reactivate <span className="text-muted-foreground/60">← on reversal</span></div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-secondary/30 p-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Each request sends the customer's <strong>name</strong> and <strong>email</strong> in the JSON body, and a shared secret in the
          <code className="font-mono mx-1">X-Platform-Secret</code> header. The secret is stored securely as the
          <code className="font-mono mx-1">PLATFORM_WEBHOOK_SECRET</code> app secret — make sure the external app uses the exact same value.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}