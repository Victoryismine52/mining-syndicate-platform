import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, BarChart3, Users, ArrowRight, Globe, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Site } from '@shared/site-schema';

export function MySites() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites that this user is a manager for
  const { data: managedSites = [], isLoading } = useQuery<Site[]>({
    queryKey: ['/api/user/managed-sites'],
    enabled: !!user,
  });

  // Mutation to toggle isLaunched status
  const toggleLaunchMutation = useMutation({
    mutationFn: async ({ slug, isLaunched }: { slug: string; isLaunched: boolean }) => {
      return await apiRequest(`/api/sites/${slug}`, {
        method: 'PUT',
        body: { isLaunched }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/managed-sites'] });
      toast({
        title: "Status Updated",
        description: `Site is now ${data.isLaunched ? 'launched' : 'in draft mode'}.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update site status",
        variant: "destructive"
      });
    }
  });

  const getSiteTypeDisplay = (siteType: string | null) => {
    if (!siteType) return { text: 'Unknown', color: 'bg-gray-600' };
    if (siteType === 'mining-syndicate-pitch') return { text: 'Mining Syndicate', color: 'bg-orange-600' };
    if (siteType === 'pitch-site') return { text: 'Pitch Site', color: 'bg-blue-600' };
    if (siteType === 'collective') return { text: 'Collective', color: 'bg-purple-600' };
    return { text: siteType, color: 'bg-gray-600' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your sites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            My Sites
          </h1>
          <p className="text-slate-300 text-lg">
            Sites you manage and have access to
          </p>
        </div>

        {managedSites.length === 0 ? (
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Sites Assigned</h3>
              <p className="text-slate-400 mb-6">
                You don't have management access to any sites yet. Contact an administrator to get access to sites.
              </p>
              {user?.isAdmin && (
                <Button 
                  onClick={() => setLocation('/sites')}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-admin-dashboard"
                >
                  Go to Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managedSites.map((site) => {
              const typeDisplay = getSiteTypeDisplay(site.siteType);
              
              return (
                <Card key={site.id} className="bg-slate-800 border-slate-600 hover:border-slate-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {/* Status badge moved to left */}
                      <Badge variant={site.isLaunched ? "default" : "secondary"} className="shrink-0">
                        {site.isLaunched ? "Live" : "Draft"}
                      </Badge>
                      
                      {/* Site name moved to center/main area with improved truncation */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-lg mb-1 truncate" title={site.name}>
                          {site.name.length > 25 ? `${site.name.substring(0, 25)}...` : site.name}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm truncate">
                          {site.slug}
                        </CardDescription>
                      </div>
                      
                      {/* Site type badge moved to right */}
                      <Badge className={`${typeDisplay.color} text-white shrink-0`}>
                        {typeDisplay.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Launch status toggle for site managers */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Launch Status:</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={site.isLaunched}
                          onCheckedChange={(checked) => {
                            toggleLaunchMutation.mutate({ slug: site.slug, isLaunched: checked });
                          }}
                          disabled={toggleLaunchMutation.isPending}
                          data-testid={`switch-launch-${site.slug}`}
                        />
                        <span className="text-xs text-slate-400">
                          {site.isLaunched ? "Live" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/site/${site.slug}`, '_blank')}
                        className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                        data-testid={`button-view-${site.slug}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/site/${site.slug}/admin?tab=settings`)}
                        className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
                        data-testid={`button-settings-${site.slug}`}
                        title="Site Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/site/${site.slug}/admin?tab=leads`)}
                        className="text-green-400 border-green-400 hover:bg-green-400/10"
                        data-testid={`button-leads-${site.slug}`}
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => setLocation(`/site/${site.slug}/admin?tab=forms`)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        data-testid={`button-manage-${site.slug}`}
                        title="Card Management"
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        Manage Site
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Admin Options */}
        {user?.isAdmin && (
          <div className="mt-8 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Administrator Options</h3>
                <p className="text-slate-400 text-sm">You have global admin access</p>
              </div>
              <Button 
                onClick={() => setLocation('/sites')}
                variant="outline"
                className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
                data-testid="button-full-admin"
              >
                <Users className="w-4 h-4 mr-2" />
                Full Admin Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}