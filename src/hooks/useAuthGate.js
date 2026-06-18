import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Returns a guard function. Call it before opening a protected modal.
 * If the user is not authenticated, shows a toast and redirects to /login
 * with the current path as ?next= so they return after login.
 * Returns true if authenticated, false if redirected.
 */
export function useAuthGate() {
  const navigate = useNavigate();
  const location = useLocation();

  const guard = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      toast.error("Please login to continue.");
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  };

  return guard;
}