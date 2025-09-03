import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface SiteAdminRouteProps {
  path: string;
  component: React.ComponentType<any>;
  siteId: string;
}

export function SiteAdminRoute({ component: Component, siteId, ...props }: SiteAdminRouteProps) {
  const { isAuthenticated, isLoading, needsApproval, isAdmin, user } = useAuth();

  // Check site-specific access for non-admin users
  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ["/api/sites", siteId, "access"],
    queryFn: async () => {
      if (isAdmin) return true; // Global admins always have access
      
      try {
        const response = await fetch(`/api/sites/${siteId}/managers`);
        if (response.status === 403) return false;
        if (response.status === 401) return false;
        return response.ok;
      } catch {
        return false;
      }
    },
    enabled: !!user && !isLoading && isAuthenticated,
    staleTime: 30000, // Cache for 30 seconds
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !needsApproval) {
      // Store the attempted path for redirect after login
      sessionStorage.setItem('redirectPath', window.location.pathname);
    }
  }, [isLoading, isAuthenticated, needsApproval]);

  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (needsApproval) {
    return <Redirect to="/approval-needed" />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Check for site-specific admin privileges
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need administrator or site manager privileges to access this site's admin panel.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors mr-4"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.href = `/site/${siteId}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View Site
          </button>
        </div>
      </div>
    );
  }

  return <Component {...props} siteId={siteId} />;
}