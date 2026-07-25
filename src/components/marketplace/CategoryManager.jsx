import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tags, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Categories are stored on the Marketplace's `categories` array — this is the
// same list captured during store setup, so those categories show up here and
// stay in sync with the store page.
export default function CategoryManager({ marketplaceId }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { data: marketplace, isLoading } = useQuery({
    queryKey: ["marketplaceCategories", marketplaceId],
    queryFn: async () => {
      const rows = await base44.entities.Marketplace.filter({ id: marketplaceId });
      return rows?.[0] || null;
    },
    enabled: !!marketplaceId,
  });

  const categories = marketplace?.categories || [];

  const saveCategories = async (next) => {
    await base44.entities.Marketplace.update(marketplaceId, { categories: next });
    queryClient.invalidateQueries({ queryKey: ["marketplaceCategories", marketplaceId] });
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return toast.error("Category name required.");
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      return toast.error("That category already exists.");
    }
    setAdding(true);
    await saveCategories([...categories, name]);
    setNewName("");
    setAdding(false);
    toast.success("Category added.");
  };

  const handleDelete = async (name) => {
    setDeleting(name);
    await saveCategories(categories.filter((c) => c !== name));
    setDeleting(null);
    toast.success("Category deleted.");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-semibold flex items-center gap-2">
        <Tags className="w-5 h-5 text-teal-400" /> Categories
      </h3>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Category name"
          className="h-8 text-xs flex-1"
        />
        <Button size="sm" onClick={handleAdd} disabled={adding} className="bg-teal-600 hover:bg-teal-700 h-8 text-xs">
          {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">No categories yet. Add your first one!</div>
      ) : (
        <div className="space-y-1.5">
          {categories.map((c) => (
            <div key={c} className="flex items-center justify-between bg-card/40 border border-border/40 rounded-xl px-3 py-2">
              <span className="text-xs">{c}</span>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(c)} disabled={deleting === c} className="h-7 w-7 p-0 text-red-400">
                {deleting === c ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}