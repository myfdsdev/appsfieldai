import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Save, ExternalLink, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";

const KIE_SIGNUP_URL = "https://kie.ai?ref=fc6e812ea30915a3af97ab08e1ce6f21";

// Store owner's own AI provider API keys for the Marketing Studio.
// When a key is set, image/video generation uses it and is unlimited
// (plan monthly caps only apply on the shared platform key).
export default function CustomApiKeysSettings({ user, allowed }) {
  const queryClient = useQueryClient();
  const { checkUserAuth } = useAuth();
  const [kieKey, setKieKey] = useState(user?.marketingApiKeys?.kieAiApiKey || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        marketingApiKeys: { ...(user?.marketingApiKeys || {}), kieAiApiKey: kieKey.trim() },
      });
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await checkUserAuth?.();
      toast.success(kieKey.trim() ? "Your Kie.ai key is saved — unlimited generations enabled." : "Custom key removed.");
    } catch (e) {
      toast.error(e.message || "Could not save your key.");
    }
    setSaving(false);
  };

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-6 max-w-xl text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto"><Lock className="w-6 h-6 text-orange-400" /></div>
        <h3 className="font-display font-bold">Custom API Keys is a premium feature</h3>
        <p className="text-sm text-muted-foreground">Upgrade to a plan that allows your own AI API key to generate unlimited Marketing Studio content with your own Kie.ai account.</p>
        <Button asChild className="gap-2"><Link to="/pricing">View Plans</Link></Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-display font-bold">Custom API Keys</p>
          <p className="text-xs text-muted-foreground">Use your own AI account for image & video generation.</p>
        </div>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          When you add your own <span className="font-semibold text-foreground">Kie.ai</span> API key, Marketing Studio uses it for all image & video generations — with <span className="font-semibold text-foreground">no monthly limits</span>. Leave it empty to use the shared platform key (subject to your plan's monthly limits).
        </div>
      </div>

      <div>
        <Label className="text-xs">Kie.ai API Key</Label>
        <Input
          type="password"
          value={kieKey}
          onChange={(e) => setKieKey(e.target.value)}
          placeholder="Paste your Kie.ai API key"
          className="mt-1 font-mono"
        />
        <a
          href={KIE_SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 mt-2 font-medium"
        >
          Don't have a key? Create your Kie.ai account <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save key
      </Button>
    </div>
  );
}