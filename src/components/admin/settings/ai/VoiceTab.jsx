import React from "react";
import { Volume2, FileAudio, Play, Loader2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import ProviderPicker from "./ProviderPicker";

// Voice & transcription — its OWN provider, independent from the text LLM.
export default function VoiceTab({
  voiceProviders, voiceProvider, onSelectVoiceProvider, activeVoiceProvider,
  voiceName, setVoiceName,
  voiceModel, setVoiceModel,
  voiceInstructions, setVoiceInstructions,
  transcribeModel, setTranscribeModel,
  previewing, playSample,
}) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Pick the voice provider separately from the text provider — e.g. use one AI for the agent's words and another for how it sounds.
        {voiceProvider === "gemini" && " Gemini uses its native TTS voices; transcription falls back to Base44."}
      </p>

      {/* Voice provider picker */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Voice Provider (Text-to-Speech)</Label>
        <ProviderPicker providers={voiceProviders} selectedId={voiceProvider} onSelect={onSelectVoiceProvider} columns={3} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* TTS voice — pick + play a sample of each */}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Voice (Text-to-Speech)
          </Label>
          <div className="grid sm:grid-cols-2 gap-2">
            {activeVoiceProvider.voices.map((v) => {
              const selected = voiceName === v.id;
              const isPreviewing = previewing === v.id;
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all ${
                    selected ? "border-violet-500 bg-violet-500/10" : "border-border/40 hover:border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setVoiceName(v.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? "border-violet-500 bg-violet-500" : "border-border"}`}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="text-sm">{v.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playSample(v)}
                    disabled={isPreviewing}
                    className="w-8 h-8 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center shrink-0 transition-colors disabled:opacity-60"
                    aria-label={`Play ${v.name} sample`}
                    title="Play sample"
                  >
                    {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* TTS model */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Voice Model</Label>
          <select
            value={voiceModel}
            onChange={(e) => setVoiceModel(e.target.value)}
            className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
          >
            {activeVoiceProvider.voiceModels.map((m) => (
              <option key={m.id || "default"} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Custom voice instructions — OpenAI (gpt-4o-mini-tts) & Gemini TTS both
            accept a natural-language style prompt to steer tone/emotion/pacing. */}
        {(voiceProvider === "openai" || voiceProvider === "gemini") && (
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Custom Voice Instructions
            </Label>
            <textarea
              value={voiceInstructions}
              onChange={(e) => setVoiceInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Speak warmly and confidently, like a friendly sales expert. Keep an upbeat, energetic pace."
              className="w-full bg-secondary/40 border border-border/50 rounded-xl px-3 py-2 text-sm resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Steers the voice's tone, emotion and pacing.
              {voiceProvider === "openai" ? " Works best with the GPT-4o Mini TTS model." : " Applied as a style prompt to Gemini TTS."}
            </p>
          </div>
        )}

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
            {activeVoiceProvider.transcribeModels.map((m) => (
              <option key={m.id || "default"} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}