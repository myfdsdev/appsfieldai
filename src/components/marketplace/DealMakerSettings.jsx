import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

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

      <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
        <input
          type="checkbox"
          checked={deal.dealMakerEnabled}
          onChange={(e) => onChange("dealMakerEnabled", e.target.checked)}
          className="accent-violet-500"
        />
        <div>
          <p className="text-sm font-medium">Enable on my store</p>
          <p className="text-[11px] text-muted-foreground">Show the Deal Maker popup and top pill to store visitors</p>
        </div>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Agent Name</label>
          <Input value={deal.dealMakerName} onChange={set("dealMakerName")} placeholder="Max" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Owner Name (for follow-ups)</label>
          <Input value={deal.dealMakerOwnerName} onChange={set("dealMakerOwnerName")} placeholder="Your name" className="bg-secondary/50 border-border/30 rounded-xl mt-1" />
        </div>
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