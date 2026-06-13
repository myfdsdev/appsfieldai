import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gavel, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const IMAGE_GRADIENTS = [
  "from-emerald-600 to-green-700",
  "from-rose-600 to-pink-700",
  "from-cyan-600 to-blue-700",
  "from-orange-600 to-amber-600",
  "from-amber-600 to-orange-700",
  "from-indigo-600 to-blue-700",
];

function CountdownTimer({ endDate }) {
  const target = new Date(endDate).getTime();
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const urgent = days === 0 && hours < 2;
  return (
    <span className={urgent ? "text-red-400" : "text-amber-400"}>
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
    </span>
  );
}

export default function AdminAuctionsManager() {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editBid, setEditBid] = useState(null);
  const [editBidForm, setEditBidForm] = useState({});

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["auctionListings"],
    queryFn: () => base44.entities.SaaSListing.filter({ status: "auction" }),
  });
  const { data: allBids = [] } = useQuery({
    queryKey: ["allBids"],
    queryFn: () => base44.entities.Bid.filter({}, ["-created_date"], 200),
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const bidsByListing = useMemo(() => {
    const map = {};
    const um = {}; allUsers.forEach(u => um[u.id] = u.full_name || u.email);
    allBids.forEach(b => {
      if (!map[b.listingId]) map[b.listingId] = [];
      map[b.listingId].push({ ...b, bidderName: um[b.userId] || "Unknown" });
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => b.bidAmount - a.bidAmount));
    return map;
  }, [allBids, allUsers]);

  const openManager = (l) => {
    setSelectedListing(l);
    setEditForm({
      softwareName: l.softwareName || l.title || "",
      fullPrice: l.fullPrice || 0,
      sharePrice: l.sharePrice || 0,
      monthlyRevenue: l.monthlyRevenue || 0,
      monthlyExpenses: l.monthlyExpenses || 0,
      growthRate: l.growthRate || 0,
      auctionEndsAt: l.auctionEndsAt || "",
      soldShares: l.soldShares || 0,
      totalShares: l.totalShares || 0,
      category: l.category || "",
    });
  };

  const handleEditSave = async () => {
    if (!selectedListing) return;
    await base44.entities.SaaSListing.update(selectedListing.id, {
      ...editForm,
      fullPrice: parseFloat(editForm.fullPrice) || 0,
      sharePrice: parseFloat(editForm.sharePrice) || 0,
      monthlyRevenue: parseFloat(editForm.monthlyRevenue) || 0,
      monthlyExpenses: parseFloat(editForm.monthlyExpenses) || 0,
      growthRate: parseFloat(editForm.growthRate) || 0,
      soldShares: parseInt(editForm.soldShares) || 0,
      totalShares: parseInt(editForm.totalShares) || 0,
    });
    queryClient.invalidateQueries({ queryKey: ["auctionListings"] });
    queryClient.invalidateQueries({ queryKey: ["allListings"] });
    setSelectedListing(null);
    toast.success("Listing updated");
  };

  const openBidEdit = (b) => {
    setEditBid(b);
    setEditBidForm({ bidAmount: b.bidAmount, autoBid: b.autoBid, maxAutoBid: b.maxAutoBid || "" });
  };

  const handleBidEditSave = async () => {
    if (!editBid) return;
    await base44.entities.Bid.update(editBid.id, {
      bidAmount: parseFloat(editBidForm.bidAmount) || 0,
      autoBid: editBidForm.autoBid,
      maxAutoBid: editBidForm.maxAutoBid ? parseFloat(editBidForm.maxAutoBid) : null,
    });
    queryClient.invalidateQueries({ queryKey: ["allBids"] });
    setEditBid(null);
    toast.success("Bid updated");
  };

  const handleBidDelete = async (b) => {
    await base44.entities.Bid.delete(b.id);
    queryClient.invalidateQueries({ queryKey: ["allBids"] });
    toast.success("Bid deleted");
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center"><Gavel className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-display font-bold">Live Auctions</h1><p className="text-sm text-muted-foreground mt-1">Manage auction listings, bids, and edit details.</p></div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <Gavel className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-lg font-display text-muted-foreground mt-4">No active auctions</p>
          <p className="text-sm text-muted-foreground mt-1">Start auctions from the Listings & Requests tab.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing, i) => {
            const sharesLeft = (listing.totalShares || 0) - (listing.soldShares || 0);
            const gradient = listing.imageGradient || IMAGE_GRADIENTS[i % IMAGE_GRADIENTS.length];
            const lbids = bidsByListing[listing.id] || [];
            const highestBid = lbids.length > 0 ? lbids[0].bidAmount : 0;

            return (
              <motion.div key={listing.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden hover:border-amber-500/30 transition-all group">
                  <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <h3 className="relative text-white font-display font-bold text-lg px-4 text-center">{listing.title}</h3>
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge className="bg-amber-500/90 text-white text-[10px] border-0"><Gavel className="w-3 h-3 mr-1" /> Live</Badge>
                      {lbids.length > 5 && <Badge className="bg-red-500/90 text-white text-[10px] border-0">Hot</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Full Price</p>
                        <p className="font-display font-bold text-sm">${listing.fullPrice?.toLocaleString()}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Per Share</p>
                        <p className="font-display font-bold text-sm text-cyan-400">${listing.sharePrice}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">Growth</p>
                        <p className="font-display font-bold text-sm text-emerald-400">+{listing.growthRate}%</p>
                      </div>
                    </div>

                    {highestBid > 0 && (
                      <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                        <span className="text-[11px] text-muted-foreground">Highest Bid</span>
                        <span className="text-sm font-display font-bold text-amber-400">${highestBid.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Shares Sold</span>
                        <span>{listing.soldShares || 0}/{listing.totalShares || 0} <span className="text-muted-foreground">({sharesLeft} left)</span></span>
                      </div>
                      <Progress value={((listing.soldShares || 0) / (listing.totalShares || 1)) * 100} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {listing.auctionEndsAt ? (
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><CountdownTimer endDate={listing.auctionEndsAt} /></div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>No end date</span></div>
                      )}
                      <Badge variant="outline" className="text-[10px] border-border/40">{listing.category}</Badge>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl h-9 text-sm font-semibold"
                      onClick={() => openManager(listing)}
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Manage Auction
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Manage Auction Modal */}
      <Dialog open={!!selectedListing} onOpenChange={() => { setSelectedListing(null); setEditBid(null); }}>
        <DialogContent className="bg-card border-border/40 max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-400" />Manage Auction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Listing Edit Fields */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-amber-400">Listing Details</p>
              <div><label className="text-xs text-muted-foreground">Title</label><Input value={editForm.softwareName || ""} onChange={e => setEditForm(f => ({ ...f, softwareName: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Full Price</label><Input type="number" value={editForm.fullPrice || ""} onChange={e => setEditForm(f => ({ ...f, fullPrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">Share Price</label><Input type="number" value={editForm.sharePrice || ""} onChange={e => setEditForm(f => ({ ...f, sharePrice: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">Growth %</label><Input type="number" value={editForm.growthRate || ""} onChange={e => setEditForm(f => ({ ...f, growthRate: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Sold Shares</label><Input type="number" value={editForm.soldShares || ""} onChange={e => setEditForm(f => ({ ...f, soldShares: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">Total Shares</label><Input type="number" value={editForm.totalShares || ""} onChange={e => setEditForm(f => ({ ...f, totalShares: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">Category</label><Input value={editForm.category || ""} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Monthly Revenue</label><Input type="number" value={editForm.monthlyRevenue || ""} onChange={e => setEditForm(f => ({ ...f, monthlyRevenue: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">Monthly Expenses</label><Input type="number" value={editForm.monthlyExpenses || ""} onChange={e => setEditForm(f => ({ ...f, monthlyExpenses: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl mt-1" /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Auction End Date</label><Input value={editForm.auctionEndsAt || ""} onChange={e => setEditForm(f => ({ ...f, auctionEndsAt: e.target.value }))} placeholder="2026-06-20T00:00:00.000Z" className="bg-secondary/50 border-border/30 rounded-xl mt-1 text-xs" /></div>
            </div>

            {/* Bids Management */}
            {selectedListing && bidsByListing[selectedListing.id]?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-400">Bids ({bidsByListing[selectedListing.id].length})</p>
                <div className="space-y-1.5">
                  {bidsByListing[selectedListing.id].map(b => (
                    <div key={b.id} className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-foreground flex-1 truncate">{b.bidderName}</span>
                      <span className="text-xs font-display font-bold text-amber-400">${b.bidAmount?.toLocaleString()}</span>
                      {b.autoBid && <Badge className="text-[8px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Auto</Badge>}
                      <Button size="sm" variant="ghost" onClick={() => openBidEdit(b)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleBidDelete(b)} className="h-6 w-6 p-0 text-red-400/60 hover:text-red-400"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Bid Modal (nested inside) */}
            {editBid && (
              <div className="space-y-2 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <p className="text-xs font-medium text-amber-400">Edit Bid</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Bidder: <span className="text-foreground">{editBid.bidderName}</span></span>
                </div>
                <Input type="number" value={editBidForm.bidAmount || ""} onChange={e => setEditBidForm(f => ({ ...f, bidAmount: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl" />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={editBidForm.autoBid || false} onChange={e => setEditBidForm(f => ({ ...f, autoBid: e.target.checked }))} className="rounded accent-amber-500" />
                    <span className="text-muted-foreground text-xs">Auto Bid</span>
                  </label>
                  {editBidForm.autoBid && <Input type="number" placeholder="Max auto-bid" value={editBidForm.maxAutoBid || ""} onChange={e => setEditBidForm(f => ({ ...f, maxAutoBid: e.target.value }))} className="bg-secondary/50 border-border/30 rounded-xl text-xs h-8 flex-1" />}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBidEditSave} className="bg-amber-600 hover:bg-amber-700 rounded-xl text-xs h-8">Save Bid</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditBid(null)} className="border-border/40 rounded-xl text-xs h-8">Cancel</Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedListing(null); setEditBid(null); }} className="border-border/40 rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}