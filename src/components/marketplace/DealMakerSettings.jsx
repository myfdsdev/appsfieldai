import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Check } from "lucide-react";
import R2ImageUpload from "@/components/marketplace/R2ImageUpload";

const LAYOUTS = [
  { key: "centered", label: "Centered", hint: "Orb on top, chat below" },
  { key: "avatar_left", label: "Character Left", hint: "Image left, chat right" },
  { key: "avatar_right", label: "Character Right", hint: "Chat left, image right" },
  { key: "spotlight", label: "Spotlight", hint: "Large image, chat over it" },
];

// Tiny visual thumbnails of each layout
function LayoutThumb({ variant }) {
  const orb = <span className="block w-3 h-3 rounded-full bg-white/70 mx-auto" />;
  const lines = (
    <span className="block space-y-1">
      <span className="block h-1 w-3/4 mx-auto rounded bg-white/40" />
      <span className="block h-1 w-1/2 mx-auto rounded bg-white/25" />
    </span>
  );
  const person = <span className="block w-4 h-6 rounded bg-white/60 mx-auto" />;
  if (variant === "centered") {
    return <span className="block space-y-1.5">{orb}{lines}</span>;
  }
  if (variant === "avatar_left") {
    return <span className="flex items-center gap-1.5">{person}<span className="flex-1">{lines}</span></span>;
  }
  if (variant === "avatar_right") {
    return <span className="flex items-center gap-1.5"><span className="flex-1">{lines}</span>{person}</span>;
  }
  // spotlight
  return (
    <span className="relative block">
      <span className="block w-5 h-7 rounded bg-white/40 mx-auto" />
      <span className="absolute inset-x-1 bottom-0">{lines}</span>
    </span>
  );
}

// Store-owner settings for the Deal Maker AI sales agent.
// Feeds the agent its name, persona context, greeting and a free-form
// knowledge base (store info, tasks, rules, FAQs) used to train its replies.
export default function DealMakerSettings({ deal, onChange }) {
  const set = (k) => (e) => onChange(k, e.target.value);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium">Deal Maker Sales Agent</p>
          <p className="text-[11px] text-muted-foreground">The AI closer that greets visitors on your store, matches them to products and captures leads. Train it below.</p>
        </div>
      </div>

      {/* Profile image — shown in the centered welcome hero and chat header */}
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {deal.dealMakerImageUrl ? (
            <img src={deal.dealMakerImageUrl} alt="Agent" className="w-20 h-20 rounded-2xl object-cover border border-border/40" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Agent Profile Image</label>
          <div className="mt-1">
            <R2ImageUpload value={deal.dealMakerImageUrl} onChange={(url) => onChange("dealMakerImageUrl", url)} campaignId="deal-maker-avatar" placeholder="https://..." />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">A professional headshot or avatar shown in the centered welcome and chat.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Agent Name</label>
          <Input value={deal.dealMakerName} onChange={set("dealMakerName")} placeholder="Max" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Title / Tagline</label>
          <Input value={deal.dealMakerTagline} onChange={set("dealMakerTagline")} placeholder="AI Deal Strategist" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Owner Name (for follow-ups)</label>
          <Input value={deal.dealMakerOwnerName} onChange={set("dealMakerOwnerName")} placeholder="Your name" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
      </div>

      {/* Layout picker */}
      <div>
        <label className="text-xs text-muted-foreground">Chat Layout</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
          {LAYOUTS.map((l) => {
            const active = (deal.dealMakerLayout || "centered") === l.key;
            return (
              <button
                key={l.key}
                type="button"
                onClick={() => onChange("dealMakerLayout", l.key)}
                className={`relative text-left rounded-xl border p-3 transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border/40 bg-secondary/30 hover:border-border"
                }`}
              >
                {active && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </span>
                )}
                <span className="block rounded-lg bg-neutral-900 p-2.5 h-14 flex items-center">
                  <span className="block w-full"><LayoutThumb variant={l.key} /></span>
                </span>
                <p className="text-xs font-medium mt-2">{l.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{l.hint}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">Character layouts show a full standing image — use a tall portrait for best results.</p>
      </div>

      {/* Background transparency of the immersive chat overlay */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Chat Background Dim</label>
          <span className="text-xs font-medium text-foreground">{deal.dealMakerBgOpacity ?? 5}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={deal.dealMakerBgOpacity ?? 5}
          onChange={(e) => onChange("dealMakerBgOpacity", Number(e.target.value))}
          className="w-full mt-2 accent-primary"
        />
        <p className="text-[11px] text-muted-foreground mt-1">How dark the store fades behind the chat. 0% = fully see-through, 100% = solid dark.</p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Who You Help (niche)</label>
        <Input value={deal.dealMakerNiche} onChange={set("dealMakerNiche")} placeholder="e.g. gym owners, coaches, local restaurants" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Guarantee Line</label>
        <Input value={deal.dealMakerGuarantee} onChange={set("dealMakerGuarantee")} placeholder="e.g. 30-day money-back guarantee" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Opening Greeting <span className="opacity-60">(optional)</span></label>
        <Textarea value={deal.dealMakerGreeting} onChange={set("dealMakerGreeting")} placeholder="Leave blank to auto-generate. e.g. Hey, welcome to our store — I'm Max. What kind of business do you run?" className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-20" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Training / Knowledge Base</label>
        <Textarea
          value={deal.dealMakerKnowledge}
          onChange={set("dealMakerKnowledge")}
          placeholder={"Feed the agent everything it should know: store background, your best offers, bundle rules, common objections & how to handle them, delivery/support details, FAQs, and specific selling tasks. The agent uses this to sell accurately — it never invents anything outside it."}
          className="bg-secondary/50 border-border/30 rounded-xl mt-1 h-48"
        />
        <p className="text-[11px] text-muted-foreground mt-1">The more you add, the sharper the agent sells. It only uses facts you provide plus your live product catalog.</p>
      </div>
    </div>
  );
}