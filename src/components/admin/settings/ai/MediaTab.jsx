import React from "react";
import { Label } from "@/components/ui/label";
import ProviderPicker from "./ProviderPicker";

// Shared layout for the Image and Video tabs — provider cards + model select.
export default function MediaTab({ providers, providerId, model, setModel, onSelectProvider, activeProvider, helpText }) {
  return (
    <div className="space-y-4">
      <Label className="text-sm text-muted-foreground">Provider</Label>
      <ProviderPicker providers={providers} selectedId={providerId} onSelect={onSelectProvider} columns={2} />
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Model</Label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full h-10 bg-secondary/40 border border-border/50 rounded-xl px-3 text-sm"
        >
          {activeProvider.models.map((m) => (
            <option key={m.id || "default"} value={m.id}>{m.name}</option>
          ))}
        </select>
        {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      </div>
    </div>
  );
}