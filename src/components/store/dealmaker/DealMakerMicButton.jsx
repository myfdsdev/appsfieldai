import React, { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Voice-to-text mic. Records audio via MediaRecorder, uploads it, then
// transcribes with Base44's built-in TranscribeAudio integration and hands
// the text back to the composer. (Later swappable for Gemini/OpenAI/OpenRouter.)
export default function DealMakerMicButton({ brandColor = "#6366f1", disabled, onTranscript }) {
  const [state, setState] = useState("idle"); // idle | recording | processing
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const stop = () => {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      console.warn("voice recording not supported in this context");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setState("processing");
        try {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
          const file = new File([blob], "voice.webm", { type: blob.type });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
          const clean = (typeof text === "string" ? text : text?.transcript || "").trim();
          if (clean) onTranscript?.(clean);
        } catch (e) {
          console.error("transcription failed", e);
        }
        setState("idle");
      };
      rec.start();
      setState("recording");
    } catch (e) {
      console.error("mic access denied", e);
      setState("idle");
    }
  };

  const onClick = () => {
    if (state === "recording") stop();
    else if (state === "idle") start();
  };

  const recording = state === "recording";
  const processing = state === "processing";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || processing}
      aria-label={recording ? "Stop recording" : "Record voice message"}
      className="absolute right-14 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-40 transition-colors"
      style={recording ? { color: "#fff", background: "rgba(239,68,68,0.25)" } : undefined}
    >
      {recording && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(239,68,68,0.4)" }}
        />
      )}
      {processing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : recording ? (
        <Square className="w-4 h-4 relative" />
      ) : (
        <Mic className="w-4 h-4 relative" />
      )}
    </button>
  );
}