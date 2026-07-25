import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Server, Mail, Info } from "lucide-react";
import { toast } from "sonner";

// Template-mail definitions, one tab per transactional action.
const TEMPLATE_TABS = [
  { key: "welcome", label: "Welcome", defaultSubject: "Welcome to {{store_name}}!" },
  { key: "orderConfirmation", label: "Order Confirmation", defaultSubject: "Your order is confirmed" },
  { key: "reservation", label: "Reservation", defaultSubject: "Your spot is reserved" },
];

export default function EmailSettingsManager({ marketplace }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("smtp"); // "smtp" | "templates"
  const [activeTpl, setActiveTpl] = useState("welcome");

  const es = marketplace?.emailSettings || {};
  const [form, setForm] = useState({
    fromName: es.fromName || "",
    fromEmail: es.fromEmail || "",
    templates: {
      welcome: es.templates?.welcome || { enabled: true, subject: "", body: "" },
      orderConfirmation: es.templates?.orderConfirmation || { enabled: true, subject: "", body: "" },
      reservation: es.templates?.reservation || { enabled: true, subject: "", body: "" },
    },
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setTpl = (key, field, value) =>
    setForm(f => ({ ...f, templates: { ...f.templates, [key]: { ...f.templates[key], [field]: value } } }));

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || "").trim());
  const isBlockedEmail = (e) => {
    const v = (e || "").trim().toLowerCase();
    return v.endsWith("@appsfieldai.com") || v.endsWith("@gmail.com");
  };

  const handleSave = async () => {
    const fe = form.fromEmail.trim();
    if (fe) {
      if (!isValidEmail(fe)) { toast.error("Please enter a valid From Email address."); return; }
      if (isBlockedEmail(fe)) { toast.error("From Email must be a custom domain email — not an appsfieldai.com or gmail.com address."); return; }
    }
    setSaving(true);
    // Merge into existing emailSettings so templates & any legacy fields are preserved.
    await base44.entities.Marketplace.update(marketplace.id, {
      emailSettings: { ...es, ...form },
    });
    queryClient.invalidateQueries({ queryKey: ["ownerMarketplaces"] });
    toast.success("Email settings saved!");
    setSaving(false);
  };

  const tpl = form.templates[activeTpl];
  const tplMeta = TEMPLATE_TABS.find(t => t.key === activeTpl);

  return (
    <div className="space-y-4">
      {/* Section switch */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 w-fit">
        {[{ id: "smtp", label: "Sender", icon: Server }, { id: "templates", label: "Email Templates", icon: Mail }].map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${section === s.id ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"}`}>
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {section === "smtp" && (
        <div className="rounded-2xl border border-border/30 bg-card/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center"><Server className="w-4.5 h-4.5 text-orange-400" /></div>
            <div><p className="text-sm font-semibold">Sender Identity</p><p className="text-[11px] text-muted-foreground">This store's emails are sent through your account's SMTP server.</p></div>
          </div>

          {/* Inherited SMTP note */}
          <div className="flex items-start gap-2 rounded-xl bg-orange-500/5 border border-orange-500/20 p-3">
            <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              SMTP server, username and password are configured once under <span className="font-medium text-foreground">My Account → Outreach Email</span> and shared across all your stores — no need to set it up per store. Here you only choose how the sender appears for this store.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground">From Name</label><Input value={form.fromName} onChange={e => set("fromName", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="My Store" /></div>
            <div>
              <label className="text-xs text-muted-foreground">From Email</label>
              <Input value={form.fromEmail} onChange={e => set("fromEmail", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder="info@yourdomain.com" />
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Must be a valid <span className="font-medium text-foreground">custom domain email</span> (e.g. info@yourdomain.com). It cannot be an <span className="font-medium">appsfieldai.com</span> or <span className="font-medium">gmail.com</span> address. Leave empty to use your account's default sender.
              </p>
            </div>
          </div>
        </div>
      )}

      {section === "templates" && (
        <div className="rounded-2xl border border-border/30 bg-card/60 p-5 space-y-4">
          {/* Template action tabs */}
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTpl(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTpl === t.key ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50">
            <input type="checkbox" checked={!!tpl.enabled} onChange={e => setTpl(activeTpl, "enabled", e.target.checked)} className="accent-orange-500 w-4 h-4" />
            <div><p className="text-sm font-medium">Send "{tplMeta?.label}" email</p><p className="text-[11px] text-muted-foreground">Automatically sent for this action</p></div>
          </label>

          <div><label className="text-xs text-muted-foreground">Subject</label><Input value={tpl.subject} onChange={e => setTpl(activeTpl, "subject", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1" placeholder={tplMeta?.defaultSubject} /></div>
          <div><label className="text-xs text-muted-foreground">Body</label>
            <Textarea value={tpl.body} onChange={e => setTpl(activeTpl, "body", e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-40 resize-none" placeholder={`Hi {{customer_name}},\n\nThanks for choosing {{store_name}}...`} />
            <p className="text-[11px] text-muted-foreground mt-1">Variables: <code className="text-orange-400">{"{{customer_name}}"}</code>, <code className="text-orange-400">{"{{store_name}}"}</code>, <code className="text-orange-400">{"{{order_id}}"}</code></p>
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0">
        <Save className="w-4 h-4" /> Save Email Settings
      </Button>
    </div>
  );
}