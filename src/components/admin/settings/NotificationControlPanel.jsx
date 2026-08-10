import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NOTIFICATION_EVENT_GROUPS, NOTIFICATION_SETTINGS_DEFAULTS } from "@/lib/notificationEvents";

export default function NotificationControlPanel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(NOTIFICATION_SETTINGS_DEFAULTS);
  const [saving, setSaving] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["appConfigNotificationSettings"],
    queryFn: async () => {
      const rows = await base44.entities.AppConfig.filter({ key: "notification_settings" });
      return rows[0] || null;
    },
  });

  useEffect(() => {
    if (config?.notificationSettings) {
      setForm({ ...NOTIFICATION_SETTINGS_DEFAULTS, ...config.notificationSettings });
    }
  }, [config]);

  const isOn = (key, channel) => form.events?.[key]?.[channel] !== false;

  const toggleEvent = (key, channel, value) =>
    setForm((f) => ({
      ...f,
      events: { ...(f.events || {}), [key]: { ...(f.events?.[key] || {}), [channel]: value } },
    }));

  const save = async () => {
    setSaving(true);
    if (config?.id) {
      await base44.entities.AppConfig.update(config.id, { notificationSettings: form });
    } else {
      await base44.entities.AppConfig.create({ key: "notification_settings", notificationSettings: form });
    }
    queryClient.invalidateQueries({ queryKey: ["appConfigNotificationSettings"] });
    setSaving(false);
    toast.success("Notification settings saved");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Bell className="w-4 h-4 text-violet-400" />Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Control which events send in-app notifications and emails across the whole platform.
          </p>

          {/* Master switches */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border/30 bg-[#252525] px-4 py-3">
              <span className="text-xs flex items-center gap-2 text-foreground"><Bell className="w-3.5 h-3.5 text-violet-400" />All in-app notifications</span>
              <Switch checked={form.masterInApp !== false} onCheckedChange={(v) => setForm((f) => ({ ...f, masterInApp: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/30 bg-[#252525] px-4 py-3">
              <span className="text-xs flex items-center gap-2 text-foreground"><Mail className="w-3.5 h-3.5 text-cyan-400" />All email notifications</span>
              <Switch checked={form.masterEmail !== false} onCheckedChange={(v) => setForm((f) => ({ ...f, masterEmail: v }))} />
            </div>
          </div>

          {/* Per-event grid */}
          {NOTIFICATION_EVENT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</p>
              <div className="rounded-xl border border-border/30 divide-y divide-border/20">
                <div className="flex items-center gap-4 px-4 py-2">
                  <span className="flex-1 text-[10px] uppercase tracking-wider text-muted-foreground">Event</span>
                  <span className="w-16 text-[10px] uppercase tracking-wider text-muted-foreground text-center">In-app</span>
                  <span className="w-16 text-[10px] uppercase tracking-wider text-muted-foreground text-center">Email</span>
                </div>
                {group.events.map((ev) => (
                  <div key={ev.key} className="flex items-center gap-4 px-4 py-2.5">
                    <span className="flex-1 text-xs text-foreground">{ev.label}</span>
                    <div className="w-16 flex justify-center">
                      <Switch checked={isOn(ev.key, "inApp")} onCheckedChange={(v) => toggleEvent(ev.key, "inApp", v)} />
                    </div>
                    <div className="w-16 flex justify-center">
                      <Switch checked={isOn(ev.key, "email")} onCheckedChange={(v) => toggleEvent(ev.key, "email", v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Settings
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}