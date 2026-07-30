import React from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function UpgradePlanDialog({ open, onClose, storeLimit = 0, hasPlan = true }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="bg-card border-border/40 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> Upgrade your plan
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
            <Store className="w-7 h-7 text-amber-400" />
          </div>
          {hasPlan ? (
            <p className="text-sm text-muted-foreground">
              Your current plan allows <span className="font-semibold text-foreground">{storeLimit === -1 ? "unlimited" : storeLimit}</span> store{storeLimit === 1 ? "" : "s"}.
              You've reached your limit. Upgrade to create more stores.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don't have an active plan yet. Choose a plan to start creating stores.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border/40 rounded-xl">Not now</Button>
          <Button onClick={() => { onClose?.(); navigate("/pricing"); }} className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl gap-1.5">
            <Crown className="w-4 h-4" /> View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}