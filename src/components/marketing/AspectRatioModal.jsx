import React from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";

// Popup aspect-ratio picker. Each option renders a scaled proxy rectangle so the
// shape is visually obvious (square, landscape, portrait, etc.).
const RATIO_SHAPE = {
  "1:1": { w: 44, h: 44 },
  "16:9": { w: 56, h: 32 },
  "9:16": { w: 30, h: 52 },
  "4:3": { w: 52, h: 39 },
  "3:4": { w: 39, h: 52 },
  "4:5": { w: 40, h: 50 },
};

export default function AspectRatioModal({ open, onClose, ratios, value, onSelect }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-bold">Select Aspect Ratio</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ratios.map((r) => {
            const active = value === r.id;
            const shape = RATIO_SHAPE[r.id] || RATIO_SHAPE["1:1"];
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => { onSelect(r.id); onClose(); }}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-5 transition-all ${
                  active ? "border-emerald-500 bg-emerald-500/10" : "border-border/40 hover:border-border"
                }`}
              >
                {active && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
                <div className="h-14 flex items-center justify-center">
                  <div
                    style={{ width: shape.w, height: shape.h }}
                    className={`rounded-md border-2 ${active ? "border-emerald-500 bg-emerald-500/20" : "border-muted-foreground/40"}`}
                  />
                </div>
                <span className={`text-sm font-bold ${active ? "text-emerald-500" : "text-foreground"}`}>{r.id}</span>
                <span className="text-[11px] text-muted-foreground">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}