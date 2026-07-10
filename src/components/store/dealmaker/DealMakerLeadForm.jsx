import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Inline lead / custom-request capture form shown when the agent asks for contact details.
export default function DealMakerLeadForm({ hot, brandColor, submitting, onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSubmit = form.email.trim() && (!hot || form.phone.trim());

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {hot ? "Drop your details — the owner follows up within 24 hours." : "Leave your details and we'll stay in touch."}
      </p>
      <Input placeholder="Your name" value={form.name} onChange={set("name")} className="h-9" />
      <Input placeholder="Email" type="email" value={form.email} onChange={set("email")} className="h-9" />
      <Input placeholder={hot ? "Phone (required)" : "Phone (optional)"} value={form.phone} onChange={set("phone")} className="h-9" />
      <Button
        disabled={!canSubmit || submitting}
        onClick={() => onSubmit(form)}
        className="w-full h-9 text-white gap-2"
        style={{ background: brandColor }}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Send
      </Button>
    </div>
  );
}