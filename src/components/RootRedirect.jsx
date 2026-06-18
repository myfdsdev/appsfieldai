import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageLoader } from "@/components/Loader";

export default function RootRedirect() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated()
      .then((auth) => setIsAuthenticated(auth))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/marketplace" replace />;
  }

  return <Navigate to="/login" replace />;
}