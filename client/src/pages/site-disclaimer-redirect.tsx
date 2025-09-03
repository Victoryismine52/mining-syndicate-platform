import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';

export function SiteDisclaimerRedirect() {
  const { siteId, disclaimerId } = useParams<{ siteId: string; disclaimerId: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (disclaimerId) {
      // Redirect to the global disclaimer page
      setLocation(`/disclaimer/${disclaimerId}`);
    }
  }, [disclaimerId, setLocation]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-400">Redirecting to disclaimer...</p>
      </div>
    </div>
  );
}