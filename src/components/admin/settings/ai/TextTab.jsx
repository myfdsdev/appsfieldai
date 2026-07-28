import React from "react";
import { Label } from "@/components/ui/label";
import ProviderPicker from "./ProviderPicker";

// Text / LLM provider + model selection.
export default function TextTab({ providers, provider, model, setModel, onSelectProvider, activeProvider }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Agent Text Provider (LLM)</Label>
        <ProviderPicker providers={providers} selectedId={provider} onSelect={onSelectProvider} columns={3} />
      </div>

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
    </div>
  );
}