import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe, Lock, ExternalLink, User, Shield } from 'lucide-react';
import type { Site } from '@shared/schema';

interface PasswordCheckDialogProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PasswordCheckDialog({ site, isOpen, onClose, onSuccess }: PasswordCheckDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    // Check if password matches site password
    if (password === site.password) {
      // Store access in sessionStorage so they don't need to re-enter
      sessionStorage.setItem(`site_access_${site.siteId}`, 'granted');
      onSuccess();
    } else {
      setError('Incorrect password');
    }
    setIsChecking(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password Required</DialogTitle>
          <DialogDescription>
            This site is password protected. Please enter the password to access {site.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter site password"
              required
              data-testid="input-site-password"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isChecking} data-testid="button-submit-password">
              {isChecking ? 'Checking...' : 'Access Site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SiteDirectory() {
  const [, setLocation] = useLocation();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const { data: sites, isLoading, error } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  const handleSiteAccess = (site: Site) => {
    // Check if site is password protected
    if (site.password) {
      // Check if user already has access
      const hasAccess = sessionStorage.getItem(`site_access_${site.siteId}`) === 'granted';
      if (hasAccess) {
        setLocation(`/site/${site.siteId}`);
      } else {
        setSelectedSite(site);
        setPasswordDialogOpen(true);
      }
    } else {
      // Public site, direct access
      setLocation(`/site/${site.siteId}`);
    }
  };

  const handlePasswordSuccess = () => {
    if (selectedSite) {
      setPasswordDialogOpen(false);
      setLocation(`/site/${selectedSite.siteId}`);
      setSelectedSite(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading sites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load sites</div>
      </div>
    );
  }

  if (!sites) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        
        {/* Conduit Logo - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <a href="https://cndt.io" target="_blank" rel="noopener noreferrer">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <img 
                src="https://cndt.io/nav2/logo-full.svg" 
                alt="Conduit Network Logo" 
                className="h-6 w-auto"
              />
            </div>
          </a>
        </div>

        {/* Admin Login Button - Top Right */}
        <div className="absolute top-6 right-6 z-10">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // For admin login from site directory, redirect to sites manager
              const adminDestination = '/sites';
              const redirectParam = encodeURIComponent(adminDestination);
              console.log('Navigating to login with admin redirect to:', adminDestination);
              setLocation(`/login?redirect=${redirectParam}`);
            }}
            className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700/80"
            data-testid="button-admin-login"
          >
            <User className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
        </div>

        <div className="relative container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Site Directory
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Browse and access all deployed Mining Syndicate sites. Each site offers customized content and opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Available Sites</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {sites.length} active {sites.length === 1 ? 'site' : 'sites'} available
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {sites.map((site) => (
            <Card 
              key={site.id} 
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full"
              data-testid={`card-site-${site.siteId}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Globe className="text-blue-400 w-5 h-5" />
                    <CardTitle className="text-xl text-white">{site.name}</CardTitle>
                  </div>
                  {site.password && (
                    <Lock className="text-yellow-400 w-4 h-4" />
                  )}
                </div>
                <CardDescription className="text-slate-400">
                  {site.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-2 text-sm text-slate-300 flex-grow">
                  <div className="flex justify-between">
                    <span>Site ID:</span>
                    <span className="font-mono text-blue-300">{site.siteId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${site.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access:</span>
                    <span className={`font-medium flex items-center ${site.password ? 'text-yellow-400' : 'text-green-400'}`}>
                      {site.password ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Protected
                        </>
                      ) : 'Public'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-slate-400">
                      {site.createdAt ? new Date(site.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  onClick={() => handleSiteAccess(site)}
                  disabled={!site.isActive}
                  data-testid={`button-access-site-${site.siteId}`}
                >
                  {site.isActive ? (
                    <>
                      Access Site
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  ) : 'Site Inactive'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {sites.length === 0 && (
          <div className="text-center text-slate-400">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No sites available</p>
          </div>
        )}
      </div>

      {/* Password Dialog */}
      {selectedSite && (
        <PasswordCheckDialog
          site={selectedSite}
          isOpen={passwordDialogOpen}
          onClose={() => {
            setPasswordDialogOpen(false);
            setSelectedSite(null);
          }}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </div>
  );
}