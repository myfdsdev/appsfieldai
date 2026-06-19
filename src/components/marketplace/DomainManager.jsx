import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Globe, CheckCircle2, XCircle, Clock, Copy, Check, RefreshCw, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function genToken() {
  return "vk_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function statusBadge(status) {
  const config = {
    pending: { icon: Clock, bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Pending" },
    in_progress: { icon: RefreshCw, bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Awaiting DNS" },
    verified: { icon: CheckCircle2, bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Verified" },
    active: { icon: ShieldCheck, bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Active" },
    failed: { icon: XCircle, bg: "bg-red-500/10 text-red-400 border-red-500/20", label: "Not Found" },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return <Badge className={`text-[10px] border gap-1 ${c.bg}`}><Icon className="w-3 h-3" />{c.label}</Badge>;
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-secondary/50 border border-border/30 rounded-lg px-3 py-2">
        <code className="text-xs font-mono flex-1 truncate">{value}</code>
        <button onClick={copy} className="p-1 rounded hover:bg-secondary shrink-0">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

export default function DomainManager({ marketplace: marketplaceProp, onUpdate }) {
  // Local mirror of the marketplace so Connect/Verify reflect instantly (the prop is a stale snapshot).
  const [mp, setMp] = useState(marketplaceProp);
  const marketplace = mp || marketplaceProp;
  const [subdomain, setSubdomain] = useState(marketplaceProp?.subdomain || marketplaceProp?.slug || "");
  const [customDomain, setCustomDomain] = useState(marketplaceProp?.customDomain || "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [platformDomain, setPlatformDomain] = useState("");
  const [domainSource, setDomainSource] = useState("");
  const [cnameTarget, setCnameTarget] = useState("");

  useEffect(() => { setMp(marketplaceProp); }, [marketplaceProp]);

  useEffect(() => {
    base44.functions.invoke("getPlatformDomain", {})
      .then(res => {
        setPlatformDomain(res.data?.platformDomain || "");
        setDomainSource(res.data?.source || "");
        setCnameTarget(res.data?.cnameTarget || "");
      })
      .catch(() => {});
  }, []);

  const refreshMp = async () => {
    try {
      const fresh = await base44.entities.Marketplace.get(marketplace.id);
      if (fresh) setMp(fresh);
    } catch { /* ignore */ }
  };

  const PLATFORM_DOMAIN = platformDomain || "your-platform.com";
  const txtKey = PLATFORM_DOMAIN.split(".")[0];

  // The real Base44 host every custom domain must CNAME to (NOT the platform root domain,
  // which would cause Cloudflare Error 1000). Comes from getPlatformDomain.
  const CNAME_TARGET = cnameTarget || "base44.onrender.com";
  // A-record IP for root domains (matches the platform's own root A record).
  const ROOT_A_IP = "216.24.57.1";

  const token = marketplace?.verificationToken;
  const domain = marketplace?.customDomain;
  const isRoot = domain && domain.split(".").length === 2;

  const handleSaveSubdomain = async () => {
    if (!subdomain.trim()) return toast.error("Subdomain is required");
    setSaving(true);
    const slug = subdomain.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await base44.entities.Marketplace.update(marketplace.id, { subdomain: slug });
    onUpdate?.();
    setSaving(false);
    toast.success(`Subdomain saved: ${slug}.${PLATFORM_DOMAIN}`);
  };

  const handleConnectDomain = async () => {
    if (!customDomain.trim()) return;
    setSaving(true);
    const clean = customDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    await base44.entities.Marketplace.update(marketplace.id, {
      customDomain: clean,
      verificationToken: marketplace?.verificationToken || genToken(),
      verificationStatus: "in_progress",
      sslStatus: "pending",
    });
    setCustomDomain(clean);
    await refreshMp();
    onUpdate?.();
    setSaving(false);
    toast.success("Domain connected — add the DNS records below, then verify.");
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await base44.functions.invoke("verifyCustomDomain", { marketplaceId: marketplace.id });
      const data = res.data || {};
      if (data.verified) toast.success(data.message || "Domain verified — your store is connected!");
      else toast.error(data.message || "Verification failed. Check your DNS records.");
      await refreshMp();
      onUpdate?.();
    } catch (err) {
      toast.error("Could not verify domain. Try again shortly.");
    }
    setVerifying(false);
  };

  const subLabel = subdomain || marketplace?.slug;
  // The subdomain is the real, live default store address (wildcard DNS is configured).
  const subdomainUrl = `https://${subLabel}.${PLATFORM_DOMAIN}`;
  const recordHost = domain ? (isRoot ? "@" : domain.split(".")[0]) : "";
  // Relative TXT host (relative to the domain's DNS zone): "@"/sub label only, no domain repeated.
  const txtHost = domain ? (isRoot ? `_${txtKey}-verify` : `_${txtKey}-verify.${domain.split(".")[0]}`) : "";

  return (
    <div className="space-y-6">
      {/* Detected platform domain banner */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-muted-foreground">
          Platform domain:{" "}
          <code className="font-mono text-blue-400">{platformDomain || "detecting…"}</code>
          {domainSource === "auto_detected" && <span className="text-blue-400/60"> · auto-detected from your Base44 custom domain</span>}
          {domainSource === "configured" && <span className="text-blue-400/60"> · set in admin settings</span>}
          {domainSource === "default" && <span className="text-amber-400/70"> · using default — set a Base44 custom domain or configure one in admin</span>}
        </span>
      </div>

      {/* Platform Subdomain */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-orange-400" />
          <h3 className="font-display font-semibold text-base">Free Subdomain</h3>
          <Badge variant="secondary" className="text-[9px]">Instant</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-1">Every store gets a free subdomain — no DNS setup needed.</p>
        <p className="text-[11px] text-muted-foreground mb-4">Example: <code className="font-mono text-orange-400/80">mystore.{PLATFORM_DOMAIN}</code></p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input value={subdomain} onChange={e => setSubdomain(e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl pr-28" placeholder="mystore" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">.{PLATFORM_DOMAIN}</span>
          </div>
          <Button onClick={handleSaveSubdomain} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl gap-1.5"><Globe className="w-4 h-4" />Save</Button>
        </div>
        {subdomain && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline truncate">{subdomainUrl}</a>
              <span className="ml-auto text-[9px] text-emerald-400/60 shrink-0">Live now</span>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Globe className="w-3 h-3 mt-0.5 shrink-0" />
              This is your store's default address — live instantly via wildcard DNS, no setup needed.
            </p>
          </div>
        )}
      </motion.div>

      {/* Custom Domain */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-semibold text-base">Custom Domain</h3>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">Pro+</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Connect your own domain (e.g. <span className="font-mono">deals.yourbrand.com</span>) for full brand control.</p>

        <div className="flex gap-2 mb-4">
          <Input value={customDomain} onChange={e => setCustomDomain(e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl flex-1" placeholder="deals.yourbrand.com" />
          <Button onClick={handleConnectDomain} disabled={saving || !customDomain.trim()} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 rounded-xl gap-1.5"><Globe className="w-4 h-4" />Connect</Button>
        </div>

        {domain && (
          <div className="space-y-4">
            {/* Status row */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Domain</span>
                {statusBadge(marketplace.verificationStatus)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">SSL</span>
                {statusBadge(marketplace.sslStatus)}
              </div>
            </div>

            {marketplace.verificationStatus === "verified" ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline truncate">https://{domain}</a>
                <span className="ml-auto text-[10px] text-emerald-400/70">SSL active</span>
              </div>
            ) : (
              <>
                {/* DNS Records to add */}
                <div className="space-y-3 p-4 rounded-xl border border-border/30 bg-secondary/20">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-400" />Add these DNS records at your domain provider</p>

                  <div className="grid sm:grid-cols-3 gap-2 items-end p-3 rounded-lg bg-card/40">
                    <CopyField label="Type" value={isRoot ? "A" : "CNAME"} />
                    <CopyField label="Host / Name" value={recordHost} />
                    <CopyField label="Value" value={isRoot ? ROOT_A_IP : CNAME_TARGET} />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 items-end p-3 rounded-lg bg-card/40">
                    <CopyField label="Type" value="TXT" />
                    <CopyField label="Host / Name" value={txtHost} />
                    <CopyField label="Value" value={`${txtKey}-verify=${token || "—"}`} />
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                    DNS changes can take a few minutes to 48 hours to propagate. Click verify once added.
                  </p>
                </div>

                <Button onClick={handleVerify} disabled={verifying} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5">
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {verifying ? "Checking DNS..." : "Verify Domain"}
                </Button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}