import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getYouTubeId } from "@/lib/youtube";
import WalkthroughVideoModal from "@/components/WalkthroughVideoModal";

// Topbar button that opens the configured popup/walkthrough video on demand.
export default function WalkthroughButton() {
  const [open, setOpen] = useState(false);

  const { data: cfg } = useQuery({
    queryKey: ["walkthroughVideo"],
    queryFn: async () => {
      const configs = await base44.entities.AppConfig.list();
      return (
        configs.find((c) => getYouTubeId(c.popupVideoUrl)) ||
        configs.find((c) => c.key === "main") ||
        configs[0] ||
        null
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const url = cfg?.popupVideoUrl;
  if (!getYouTubeId(url)) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-secondary/60 border border-white/5 hover:bg-secondary/80 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
        aria-label="Watch walkthrough"
      >
        <Video className="w-4 h-4" />
        <span className="hidden lg:inline">Walkthrough</span>
      </button>
      <WalkthroughVideoModal
        open={open}
        onClose={() => setOpen(false)}
        url={url}
        title={cfg?.popupVideoTitle}
      />
    </>
  );
}