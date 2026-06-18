import { usePlanLimits } from "@/hooks/usePlanLimits";
import { AlertTriangle, Zap } from "lucide-react";

/**
 * Plan limit guard component - renders a warning UI if limit is reached.
 * Usage: <PlanLimitGuard resource="marketplace" onBack={() => navigate(-1)} />
 */
export default function PlanLimitGuard({ resource, onBack }) {
  const { canCreateMarketplace, canCreateListing, canCreateVendor, planName } = usePlanLimits();
  
  const allowed = resource === "marketplace" ? canCreateMarketplace : resource === "listing" ? canCreateListing : canCreateVendor;
  const resourceLabel = resource === "marketplace" ? "Marketplace" : resource === "listing" ? "Listing" : "Vendor";
  const limitType = resource === "marketplace" ? "marketplaces" : resource === "listing" ? "listings" : "vendors";
  
  if (allowed) {
    return null;
  }
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground">Plan Limit Reached</h2>
          <p className="text-sm text-muted-foreground">
            You've reached your plan limit for {limitType}. Upgrade to <span className="text-foreground font-medium">{planName}</span> or higher to create more.
          </p>
          <div className="flex gap-2 pt-2">
            {onBack && (
              <button onClick={onBack} className="flex-1 px-4 py-2 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                Go Back
              </button>
            )}
            <a href="/pricing" className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <Zap className="w-4 h-4" /> Upgrade Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}