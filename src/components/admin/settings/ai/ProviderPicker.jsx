import React from "react";
import { Check } from "lucide-react";

// Reusable provider card grid used across all AI setting tabs.
export default function ProviderPicker({ providers, selectedId, onSelect, columns = 3 }) {
  const colClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  return (
    <div className={`grid ${colClass} gap-3`}>
      {providers.map((p) => {
        const active = selectedId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
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
  );
}