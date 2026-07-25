import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Settings, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const firstName = (b) => (b || "").trim().split(/\s+/)[0] || "there";
const applyVars = (tpl, vars) => (tpl || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => vars[k] ?? "");

// Verifies SMTP is configured, then lets the owner pick a template that gets
// auto-personalized with the lead's first name + business description and sent.
export default function SendLeadEmailDialog({ open, onClose, lead, ownerId }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [smtpOk, setSmtpOk] = useState(null);
  const [checking, setChecking] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["leadTemplates", ownerId],
    queryFn: () => base44.entities.LeadEmailTemplate.filter({ ownerId }, "-created_date"),
    enabled: !!ownerId && open,
  });

  useEffect(() => {
    if (!open) return;
    setChecking(true);
    base44.functions.invoke("leadFinder", { action: "checkSmtp" })
      .then((r) => setSmtpOk(!!(r?.data?.ok ?? r?.ok)))
      .catch(() => setSmtpOk(false))
      .finally(() => setChecking(false));
  }, [open]);

  const vars = lead ? {
    first_name: firstName(lead.businessName),
    business_name: lead.businessName || "",
    business_description: lead.description || "",
    store_name: "",
  } : {};

  const pickTemplate = (id) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setSubject(applyVars(t.subject, { ...vars, store_name: t.storeName || "" }));
      setBodyText(applyVars(t.body, { ...vars, store_name: t.storeName || "" }));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !bodyText.trim()) { toast.error("Subject and message are required"); return; }
    setSending(true);
    try {
      const html = `<div style="font-family:sans-serif;white-space:pre-wrap;line-height:1.6;">${bodyText.replace(/</g, "&lt;")}</div>`;
      const r = await base44.functions.invoke("leadFinder", { action: "sendEmail", leadId: lead.id, subject, htmlBody: html });
      if (r?.data?.error || r?.error) throw new Error(r?.data?.error || r?.error);
      toast.success(`Email sent to ${lead.businessName}`);
      queryClient.invalidateQueries({ queryKey: ["foundLeads"] });
      onClose();
    } catch (e) {
      toast.error(e.message || "Failed to send email");
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border/40 max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-orange-400" /> Send Email — {lead?.businessName}</DialogTitle>
        </DialogHeader>

        {checking ? (
          <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        ) : smtpOk === false ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Your email (SMTP) settings aren't set up yet. Set them up to send outreach emails.</p>
            <Button onClick={() => { onClose(); navigate("/my-account?tab=account"); }} className="gap-2">
              <Settings className="w-4 h-4" /> Set up your SMTP settings
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Template</Label>
              <select value={templateId} onChange={(e) => pickTemplate(e.target.value)} className="w-full bg-secondary/50 border border-border/30 rounded-xl mt-1 px-3 py-2 text-sm">
                <option value="">Select a template…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {templates.length === 0 && <p className="text-[11px] text-muted-foreground mt-1">No templates yet — create one in the Templates tab.</p>}
            </div>
            <div>
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" placeholder="Subject line" />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="mt-1 h-44 resize-none" placeholder="Your personalized message…" />
              <p className="text-[11px] text-muted-foreground mt-1">Personalized for {firstName(lead?.businessName)} automatically.</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSend} disabled={sending} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}