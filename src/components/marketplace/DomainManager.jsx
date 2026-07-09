import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Globe, CheckCircle2, XCircle, Clock, Copy, Check, RefreshCw, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Standalone custom-domain service (verification + SSL + reverse proxy) —
// see custom-domain-service/. Uses VITE_ env vars for local dev, and falls back
// to the deployed values so it works in the Base44-hosted build too (which does
// not inject custom VITE_ vars). The secret is embedded in client-side JS either
// way — that is inherent to calling the service directly from the browser.
const DOMAIN_SERVICE_URL =
  import.meta.env.VITE_DOMAIN_SERVICE_URL || "https://api.appsfieldai.com";
const DOMAIN_SERVICE_SECRET =
  import.meta.env.VITE_DOMAIN_SERVICE_SECRET ||
  "c81eb879bca1bd6c10522df3a0429de333ac2d28cd2986e90de982bc46dc71ab";

async function domainServiceFetch(path, options = {}) {
  // Without a configured service URL the fetch would hit this app's own origin
  // and get a misleading 405 from the static host. Fail with a clear message.
  if (!DOMAIN_SERVICE_URL) {
    throw new Error("Custom domain service is not configured. Set VITE_DOMAIN_SERVICE_URL and VITE_DOMAIN_SERVICE_SECRET.");
  }
  const res = await fetch(`${DOMAIN_SERVICE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DOMAIN_SERVICE_SECRET}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
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
  // Verification/SSL status + DNS instructions now live in the standalone
  // custom-domain-service, not on the Marketplace entity.
  const [domainState, setDomainState] = useState(null);

  useEffect(() => { setMp(marketplaceProp); }, [marketplaceProp]);

  useEffect(() => {
    base44.functions.invoke("getPlatformDomain", {})
      .then(res => {
        setPlatformDomain(res.data?.platformDomain || "");
        setDomainSource(res.data?.source || "");
      })
      .catch(() => {});
  }, []);

  // Restore status + DNS instructions for an already-connected domain.
  useEffect(() => {
    const existing = marketplaceProp?.customDomain;
    if (!existing || !DOMAIN_SERVICE_URL) return;
    domainServiceFetch(`/api/custom-domains/status?hostname=${encodeURIComponent(existing)}`)
      .then(setDomainState)
      .catch(() => {});
  }, [marketplaceProp?.customDomain]);

  const PLATFORM_DOMAIN = platformDomain || "your-platform.com";

  const domain = marketplace?.customDomain;

  const handleSaveSubdomain = async () => {
    if (!subdomain.trim()) return toast.error("Subdomain is required");
    setSaving(true);
    const slug = subdomain.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await base44.entities.Marketplace.update(marketplace.id, { subdomain: slug });
    onUpdate?.();
    setSaving(false);
    toast.success(`Store URL saved: ${PLATFORM_DOMAIN}/store/${slug}`);
  };

  const handleConnectDomain = async () => {
    if (!customDomain.trim()) return;
    setSaving(true);
    const clean = customDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    try {
      const res = await domainServiceFetch("/api/custom-domains/register", {
        method: "POST",
        body: JSON.stringify({
          hostname: clean,
          tenantId: marketplace.id,
          originType: "app",
          storeSlug: marketplace?.subdomain || marketplace?.slug,
        }),
      });
      // Keep Base44's own customDomain field in sync — getMarketplacePublic still
      // resolves stores by this field for the SPA's client-side custom-domain detection.
      await base44.entities.Marketplace.update(marketplace.id, { customDomain: clean });
      setCustomDomain(clean);
      setDomainState({ hostname: clean, status: res.status || "pending", sslStatus: "pending", dnsRecords: res.dnsRecords });
      await refreshMp();
      onUpdate?.();
      toast.success("Domain connected — add the DNS record below, then check status.");
    } catch (err) {
      toast.error(err.message || "Could not connect domain. Try again.");
    }
    setSaving(false);
  };

  const refreshMp = async () => {
    try {
      const fresh = await base44.entities.Marketplace.get(marketplace.id);
      if (fresh) setMp(fresh);
    } catch { /* ignore */ }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const data = await domainServiceFetch(
        `/api/custom-domains/status?hostname=${encodeURIComponent(domain)}`
      );
      if (data.status === "active") toast.success("Your domain is connected successfully.");
      else toast.error("Not verified yet. Check your DNS record and try again shortly.");
      setDomainState((prev) => ({ ...prev, ...data }));
      onUpdate?.();
    } catch (err) {
      toast.error(err.message || "Could not check status. Try again shortly.");
    }
    setVerifying(false);
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      await domainServiceFetch(`/api/custom-domains?hostname=${encodeURIComponent(domain)}`, { method: "DELETE" });
      await base44.entities.Marketplace.update(marketplace.id, { customDomain: "" });
      setCustomDomain("");
      setDomainState(null);
      await refreshMp();
      onUpdate?.();
      toast.success("Custom domain disconnected.");
    } catch (err) {
      toast.error(err.message || "Could not disconnect domain.");
    }
    setSaving(false);
  };

  const subLabel = subdomain || marketplace?.slug;
  // Path-based store URL on the main app domain — always live, no DNS needed.
  const storeUrl = `https://${PLATFORM_DOMAIN}/store/${subLabel}`;
  // DNS records come entirely from the custom-domain worker response.
  const dnsRecords = domainState?.dnsRecords || [];

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

      {/* Store URL (path-based on the main domain) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-orange-400" />
          <h3 className="font-display font-semibold text-base">Your Store URL</h3>
          <Badge variant="secondary" className="text-[9px]">Live now</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-1">Your store is live on the main domain — no DNS setup needed.</p>
        <p className="text-[11px] text-muted-foreground mb-4">Choose your store name (the last part of the URL).</p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{PLATFORM_DOMAIN}/store/</span>
            <Input value={subdomain} onChange={e => setSubdomain(e.target.value)} className="bg-secondary/50 border-border/30 rounded-xl" style={{ paddingLeft: `${PLATFORM_DOMAIN.length * 7 + 56}px` }} placeholder="mystore" />
          </div>
          <Button onClick={handleSaveSubdomain} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-xl gap-1.5"><Globe className="w-4 h-4" />Save</Button>
        </div>
        {subLabel && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline truncate">{storeUrl}</a>
              <span className="ml-auto text-[9px] text-emerald-400/60 shrink-0">Live now</span>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Globe className="w-3 h-3 mt-0.5 shrink-0" />
              This is your store's live address. Want it on your own domain? Connect a custom domain below.
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
                {statusBadge(domainState?.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">SSL</span>
                {statusBadge(domainState?.sslStatus)}
              </div>
            </div>

            {domainState?.status === "active" ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline truncate">https://{domain}</a>
                <span className="ml-auto text-[10px] text-emerald-400/70">Connected</span>
              </div>
            ) : (
              <>
                {/* DNS records to add (routing CNAME, plus any ownership/SSL records) */}
                <div className="space-y-3 p-4 rounded-xl border border-border/30 bg-secondary/20">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-400" />Add {dnsRecords.length > 1 ? "these DNS records" : "this DNS record"} at your domain provider</p>

                  {dnsRecords.map((rec, i) => (
                    <div key={i} className="grid sm:grid-cols-3 gap-2 items-end p-3 rounded-lg bg-card/40">
                      <CopyField label="Type" value={rec.type || "CNAME"} />
                      <CopyField label="Host / Name" value={rec.name || ""} />
                      <CopyField label="Value" value={rec.target || "—"} />
                    </div>
                  ))}

                  <p className="text-[11px] text-amber-400/80 flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Do not add this domain to Render. Your domain connects through Cloudflare — just add the CNAME record above at your domain provider.
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                    DNS changes can take a few minutes to 48 hours to propagate. Check status once added.
                  </p>
                </div>

                <Button onClick={handleVerify} disabled={verifying} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5">
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {verifying ? "Checking status..." : "Check Status"}
                </Button>
              </>
            )}

            <button onClick={handleDisconnect} disabled={saving} className="text-[11px] text-muted-foreground hover:text-red-400 transition-colors">
              Disconnect this domain
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}