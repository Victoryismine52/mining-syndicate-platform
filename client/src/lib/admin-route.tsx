import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useEffect } from "react";

interface AdminRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function AdminRoute({ component: Component, ...props }: AdminRouteProps) {
  const { isAuthenticated, isLoading, needsApproval, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !needsApproval) {
      // Store the attempted path for redirect after login
      sessionStorage.setItem('redirectPath', window.location.pathname);
    }
  }, [isLoading, isAuthenticated, needsApproval]);

  if (isLoading) {
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

  // Check for admin privileges
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need administrator privileges to access this page.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Component {...props} />;
}