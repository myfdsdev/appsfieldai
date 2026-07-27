import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CheckCircle2, Smartphone, Bell, Copy, Unplug, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// "Telegram" tab — connect the owner's Telegram so agent alerts (new leads,
// new sales) are pushed instantly. Owner scans the QR (or taps the link),
// which opens the bot; starting it links their chat to this account.
export default function TelegramSettings() {
  const queryClient = useQueryClient();
  const [disconnecting, setDisconnecting] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["telegramConnect"],
    queryFn: async () => {
      const res = await base44.functions.invoke("telegramConnect", {});
      return res.data;
    },
    refetchInterval: (q) => (q.state.data?.connected ? false : 5000), // poll until connected
  });

  const connected = data?.connected;
  const deepLink = data?.deepLink || "";
  const qrUrl = deepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(deepLink)}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(deepLink);
    toast.success("Connect link copied.");
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await base44.functions.invoke("telegramDisconnect", {});
      await queryClient.invalidateQueries({ queryKey: ["telegramConnect"] });
      await refetch();
      toast.success("Telegram disconnected.");
    } catch (e) {
      toast.error(e.message || "Could not disconnect.");
    }
    setDisconnecting(false);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5 max-w-xl space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
          <Send className="w-5 h-5 text-sky-500" />
        </div>
        <div>
          <p className="text-sm font-semibold">Telegram Alerts</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get an instant Telegram message the moment you get a new lead or a new sale.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Connected</p>
              <p className="text-xs text-muted-foreground">
                Alerts are being sent to {data?.telegramUsername || "your Telegram"}.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-sky-500" /> 🎯 New leads captured by your Deal Maker agent</p>
            <p className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-sky-500" /> 💰 New sales on your store</p>
          </div>
          <Button variant="outline" onClick={disconnect} disabled={disconnecting} className="gap-2 border-border/40">
            {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="rounded-xl bg-white p-2 border border-border/40 shrink-0">
              {qrUrl ? (
                <img src={qrUrl} alt="Scan to connect Telegram" className="w-[190px] h-[190px]" />
              ) : (
                <div className="w-[190px] h-[190px] flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-3 flex-1">
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li className="flex items-start gap-1.5"><Smartphone className="w-3.5 h-3.5 mt-0.5 text-sky-500 shrink-0" /><span>Open Telegram on your phone and scan this QR code.</span></li>
                <li>Tap <b className="text-foreground">Start</b> in the chat that opens.</li>
                <li>Done — this page updates automatically once connected.</li>
              </ol>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
                  <a href={deepLink} target="_blank" rel="noopener noreferrer"><Send className="w-4 h-4" />Open in Telegram</a>
                </Button>
                <Button size="sm" variant="outline" onClick={copyLink} className="gap-2 border-border/40"><Copy className="w-4 h-4" />Copy link</Button>
                <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />Refresh
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Not on your phone? Tap “Open in Telegram” on any device where you’re signed into Telegram.
          </p>
        </div>
      )}
    </div>
  );
}