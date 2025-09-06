import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { ThemeSelector } from '../../../packages/theme-framework';

export function Login() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      // Check if there's a redirect parameter in the URL
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/sites';
      
      // Decode the redirect URL if it was encoded
      const decodedRedirectTo = decodeURIComponent(redirectTo);
      
      console.log('User already authenticated, redirecting to:', decodedRedirectTo);
      setLocation(decodedRedirectTo);
    }
  }, [user, isLoading, setLocation]);

  // Show loading while checking auth status
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // Only show login form if not authenticated
  const handleGoogleLogin = () => {
    console.log('Initiating Google OAuth login...');
    
    // Check if there's a redirect parameter to pass along
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    // Build the OAuth URL with redirect parameter if present
    let oauthUrl = '/api/auth/google';
    if (redirect) {
      oauthUrl += `?redirect=${encodeURIComponent(redirect)}`;
      console.log('Redirecting to OAuth with redirect path:', redirect);
    }
    
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute top-6 right-6 z-10">
        <ThemeSelector 
          variant="icons" 
          size="sm"
          className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-lg p-1"
        />
      </div>
      <Card className="w-full max-w-md bg-slate-800 border-slate-600">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to manage Mining Syndicate sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border"
            data-testid="button-google-login"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}