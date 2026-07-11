import React, { useState, useEffect } from "react";
import { Cpu, Save, Check, KeyRound, Mic, Volume2, FileAudio, PlugZap } from "lucide-react";
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
    voices: [
      { id: "river", name: "River (calm)" },
      { id: "honey", name: "Honey (warm)" },
      { id: "sunny", name: "Sunny (upbeat)" },
      { id: "storm", name: "Storm (formal)" },
      { id: "spark", name: "Spark (energetic)" },
    ],
    voiceModels: [{ id: "", name: "Default" }],
    transcribeModels: [{ id: "", name: "Default (Whisper)" }],
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "Real OpenAI API — needs your API key.",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (fast)" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "o4-mini", name: "o4-mini (reasoning)" },
      { id: "o3", name: "o3 (highest reasoning)" },
    ],
    voices: [
      { id: "alloy", name: "Alloy" },
      { id: "echo", name: "Echo" },
      { id: "fable", name: "Fable" },
      { id: "onyx", name: "Onyx" },
      { id: "nova", name: "Nova" },
      { id: "shimmer", name: "Shimmer" },
    ],
    voiceModels: [
      { id: "gpt-4o-mini-tts", name: "GPT-4o Mini TTS (latest)" },
      { id: "tts-1", name: "TTS-1 (fast)" },
      { id: "tts-1-hd", name: "TTS-1 HD (quality)" },
    ],
    transcribeModels: [
      { id: "gpt-4o-mini-transcribe", name: "GPT-4o Mini Transcribe (latest)" },
      { id: "gpt-4o-transcribe", name: "GPT-4o Transcribe" },
      { id: "whisper-1", name: "Whisper-1" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    desc: "Real Gemini API — needs your API key. Voice & transcription fall back to Base44.",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (fast)" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (highest quality)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    ],
    voices: [
      { id: "river", name: "River (calm)" },
      { id: "honey", name: "Honey (warm)" },
      { id: "sunny", name: "Sunny (upbeat)" },
    ],
    voiceModels: [{ id: "", name: "Default (via Base44)" }],
    transcribeModels: [{ id: "", name: "Default (via Base44)" }],
  },
];

export default function AIEngineSettings() {
  const [configId, setConfigId] = useState(null);
  const [provider, setProvider] = useState("base44");
  const [model, setModel] = useState("automatic");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [voiceModel, setVoiceModel] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [transcribeModel, setTranscribeModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
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
          setVoiceModel(eng.voiceModel || "");
          setVoiceName(eng.voiceName || "");
          setTranscribeModel(eng.transcribeModel || "");
        }
      } catch { /* none yet */ }
      setLoading(false);
    })();
  }, []);

  const activeProvider = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];

  const selectProvider = (p) => {
    setProvider(p.id);
    // Default to that provider's first model/voice when switching.
    setModel(p.models[0].id);
    setVoiceModel(p.voiceModels[0].id);
    setVoiceName(p.voices[0].id);
    setTranscribeModel(p.transcribeModels[0].id);
  };

  const buildEnginePayload = () => ({
    provider,
    model: model || activeProvider.models[0].id,
    openaiApiKey: openaiApiKey.trim(),
    geminiApiKey: geminiApiKey.trim(),
    voiceModel,
    voiceName,
    transcribeModel,
  });

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await base44.functions.invoke("aiTest", {
        provider,
        model: model || activeProvider.models[0].id,
        openaiApiKey: openaiApiKey.trim(),
        geminiApiKey: geminiApiKey.trim(),
      });
      if (res.data?.ok) toast.success(res.data.message || "Connection successful.");
      else toast.error(res.data?.error || "Connection failed.");
    } catch {
      toast.error("Could not run the test.");
    } finally {
      setTesting(false);
    }
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
      const payload = { aiEngine: buildEnginePayload() };
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

      {/* Voice & transcription — same provider source as the LLM */}
      <div className="border-t border-border/40 pt-6 space-y-5">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-foreground">Voice & Transcription</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Text-to-speech and speech-to-text use the same provider &amp; API key selected above.
          {provider === "gemini" && " Gemini has no built-in voice here, so these fall back to Base44."}
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* TTS voice */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Voice (Text-to-Speech)
            </Label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
            >
              {activeProvider.voices.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* TTS model */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Voice Model</Label>
            <select
              value={voiceModel}
              onChange={(e) => setVoiceModel(e.target.value)}
              className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
            >
              {activeProvider.voiceModels.map((m) => (
                <option key={m.id || "default"} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Transcribe model */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5" /> Transcription Model (Speech-to-Text)
            </Label>
            <select
              value={transcribeModel}
              onChange={(e) => setTranscribeModel(e.target.value)}
              className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
            >
              {activeProvider.transcribeModels.map((m) => (
                <option key={m.id || "default"} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        <Button onClick={handleTest} disabled={testing} variant="outline" className="h-10 px-6">
          <PlugZap className="w-4 h-4 mr-2" />
          {testing ? "Testing..." : "Test Connection"}
        </Button>
      </div>
    </div>
  );
}