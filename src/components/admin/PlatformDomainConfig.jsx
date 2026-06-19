import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Globe, Save, Copy, Check, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function SampleRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="flex items-center gap-2 bg-[#252525] border border-border/30 rounded-lg px-3 py-2">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-24 shrink-0">{label}</span>
      <code className="text-xs font-mono flex-1 truncate text-foreground">{value}</code>
      <button onClick={copy} className="p-1 rounded hover:bg-secondary shrink-0">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function PlatformDomainConfig() {
  const [platformDomain, setPlatformDomain] = useState("");
  const [configId, setConfigId] = useState(null);
  const [detected, setDetected] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const configs = await base44.entities.AppConfig.filter({ key: "main" });
        if (configs?.[0]) {
          setConfigId(configs[0].id);
          if (configs[0].platformDomain) setPlatformDomain(configs[0].platformDomain);
        }
      } catch { /* none yet */ }
      try {
        const res = await base44.functions.invoke("getPlatformDomain", {});
        setDetected(res.data?.platformDomain || "");
        setSource(res.data?.source || "");
      } catch { /* ignore */ }
    })();
  }, []);

  const handleSave = async () => {
    const clean = platformDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    if (!clean) return toast.error("Enter a platform domain");
    setSaving(true);
    try {
      if (configId) await base44.entities.AppConfig.update(configId, { platformDomain: clean });
      else {
        const created = await base44.entities.AppConfig.create({ key: "main", platformDomain: clean });
        setConfigId(created.id);
      }
      setPlatformDomain(clean);
      toast.success("Platform domain saved — user subdomain & DNS samples updated.");
    } catch {
      toast.error("Failed to save domain.");
    }
    setSaving(false);
  };

  const dom = platformDomain || detected || "yourdomain.com";
  const txtKey = dom.split(".")[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-foreground">
            <Globe className="w-4 h-4 text-orange-400" />Platform Domain
            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] ml-1">System Config</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set your platform's base domain. This powers every store owner's free subdomain and the DNS records they paste to connect a custom domain.
          </p>

          <div className="flex gap-2">
            <Input
              value={platformDomain}
              onChange={(e) => setPlatformDomain(e.target.value)}
              placeholder="saasshare.app"
              className="bg-[#252525] border-border/30 rounded-xl font-mono"
            />
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl gap-1.5">
              <Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {detected && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <span>
                Live detected domain: <code className="font-mono text-blue-400">{detected}</code>
                <span className="text-muted-foreground/70"> · {source === "configured" ? "from this setting" : source === "auto_detected" ? "auto-detected from your Base44 custom domain" : "default — set yours above"}</span>
              </span>
            </div>
          )}

          {/* Sample URLs users will see */}
          <div className="space-y-2 p-3 rounded-xl border border-border/30 bg-[#151515]">
            <p className="text-xs font-semibold text-foreground">Sample URLs shown to store owners</p>
            <SampleRow label="Subdomain" value={`mystore.${dom}`} />
            <SampleRow label="CNAME target" value={`cname.${dom}`} />
            <SampleRow label="TXT host" value={`_${txtKey}.deals.clientbrand.com`} />
            <SampleRow label="TXT value" value={`${txtKey}-verify=vk_xxxxxxxx`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}