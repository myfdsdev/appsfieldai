import React, { useState } from "react";
import { Mail, Save, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EmailSettings() {
  const [adminEmail, setAdminEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [provider, setProvider] = useState("smtp");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [loginNotify, setLoginNotify] = useState(true);
  const [registerNotify, setRegisterNotify] = useState(true);
  const [purchaseNotify, setPurchaseNotify] = useState(true);
  const [payoutNotify, setPayoutNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email Configuration</h2>
          <p className="text-sm text-muted-foreground">Manage notifications and SMTP settings</p>
        </div>
      </div>

      {/* Core Email Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Admin Notification Email">
          <Input
            placeholder="admin@yourdomain.com"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Sender Name">
          <Input
            placeholder="SaaSShare"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Sender Email">
          <Input
            placeholder="noreply@yourdomain.com"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            className="h-10 bg-secondary/40 border-border/50"
          />
        </Field>
        <Field label="Email Provider">
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="h-10 bg-secondary/40 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smtp">SMTP</SelectItem>
              <SelectItem value="resend">Resend</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="mailgun">Mailgun</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* SMTP Fields */}
      {provider === "smtp" && (
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <Field label="SMTP Host">
            <Input
              placeholder="smtp.gmail.com"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
          <Field label="SMTP Port">
            <Input
              placeholder="587"
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
          <Field label="SMTP Username">
            <Input
              placeholder="your@email.com"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
          <Field label="SMTP Password">
            <Input
              type="password"
              placeholder="••••••••"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="h-10 bg-secondary/40 border-border/50"
            />
          </Field>
        </div>
      )}

      {/* Notification Toggles */}
      <div className="pt-4 border-t border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3">Notification Preferences</h3>
        <div className="divide-y divide-border/20">
          <ToggleRow label="Login Notification" checked={loginNotify} onChange={setLoginNotify} />
          <ToggleRow label="Registration Notification" checked={registerNotify} onChange={setRegisterNotify} />
          <ToggleRow label="Purchase Notification" checked={purchaseNotify} onChange={setPurchaseNotify} />
          <ToggleRow label="Payout Notification" checked={payoutNotify} onChange={setPayoutNotify} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        <Button variant="outline" className="h-10 border-border/40 text-foreground/70">
          <Send className="w-4 h-4 mr-2" />
          Test Email
        </Button>
      </div>
    </div>
  );
}