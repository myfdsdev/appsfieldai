import React, { useState, useEffect, useRef } from "react";
import { Cpu, Save, PlugZap, KeyRound, MessageSquare, Image as ImageIcon, Video, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ApiKeysTab from "./ai/ApiKeysTab";
import TextTab from "./ai/TextTab";
import MediaTab from "./ai/MediaTab";
import VoiceTab from "./ai/VoiceTab";

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
    desc: "Real Gemini API — needs your API key. Native Gemini TTS voices supported.",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (fast)" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (fastest)" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (highest quality)" },
      { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
    ],
    // Native Gemini TTS prebuilt voices (each ships with its own character).
    voices: [
      { id: "Zephyr", name: "Zephyr (bright)" },
      { id: "Puck", name: "Puck (upbeat)" },
      { id: "Charon", name: "Charon (informative)" },
      { id: "Kore", name: "Kore (firm)" },
      { id: "Fenrir", name: "Fenrir (excitable)" },
      { id: "Leda", name: "Leda (youthful)" },
      { id: "Orus", name: "Orus (firm)" },
      { id: "Aoede", name: "Aoede (breezy)" },
      { id: "Callirrhoe", name: "Callirrhoe (easy-going)" },
      { id: "Autonoe", name: "Autonoe (bright)" },
      { id: "Enceladus", name: "Enceladus (breathy)" },
      { id: "Iapetus", name: "Iapetus (clear)" },
    ],
    voiceModels: [
      { id: "gemini-2.5-flash-preview-tts", name: "Gemini 2.5 Flash TTS (fast)" },
      { id: "gemini-2.5-pro-preview-tts", name: "Gemini 2.5 Pro TTS (quality)" },
    ],
    transcribeModels: [{ id: "", name: "Default (via Base44)" }],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    desc: "Real x.ai API — needs your Grok API key.",
    models: [
      { id: "grok-4", name: "Grok 4 (highest quality)" },
      { id: "grok-4-fast-reasoning", name: "Grok 4 Fast (reasoning)" },
      { id: "grok-4-fast-non-reasoning", name: "Grok 4 Fast (fast)" },
      { id: "grok-3", name: "Grok 3" },
      { id: "grok-3-mini", name: "Grok 3 Mini (cheapest)" },
    ],
    voices: [],
    voiceModels: [],
    transcribeModels: [],
  },
];

// Image & video generation providers/models (separate from the text LLM).
export const AI_IMAGE_PROVIDERS = [
  {
    id: "base44",
    name: "Base44 (Built-in)",
    desc: "Base44's built-in image generation — no setup needed.",
    models: [{ id: "", name: "Default" }],
  },
  {
    id: "xai",
    name: "xAI (Grok Imagine)",
    desc: "Grok image generation — uses your xAI API key.",
    models: [
      { id: "grok-2-image", name: "Grok 2 Image" },
      { id: "grok-imagine-image-quality", name: "Grok Imagine (quality)" },
      { id: "grok-imagine-image-fast", name: "Grok Imagine (fast)" },
    ],
  },
  {
    id: "kie",
    name: "Kie.ai (Grok Imagine)",
    desc: "Kie.ai-hosted image models — uses your Kie.ai API key.",
    models: [
      { id: "grok-imagine-image-1-5-preview", name: "Grok Imagine Image 1.5 (preview)" },
      { id: "google/nano-banana", name: "Google Nano Banana" },
    ],
  },
];

export const AI_VIDEO_PROVIDERS = [
  {
    id: "base44",
    name: "Base44 (Built-in)",
    desc: "Base44's built-in video generation — no setup needed.",
    models: [{ id: "", name: "Default (Veo)" }],
  },
  {
    id: "xai",
    name: "xAI (Grok Imagine)",
    desc: "Grok video generation — uses your xAI API key.",
    models: [
      { id: "grok-imagine-video", name: "Grok Imagine Video" },
      { id: "grok-imagine-video-fast", name: "Grok Imagine Video (fast)" },
    ],
  },
  {
    id: "kie",
    name: "Kie.ai (Grok Imagine)",
    desc: "Kie.ai-hosted Grok Imagine video — uses your Kie.ai API key.",
    models: [
      { id: "grok-imagine-video-1-5-preview", name: "Grok Imagine Video 1.5 (preview)" },
    ],
  },
];

