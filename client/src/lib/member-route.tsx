import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface MemberRouteProps {
  component: React.ComponentType<any>;
  siteId: string;
}

export function MemberRoute({ component: Component, siteId, ...props }: MemberRouteProps) {
  const { isAuthenticated, isLoading, needsApproval, isAdmin, user } = useAuth();

  // Check membership status for the site
  const { data: membershipData, isLoading: membershipLoading } = useQuery({
    queryKey: ["/api/sites", siteId, "membership"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}/membership`);
        if (response.status === 403) return { isMember: false };
        if (response.status === 401) return { isMember: false };
        if (response.ok) {
          return await response.json();
        }
        return { isMember: false };
      } catch {
        return { isMember: false };
      }
    },
    enabled: !!user && !isLoading && isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !needsApproval) {
      // Store the attempted path for redirect after login
      sessionStorage.setItem('redirectPath', window.location.pathname);
    }
  }, [isLoading, isAuthenticated, needsApproval]);

  if (isLoading || membershipLoading) {
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

  // Check for membership privileges
  if (!membershipData?.isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-purple-400 text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-2">Member Access Required</h1>
          <p className="text-slate-400 mb-6">You need to be a member of this collective to access this page.</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = `/site/${siteId}`}
              className="block w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Go to Collective Landing Page
            </button>
            <button 
              onClick={() => window.history.back()}
              className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Component {...props} membershipData={membershipData} />;
}