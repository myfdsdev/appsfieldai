import React, { useState, useEffect } from "react";
import { Cpu, Save, Check, KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// AI providers and the models each exposes. For OpenAI/Gemini the model ids are
// the REAL API model names (used directly against each provider's API).
// "base44" = Base44's built-in automatic routing (no key needed).
export const AI_PROVIDERS = [
  {
    id: "base44",
    name: "Base44 (Built-in)",
    desc: "Base44's automatic model routing — no setup needed.",
    models: [{ id: "automatic", name: "Automatic (recommended)" }],
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "Real OpenAI API — needs your API key.",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (fast)" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4.1", name: "GPT-4.1 (highest quality)" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    desc: "Real Gemini API — needs your API key.",
    models: [
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (fast)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (highest quality)" },
    ],
  },
];

export default function AIEngineSettings() {
  const [configId, setConfigId] = useState(null);
  const [provider, setProvider] = useState("base44");
  const [model, setModel] = useState("automatic");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const cfg = configs?.[0];
        if (cfg) {
          setConfigId(cfg.id);
          const eng = cfg.aiEngine || {};
          setProvider(eng.provider || "base44");
          setModel(eng.model || (eng.provider ? "" : "automatic"));
          setOpenaiApiKey(eng.openaiApiKey || "");
          setGeminiApiKey(eng.geminiApiKey || "");
        }
      } catch { /* none yet */ }
      setLoading(false);
    })();
  }, []);

  const activeProvider = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];

  const selectProvider = (p) => {
    setProvider(p.id);
    // Default to that provider's first model when switching.
    setModel(p.models[0].id);
  };

  const handleSave = async () => {
    if (provider === "openai" && !openaiApiKey.trim()) {
      toast.error("Enter your OpenAI API key.");
      return;
    }
    if (provider === "gemini" && !geminiApiKey.trim()) {
      toast.error("Enter your Gemini API key.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        aiEngine: {
          provider,
          model: model || activeProvider.models[0].id,
          openaiApiKey: openaiApiKey.trim(),
          geminiApiKey: geminiApiKey.trim(),
        },
      };
      const configs = await base44.entities.AppConfig.filter({ key: "main" });
      if (configs?.[0]) await base44.entities.AppConfig.update(configs[0].id, payload);
      else await base44.entities.AppConfig.create({ key: "main", ...payload });
      toast.success("AI engine settings saved.");
    } catch {
      toast.error("Failed to save AI engine settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Cpu className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI & Engine</h2>
          <p className="text-sm text-muted-foreground">Choose the AI model used for store creation and Deal Maker chat responses</p>
        </div>
      </div>

      {/* Provider picker */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">AI Provider</Label>
        <div className="grid sm:grid-cols-3 gap-3">
          {AI_PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProvider(p)}
                className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                  active ? "border-violet-500 bg-violet-500/10" : "border-border/40 hover:border-border"
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model picker */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Model</Label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
        >
          {activeProvider.models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          This model powers auto-building new stores and the Deal Maker sales agent's replies. Higher-quality models produce better content but use more credits.
        </p>
      </div>

      {/* API key — only for external providers */}
      {provider === "openai" && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> OpenAI API Key
          </Label>
          <Input
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="sk-..."
            className="bg-secondary/40 border-border/50 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Get one at platform.openai.com/api-keys. Stored securely and used only on the backend.
          </p>
        </div>
      )}

      {provider === "gemini" && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Gemini API Key
          </Label>
          <Input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIza..."
            className="bg-secondary/40 border-border/50 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Get one at aistudio.google.com/apikey. Stored securely and used only on the backend.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}