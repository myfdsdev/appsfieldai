import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Names of active DFY presets — used to tell imported DFY listings apart from
// the owner's own manually-added products.
async function getDfyPresetNames() {
  const presets = await base44.entities.DFYProduct.filter({ isActive: true });
  return new Set(presets.map((p) => (p.softwareName || "").trim().toLowerCase()));
}

// Computes the user's total allowed DFY imports (summed across every
// DFY-allowed plan they hold) and how many DFY products they've already
// imported across ALL of their stores.
export function useDfyLimit() {
  return useQuery({
    queryKey: ["dfyLimit"],
    queryFn: async () => {
      const me = await base44.auth.me();

      // All plan IDs the user holds: active plan + JVZoo-stacked plans (deduped).
      const planIds = [...new Set([me.planId, ...(me.jvzooPlanIds || [])].filter(Boolean))];

      let limit = 0;
      let unlimited = false;
      if (planIds.length) {
        const plans = await base44.entities.SubscriptionPlan.filter({ id: { $in: planIds } });
        for (const p of plans) {
          if (!p.dfyAllowed) continue; // sum only DFY-allowed plans
          if ((p.dfyProductLimit ?? 0) === -1) unlimited = true;
          else limit += p.dfyProductLimit ?? 0;
        }
      }

      // Count DFY products already imported across all of the user's stores.
      const stores = await base44.entities.Marketplace.filter({ ownerId: me.id });
      let used = 0;
      if (stores.length) {
        const dfyNames = await getDfyPresetNames();
        const storeIds = stores.map((s) => s.id);
        const listings = await base44.entities.SaaSListing.filter({ marketplaceId: { $in: storeIds } });
        used = listings.filter((l) => dfyNames.has((l.softwareName || "").trim().toLowerCase())).length;
      }

      return { limit, used, unlimited, remaining: unlimited ? Infinity : Math.max(0, limit - used) };
    },
  });
}