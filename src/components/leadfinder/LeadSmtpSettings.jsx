import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

// Personal SMTP settings used by Lead Finder to send outreach emails.
// Lives under My Account → Settings.
export default function LeadSmtpSettings({ user }) {
  const queryClient = useQueryClient();
  const { checkUserAuth } = useAuth();
  const s = user?.leadFinderSmtp || {};
  const [form, setForm] = useState({
    enabled: s.enabled ?? false,
    host: s.host || "",
    port: s.port || 587,
    username: s.username || "",
    password: s.password || "",
    secure: s.secure ?? false,
    fromName: s.fromName || "",
    fromEmail: s.fromEmail || "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await base44.functions.invoke("leadFinder", {
        action: "sendTest",
        smtp: { ...form, port: parseInt(form.port) || 587 },
      });
      const data = r?.data || r;
      if (data?.error) { toast.error(data.error); }
      else { toast.success(`Test email sent to ${data?.to || "your inbox"}.`); }
    } catch (e) {
      toast.error(e.message || "Could not send test email.");
    }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ leadFinderSmtp: { ...form, port: parseInt(form.port) || 587 } });
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await checkUserAuth?.();
      toast.success("Email (SMTP) settings saved.");
    } catch (e) {
      toast.error(e.message || "Could not save settings.");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 max-w-xl space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Mail className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-medium">Outreach Email (SMTP)</p>
          <p className="text-xs text-muted-foreground">Used by Lead Finder to send invite emails from your own address.</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Enable SMTP sending</p>
          <p className="text-[11px] text-muted-foreground">Turn on to send Lead Finder emails</p>
        </div>
        <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs">SMTP Host</Label>
          <Input value={form.host} onChange={(e) => set("host", e.target.value)} className="mt-1" placeholder="smtp.gmail.com" />
        </div>
        <div>
          <Label className="text-xs">Port</Label>
          <Input type="number" value={form.port} onChange={(e) => set("port", e.target.value)} className="mt-1" placeholder="587" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={form.secure} onCheckedChange={(v) => set("secure", v)} />
          <span className="text-xs text-muted-foreground">Use SSL (port 465)</span>
        </div>
        <div>
          <Label className="text-xs">Username</Label>
          <Input value={form.username} onChange={(e) => set("username", e.target.value)} className="mt-1" placeholder="you@domain.com" />
        </div>
        <div>
          <Label className="text-xs">Password</Label>
          <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="mt-1" placeholder="••••••••" />
        </div>
        <div>
          <Label className="text-xs">From Name</Label>
          <Input value={form.fromName} onChange={(e) => set("fromName", e.target.value)} className="mt-1" placeholder="Your name" />
        </div>
        <div>
          <Label className="text-xs">From Email</Label>
          <Input value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} className="mt-1" placeholder="you@domain.com" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save SMTP settings
        </Button>
        <Button onClick={handleTest} disabled={testing} variant="outline" className="gap-2">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send test email
        </Button>
      </div>
    </div>
  );
}