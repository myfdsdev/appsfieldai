import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink } from "lucide-react";

// Shows the full text of a notification that has no dedicated page to open.
export default function NotificationDetailModal({ notification, onClose }) {
  if (!notification) return null;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-amber-400" />{notification.title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{notification.message}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-border/40 rounded-xl">Close</Button>
          {notification.linkUrl && (
            <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-xl">
              <a href={notification.linkUrl} target="_blank" rel="noreferrer" onClick={onClose}>
                Open <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}