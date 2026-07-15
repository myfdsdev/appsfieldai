import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShoppingBag, Loader2, KeyRound, Save, Truck, Undo2, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const badgeColors = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  refunded: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  placed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const StatusBadge = ({ status }) => (
  <Badge className={`text-[10px] border capitalize ${badgeColors[status] || ""}`}>{status}</Badge>
);

// Inline editor for the software access info delivered to the customer.
function DeliveryEditor({ order, onSave }) {
  const [accessUrl, setAccessUrl] = useState(order.delivery?.accessUrl || "");
  const [instructions, setInstructions] = useState(order.delivery?.instructions || "");
  const [saving, setSaving] = useState(false);

  const save = async (markDelivered) => {
    setSaving(true);
    await onSave({ accessUrl, instructions }, markDelivered);
    setSaving(false);
  };

  return (
    <div className="mt-3 rounded-xl border border-border/40 bg-secondary/20 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-orange-400 flex items-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5" /> Product Delivery (sent to customer once delivered)
      </p>
      <Input value={accessUrl} onChange={(e) => setAccessUrl(e.target.value)} className="bg-secondary/50 border-border/30 rounded-lg text-xs h-8" placeholder="Product access URL" />
      <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="bg-secondary/50 border-border/30 rounded-lg text-xs h-16" placeholder="Login details, license key, access instructions..." />
      <div className="flex gap-2">
        <Button onClick={() => save(false)} disabled={saving} variant="outline" size="sm" className="border-border/40 rounded-lg text-xs gap-1.5 h-7">
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
        {order.status !== "completed" && (
          <Button onClick={() => save(true)} disabled={saving} size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 rounded-lg text-xs gap-1.5 h-7">
            <Truck className="w-3.5 h-3.5" /> Save & Mark Delivered
          </Button>
        )}
      </div>
    </div>
  );
}

export default function StoreOrderManager({ marketplaceId }) {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["storeOrders", marketplaceId],
    queryFn: () => base44.entities.StoreOrder.filter({ marketplaceId }, "-created_date"),
    enabled: !!marketplaceId,
  });

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const [refunding, setRefunding] = useState(null);

  const updateStatus = async (id, field, value) => {
    const payload = { [field]: value };
    // Stamp paidAt when a payment is confirmed — starts the refund/hold window.
    if (field === "paymentStatus" && value === "paid") payload.paidAt = new Date().toISOString();
    const updated = await base44.entities.StoreOrder.update(id, payload);
    queryClient.invalidateQueries({ queryKey: ["storeOrders", marketplaceId] });

    // When the owner approves payment, email the customer that their order is now
    // confirmed (the first email they got said "pending").
    if (field === "paymentStatus" && value === "paid" && updated?.customerEmail) {
      base44.functions.invoke("sendStoreEmail", {
        marketplaceId,
        templateKey: "orderConfirmation",
        to: updated.customerEmail,
        order: updated,
        vars: {
          customer_name: updated.customerName || "there",
          order_id: updated.id,
          order_total: `${updated.currency || "USD"} ${(updated.total || 0).toLocaleString()}`,
        },
      }).then(() => toast.success("Order confirmed — customer notified by email."))
        .catch(() => {});
    }
  };

  const handleRefund = async (order) => {
    if (!confirm(`Refund this order for ${order.customerEmail}? This revokes their access and reverses any uncleared vendor payout.`)) return;
    setRefunding(order.id);
    try {
      const res = await base44.functions.invoke("refundStoreOrder", { orderId: order.id });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Order refunded — access revoked and ledger updated.");
      queryClient.invalidateQueries({ queryKey: ["storeOrders", marketplaceId] });
    } catch (e) {
      toast.error(e.message || "Refund failed");
    }
    setRefunding(null);
  };

  const saveDelivery = async (order, delivery, markDelivered) => {
    const payload = {
      delivery: { ...delivery, deliveredAt: new Date().toISOString() },
    };
    if (markDelivered) payload.status = "completed";
    await base44.entities.StoreOrder.update(order.id, payload);
    queryClient.invalidateQueries({ queryKey: ["storeOrders", marketplaceId] });
    toast.success(markDelivered ? "Order delivered to customer" : "Delivery info saved");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid Revenue</p>
          <p className="text-lg font-display font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Orders</p>
          <p className="text-lg font-display font-bold text-blue-400">{orders.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/40">
          <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No store orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-card/40 border border-border/40 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{o.customerName || o.customerEmail || "Customer"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.customerEmail}{o.phone ? ` · ${o.phone}` : ""} · {new Date(o.created_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{o.currency || "USD"} ${(o.total || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{o.paymentMethod}</p>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {(o.items || []).map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{it.listingTitle} × {it.quantity}</span>
                    <span>${((it.unitPrice || 0) * (it.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {o.notes && <p className="text-[11px] text-muted-foreground italic mb-3">"{o.notes}"</p>}

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={o.paymentStatus} />
                <StatusBadge status={o.status} />
                {o.accessStatus === "revoked" && (
                  <Badge className="text-[10px] border bg-red-500/10 text-red-400 border-red-500/20 gap-1"><ShieldOff className="w-3 h-3" /> access revoked</Badge>
                )}
                {o.payoutEligible && (
                  <Badge className="text-[10px] border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">funds cleared</Badge>
                )}
                <div className="ml-auto flex gap-2">
                  <Select value={o.paymentStatus} onValueChange={(v) => updateStatus(o.id, "paymentStatus", v)}>
                    <SelectTrigger className="h-7 w-28 text-xs bg-secondary/50 border-border/30 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, "status", v)}>
                    <SelectTrigger className="h-7 w-28 text-xs bg-secondary/50 border-border/30 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placed">Placed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {o.paymentStatus === "paid" && (
                <div className="mt-3">
                  <Button
                    onClick={() => handleRefund(o)}
                    disabled={refunding === o.id}
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs gap-1.5 h-7"
                  >
                    {refunding === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                    Refund & Revoke Access
                  </Button>
                </div>
              )}

              <DeliveryEditor order={o} onSave={(delivery, markDelivered) => saveDelivery(o, delivery, markDelivered)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}