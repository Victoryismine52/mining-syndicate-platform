import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, FileText, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { LegalDisclaimer } from '@shared/site-schema';

export function LegalDisclaimers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDisclaimer, setEditingDisclaimer] = useState<LegalDisclaimer | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: disclaimers = [], isLoading } = useQuery<LegalDisclaimer[]>({
    queryKey: ['/api/disclaimers'],
  });

  const createDisclaimerMutation = useMutation({
    mutationFn: async (disclaimerData: any) => {
      const response = await apiRequest('POST', '/api/disclaimers', disclaimerData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disclaimers'] });
      setIsCreateOpen(false);
      toast({
        title: "Success",
        description: "Legal disclaimer created successfully",
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

  const updateDisclaimerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/disclaimers/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disclaimers'] });
      setIsEditOpen(false);
      setEditingDisclaimer(null);
      toast({
        title: "Success",
        description: "Legal disclaimer updated successfully",
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

  const deleteDisclaimerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/disclaimers/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disclaimers'] });
      toast({
        title: "Success",
        description: "Legal disclaimer deleted successfully",
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

  const handleCreateDisclaimer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const disclaimerData = {
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      language: formData.get('language') as string,
      content: formData.get('content') as string,
      description: formData.get('description') as string || undefined,
    };

    createDisclaimerMutation.mutate(disclaimerData);
  };

  const handleEditDisclaimer = (disclaimer: LegalDisclaimer) => {
    setEditingDisclaimer(disclaimer);
    setIsEditOpen(true);
  };

  const handleUpdateDisclaimer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDisclaimer) return;

    const formData = new FormData(e.currentTarget);
    
    const updates = {
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      language: formData.get('language') as string,
      content: formData.get('content') as string,
      description: formData.get('description') as string || undefined,
    };

    updateDisclaimerMutation.mutate({ id: editingDisclaimer.id, updates });
  };

  const getLanguageDisplay = (lang: string) => {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'fr': 'French',
      'de': 'German'
    };
    return languages[lang] || lang.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading legal disclaimers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/sites')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="button-back-to-sites"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site Manager
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Legal Disclaimer Library</h1>
              <p className="text-slate-400">Manage legal disclaimers for your sites</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-disclaimer">
                <Plus className="w-4 h-4 mr-2" />
                Create New Disclaimer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white border-slate-600 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Legal Disclaimer</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new legal disclaimer to your document library
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDisclaimer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Disclaimer Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Conduit Mining Syndicate US Legal Disclaimer"
                      className="bg-slate-700 border-slate-600"
                      required
                      data-testid="input-disclaimer-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      name="version"
                      placeholder="e.g., 1.0"
                      defaultValue="1.0"
                      className="bg-slate-700 border-slate-600"
                      required
                      data-testid="input-disclaimer-version"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select name="language" defaultValue="en">
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Brief description of this disclaimer"
                      className="bg-slate-700 border-slate-600"
                      data-testid="input-disclaimer-description"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Legal Disclaimer Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Paste the full legal disclaimer text here..."
                    className="bg-slate-700 border-slate-600 min-h-[300px]"
                    required
                    data-testid="textarea-disclaimer-content"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createDisclaimerMutation.isPending}
                    data-testid="button-submit-disclaimer"
                  >
                    {createDisclaimerMutation.isPending ? "Creating..." : "Create Disclaimer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {disclaimers.map((disclaimer) => (
            <Card key={disclaimer.id} className="bg-slate-800 border-slate-600">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <CardTitle className="text-lg">{disclaimer.name}</CardTitle>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        v{disclaimer.version}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">{getLanguageDisplay(disclaimer.language)}</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        Created {disclaimer.createdAt ? new Date(disclaimer.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    {disclaimer.description && (
                      <CardDescription className="text-slate-400">
                        {disclaimer.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditDisclaimer(disclaimer)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid={`button-edit-disclaimer-${disclaimer.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteDisclaimerMutation.mutate(disclaimer.id)}
                      disabled={deleteDisclaimerMutation.isPending}
                      data-testid={`button-delete-disclaimer-${disclaimer.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 rounded-lg p-4 max-h-32 overflow-y-auto">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {disclaimer.content.length > 300 
                      ? `${disclaimer.content.substring(0, 300)}...` 
                      : disclaimer.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {disclaimers.length === 0 && (
            <Card className="bg-slate-800 border-slate-600 text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Legal Disclaimers</h3>
                <p className="text-slate-400 mb-4">
                  Create your first legal disclaimer to manage legal documents across your sites.
                </p>
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Disclaimer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-slate-800 text-white border-slate-600 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Legal Disclaimer</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update the legal disclaimer details
              </DialogDescription>
            </DialogHeader>
            {editingDisclaimer && (
              <form onSubmit={handleUpdateDisclaimer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Disclaimer Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingDisclaimer.name}
                      className="bg-slate-700 border-slate-600"
                      required
                      data-testid="input-edit-disclaimer-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-version">Version</Label>
                    <Input
                      id="edit-version"
                      name="version"
                      defaultValue={editingDisclaimer.version}
                      className="bg-slate-700 border-slate-600"
                      required
                      data-testid="input-edit-disclaimer-version"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-language">Language</Label>
                    <Select name="language" defaultValue={editingDisclaimer.language}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      name="description"
                      defaultValue={editingDisclaimer.description || ''}
                      className="bg-slate-700 border-slate-600"
                      data-testid="input-edit-disclaimer-description"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-content">Legal Disclaimer Content</Label>
                  <Textarea
                    id="edit-content"
                    name="content"
                    defaultValue={editingDisclaimer.content}
                    className="bg-slate-700 border-slate-600 min-h-[300px]"
                    required
                    data-testid="textarea-edit-disclaimer-content"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateDisclaimerMutation.isPending}
                    data-testid="button-update-disclaimer"
                  >
                    {updateDisclaimerMutation.isPending ? "Updating..." : "Update Disclaimer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                    className="border-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}