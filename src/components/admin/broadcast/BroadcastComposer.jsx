import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, Loader2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

const EMPTY = {
  title: "",
  message: "",
  linkUrl: "",
  buttonLabel: "",
  mediaType: "none",
  mediaUrl: "",
  audience: "store_owners",
  sendEmail: false,
  showPopup: true,
  scheduleMode: "instant",
  scheduledAt: "",
  durationHours: 24,
};

export default function BroadcastComposer({ onSent }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const sendTest = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setTesting(true);
    try {
      const res = await base44.functions.invoke("sendBroadcast", { test: true, broadcast: form });
      toast.success(res.data?.emailed ? "Test sent to your notifications and email" : "Test sent to your notifications");
    } catch (e) {
      toast.error("Could not send the test");
    }
    setTesting(false);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (form.scheduleMode === "scheduled" && !form.scheduledAt) {
      toast.error("Pick a date & time for the scheduled announcement");
      return;
    }
    setBusy(true);
    try {
      const created = await base44.entities.AdminBroadcast.create({
        ...form,
        durationHours: Number(form.durationHours) || 0,
        scheduledAt: form.scheduleMode === "scheduled" ? new Date(form.scheduledAt).toISOString() : "",
        status: "scheduled",
      });
      if (form.scheduleMode === "instant") {
        const res = await base44.functions.invoke("sendBroadcast", { broadcastId: created.id });
        toast.success(`Sent to ${res.data?.recipientCount ?? 0} recipients`);
      } else {
        toast.success("Announcement scheduled");
      }
      setForm(EMPTY);
      onSent?.();
    } catch (e) {
      toast.error("Could not send the announcement");
    }
    setBusy(false);
  };

  return (
    <Card className="border-border/40 bg-[#1a1a1a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
          <Megaphone className="w-4 h-4 text-amber-400" />New Announcement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Title</label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="New feature is live" className="bg-[#252525] border-border/30 rounded-xl mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Description</label>
          <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={4} placeholder="Tell store owners what's new..." className="bg-[#252525] border-border/30 rounded-xl mt-1" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Button label</label>
            <Input value={form.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} placeholder="Learn more" className="bg-[#252525] border-border/30 rounded-xl mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Button link</label>
            <Input value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="https://..." className="bg-[#252525] border-border/30 rounded-xl mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Media</label>
            <Select value={form.mediaType} onValueChange={(v) => set("mediaType", v)}>
              <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Media file</label>
            <div className="mt-1">
              {form.mediaType === "none" ? (
                <Input disabled placeholder="Select a media type first" className="bg-[#252525] border-border/30 rounded-xl" />
              ) : (
                <R2ImageUpload
                  value={form.mediaUrl}
                  onChange={(url) => set("mediaUrl", url)}
                  campaignId="admin-broadcast"
                  accept={form.mediaType === "video" ? "video/*" : "image/*"}
                  placeholder={form.mediaType === "video" ? "https://... (mp4 or YouTube)" : "https://... (image)"}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Audience</label>
            <Select value={form.audience} onValueChange={(v) => set("audience", v)}>
              <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="store_owners">Store owners</SelectItem>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="admins">Admins only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">When</label>
            <Select value={form.scheduleMode} onValueChange={(v) => set("scheduleMode", v)}>
              <SelectTrigger className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Send instantly</SelectItem>
                <SelectItem value="scheduled">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Popup duration (hours)</label>
            <Input type="number" min="0" value={form.durationHours} onChange={(e) => set("durationHours", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1" />
          </div>
        </div>

        {form.scheduleMode === "scheduled" && (
          <div>
            <label className="text-xs text-muted-foreground">Scheduled date & time</label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1 text-xs" />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-border/30 bg-[#252525] px-4 py-3">
            <span className="text-xs text-foreground">Show as popup</span>
            <Switch checked={form.showPopup} onCheckedChange={(v) => set("showPopup", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/30 bg-[#252525] px-4 py-3">
            <span className="text-xs text-foreground">Also send by email</span>
            <Switch checked={form.sendEmail} onCheckedChange={(v) => set("sendEmail", v)} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={submit} disabled={busy} className="bg-orange-500 hover:bg-orange-600 rounded-xl text-sm">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {form.scheduleMode === "instant" ? "Send Now" : "Schedule"}
          </Button>
          <Button onClick={sendTest} disabled={testing} variant="outline" className="border-border/40 rounded-xl text-sm">
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
            Send Test to Me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}