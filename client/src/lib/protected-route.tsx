import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({ component: Component, ...props }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, needsApproval } = useAuth();

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

  return <Component {...props} />;
}