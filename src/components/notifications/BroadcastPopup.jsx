import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

const DISMISS_KEY = "dismissedBroadcasts";

const getDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
  } catch {
    return [];
  }
};

export default function BroadcastPopup() {
  const [active, setActive] = useState(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me(), retry: false });
  const { data: broadcasts = [] } = useQuery({
    queryKey: ["activeBroadcasts"],
    queryFn: () => base44.entities.AdminBroadcast.filter({ status: "sent" }, "-sentAt", 20),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || !broadcasts.length) return;
    const dismissed = getDismissed();
    const now = Date.now();
    const match = broadcasts.find(
      (b) =>
        b.showPopup !== false &&
        !dismissed.includes(b.id) &&
        (!b.expiresAt || new Date(b.expiresAt).getTime() > now) &&
        (b.audience !== "admins" || user.role === "admin")
    );
    if (match) setActive(match);
  }, [broadcasts, user]);

  const dismiss = () => {
    if (active) {
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...getDismissed(), active.id]));
    }
    setActive(null);
  };

  if (!active) return null;

  return (
    <Dialog open onOpenChange={dismiss}>
      <DialogContent className="bg-[#1a1a1a] border-border/40 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />{active.title}
          </DialogTitle>
        </DialogHeader>

        {active.mediaType === "image" && active.mediaUrl && (
          <img src={active.mediaUrl} alt="" className="w-full rounded-xl" />
        )}
        {active.mediaType === "video" && active.mediaUrl && (
          <video src={active.mediaUrl} controls className="w-full rounded-xl" />
        )}

        <p className="text-sm text-muted-foreground whitespace-pre-line">{active.message}</p>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" onClick={dismiss} className="border-border/40 rounded-xl">Dismiss</Button>
          {active.linkUrl && (
            <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-xl">
              <a href={active.linkUrl} target="_blank" rel="noreferrer" onClick={dismiss}>
                {active.buttonLabel || "Open"}
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}