import React, { useRef, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Voice-to-text mic. Records audio via MediaRecorder, uploads it, then
// transcribes with Base44's built-in TranscribeAudio integration and hands
// the text back to the composer.
// While recording it shows a live waveform driven by real mic volume and
// AUTO-STOPS after a short silence once the user stops talking.
const SILENCE_MS = 1800;   // stop after this much continuous quiet
const SILENCE_LEVEL = 0.045; // RMS below this counts as silence
const BARS = 5;

export default function DealMakerMicButton({ brandColor = "#6366f1", disabled, onTranscript }) {
  const [state, setState] = useState("idle"); // idle | recording | processing
  const [levels, setLevels] = useState(Array(BARS).fill(0.15));
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const silenceStartRef = useRef(null);
  const spokeRef = useRef(false);

  const cleanupAudio = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  // Monitors volume: animates the waveform + auto-stops on sustained silence.
  const monitor = (stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      // waveform bars react to the current level
      const scaled = Math.min(1, rms * 6);
      setLevels((prev) => prev.map((_, i) => {
        const jitter = 0.6 + Math.random() * 0.4;
        return Math.max(0.12, scaled * jitter);
      }));

      // silence-based auto stop (only after the user has spoken at least once)
      if (rms > SILENCE_LEVEL) {
        spokeRef.current = true;
        silenceStartRef.current = null;
      } else if (spokeRef.current) {
        if (silenceStartRef.current == null) silenceStartRef.current = performance.now();
        else if (performance.now() - silenceStartRef.current > SILENCE_MS) {
          stop();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
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
      silenceStartRef.current = null;
      spokeRef.current = false;
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        cleanupAudio();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setLevels(Array(BARS).fill(0.15));
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
      monitor(stream);
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
      className="absolute right-14 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-40 transition-all"
      style={recording ? { width: 56, color: "#fff", background: "rgba(239,68,68,0.22)" } : { width: 40 }}
    >
      {processing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : recording ? (
        // Live waveform — bars pulse with the actual mic volume
        <span className="flex items-center gap-[3px] h-4">
          {levels.map((l, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full transition-[height] duration-75"
              style={{ height: `${Math.round(4 + l * 14)}px`, background: brandColor }}
            />
          ))}
        </span>
      ) : (
        <Mic className="w-4 h-4 relative" />
      )}
    </button>
  );
}