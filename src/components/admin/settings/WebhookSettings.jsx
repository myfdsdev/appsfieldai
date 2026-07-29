import React, { useState, useEffect } from "react";
import { Webhook, Save, ShieldCheck, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [secretConfigured, setSecretConfigured] = useState(null); // null = loading

  useEffect(() => {
    (async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const pw = configs?.[0]?.platformWebhook || {};
        setEnabled(!!pw.enabled);
        setBaseUrl(pw.baseUrl || "");
      } catch { /* none yet */ }
      try {
        const res = await base44.functions.invoke("platformWebhookSecretStatus", {});
        setSecretConfigured(!!res?.data?.configured);
      } catch { setSecretConfigured(false); }
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

      {/* Shared secret key */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5" /> Shared Secret Key
        </Label>
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/30 p-3">
          {secretConfigured === null ? (
            <span className="text-xs text-muted-foreground">Checking…</span>
          ) : secretConfigured ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-foreground/90">Secret is configured</span>
              <code className="font-mono text-xs text-muted-foreground/70 ml-1">••••••••••••</code>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs text-foreground/90">No secret set yet</span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          For security the secret value can't be shown or edited here. To set or rotate it, update the
          <code className="font-mono mx-1">PLATFORM_WEBHOOK_SECRET</code> app secret in your Base44 dashboard settings
          (Settings → Environment Variables / Secrets). Use the exact same value in the external app.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-secondary/30 p-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Each request sends the customer's <strong>name</strong> and <strong>email</strong> in the JSON body, and the shared secret in the
          <code className="font-mono mx-1">X-Platform-Secret</code> header. The external app must verify this header matches its copy of the secret.
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