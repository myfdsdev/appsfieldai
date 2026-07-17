import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

// Editor for the store's custom banner section — a themed image band with a
// headline + subheadline and an adjustable text position (left / center / right).
export default function CustomBannerEditor({ form, setForm }) {
  const positions = [
    { value: "left", icon: AlignLeft, label: "Left" },
    { value: "center", icon: AlignCenter, label: "Center" },
    { value: "right", icon: AlignRight, label: "Right" },
  ];
  const pos = form.customBannerTextPosition || "center";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        A themed banner band — great for exclusive content, an announcement or a promo. Matches your hero style at half its height.
      </p>

      <div>
        <label className="text-xs text-muted-foreground">Banner Image (background)</label>
        <div className="mt-1">
          <R2ImageUpload
            value={form.customBannerImageUrl}
            onChange={(url) => setForm((f) => ({ ...f, customBannerImageUrl: url }))}
            campaignId="store-custom-banner"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Heading</label>
        <Input
          value={form.customBannerTitle || ""}
          onChange={(e) => setForm((f) => ({ ...f, customBannerTitle: e.target.value }))}
          className="bg-secondary/50 border-border/30 rounded-xl mt-1"
          placeholder="Exclusive content just for you"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Subheadline</label>
        <Textarea
          value={form.customBannerSubtitle || ""}
          onChange={(e) => setForm((f) => ({ ...f, customBannerSubtitle: e.target.value }))}
          className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-16 resize-none"
          placeholder="Add a short supporting line here."
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Text Position</label>
        <div className="flex gap-2 mt-1.5">
          {positions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, customBannerTextPosition: value }))}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                pos === value
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-secondary/50 text-muted-foreground border-border/30 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}