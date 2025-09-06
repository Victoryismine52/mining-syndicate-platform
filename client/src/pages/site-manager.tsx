import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, QrCode, Eye, Edit, Trash2, Copy, Settings, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ThemeSelector } from '../../../packages/theme-framework';
import type { Site, InsertSite } from '@shared/site-schema';

export function SiteManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Auto-generation states
  const [siteNameValue, setSiteNameValue] = useState('');
  const [siteIdValue, setSiteIdValue] = useState('');
  const [siteIdTouched, setSiteIdTouched] = useState(false);

  // Generate a URL-friendly slug from site name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Handle site name changes and auto-generate slug if user hasn't customized it
  const handleSiteNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setSiteNameValue(newName);
    
    // Only auto-generate if user hasn't manually edited the site ID
    if (!siteIdTouched && newName) {
      setSiteIdValue(generateSlug(newName));
    }
  };

  // Handle site ID changes and mark as touched
  const handleSiteIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSiteIdValue(e.target.value);
    setSiteIdTouched(true);
  };

  // Reset form state when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setSiteNameValue('');
      setSiteIdValue('');
      setSiteIdTouched(false);
    }
  };

  const getSiteTypeDisplay = (siteType: string | null) => {
    if (!siteType) return { text: 'Unknown', color: 'bg-gray-600' };
    if (siteType === 'mining-syndicate-pitch') return { text: 'Mining Syndicate', color: 'bg-orange-600' };
    if (siteType === 'pitch-site') return { text: 'Pitch Site', color: 'bg-blue-600' };
    if (siteType === 'collective') return { text: 'Collective', color: 'bg-purple-600' };
    return { text: siteType, color: 'bg-gray-600' };
  };

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  const createSiteMutation = useMutation({
    mutationFn: async (siteData: InsertSite & { presentationMode?: string }) => {
      const response = await apiRequest('POST', '/api/sites', siteData);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      setIsCreateOpen(false);
      
      const presentationMode = (variables as any).presentationMode;
      const siteId = data.siteId; // Use the siteId from the response data
      
      toast({
        title: "Success",
        description: "Site created successfully. Redirecting to admin panel...",
      });
      
      // Redirect to admin page immediately for load-immediately mode
      setTimeout(() => {
        if (presentationMode === 'load-immediately') {
          setLocation(`/sites/${siteId}/admin?tab=slides`);
        } else {
          setLocation(`/sites/${siteId}/admin`);
        }
      }, presentationMode === 'load-immediately' ? 500 : 1000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: async ({ siteId, updates }: { siteId: string; updates: Partial<InsertSite> }) => {
      const response = await apiRequest('PUT', `/api/sites/${siteId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      setIsEditOpen(false);
      setEditingSite(null);
      toast({
        title: "Success",
        description: "Site updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const response = await apiRequest('DELETE', `/api/sites/${siteId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      toast({
        title: "Success",
        description: "Site deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const response = await apiRequest('POST', `/api/sites/${siteId}/qr-code`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      toast({
        title: "Success",
        description: "QR code generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleLaunchedMutation = useMutation({
    mutationFn: async ({ siteId, isLaunched }: { siteId: string; isLaunched: boolean }) => {
      const response = await apiRequest('PUT', `/api/sites/${siteId}`, { isLaunched });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      toast({
        title: "Success",
        description: "Site launch status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [selectedSiteType, setSelectedSiteType] = useState('');
  const [passwordProtected, setPasswordProtected] = useState(false);

  const handleCreateSite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const presentationMode = formData.get('presentationMode') as string || 'default';
    
    // Use controlled values or fallback to form data, with auto-generation
    let finalSiteId = siteIdValue.trim();
    const siteName = siteNameValue.trim() || (formData.get('name') as string).trim();
    
    // Auto-generate siteId if empty
    if (!finalSiteId && siteName) {
      finalSiteId = generateSlug(siteName);
    }
    
    // Ensure we have a site ID
    if (!finalSiteId) {
      toast({
        title: "Error",
        description: "Please provide a site name to generate an ID, or enter a custom site ID.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that siteType is selected
    if (!selectedSiteType) {
      toast({
        title: "Error",
        description: "Please select a site type to determine how to construct the site",
        variant: "destructive",
      });
      return;
    }
    
    const siteData: InsertSite = {
      siteId: finalSiteId,
      name: siteName,
      description: (formData.get('description') as string).trim(),
      password: passwordProtected ? (formData.get('password') as string || undefined) : undefined,
      passwordProtected: passwordProtected,
      siteType: selectedSiteType,
      hubspotFormIds: {},
      landingConfig: {},
    };

    // Store presentation mode for later use
    (siteData as any).presentationMode = presentationMode;

    createSiteMutation.mutate(siteData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setIsEditOpen(true);
  };

  const handleUpdateSite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSite) return;

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const switchElement = form.querySelector('[name="passwordProtected"]') as HTMLInputElement;
    
    const updates: Partial<InsertSite> = {
      siteId: formData.get('siteId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      password: formData.get('password') as string || undefined,
      passwordProtected: switchElement ? switchElement.checked : false,
      landingConfig: {
        ...editingSite.landingConfig,
        heroTitle: formData.get('heroTitle') as string || undefined,
        heroSubtitle: formData.get('heroSubtitle') as string || undefined,
        companyName: formData.get('companyName') as string || undefined,
        logoUrl: formData.get('logoUrl') as string || undefined,
      },
    };

    updateSiteMutation.mutate({ siteId: editingSite.siteId, updates });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Site Manager</h1>
            <p className="text-slate-400">Manage your presentation sites and pitch decks</p>
          </div>
          
          {/* Navigation with Create Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
            <nav className="flex items-center gap-1">
              <ThemeSelector 
                variant="pills" 
                size="sm"
                className="bg-slate-800/50 border border-slate-600 mr-3"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 px-4 py-2 h-9"
                data-testid="button-back-to-directory"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Directory
              </Button>
              
              <div className="h-4 w-px bg-slate-600 mx-2"></div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin')}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 px-4 py-2 h-9"
                data-testid="button-admin-dashboard"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
              
              <div className="h-4 w-px bg-slate-600 mx-2"></div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/disclaimers')}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 px-4 py-2 h-9"
                data-testid="button-legal-disclaimers"
              >
                <FileText className="w-4 h-4 mr-2" />
                Legal
              </Button>
            </nav>
            
            <Dialog open={isCreateOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg h-9" data-testid="button-create-site">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Site
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Create New Site</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Set up a new presentation site with customizable forms and content
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSite} className="space-y-6">
                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-200 border-b border-slate-700 pb-2">Basic Information</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-slate-300">Display Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={siteNameValue}
                            onChange={handleSiteNameChange}
                            placeholder="My Mining Syndicate"
                            className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                            required
                            data-testid="input-site-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="siteId" className="text-slate-300">Site ID (Optional)</Label>
                          <Input
                            id="siteId"
                            name="siteId"
                            value={siteIdValue}
                            onChange={handleSiteIdChange}
                            placeholder={siteNameValue ? generateSlug(siteNameValue) : "my-mining-site"}
                            className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                            data-testid="input-site-id"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Used in URL: /sites/{siteIdValue || (siteNameValue ? generateSlug(siteNameValue) : 'your-id')}
                            {!siteIdTouched && siteNameValue && (
                              <span className="text-blue-400 ml-2">(auto-generated from site name)</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Brief description of this site..."
                            className="bg-slate-700/50 border-slate-600 focus:border-blue-500 resize-none"
                            rows={2}
                            data-testid="textarea-description"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Security & Site Type */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-200 border-b border-slate-700 pb-2">Settings</h4>
                      
                      <div className="space-y-4">
                        {/* Site Type */}
                        <div>
                          <Label htmlFor="siteType" className="text-slate-300">Site Type</Label>
                          <Select name="siteType" value={selectedSiteType} onValueChange={setSelectedSiteType}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 focus:border-blue-500" data-testid="select-site-type">
                              <SelectValue placeholder="Select site type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="mining-syndicate-pitch" data-testid="option-mining-syndicate">
                                <div>
                                  <div className="font-medium text-slate-200">Mining Syndicate</div>
                                  <p className="text-sm text-slate-400">Traditional mining investment presentation</p>
                                </div>
                              </SelectItem>
                              <SelectItem value="pitch-site" data-testid="option-pitch-site">
                                <div>
                                  <div className="font-medium text-slate-200">Pitch Site</div>
                                  <p className="text-sm text-slate-400">Generic pitch deck with customizable forms</p>
                                </div>
                              </SelectItem>
                              <SelectItem value="collective" data-testid="option-collective">
                                <div>
                                  <div className="font-medium text-slate-200">Collective</div>
                                  <p className="text-sm text-slate-400">Community site with member management and tasks</p>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Security */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Switch
                              id="passwordProtected"
                              checked={passwordProtected}
                              onCheckedChange={setPasswordProtected}
                              data-testid="switch-password-protected"
                            />
                            <Label htmlFor="passwordProtected" className="text-slate-300">
                              Password Protected
                            </Label>
                          </div>
                          {passwordProtected && (
                            <div>
                              <Label htmlFor="password" className="text-slate-300">Site Password</Label>
                              <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter password for this site"
                                className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                                required={passwordProtected}
                                data-testid="input-password"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Initial Setup */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-200 border-b border-slate-700 pb-2">Initial Setup</h4>
                      {selectedSiteType === 'mining-syndicate-pitch' ? (
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="presentationMode"
                              value="default"
                              defaultChecked
                              className="mt-1"
                              data-testid="radio-default-presentation"
                            />
                            <div>
                              <div className="font-medium text-slate-200">Ready to Use</div>
                              <p className="text-sm text-slate-400">Full presentation with all global slides</p>
                            </div>
                          </label>
                          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="presentationMode"
                              value="load-immediately"
                              className="mt-1"
                              data-testid="radio-load-immediately"
                            />
                            <div>
                              <div className="font-medium text-slate-200">Upload Slides Now</div>
                              <p className="text-sm text-slate-400">Go straight to slide management after creation</p>
                            </div>
                          </label>
                        </div>
                      ) : selectedSiteType === 'collective' ? (
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="presentationMode"
                              value="coming-soon"
                              defaultChecked
                              className="mt-1"
                              data-testid="radio-collective-coming-soon"
                            />
                            <div>
                              <div className="font-medium text-slate-200">Coming Soon Landing Page</div>
                              <p className="text-sm text-slate-400">Create a landing page with admin login for collective setup</p>
                            </div>
                          </label>
                          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="presentationMode"
                              value="configure-now"
                              className="mt-1"
                              data-testid="radio-collective-configure-now"
                            />
                            <div>
                              <div className="font-medium text-slate-200">Configure Collective Now</div>
                              <p className="text-sm text-slate-400">Go directly to admin panel for full collective setup</p>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="presentationMode"
                              value="coming-soon"
                              defaultChecked
                              className="mt-1"
                              data-testid="radio-coming-soon"
                            />
                            <div>
                              <div className="font-medium text-slate-200">Coming Soon Landing Page</div>
                              <p className="text-sm text-slate-400">Create a landing page with admin login for site customization</p>
                            </div>
                          </label>
                          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="presentationMode"
                              value="configure-now"
                              className="mt-1"
                              data-testid="radio-configure-now"
                            />
                            <div>
                              <div className="font-medium text-slate-200">Configure Site Now</div>
                              <p className="text-sm text-slate-400">Go directly to admin panel for full site setup</p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-slate-400 hover:text-slate-200"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                    disabled={createSiteMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createSiteMutation.isPending ? 'Creating...' : 'Create Site'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Site Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Edit Site Settings</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Update your site configuration
                </DialogDescription>
              </DialogHeader>
              {editingSite && (
                <form onSubmit={handleUpdateSite} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-200 border-b border-slate-700 pb-2">Basic Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-siteId" className="text-slate-300">Site ID</Label>
                        <Input
                          id="edit-siteId"
                          name="siteId"
                          defaultValue={editingSite.siteId}
                          className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                          required
                          data-testid="input-edit-site-id"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-name" className="text-slate-300">Display Name</Label>
                        <Input
                          id="edit-name"
                          name="name"
                          defaultValue={editingSite.name}
                          className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                          required
                          data-testid="input-edit-site-name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-description" className="text-slate-300">Description</Label>
                      <Textarea
                        id="edit-description"
                        name="description"
                        defaultValue={editingSite.description || ''}
                        className="bg-slate-700/50 border-slate-600 focus:border-blue-500 resize-none"
                        rows={2}
                        data-testid="textarea-edit-description"
                      />
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-200 border-b border-slate-700 pb-2">Security Settings</h4>
                    
                    <div>
                      <Label htmlFor="edit-password" className="text-slate-300">Custom Password</Label>
                      <Input
                        id="edit-password"
                        name="password"
                        type="password"
                        defaultValue={editingSite.password || ''}
                        placeholder="(optional)"
                        className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                        data-testid="input-edit-password"
                      />
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-700">
                      <Switch
                        id="edit-passwordProtected"
                        name="passwordProtected"
                        defaultChecked={editingSite.passwordProtected || false}
                        data-testid="switch-password-protected"
                      />
                      <Label htmlFor="edit-passwordProtected" className="text-slate-300 cursor-pointer">
                        Enable password protection for this site
                      </Label>
                    </div>
                  </div>

                  {/* Landing Page Customization */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-200 border-b border-slate-700 pb-2">Landing Page Customization</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-heroTitle" className="text-slate-300">Hero Title</Label>
                        <Input
                          id="edit-heroTitle"
                          name="heroTitle"
                          defaultValue={editingSite.landingConfig?.heroTitle || ''}
                          placeholder="Custom hero title"
                          className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                          data-testid="input-edit-hero-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-heroSubtitle" className="text-slate-300">Hero Subtitle</Label>
                        <Input
                          id="edit-heroSubtitle"
                          name="heroSubtitle"
                          defaultValue={editingSite.landingConfig?.heroSubtitle || ''}
                          placeholder="Custom hero subtitle"
                          className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                          data-testid="input-edit-hero-subtitle"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-companyName" className="text-slate-300">Company Name</Label>
                        <Input
                          id="edit-companyName"
                          name="companyName"
                          defaultValue={editingSite.landingConfig?.companyName || ''}
                          placeholder="Company name"
                          className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                          data-testid="input-edit-company-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-logoUrl" className="text-slate-300">Logo URL</Label>
                        <Input
                          id="edit-logoUrl"
                          name="logoUrl"
                          defaultValue={editingSite.landingConfig?.logoUrl || ''}
                          placeholder="https://example.com/logo.png"
                          className="bg-slate-700/50 border-slate-600 focus:border-blue-500"
                          data-testid="input-edit-logo-url"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsEditOpen(false);
                        setEditingSite(null);
                      }}
                      className="text-slate-400 hover:text-slate-200"
                      data-testid="button-edit-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                      disabled={updateSiteMutation.isPending}
                      data-testid="button-edit-submit"
                    >
                      {updateSiteMutation.isPending ? 'Updating...' : 'Update Site'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Sites List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Your Sites</h2>
            <span className="text-slate-400 text-sm">{sites.length} {sites.length === 1 ? 'site' : 'sites'}</span>
          </div>
          
          {sites.length === 0 ? (
            <Card className="bg-slate-800/30 border-slate-700 border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No sites yet</h3>
                  <p className="text-slate-500 mb-4">Create your first mining syndicate presentation site</p>
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Site
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sites.map((site) => (
                <Card key={site.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-white text-lg">{site.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-white ${getSiteTypeDisplay(site.siteType).color}`}>
                              {getSiteTypeDisplay(site.siteType).text}
                            </Badge>
                            {site.siteId === 'main-site' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                ⭐ Main Site
                              </span>
                            )}
                            {site.passwordProtected && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                🔒 Protected
                              </span>
                            )}
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-slate-600 bg-slate-700/30">
                              <Switch
                                checked={site.isLaunched !== false}
                                onCheckedChange={(checked) => 
                                  toggleLaunchedMutation.mutate({ 
                                    siteId: site.siteId, 
                                    isLaunched: checked 
                                  })
                                }
                                disabled={toggleLaunchedMutation.isPending}
                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-600 scale-75"
                                data-testid={`switch-launched-${site.siteId}`}
                              />
                              <span className="text-xs font-medium text-slate-300">
                                {site.isLaunched !== false ? '🚀 Launched' : '⏳ Coming Soon'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <CardDescription className="text-slate-400 mb-3">
                          {site.description || 'No description provided'}
                        </CardDescription>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">URL:</span>
                            <code className="bg-slate-700/50 px-2 py-1 rounded text-blue-300">/site/{site.siteId}</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Created:</span>
                            <span>{site.createdAt ? new Date(site.createdAt).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {site.qrCodeUrl && (
                        <div className="ml-4">
                          <img 
                            src={site.qrCodeUrl} 
                            alt="QR Code" 
                            className="w-16 h-16 border border-slate-600 rounded-lg bg-white p-1"
                            data-testid={`img-qr-code-${site.siteId}`}
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Primary Actions */}
                        <Button
                          size="sm"
                          onClick={() => window.open(`/site/${site.siteId}`, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid={`button-view-site-${site.siteId}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Site
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/site/${site.siteId}/admin`)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          data-testid={`button-admin-panel-${site.siteId}`}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Secondary Actions */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`${window.location.origin}/site/${site.siteId}`)}
                          className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                          data-testid={`button-copy-url-${site.siteId}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateQRMutation.mutate(site.siteId)}
                          disabled={generateQRMutation.isPending}
                          className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                          data-testid={`button-generate-qr-${site.siteId}`}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        
                        {site.siteId !== 'main-site' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSite(site)}
                              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                              data-testid={`button-edit-site-${site.siteId}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSiteMutation.mutate(site.siteId)}
                              disabled={deleteSiteMutation.isPending}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              data-testid={`button-delete-site-${site.siteId}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}