import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import type { Site, SiteDisclaimer } from '@shared/site-schema';

export function SiteDisclaimers() {
  const { siteId } = useParams<{ siteId: string }>();
  const [, setLocation] = useLocation();

  const { data: site, isLoading: siteLoading } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
    enabled: !!siteId,
  });

  const { data: disclaimers = [], isLoading: disclaimersLoading } = useQuery<SiteDisclaimer[]>({
    queryKey: [`/api/sites/${siteId}/disclaimers`],
    enabled: !!siteId,
  });

  if (siteLoading || disclaimersLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading disclaimers...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site Not Found</h1>
          <p className="text-slate-400 mb-8">The requested site does not exist.</p>
          <Button onClick={() => setLocation('/')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/site/${siteId}`)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="button-back-to-site"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Site
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Legal Disclaimers</h1>
                <p className="text-slate-400 mt-1">{site.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {disclaimers.length === 0 ? (
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Legal Disclaimers</h2>
              <p className="text-slate-400">This site has no legal disclaimers attached.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Available Legal Disclaimers</h2>
              <p className="text-slate-400">
                Select a disclaimer below to view its content.
              </p>
            </div>

            <div className="grid gap-4">
              {disclaimers.map((disclaimer) => (
                <Card 
                  key={disclaimer.id} 
                  className="bg-slate-800 border-slate-600 hover:bg-slate-750 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/site/${siteId}/disclaimer/${disclaimer.disclaimerId}`)}
                  data-testid={`card-disclaimer-${disclaimer.disclaimerId}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <CardTitle className="text-lg">{disclaimer.linkText || 'Legal Disclaimer'}</CardTitle>
                          <CardDescription className="text-slate-400">
                            Display Order: {disclaimer.displayOrder}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {disclaimer.disclaimerId.split('-')[0]}
                        </Badge>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}