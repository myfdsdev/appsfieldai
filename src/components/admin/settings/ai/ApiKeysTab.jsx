import React from "react";
import { KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function KeyField({ label, value, onChange, placeholder, hint }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5" /> {label}
      </Label>
      <Input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-secondary/40 border-border/50 rounded-xl"
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

// All provider API keys live here, in one place. Each key powers whichever
// text / image / video / voice provider it's selected for in the other tabs.
export default function ApiKeysTab({
  openaiApiKey, setOpenaiApiKey,
  geminiApiKey, setGeminiApiKey,
  xaiApiKey, setXaiApiKey,
  kieAiApiKey, setKieAiApiKey,
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Enter your provider API keys here. Keys are stored securely and used only on the backend — each one powers whichever provider you select in the Text, Image, Video and Voice tabs.
      </p>
      <KeyField
        label="OpenAI API Key"
        value={openaiApiKey}
        onChange={setOpenaiApiKey}
        placeholder="sk-..."
        hint="Get one at platform.openai.com/api-keys. Powers OpenAI text & voice."
      />
      <KeyField
        label="Gemini API Key"
        value={geminiApiKey}
        onChange={setGeminiApiKey}
        placeholder="AIza..."
        hint="Get one at aistudio.google.com/apikey. Powers Gemini text & voice."
      />
      <KeyField
        label="xAI (Grok) API Key"
        value={xaiApiKey}
        onChange={setXaiApiKey}
        placeholder="xai-..."
        hint="Get one at console.x.ai. Powers Grok text, image & video generation."
      />
      <KeyField
        label="Kie.ai API Key"
        value={kieAiApiKey}
        onChange={setKieAiApiKey}
        placeholder="Your Kie.ai API key"
        hint="Get one at kie.ai/api-key. Powers Kie.ai Grok Imagine image & video generation."
      />
    </div>
  );
}