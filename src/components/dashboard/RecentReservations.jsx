import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  contacted: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border/40",
};

// Recent "reserve spot" requests across the owner's listings.
export default function RecentReservations({ marketplaces = [] }) {
  const marketplaceIds = useMemo(() => marketplaces.map((m) => m.id), [marketplaces]);

  const { data: listings = [] } = useQuery({
    queryKey: ["ownerListingsForReservations", marketplaceIds],
    queryFn: async () => {
      const results = await Promise.all(marketplaceIds.map((id) => base44.entities.SaaSListing.filter({ marketplaceId: id })));
      return results.flat();
    },
    enabled: marketplaceIds.length > 0,
  });

  const listingIds = useMemo(() => listings.map((l) => l.id), [listings]);

  const { data: reservations = [] } = useQuery({
    queryKey: ["ownerReservations", listingIds],
    queryFn: async () => {
      const results = await Promise.all(listingIds.map((id) => base44.entities.DealReservations.filter({ listingId: id }, "-created_date")));
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8);
    },
    enabled: listingIds.length > 0,
  });

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-orange-400" /> Recent Reserve Spot Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No reservations yet.</div>
        ) : (
          <div className="space-y-2">
            {reservations.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(r.userName || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.userName || "Anonymous"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">reserved a spot on {r.listingTitle || "a deal"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={`text-[10px] border ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>{r.status}</Badge>
                  {r.created_date && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-2.5 h-2.5" />{formatDistanceToNow(new Date(r.created_date), { addSuffix: true })}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}