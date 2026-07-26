import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search, Download, Loader2, Package, CheckCheck } from "lucide-react";

// Popup that lets a store owner pick which DFY products to import (multi-select).
export default function ImportDFYDialog({ open, onClose, existingNames = [], importing, onImport }) {
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["dfyProductsActive"],
    queryFn: () => base44.entities.DFYProduct.filter({ isActive: true }),
    enabled: open,
  });

  const existing = useMemo(
    () => new Set(existingNames.map((n) => (n || "").trim().toLowerCase())),
    [existingNames]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presets.filter((p) => {
      if (!q) return true;
      return (
        (p.softwareName || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    });
  }, [presets, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectableIds = filtered
    .filter((p) => !existing.has((p.softwareName || "").trim().toLowerCase()))
    .map((p) => p.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(selectableIds);
    });
  };

  const handleImport = () => {
    const chosen = presets.filter((p) => selected.has(p.id));
    onImport(chosen);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="w-4 h-4 text-orange-400" /> Import DFY Products
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 rounded-xl" placeholder="Search products" />
          </div>
          {selectableIds.length > 0 && (
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300">
              <CheckCheck className="w-3.5 h-3.5" /> {allSelected ? "Clear selection" : "Select all"}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {isLoading ? (
            <div className="text-center py-10 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading products…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-8 h-8 mx-auto mb-2 text-orange-400/40" />
              <p className="text-sm text-muted-foreground">No DFY products available.</p>
            </div>
          ) : (
            filtered.map((p) => {
              const already = existing.has((p.softwareName || "").trim().toLowerCase());
              const isSel = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  disabled={already}
                  onClick={() => toggle(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    already
                      ? "border-border/20 bg-secondary/20 opacity-60 cursor-not-allowed"
                      : isSel
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-border/40 bg-card/40 hover:border-orange-500/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${p.imageGradient || "from-orange-500 to-amber-500"} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-bold text-xs">{(p.softwareName || "?")[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.softwareName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.category}
                      {p.discountPrice > 0 && ` · $${p.discountPrice}`}
                      {p.adminAccessType && p.adminAccessType !== "none" && " · Admin access included"}
                    </p>
                  </div>
                  {already ? (
                    <span className="text-[10px] text-muted-foreground shrink-0">Imported</span>
                  ) : (
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isSel ? "bg-orange-500 border-orange-500" : "border-border/60"}`}>
                      {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl gap-1.5 text-white border-0"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Import {selected.size > 0 ? selected.size : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}