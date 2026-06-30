import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon, RotateCcw, Save } from "lucide-react";
import {
  THEME_CONFIG_KEY,
  COLOR_TOKENS,
  DEFAULT_COLORS,
  applyThemeColors,
} from "@/lib/themeColors";

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-sm text-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="no-global-input-style w-24 h-8 rounded-md border border-border bg-background px-2 text-xs font-mono"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-md border border-border bg-transparent cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function ThemeColorSettings() {
  const [mode, setMode] = useState("dark");
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [saving, setSaving] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["themeColorsConfig"],
    queryFn: () =>
      base44.entities.AppConfig.filter({ key: THEME_CONFIG_KEY }).then((r) => r[0] || null),
  });

  useEffect(() => {
    if (config?.themeColors) {
      setColors({
        light: { ...DEFAULT_COLORS.light, ...(config.themeColors.light || {}) },
        dark: { ...DEFAULT_COLORS.dark, ...(config.themeColors.dark || {}) },
      });
    }
  }, [config]);

  const updateColor = (token, value) => {
    setColors((prev) => ({ ...prev, [mode]: { ...prev[mode], [token]: value } }));
  };

  // Live preview the active mode's colors as the admin edits them.
  const preview = () => applyThemeColors(colors, document.documentElement.classList.contains("dark") ? "dark" : "light");
  useEffect(() => { preview(); /* eslint-disable-next-line */ }, [colors]);

  const handleReset = () => {
    setColors((prev) => ({ ...prev, [mode]: { ...DEFAULT_COLORS[mode] } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { key: THEME_CONFIG_KEY, themeColors: colors };
      if (config?.id) await base44.entities.AppConfig.update(config.id, payload);
      else await base44.entities.AppConfig.create(payload);
      toast({ title: "Theme colors saved", description: "Your color scheme is now live across the app." });
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading theme colors...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground">Theme Colors</h2>
        <p className="text-sm text-muted-foreground">Customize the light and dark mode color scheme of your app.</p>
      </div>

      {/* Light / Dark mode switch for which palette you're editing */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 w-fit">
        {[
          { id: "light", label: "Light Mode", icon: Sun },
          { id: "dark", label: "Dark Mode", icon: Moon },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border/40">
        {COLOR_TOKENS.map(({ token, label }) => (
          <ColorRow
            key={token}
            label={label}
            value={colors[mode][token]}
            onChange={(v) => updateColor(token, v)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Colors"}
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="w-4 h-4" /> Reset {mode === "dark" ? "Dark" : "Light"}
        </Button>
      </div>
    </div>
  );
}