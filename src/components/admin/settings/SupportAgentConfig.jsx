import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bot, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SUPPORT_AGENT_DEFAULTS } from "@/lib/supportAgent";

export default function SupportAgentConfig() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(SUPPORT_AGENT_DEFAULTS);
  const [saving, setSaving] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["appConfigSupportAgent"],
    queryFn: async () => {
      const rows = await base44.entities.AppConfig.filter({ key: "support_agent" });
      return rows[0] || null;
    },
  });

  useEffect(() => {
    if (config?.supportAgent) {
      setForm({ ...SUPPORT_AGENT_DEFAULTS, ...config.supportAgent });
    }
  }, [config]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      quickPrompts: (form.quickPrompts || []).filter((p) => p && p.trim()),
    };
    if (config?.id) {
      await base44.entities.AppConfig.update(config.id, { supportAgent: payload });
    } else {
      await base44.entities.AppConfig.create({ key: "support_agent", supportAgent: payload });
    }
    queryClient.invalidateQueries({ queryKey: ["appConfigSupportAgent"] });
    queryClient.invalidateQueries({ queryKey: ["supportAgentSettings"] });
    setSaving(false);
    toast.success("Support agent settings saved");
  };

  const prompts = form.quickPrompts || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Bot className="w-4 h-4 text-orange-400" />Support Agent
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{form.enabled ? "Visible" : "Hidden"}</span>
            <Switch checked={!!form.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Controls the floating in-app help agent shown to every user across the platform.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Agent Name</label>
              <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tagline</label>
              <Input value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Mascot / Avatar Image URL</label>
            <div className="flex items-center gap-3 mt-1">
              <Input value={form.mascotImageUrl || ""} onChange={(e) => set("mascotImageUrl", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl text-sm" />
              {form.mascotImageUrl && <img src={form.mascotImageUrl} alt="" className="w-10 h-10 object-contain rounded-lg shrink-0" />}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Bubble Text</label>
            <Input value={form.bubbleText || ""} onChange={(e) => set("bubbleText", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1 text-sm" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Welcome Greeting</label>
            <Input value={form.greeting || ""} onChange={(e) => set("greeting", e.target.value)} className="bg-[#252525] border-border/30 rounded-xl mt-1 text-sm" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Knowledge Base / Extra Instructions</label>
            <Textarea
              value={form.knowledgeBase || ""}
              onChange={(e) => set("knowledgeBase", e.target.value)}
              rows={6}
              placeholder="Platform rules, FAQs, policies the agent must know…"
              className="bg-[#252525] border-border/30 rounded-xl mt-1 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Quick Prompts</label>
            <div className="space-y-2 mt-1">
              {prompts.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={p}
                    onChange={(e) => set("quickPrompts", prompts.map((x, j) => (j === i ? e.target.value : x)))}
                    className="bg-[#252525] border-border/30 rounded-xl text-sm"
                  />
                  <Button variant="ghost" size="sm" onClick={() => set("quickPrompts", prompts.filter((_, j) => j !== i))} className="text-red-400/70 hover:text-red-400 h-9">Remove</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set("quickPrompts", [...prompts, ""])} className="border-border/40 rounded-xl text-xs">Add prompt</Button>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Settings
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}