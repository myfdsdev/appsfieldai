import React from "react";
import { X, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

// Slide-over cart for store visitors. Lists cart items with quantity controls
// and a checkout button. Empties to a friendly empty state.
export default function StoreCartDrawer({ open, onClose, cart, brandColor = "#f97316", onCheckout }) {
  if (!open) return null;
  const { items, updateQty, removeItem, total } = cart;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-background border-l border-border/40 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: brandColor }}>
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Your Cart</p>
              <p className="text-[11px] text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Your cart is empty.</p>
              <p className="text-xs mt-1">Add a product to get started.</p>
            </div>
          ) : (
            items.map((i) => (
              <div key={i.listingId} className="rounded-2xl border border-border/40 bg-card/60 p-3 flex gap-3">
                <div className={`w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br ${i.imageGradient || "from-orange-500 to-amber-500"} overflow-hidden`}>
                  {i.logo && <img src={i.logo} alt={i.listingTitle} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{i.listingTitle}</p>
                    <button onClick={() => removeItem(i.listingId)} className="text-muted-foreground hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{i.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(i.listingId, i.quantity - 1)} disabled={i.quantity <= 1}
                        className="w-7 h-7 rounded-lg border border-border/40 flex items-center justify-center disabled:opacity-40 hover:bg-secondary/50"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-7 text-center text-sm font-medium">{i.quantity}</span>
                      <button onClick={() => updateQty(i.listingId, i.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-border/40 flex items-center justify-center hover:bg-secondary/50"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <span className="text-sm font-display font-bold" style={{ color: brandColor }}>${(i.unitPrice * i.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/40 p-5 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-display font-bold" style={{ color: brandColor }}>${total.toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: brandColor }}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}