export default function AIEngineSettings() {
  const [configId, setConfigId] = useState(null);
  const [provider, setProvider] = useState("base44");
  const [voiceProvider, setVoiceProvider] = useState("base44");
  const [model, setModel] = useState("automatic");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [xaiApiKey, setXaiApiKey] = useState("");
  const [kieAiApiKey, setKieAiApiKey] = useState("");
  const [imageProvider, setImageProvider] = useState("base44");
  const [imageModel, setImageModel] = useState("");
  const [videoProvider, setVideoProvider] = useState("base44");
  const [videoModel, setVideoModel] = useState("");
  const [voiceModel, setVoiceModel] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [voiceInstructions, setVoiceInstructions] = useState("");
  const [transcribeModel, setTranscribeModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(null);
  const audioRef = useRef(null);

  // Play a short spoken sample of a voice using the currently-selected
  // (possibly unsaved) provider / model / key.
  const playSample = async (v) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setPreviewing(v.id);
    try {
      // Generate each voice's sample ONCE (server caches it), then replay the
      // stored file instantly on every later preview.
      const res = await base44.functions.invoke("voiceSample", {
        voice: v.id,
        name: v.name,
        provider: voiceProvider,
        voiceModel,
        voiceInstructions: voiceInstructions.trim(),
        openaiApiKey: openaiApiKey.trim(),
        geminiApiKey: geminiApiKey.trim(),
      });
      const url = res?.data?.url;
      if (!url) { toast.error("Couldn't generate a sample."); setPreviewing(null); return; }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPreviewing(null);
      audio.onerror = () => { toast.error("Couldn't play the sample."); setPreviewing(null); };
      audio.play().catch(() => { toast.error("Couldn't play the sample."); setPreviewing(null); });
    } catch {
      toast.error("Couldn't play the sample.");
      setPreviewing(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        const cfg = configs?.[0];
        if (cfg) {
          setConfigId(cfg.id);
          const eng = cfg.aiEngine || {};
          setProvider(eng.provider || "base44");
          // Voice provider is independent; fall back to legacy shared provider.
          setVoiceProvider(eng.voiceProvider || eng.provider || "base44");
          setModel(eng.model || (eng.provider ? "" : "automatic"));
          setOpenaiApiKey(eng.openaiApiKey || "");
          setGeminiApiKey(eng.geminiApiKey || "");
          setXaiApiKey(eng.xaiApiKey || "");
          setKieAiApiKey(eng.kieAiApiKey || "");
          setImageProvider(eng.imageProvider || "base44");
          setImageModel(eng.imageModel || "");
          setVideoProvider(eng.videoProvider || "base44");
          setVideoModel(eng.videoModel || "");
          setVoiceModel(eng.voiceModel || "");
          setVoiceName(eng.voiceName || "");
          setVoiceInstructions(eng.voiceInstructions || "");
          setTranscribeModel(eng.transcribeModel || "");
        }
      } catch { /* none yet */ }
      setLoading(false);
    })();
  }, []);

  const activeProvider = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];
  // Voice-specific provider — drives the voice list, voice model, transcription
  // and voice instructions, independent from the text/LLM provider above.
  const activeVoiceProvider = AI_PROVIDERS.find((p) => p.id === voiceProvider) || AI_PROVIDERS[0];
  const activeImageProvider = AI_IMAGE_PROVIDERS.find((p) => p.id === imageProvider) || AI_IMAGE_PROVIDERS[0];
  const activeVideoProvider = AI_VIDEO_PROVIDERS.find((p) => p.id === videoProvider) || AI_VIDEO_PROVIDERS[0];

  const selectProvider = (p) => {
    setProvider(p.id);
    // Default to that provider's first text model when switching.
    setModel(p.models[0].id);
  };

  const selectVoiceProvider = (p) => {
    setVoiceProvider(p.id);
    // Default to that provider's first voice/voice-model/transcription when switching.
    setVoiceModel(p.voiceModels[0].id);
    setVoiceName(p.voices[0].id);
    setTranscribeModel(p.transcribeModels[0].id);
  };

  const selectImageProvider = (p) => {
    setImageProvider(p.id);
    setImageModel(p.models[0].id);
  };

  const selectVideoProvider = (p) => {
    setVideoProvider(p.id);
    setVideoModel(p.models[0].id);
  };

  // Does the current text OR voice provider require this external key?
  const needsOpenaiKey = provider === "openai" || voiceProvider === "openai";
  const needsGeminiKey = provider === "gemini" || voiceProvider === "gemini";
  // xAI key needed if selected for text, image, or video generation.
  const needsXaiKey = provider === "xai" || imageProvider === "xai" || videoProvider === "xai";
  // Kie.ai key needed if selected for image or video generation.
  const needsKieKey = imageProvider === "kie" || videoProvider === "kie";

  const buildEnginePayload = () => ({
    provider,
    voiceProvider,
    model: model || activeProvider.models[0].id,
    openaiApiKey: openaiApiKey.trim(),
    geminiApiKey: geminiApiKey.trim(),
    xaiApiKey: xaiApiKey.trim(),
    kieAiApiKey: kieAiApiKey.trim(),
    imageProvider,
    imageModel,
    videoProvider,
    videoModel,
    voiceModel,
    voiceName,
    voiceInstructions: voiceInstructions.trim(),
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
        xaiApiKey: xaiApiKey.trim(),
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
    if (needsOpenaiKey && !openaiApiKey.trim()) {
      toast.error("Enter your OpenAI API key.");
      return;
    }
    if (needsGeminiKey && !geminiApiKey.trim()) {
      toast.error("Enter your Gemini API key.");
      return;
    }
    if (needsXaiKey && !xaiApiKey.trim()) {
      toast.error("Enter your xAI (Grok) API key.");
      return;
    }
    if (needsKieKey && !kieAiApiKey.trim()) {
      toast.error("Enter your Kie.ai API key.");
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

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/40 p-1 rounded-xl">
          <TabsTrigger value="keys" className="gap-1.5"><KeyRound className="w-4 h-4" /> API Keys</TabsTrigger>
          <TabsTrigger value="text" className="gap-1.5"><MessageSquare className="w-4 h-4" /> Text / LLM</TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5"><ImageIcon className="w-4 h-4" /> Image</TabsTrigger>
          <TabsTrigger value="video" className="gap-1.5"><Video className="w-4 h-4" /> Video</TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5"><Mic className="w-4 h-4" /> Voice / Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-6">
          <ApiKeysTab
            openaiApiKey={openaiApiKey} setOpenaiApiKey={setOpenaiApiKey}
            geminiApiKey={geminiApiKey} setGeminiApiKey={setGeminiApiKey}
            xaiApiKey={xaiApiKey} setXaiApiKey={setXaiApiKey}
            kieAiApiKey={kieAiApiKey} setKieAiApiKey={setKieAiApiKey}
          />
        </TabsContent>

        <TabsContent value="text" className="mt-6">
          <TextTab
            providers={AI_PROVIDERS}
            provider={provider}
            model={model}
            setModel={setModel}
            onSelectProvider={selectProvider}
            activeProvider={activeProvider}
          />
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <MediaTab
            providers={AI_IMAGE_PROVIDERS}
            providerId={imageProvider}
            model={imageModel}
            setModel={setImageModel}
            onSelectProvider={selectImageProvider}
            activeProvider={activeImageProvider}
            helpText="Used whenever the app generates images (store creation, product art, etc.)."
          />
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <MediaTab
            providers={AI_VIDEO_PROVIDERS}
            providerId={videoProvider}
            model={videoModel}
            setModel={setVideoModel}
            onSelectProvider={selectVideoProvider}
            activeProvider={activeVideoProvider}
            helpText="Used whenever the app generates videos. Video generation may take a while."
          />
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <VoiceTab
            voiceProviders={AI_PROVIDERS.filter((p) => p.voices.length > 0)}
            voiceProvider={voiceProvider}
            onSelectVoiceProvider={selectVoiceProvider}
            activeVoiceProvider={activeVoiceProvider}
            voiceName={voiceName} setVoiceName={setVoiceName}
            voiceModel={voiceModel} setVoiceModel={setVoiceModel}
            voiceInstructions={voiceInstructions} setVoiceInstructions={setVoiceInstructions}
            transcribeModel={transcribeModel} setTranscribeModel={setTranscribeModel}
            previewing={previewing} playSample={playSample}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3 pt-6 border-t border-border/40 mt-6">
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