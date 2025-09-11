import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Users, BarChart3, Eye, UserPlus, X, FileText, Shield, ExternalLink, Plus, Trash2, Edit, Images, Globe, Download, CheckCircle, GripVertical, ChevronUp, ChevronDown, Folder, Monitor } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SlugInput } from '@/components/slug-input';
import type { Site, SiteLead, SiteManager, LegalDisclaimer, SiteDisclaimer } from '@shared/site-schema';
import { SlideManager } from '@/components/slide-manager';
import * as XLSX from 'xlsx';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface SiteAdminProps {
  siteId?: string;
}

// Helper function for gradient preview
function getBrandGradientPreview(gradientType: string) {
  const gradients = {
    pitchme: 'bg-gradient-to-r from-blue-600 to-purple-600',
    ocean: 'bg-gradient-to-r from-blue-500 to-teal-500',
    sunset: 'bg-gradient-to-r from-orange-500 to-pink-500',
    forest: 'bg-gradient-to-r from-green-500 to-emerald-600',
    lavender: 'bg-gradient-to-r from-purple-500 to-pink-500',
    gold: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    midnight: 'bg-gradient-to-r from-slate-600 to-blue-600'
  };
  return gradients[gradientType as keyof typeof gradients] || gradients.pitchme;
}

// Sortable Form Item Component  
interface SortableFormItemProps {
  assignment: any;
  template: any;
  onRemove: (assignmentId: string) => void;
  onUpdate: (assignmentId: string, updates: any) => void;
}

function SortableFormItem({ assignment, template, onRemove, onUpdate }: SortableFormItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [colorOverride, setColorOverride] = useState(assignment.overrideConfig?.color || '');
  const [includeInPresentation, setIncludeInPresentation] = useState(assignment.overrideConfig?.includeInPresentation || false);

  // Content customization state
  const [titleOverride, setTitleOverride] = useState(assignment.overrideConfig?.title || '');
  const [subtitleOverride, setSubtitleOverride] = useState(assignment.overrideConfig?.subtitle || '');
  const [descriptionOverride, setDescriptionOverride] = useState(assignment.overrideConfig?.description || '');

  const { debounced: debouncedTitleUpdate, flush: flushTitleUpdate } = useDebouncedCallback((value: string) => {
    onUpdate(assignment.id, {
      overrideConfig: {
        ...(assignment.overrideConfig || {}),
        title: value,
      },
    });
  }, 400);

  const { debounced: debouncedSubtitleUpdate, flush: flushSubtitleUpdate } = useDebouncedCallback((value: string) => {
    onUpdate(assignment.id, {
      overrideConfig: {
        ...(assignment.overrideConfig || {}),
        subtitle: value,
      },
    });
  }, 400);

  const { debounced: debouncedDescriptionUpdate, flush: flushDescriptionUpdate } = useDebouncedCallback((value: string) => {
    onUpdate(assignment.id, {
      overrideConfig: {
        ...(assignment.overrideConfig || {}),
        description: value,
      },
    });
  }, 400);

  useEffect(() => {
    setColorOverride(assignment.overrideConfig?.color || '');
    setIncludeInPresentation(assignment.overrideConfig?.includeInPresentation || false);
    setTitleOverride(assignment.overrideConfig?.title || '');
    setSubtitleOverride(assignment.overrideConfig?.subtitle || '');
    setDescriptionOverride(assignment.overrideConfig?.description || '');
  }, [assignment.overrideConfig?.color, assignment.overrideConfig?.includeInPresentation, assignment.overrideConfig?.title, assignment.overrideConfig?.subtitle, assignment.overrideConfig?.description]);
  

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleColorChange = (newColor: string) => {
    // If clicking the same color, deselect it (reset to default)
    const finalColor = colorOverride === newColor ? '' : newColor;
    setColorOverride(finalColor);
    onUpdate(assignment.id, {
      overrideConfig: {
        ...(assignment.overrideConfig || {}),
        color: finalColor
      }
    });
  };

  const handlePresentationToggle = (checked: boolean) => {
    setIncludeInPresentation(checked);
    onUpdate(assignment.id, {
      overrideConfig: {
        ...(assignment.overrideConfig || {}),
        includeInPresentation: checked
      }
    });
  };


  const colorOptions = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
    { name: 'PitchMe', value: 'pitchme', class: 'bg-gradient-to-r from-blue-600 to-purple-600' }
  ];

  const currentColorClass = colorOptions.find(c => c.value === colorOverride)?.class || 'bg-blue-500';

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`bg-slate-700/50 border-slate-600 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-600/50 transition-colors"
              data-testid={`grip-handle-${assignment.id}`}
            >
              <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            <div className={`w-3 h-3 rounded-full ${currentColorClass}`}></div>
            <CardTitle className="text-lg">
              {assignment.overrideConfig?.title || template?.config?.title || template?.name || 'Unknown Form'}
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              Active
            </Badge>
            {(assignment.overrideConfig?.title || assignment.overrideConfig?.subtitle || assignment.overrideConfig?.description) && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                Custom Content
              </Badge>
            )}
            {includeInPresentation && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                <Monitor className="w-3 h-3 mr-1" />
                In Presentation
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-300 hover:bg-slate-600"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`button-expand-form-${assignment.id}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-950"
              onClick={() => onRemove(assignment.id)}
              data-testid={`button-remove-form-${assignment.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-slate-400">
          {assignment.overrideConfig?.subtitle || assignment.overrideConfig?.description || template?.config?.subtitle || template?.description || 'No description available'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {template?.fields?.map((field: any, index: number) => (
            <Badge key={index} variant="outline" className="text-xs border-slate-500 text-slate-300">
              {field.label}
            </Badge>
          ))}
        </div>

        {isExpanded && (
          <div className="border-t border-slate-600 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Color Override */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">Override Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <Button
                      key={color.value}
                      variant={colorOverride === color.value ? "default" : "outline"}
                      size="sm"
                      className={`h-10 ${colorOverride === color.value 
                        ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800' 
                        : 'border-slate-600 hover:bg-slate-600'}`}
                      onClick={() => handleColorChange(color.value)}
                      data-testid={`button-color-${color.value}-${assignment.id}`}
                    >
                      <div className={`w-4 h-4 rounded-full mr-2 ${color.class}`}></div>
                      <span className="text-xs">{color.name}</span>
                    </Button>
                  ))}
                </div>
                {colorOverride && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-300"
                    onClick={() => handleColorChange('')}
                    data-testid={`button-reset-color-${assignment.id}`}
                  >
                    Reset to Default
                  </Button>
                )}
              </div>

              {/* Presentation Inclusion */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">Presentation Settings</Label>
                <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                  <input
                    type="checkbox"
                    id={`presentation-${assignment.id}`}
                    checked={includeInPresentation}
                    onChange={(e) => handlePresentationToggle(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                    data-testid={`checkbox-presentation-${assignment.id}`}
                  />
                  <Label htmlFor={`presentation-${assignment.id}`} className="text-sm text-slate-300 cursor-pointer">
                    Include in final presentation slide
                  </Label>
                </div>
                <p className="text-xs text-slate-400">
                  When enabled, this form will appear on the final slide of the presentation for easy access.
                </p>
              </div>
            </div>

            {/* Content Customization Section */}
            <div className="border-t border-slate-600 pt-6 mt-6 space-y-4">
              <Label className="text-base font-medium text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Customization
              </Label>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-300">Card Title Override</Label>
                    <input
                      type="text"
                      value={titleOverride}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTitleOverride(value);
                        debouncedTitleUpdate(value);
                      }}
                      onBlur={() => flushTitleUpdate()}
                      placeholder={template?.config?.title || template?.name || 'Default title'}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid={`input-title-override-${assignment.id}`}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-slate-300">Card Subtitle Override</Label>
                    <input
                      type="text"
                      value={subtitleOverride}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSubtitleOverride(value);
                        debouncedSubtitleUpdate(value);
                      }}
                      onBlur={() => flushSubtitleUpdate()}
                      placeholder={template?.config?.subtitle || 'Default subtitle'}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid={`input-subtitle-override-${assignment.id}`}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-slate-300">Card Description Override</Label>
                    <textarea
                      value={descriptionOverride}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDescriptionOverride(value);
                        debouncedDescriptionUpdate(value);
                      }}
                      onBlur={() => flushDescriptionUpdate()}
                      placeholder={template?.config?.description || 'Default description'}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      data-testid={`textarea-description-override-${assignment.id}`}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-slate-400 bg-slate-800/30 border border-slate-600 rounded p-3">
                  <strong>Note:</strong> Leave fields empty to use the default values from the card template. 
                  Custom values will override the template defaults for this site only.
                </div>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Droppable Section Component
function DroppableSection({ 
  section, 
  children, 
  isDragOver = false 
}: { 
  section: { id: string; name: string; } | null; 
  children: React.ReactNode; 
  isDragOver?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: section ? `section-${section.id}` : 'no-section',
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
        isOver || isDragOver
          ? 'border-blue-400 bg-blue-50/10' 
          : 'border-slate-600 bg-slate-800/30'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Folder className="w-4 h-4 text-slate-400" />
        <h4 className="text-sm font-medium text-slate-200">
          {section ? section.name : 'Unsectioned Cards'}
        </h4>
        <Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
          Drop Zone
        </Badge>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

export function SiteAdmin(props: SiteAdminProps) {
  const params = useParams<{ siteId: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isAttachDisclaimerOpen, setIsAttachDisclaimerOpen] = useState(false);
  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);
  const [cardAssignmentState, setCardAssignmentState] = useState<{ templateId: string; isOpen: boolean } | null>(null);
  
  // Collapsible sections state for Edit Settings modal
  const [basicSettingsOpen, setBasicSettingsOpen] = useState(true);
  const [landingConfigOpen, setLandingConfigOpen] = useState(false);
  const [hubspotConfigOpen, setHubspotConfigOpen] = useState(false);
  
  // Form state for controlled inputs
  const [formData, setFormData] = useState({
    name: '',
    siteId: '',
    description: '',
    passwordProtected: false,
    isActive: false,
    footerText: '',
    heroTitle: '',
    heroSubtitle: '',
    companyName: '',
    logoUrl: '',
    brandGradient: 'pitchme',
    formsTitle: '',
    formsDescription: '',
    hubspotEnabled: false,
    hubspotApiKey: '',
    hubspotPortalId: ''
  });
  

  
  // Handle tab selection from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'leads';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Extract siteId from props, params, or URL path manually as fallback
  const siteId = props.siteId || params.siteId || (() => {
    const pathParts = window.location.pathname.split('/');
    const siteIndex = pathParts.indexOf('site');
    return siteIndex !== -1 && pathParts[siteIndex + 1] ? pathParts[siteIndex + 1] : undefined;
  })();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
  }, [location, props.siteId, params.siteId, siteId]);

  // Note: Authentication is handled by ProtectedRoute wrapper

  const { data: site, isLoading: siteLoading } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
    enabled: !!siteId && isAuthenticated,
  });

  // Initialize form data when site data loads
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        siteId: site.siteId || '',
        description: site.description || '',
        passwordProtected: site.passwordProtected || false,
        isActive: site.isActive || false,
        footerText: site.footerText || '',
        heroTitle: site.landingConfig?.heroTitle || '',
        heroSubtitle: site.landingConfig?.heroSubtitle || '',
        companyName: site.landingConfig?.companyName || '',
        logoUrl: site.landingConfig?.logoUrl || '',
        brandGradient: site.landingConfig?.brandGradient || 'pitchme',
        formsTitle: site.landingConfig?.formsTitle || '',
        formsDescription: site.landingConfig?.formsDescription || '',
        hubspotEnabled: site.hubspotEnabled || false,
        hubspotApiKey: site.hubspotApiKey || '',
        hubspotPortalId: site.hubspotPortalId || ''
      });
    }
  }, [site]);



  const { data: leads = [], isLoading: leadsLoading } = useQuery<SiteLead[]>({
    queryKey: [`/api/sites/${siteId}/leads`],
    enabled: !!siteId && isAuthenticated,
  });

  const { data: managers = [] } = useQuery<SiteManager[]>({
    queryKey: [`/api/sites/${siteId}/managers`],
    enabled: !!siteId && isAuthenticated,
  });

  const { data: siteDisclaimers = [] } = useQuery<SiteDisclaimer[]>({
    queryKey: [`/api/sites/${siteId}/disclaimers`],
    enabled: !!siteId && isAuthenticated,
  });

  const { data: allDisclaimers = [] } = useQuery<LegalDisclaimer[]>({
    queryKey: [`/api/sites/${siteId}/available-disclaimers`],
    enabled: !!siteId && isAuthenticated,
  });


  // Check if current user is a site manager for this site
  const { data: isSiteManager = false } = useQuery({
    queryKey: ["/api/sites", siteId, "user-manager-status"],
    queryFn: async () => {
      if (user?.isAdmin) return false; // Global admins don't need site manager check
      try {
        const response = await fetch(`/api/sites/${siteId}/managers`);
        return response.ok; // If they can access managers endpoint, they're a site manager
      } catch {
        return false;
      }
    },
    enabled: !!user && !user?.isAdmin
  });

  // Determine if user can manage this site (global admin OR site manager)
  const canManageSite = user?.isAdmin || isSiteManager;

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: Boolean(siteId && isAuthenticated && canManageSite),
  });

  // Form templates for pitch sites
  const { data: formTemplates = [] } = useQuery<any[]>({
    queryKey: ['/api/form-templates'],
    enabled: Boolean(siteId && isAuthenticated),
  });

  // Site form assignments for pitch sites
  const { data: siteFormAssignments = [], refetch: refetchFormAssignments } = useQuery<any[]>({
    queryKey: [`/api/sites/${siteId}/form-assignments`],
    enabled: Boolean(siteId && isAuthenticated),
    staleTime: 0, // Always consider stale to force refresh
    gcTime: 0, // Don't cache this query
    queryFn: async () => {
      // Add aggressive cache-busting to force fresh data
      const response = await fetch(`/api/sites/${siteId}/form-assignments?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Site sections for organizing cards
  const { data: siteSections = [] } = useQuery<any[]>({
    queryKey: [`/api/sites/${siteId}/sections`],
    enabled: Boolean(siteId && isAuthenticated),
  });

  const addManagerMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await apiRequest('POST', `/api/sites/${siteId}/managers`, { userEmail });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/managers`] });
      setIsAddManagerOpen(false);
      toast({
        title: "Success",
        description: "Site manager added successfully",
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

  const inviteManagerMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await apiRequest('POST', `/api/sites/${siteId}/managers`, { userEmail });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/managers`] });
      setIsInviteManagerOpen(false);
      toast({
        title: "Success",
        description: "Invitation sent successfully",
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

  const attachDisclaimerMutation = useMutation({
    mutationFn: async ({ disclaimerId, displayOrder, linkText }: { disclaimerId: string; displayOrder: number; linkText: string }) => {
      const response = await apiRequest('POST', `/api/sites/${siteId}/disclaimers`, { disclaimerId, displayOrder, linkText });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/disclaimers`] });
      setIsAttachDisclaimerOpen(false);
      toast({
        title: "Success",
        description: "Legal disclaimer attached to site successfully",
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

  const detachDisclaimerMutation = useMutation({
    mutationFn: async (disclaimerId: string) => {
      const response = await apiRequest('DELETE', `/api/sites/${siteId}/disclaimers/${disclaimerId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/disclaimers`] });
      toast({
        title: "Success",
        description: "Legal disclaimer detached from site successfully",
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

  const removeManagerMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await apiRequest('DELETE', `/api/sites/${siteId}/managers/${encodeURIComponent(userEmail)}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/managers`] });
      toast({
        title: "Success",
        description: "Site manager removed successfully",
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

  // Mutation for editing site settings
  const editSiteMutation = useMutation({
    mutationFn: async (updatedSite: any) => {
      console.log('Updating site with data:', updatedSite);
      const response = await apiRequest('PUT', `/api/sites/${siteId}`, updatedSite);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Site update failed:', errorData);
        throw new Error(`Failed to update site: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] });
      setIsEditSiteOpen(false);
      toast({
        title: "Success",
        description: "Site settings updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Edit site mutation error:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to update site settings",
        variant: "destructive",
      });
    }
  });

  const addFormToSiteMutation = useMutation({
    mutationFn: async ({ formTemplateId, sectionId }: { formTemplateId: string; sectionId?: string }) => {
      const response = await apiRequest('POST', `/api/sites/${siteId}/form-assignments`, {
        formTemplateId,
        sectionId,
        displayOrder: '1',
        cardPosition: 'main',
        isActive: true,
        overrideConfig: {}
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/form-assignments`] });
      toast({
        title: "Success",
        description: "Card added to site successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add card to site",
        variant: "destructive",
      });
    }
  });

  const removeFormFromSiteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiRequest('DELETE', `/api/site-form-assignments/${assignmentId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/form-assignments`] });
      toast({
        title: "Success",
        description: "Form removed from site successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove form from site",
        variant: "destructive",
      });
    }
  });

  // Form reordering mutation
  const reorderFormsMutation = useMutation({
    mutationFn: async (reorderedAssignments: Array<{ id: string; displayOrder: string }>) => {
      await Promise.all(
        reorderedAssignments.map(assignment =>
          apiRequest('PUT', `/api/site-form-assignments/${assignment.id}`, {
            displayOrder: assignment.displayOrder
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/form-assignments`] });
      toast({
        title: "Success",
        description: "Form order updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update form order",
        variant: "destructive",
      });
    }
  });

  // Section management mutations
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: { name: string; description?: string; displayOrder: string }) => {
      const response = await fetch(`/api/sites/${siteId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create section: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/sections`] });
      setIsCreateSectionOpen(false);
      toast({
        title: "Success",
        description: "Section created successfully",
      });
    },
    onError: (error) => {
      console.error("Section creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create section",
        variant: "destructive",
      });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, updates }: { sectionId: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/site-sections/${sectionId}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/sections`] });
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const response = await apiRequest('DELETE', `/api/site-sections/${sectionId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/sections`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/form-assignments`] });
      toast({
        title: "Success",
        description: "Section deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
    }
  });

  // Form assignment update mutation
  const updateFormAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, updates }: { assignmentId: string; updates: any }) => {
      console.log('Updating form assignment:', assignmentId, 'with updates:', updates);
      const response = await apiRequest('PUT', `/api/site-form-assignments/${assignmentId}`, updates);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Form assignment update failed:', response.status, errorText);
        throw new Error(`Update failed: ${response.status} ${errorText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Form assignment updated successfully:', data);
      // Force immediate refresh with manual refetch
      setTimeout(() => {
        refetchFormAssignments();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Form assignment update error:', error);
      toast({
        title: "Error",
        description: `Failed to update form configuration: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle drag end for form reordering and section assignment
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dropping into a section
    if (overId.startsWith('section-') || overId === 'no-section') {
      const sectionId = overId === 'no-section' ? null : overId.replace('section-', '');
      
      // Update the card's section assignment
      updateFormAssignmentMutation.mutate({
        assignmentId: activeId,
        updates: { sectionId }
      });
      return;
    }

    // Otherwise, handle reordering within the same section
    const oldIndex = siteFormAssignments.findIndex(item => item.id === activeId);
    const newIndex = siteFormAssignments.findIndex(item => item.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(siteFormAssignments, oldIndex, newIndex);
      
      // Update display order based on new positions
      const reorderedAssignments = reorderedItems.map((item, index) => ({
        id: item.id,
        displayOrder: (index + 1).toString()
      }));

      reorderFormsMutation.mutate(reorderedAssignments);
    }
  };

  const handleAddManager = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userEmail = formData.get('userEmail') as string;
    if (userEmail) {
      addManagerMutation.mutate(userEmail);
    }
  };

  const handleInviteManager = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userEmail = formData.get('inviteEmail') as string;
    if (userEmail) {
      inviteManagerMutation.mutate(userEmail);
    }
  };

  const handleAttachDisclaimer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const disclaimerId = formData.get('disclaimerId') as string;
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 1;
    const linkText = formData.get('linkText') as string || 'Legal Disclaimer';
    
    if (disclaimerId) {
      attachDisclaimerMutation.mutate({ disclaimerId, displayOrder, linkText });
    }
  };

  // Handle edit site form submission
  const handleEditSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started, formData:', formData);
    
    const updatedSite = {
      name: formData.name,
      siteId: formData.siteId,
      description: formData.description || '',
      passwordProtected: formData.passwordProtected,
      isActive: formData.isActive,
      footerText: formData.footerText || '',
      landingConfig: {
        heroTitle: formData.heroTitle || '',
        heroSubtitle: formData.heroSubtitle || '',
        companyName: formData.companyName || '',
        logoUrl: formData.logoUrl || '',
        brandGradient: formData.brandGradient || 'pitchme',
        formsTitle: formData.formsTitle || '',
        formsDescription: formData.formsDescription || '',
      },
      hubspotEnabled: formData.hubspotEnabled,
      hubspotApiKey: formData.hubspotApiKey || '',
      hubspotPortalId: formData.hubspotPortalId || '',
    };
    
    console.log('Submitting site update:', updatedSite);
    editSiteMutation.mutate(updatedSite);
  };
  
  // Helper function to update form data
  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || siteLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading site administration...</p>
          {siteId && <p className="mt-2 text-slate-500">Site: {siteId}</p>}
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site Not Found</h1>
          <p className="text-slate-400 mb-4">The requested site does not exist or you don't have access to it.</p>
          {user?.isAdmin && (
            <div className="bg-slate-800 p-4 rounded mt-4 text-left">
              <p className="text-sm text-yellow-400">Debug Info (Admin Only):</p>
              <p className="text-xs text-slate-300">Site ID: {siteId || 'EMPTY'}</p>
              <p className="text-xs text-slate-300">Current Location: {location}</p>
              <p className="text-xs text-slate-300">Window Path: {window.location.pathname}</p>
              <p className="text-xs text-slate-300">User Admin: {user.isAdmin ? 'Yes' : 'No'}</p>
              <p className="text-xs text-slate-300">Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
            </div>
          )}
          <Button onClick={() => setLocation('/sites')} variant="outline" className="mt-4">
            Back to Sites
          </Button>
        </div>
      </div>
    );
  }

  // Group leads by form type dynamically
  const formTypeGroups = leads.reduce((groups, lead) => {
    const formType = lead.formType || 'unknown';
    if (!groups[formType]) {
      groups[formType] = [];
    }
    groups[formType].push(lead);
    return groups;
  }, {} as Record<string, SiteLead[]>);

  // Get form type configurations for display
  const getFormTypeConfig = (formType: string) => {
    const configs = {
      'learn-more': {
        title: 'Information Requests',
        description: 'General inquiries and information requests',
        color: 'blue',
        icon: BarChart3,
      },
      'mining-pool': {
        title: 'Mining Pool Interest',
        description: 'Hardware mining opportunity inquiries',
        color: 'orange', 
        icon: Settings,
      },
      'lending-pool': {
        title: 'Lending Pool Interest',
        description: 'Passive income lending opportunities',
        color: 'green',
        icon: Users,
      },
      'pitch-site': {
        title: 'Pitch Inquiries',
        description: 'Interest in pitch presentation opportunities',
        color: 'purple',
        icon: FileText,
      },
      'unknown': {
        title: 'Other Inquiries',
        description: 'Miscellaneous form submissions',
        color: 'gray',
        icon: BarChart3,
      }
    };
    return configs[formType as keyof typeof configs] || configs['unknown'];
  };

  // Excel export function
  const exportToExcel = () => {
    const exportData = leads.map(lead => ({
      'First Name': lead.firstName,
      'Last Name': lead.lastName,
      'Email': lead.email,
      'Phone': lead.phone || '',
      'Company': lead.company || '',
      'Form Type': lead.formType,
      'Mining Amount': lead.miningAmount || '',
      'Lending Amount': lead.lendingAmount || '',
      'Interests': Array.isArray(lead.interests) ? lead.interests.join(', ') : '',
      'Message': lead.message || '',
      'Created Date': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
      'IP Address': lead.ipAddress || '',
      'User Agent': lead.userAgent || '',
      'Referrer': lead.referrer || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    
    const fileName = `${site?.siteId || 'site'}-leads-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Export Complete",
      description: `Downloaded ${leads.length} leads to ${fileName}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">{site.name}</h1>
              <p className="text-slate-400 mt-1">Admin Dashboard • Site ID: {site.siteId}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`/site/${site.siteId}`, '_blank')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                data-testid="button-view-site"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Site
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/sites')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                data-testid="button-back-to-sites"
              >
                <Globe className="w-4 h-4 mr-2" />
                All Sites
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-slate-800/50 border border-slate-700 p-1 rounded-lg">
              <TabsTrigger 
                value="leads" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {site?.siteType === 'collective' ? 'Community Stats' : 'Lead Management'}
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Site Settings
              </TabsTrigger>
              {/* Sections & Card Management - For Pitch Sites and Collective Sites */}
              {(site?.siteType === 'pitch-site' || site?.siteType === 'collective') && (
                <>
                  <TabsTrigger 
                    value="sections" 
                    className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Sections
                  </TabsTrigger>
                  <TabsTrigger 
                    value="forms" 
                    className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Card Management
                  </TabsTrigger>
                </>
              )}
              {/* Slide Management - Only for non-collective sites */}
              {site?.siteType !== 'collective' && (
                <TabsTrigger 
                  value="slides" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
                >
                  <Images className="w-4 h-4 mr-2" />
                  Slide Management
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="disclaimers" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
              >
                <Shield className="w-4 h-4 mr-2" />
                Legal Disclaimers
              </TabsTrigger>
              {canManageSite && (
                <TabsTrigger 
                  value="managers" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Site Managers
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Lead Management Tab */}
          <TabsContent value="leads" className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Lead Management 
                {site?.siteType === 'mining-syndicate-pitch' && <span className="text-sm font-normal text-slate-400 ml-2">(Hardcoded Forms)</span>}
                {site?.siteType === 'pitch-site' && <span className="text-sm font-normal text-slate-400 ml-2">(Dynamic Forms)</span>}
              </h2>
              <Button
                onClick={exportToExcel}
                disabled={leads.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-export-excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to Excel ({leads.length} leads)
              </Button>
            </div>
            {/* Dynamic Form Type Cards */}
            {Object.keys(formTypeGroups).length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="w-12 h-12 text-slate-500 mb-4" />
                  <p className="text-slate-400 text-lg mb-2">No leads yet</p>
                  <p className="text-slate-500 text-sm text-center">
                    Leads will appear here once visitors submit forms on your site
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(formTypeGroups).map(([formType, formLeads]) => {
                  const config = getFormTypeConfig(formType);
                  const IconComponent = config.icon;
                  const colorMap: Record<string, string> = {
                    blue: 'text-blue-400',
                    orange: 'text-orange-400', 
                    green: 'text-green-400',
                    purple: 'text-purple-400',
                    gray: 'text-gray-400'
                  };
                  const colorClass = colorMap[config.color] || 'text-gray-400';

                  return (
                    <Card key={formType} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                      <CardHeader className="pb-4">
                        <CardTitle className={`${colorClass} flex items-center gap-2`}>
                          <IconComponent className="w-5 h-5" />
                          {config.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {config.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className={`text-3xl font-bold ${colorClass} mb-4`}>{formLeads.length}</div>
                          <ScrollArea className="h-96">
                            <div className="space-y-3">
                              {formLeads.map((lead) => (
                                <div key={lead.id} className="p-4 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 transition-colors">
                                  <p className="font-medium text-white">{lead.firstName} {lead.lastName}</p>
                                  <p className="text-sm text-slate-300 mt-1">{lead.email}</p>
                                  {lead.phone && <p className="text-sm text-slate-300">{lead.phone}</p>}
                                  {lead.company && <p className="text-sm text-slate-400">{lead.company}</p>}
                                  {lead.miningAmount && (
                                    <p className="text-sm text-orange-400 mt-1">Mining Amount: {lead.miningAmount}</p>
                                  )}
                                  {lead.lendingAmount && (
                                    <p className="text-sm text-green-400 mt-1">Lending Amount: {lead.lendingAmount}</p>
                                  )}
                                  {lead.message && <p className="text-sm text-slate-400 mt-2">{lead.message}</p>}
                                  <p className="text-xs text-slate-500 mt-2">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Unknown date'}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Site Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Site Configuration</CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage site settings and presentation configuration
                    </CardDescription>
                  </div>
                  <Dialog open={isEditSiteOpen} onOpenChange={setIsEditSiteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        data-testid="button-edit-site-settings"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 text-white border-slate-600 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Site Settings</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Update site configuration and presentation settings
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleEditSite} className="space-y-6">
                        {/* Basic Site Settings Section */}
                        <Collapsible open={basicSettingsOpen} onOpenChange={setBasicSettingsOpen}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              <span className="font-medium">Basic Site Settings</span>
                            </div>
                            {basicSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Site Name</Label>
                                <Input
                                  id="name"
                                  name="name"
                                  value={formData.name}
                                  onChange={(e) => updateFormField('name', e.target.value)}
                                  className="bg-slate-700 border-slate-600"
                                  data-testid="input-site-name"
                                  required
                                />
                              </div>
                              <SlugInput
                                label="Site URL Slug"
                                name="siteId"
                                value={formData.siteId}
                                onChange={(value) => updateFormField('siteId', value)}
                                originalSlug={site.siteId}
                                required
                                data-testid="input-site-slug"
                              />
                            </div>

                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={(e) => updateFormField('description', e.target.value)}
                                className="bg-slate-700 border-slate-600"
                                data-testid="textarea-site-description"
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  name="passwordProtected"
                                  checked={formData.passwordProtected}
                                  onCheckedChange={(value) => updateFormField('passwordProtected', value)}
                                  data-testid="switch-password-protected"
                                />
                                <Label htmlFor="passwordProtected">Password Protected</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  name="isActive"
                                  checked={formData.isActive}
                                  onCheckedChange={(value) => updateFormField('isActive', value)}
                                  data-testid="switch-site-active"
                                />
                                <Label htmlFor="isActive">Site Active</Label>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Landing Page Configuration Section */}
                        <Collapsible open={landingConfigOpen} onOpenChange={setLandingConfigOpen}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              <span className="font-medium">Landing Page Configuration</span>
                            </div>
                            {landingConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="heroTitle">Hero Title</Label>
                              <Input
                                id="heroTitle"
                                name="heroTitle"
                                value={formData.heroTitle}
                                onChange={(e) => updateFormField('heroTitle', e.target.value)}
                                placeholder="Mining Syndicate Investment"
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-hero-title"
                              />
                            </div>
                            <div>
                              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                              <Input
                                id="heroSubtitle"
                                name="heroSubtitle"
                                value={formData.heroSubtitle}
                                onChange={(e) => updateFormField('heroSubtitle', e.target.value)}
                                placeholder="Decentralized Mining Infrastructure"
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-hero-subtitle"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="companyName">Company Name</Label>
                              <Input
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={(e) => updateFormField('companyName', e.target.value)}
                                placeholder={site?.siteType === 'collective' ? site.name : "Mining Syndicate LLC"}
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-company-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="logoUrl">Logo URL</Label>
                              <Input
                                id="logoUrl"
                                name="logoUrl"
                                value={formData.logoUrl}
                                onChange={(e) => updateFormField('logoUrl', e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-logo-url"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="formsTitle">
                                {site?.siteType === 'collective' ? 'Default Section Title' : 'Forms Section Title'}
                              </Label>
                              <Input
                                id="formsTitle"
                                name="formsTitle"
                                value={formData.formsTitle}
                                onChange={(e) => updateFormField('formsTitle', e.target.value)}
                                placeholder={site?.siteType === 'collective' ? 'Join Our Community' : 'Get Connected'}
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-forms-title"
                              />
                            </div>
                            <div>
                              <Label htmlFor="formsDescription">
                                {site?.siteType === 'collective' ? 'Default Section Description' : 'Forms Section Description'}
                              </Label>
                              <Textarea
                                id="formsDescription"
                                name="formsDescription"
                                value={formData.formsDescription}
                                onChange={(e) => updateFormField('formsDescription', e.target.value)}
                                placeholder={site?.siteType === 'collective' ? 'Become a member of our collective and help shape our shared goals.' : 'Explore our opportunities and connect with us through the forms below.'}
                                className="bg-slate-700 border-slate-600"
                                data-testid="textarea-forms-description"
                                rows={2}
                              />
                            </div>
                          </div>
                          
                          {/* Brand Gradient Selector - Only for Pitch Sites */}
                          {site.siteType === 'pitch-site' && (
                            <div className="col-span-2">
                              <Label htmlFor="brandGradient">Brand Gradient</Label>
                              <Select name="brandGradient" value={formData.brandGradient} onValueChange={(value) => updateFormField('brandGradient', value)}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                  <SelectValue placeholder="Choose a gradient theme" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pitchme">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                                      PitchMe (Blue to Purple)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="ocean">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-teal-500"></div>
                                      Ocean (Blue to Teal)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="sunset">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"></div>
                                      Sunset (Orange to Pink)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="forest">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"></div>
                                      Forest (Green to Emerald)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="lavender">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                      Lavender (Purple to Pink)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="gold">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                                      Gold (Yellow to Orange)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="midnight">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-slate-600 to-blue-600"></div>
                                      Midnight (Dark to Blue)
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-400 mt-1">
                                This gradient will be applied to banners, buttons, and branding elements
                              </p>
                            </div>
                          )}
                          <div>
                            <Label htmlFor="footerText">Footer Text</Label>
                            <Input
                              id="footerText"
                              name="footerText"
                              value={formData.footerText}
                              onChange={(e) => updateFormField('footerText', e.target.value)}
                              placeholder="© 2025 Your Company Name. All rights reserved."
                              className="bg-slate-700 border-slate-600"
                              data-testid="input-footer-text"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                              Leave empty to use "PitchMe" for pitch sites or default text for syndicate sites
                            </p>
                          </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* HubSpot Integration Section */}
                        <Collapsible open={hubspotConfigOpen} onOpenChange={setHubspotConfigOpen}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                              <span className="font-medium">HubSpot Integration</span>
                            </div>
                            {hubspotConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 pt-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="hubspotEnabled"
                              name="hubspotEnabled"
                              defaultChecked={site.hubspotEnabled || false}
                              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              data-testid="checkbox-hubspot-enabled"
                            />
                            <Label htmlFor="hubspotEnabled" className="text-sm font-medium text-slate-300">
                              Enable HubSpot contact sync
                            </Label>
                          </div>
                          <p className="text-xs text-slate-400">
                            When enabled, form submissions will automatically create contacts in HubSpot
                          </p>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="hubspotApiKey">HubSpot Private App API Key</Label>
                              <Input
                                id="hubspotApiKey"
                                name="hubspotApiKey"
                                type="password"
                                value={formData.hubspotApiKey}
                                onChange={(e) => updateFormField('hubspotApiKey', e.target.value)}
                                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-hubspot-api-key"
                              />
                              <p className="text-xs text-slate-400 mt-1">
                                Create a Private App in HubSpot with 'crm.objects.contacts.write' scope
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="hubspotPortalId">HubSpot Portal ID (Optional)</Label>
                              <Input
                                id="hubspotPortalId"
                                name="hubspotPortalId"
                                value={formData.hubspotPortalId}
                                onChange={(e) => updateFormField('hubspotPortalId', e.target.value)}
                                placeholder="12345678"
                                className="bg-slate-700 border-slate-600"
                                data-testid="input-hubspot-portal-id"
                              />
                              <p className="text-xs text-slate-400 mt-1">
                                Found in HubSpot Settings → Account Setup → Account Defaults
                              </p>
                            </div>
                          </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsEditSiteOpen(false)}
                            className="text-slate-400 hover:text-slate-200"
                            data-testid="button-cancel"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                            disabled={editSiteMutation.isPending}
                            data-testid="button-submit"
                          >
                            {editSiteMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Site Name</Label>
                    <div className="p-2 bg-slate-700 rounded">{site.name}</div>
                  </div>
                  <div>
                    <Label>Site URL</Label>
                    <div className="p-2 bg-slate-700 rounded">/site/{site.siteId}</div>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <div className="p-2 bg-slate-700 rounded">{site.description || 'No description'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={site.passwordProtected || false}
                      disabled={true}
                      data-testid="switch-password-protected-view"
                    />
                    <Label>Password Protected</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={site.isActive || false}
                      disabled={true}
                      data-testid="switch-site-active-view"
                    />
                    <Label>Site Active</Label>
                  </div>
                </div>

                {site.landingConfig && (
                  <div className="space-y-2">
                    <Label>Landing Page Configuration</Label>
                    <div className="p-3 bg-slate-700 rounded space-y-2">
                      <div><strong>Hero Title:</strong> {site.landingConfig.heroTitle || 'Default'}</div>
                      <div><strong>Hero Subtitle:</strong> {site.landingConfig.heroSubtitle || 'Default'}</div>
                      <div><strong>Company Name:</strong> {site.landingConfig.companyName || 'Default'}</div>
                      {site.landingConfig.logoUrl && (
                        <div><strong>Logo URL:</strong> {site.landingConfig.logoUrl}</div>
                      )}
                      {site.siteType === 'pitch-site' && site.landingConfig.brandGradient && (
                        <div className="flex items-center gap-2">
                          <strong>Brand Gradient:</strong> 
                          <div className={`w-4 h-4 rounded-full ${getBrandGradientPreview(site.landingConfig.brandGradient)}`}></div>
                          <span className="capitalize">{site.landingConfig.brandGradient}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Footer Configuration</Label>
                  <div className="p-3 bg-slate-700 rounded">
                    <div><strong>Footer Text:</strong> {
                      site.footerText 
                        ? `"${site.footerText}" (custom)` 
                        : site.siteType === 'pitch-site' 
                          ? '"PitchMe" (default for pitch sites)' 
                          : `"© ${site.landingConfig?.companyName || (site?.siteType === 'collective' ? site.name : 'Mining Syndicate')}. All rights reserved." (default)`
                    }</div>
                  </div>
                </div>

                {/* HubSpot Integration Display */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">H</span>
                    </div>
                    <Label>HubSpot Integration</Label>
                  </div>
                  <div className="p-3 bg-slate-700 rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>Status:</strong> 
                      {site.hubspotEnabled ? (
                        <Badge variant="default" className="bg-green-600 text-white">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-600 text-slate-300">Disabled</Badge>
                      )}
                    </div>
                    {site.hubspotEnabled && (
                      <>
                        <div>
                          <strong>API Key:</strong> {site.hubspotApiKey ? '••••••••••••••••' : 'Not configured'}
                        </div>
                        {site.hubspotPortalId && (
                          <div><strong>Portal ID:</strong> {site.hubspotPortalId}</div>
                        )}
                        <div className="text-sm text-slate-400">
                          Form submissions automatically sync to HubSpot contacts
                        </div>
                      </>
                    )}
                    {!site.hubspotEnabled && (
                      <div className="text-sm text-slate-400">
                        Enable in Edit Settings to sync form submissions to HubSpot
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Site Disclaimers</Label>
                      <p className="text-sm text-slate-400">View disclaimers attached to this site</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/site/${site.siteId}/disclaimer`, '_blank')}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="button-view-site-disclaimers"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Site Disclaimers
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Card Management Tab - For Pitch Sites and Collective Sites */}
          {(site?.siteType === 'pitch-site' || site?.siteType === 'collective') && (
            <TabsContent value="forms" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Card Selection & Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Select cards from the library and configure their display text and translations for this site
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  {/* Add New Form Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">Active Site Cards</h3>
                      <p className="text-sm text-slate-400">Cards currently available on this site's landing page</p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="button-add-site-form"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Card to Site
                    </Button>
                  </div>

                  {/* Active Forms List - Organized by Sections */}
                  <div className="space-y-4">
                    {siteFormAssignments.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 bg-slate-700/20 border border-slate-600 rounded-lg">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <h4 className="text-md font-medium mb-1">No Active Cards</h4>
                        <p className="text-sm">
                          Select cards from the library below to add them to this site
                        </p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={siteFormAssignments.map(assignment => assignment.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-6">
                            {/* Sections with assigned cards */}
                            {siteSections?.map((section) => {
                              const sectionCards = siteFormAssignments
                                .filter(a => a.sectionId === section.id)
                                .sort((a, b) => parseInt(a.displayOrder || '0') - parseInt(b.displayOrder || '0'));
                              
                              return (
                                <DroppableSection key={section.id} section={section}>
                                  {sectionCards.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                      Drag cards here to add them to the "{section.name}" section
                                    </div>
                                  ) : (
                                    sectionCards.map((assignment: any) => {
                                      const template = formTemplates.find(t => t.id === assignment.formTemplateId);
                                      return (
                                        <SortableFormItem
                                          key={assignment.id}
                                          assignment={assignment}
                                          template={template}
                                          onRemove={(assignmentId) => removeFormFromSiteMutation.mutate(assignmentId)}
                                          onUpdate={(assignmentId, updates) => updateFormAssignmentMutation.mutate({ assignmentId, updates })}
                                        />
                                      );
                                    })
                                  )}
                                </DroppableSection>
                              );
                            })}
                            
                            {/* Unsectioned cards */}
                            {(() => {
                              const unsectionedCards = siteFormAssignments
                                .filter(a => !a.sectionId)
                                .sort((a, b) => parseInt(a.displayOrder || '0') - parseInt(b.displayOrder || '0'));
                              
                              return (
                                <DroppableSection section={null}>
                                  {unsectionedCards.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                      Cards without a section will appear in the Forms section of your site
                                    </div>
                                  ) : (
                                    unsectionedCards.map((assignment: any) => {
                                      const template = formTemplates.find(t => t.id === assignment.formTemplateId);
                                      return (
                                        <SortableFormItem
                                          key={assignment.id}
                                          assignment={assignment}
                                          template={template}
                                          onRemove={(assignmentId) => removeFormFromSiteMutation.mutate(assignmentId)}
                                          onUpdate={(assignmentId, updates) => updateFormAssignmentMutation.mutate({ assignmentId, updates })}
                                        />
                                      );
                                    })
                                  )}
                                </DroppableSection>
                              );
                            })()}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>

                  {/* Available Cards from Library */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-white">Available Cards from Library</h3>
                        <p className="text-sm text-slate-400">Cards available to add to this site</p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {(() => {
                        // Filter out forms that are already assigned to this site and hidden templates
                        const assignedFormIds = siteFormAssignments.map(a => a.formTemplateId);
                        const availableForms = formTemplates.filter(t => 
                          !assignedFormIds.includes(t.id) && t.libraryVisibility === 'visible'
                        );
                        
                        if (availableForms.length === 0) {
                          if (formTemplates.length === 0) {
                            return (
                              <div className="text-center py-8 text-slate-400 bg-slate-700/20 border border-slate-600 rounded-lg">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <h4 className="text-lg font-medium mb-2">No Cards Available</h4>
                                <p className="text-sm mb-4">
                                  Create cards in the main admin panel under "Card Library" to see them here.
                                </p>
                                <Button
                                  variant="outline"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                  onClick={() => window.open('/admin', '_blank')}
                                  data-testid="button-open-global-admin"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open Global Admin
                                </Button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-center py-8 text-slate-400 bg-slate-700/20 border border-slate-600 rounded-lg">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <h4 className="text-lg font-medium mb-2">All Cards Added</h4>
                                <p className="text-sm">
                                  All available cards from the library have been added to this site.
                                </p>
                              </div>
                            );
                          }
                        }
                        
                        return availableForms.map((template: any) => (
                          <Card key={template.id} className="bg-slate-700/50 border-slate-600">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <CardTitle className="text-lg">{template.name}</CardTitle>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    {template.fields?.length || 0} Fields
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                  onClick={() => {
                                    // Open a dialog to select section or add without section
                                    if (siteSections.length > 0) {
                                      setCardAssignmentState({ templateId: template.id, isOpen: true });
                                    } else {
                                      addFormToSiteMutation.mutate({ formTemplateId: template.id });
                                    }
                                  }}
                                  disabled={addFormToSiteMutation.isPending}
                                  data-testid={`button-add-form-${template.id}`}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  {addFormToSiteMutation.isPending ? 'Adding...' : 'Add to Site'}
                                </Button>
                              </div>
                              <CardDescription className="text-slate-400">
                                {template.description || 'No description available'}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {template.fields?.map((field: any, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs border-slate-500 text-slate-300">
                                    {field.label}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Help Text */}
                  <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">About Form Management</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Select forms from the global form library to display on your site</li>
                      <li>• Customize display text and translations for each selected card</li>
                      <li>• Cards are created and managed in the main Admin → Card Library</li>
                      <li>• Each site can have its own customized wording for the same card templates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Sections Management Tab - For Pitch Sites and Collective Sites */}
          {(site?.siteType === 'pitch-site' || site?.siteType === 'collective') && (
            <TabsContent value="sections" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Section Management
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Organize your site cards into sections for better content organization and layout control
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsCreateSectionOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-create-section"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Current Sections */}
                    <div className="space-y-4">
                      {siteSections.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-700/20 border border-slate-600 rounded-lg">
                          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <h4 className="text-lg font-medium mb-2">No Sections Created</h4>
                          <p className="text-sm mb-4">
                            Create sections to organize your cards into logical groups for better site layout.
                          </p>
                          <Button
                            onClick={() => setIsCreateSectionOpen(true)}
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            data-testid="button-create-first-section"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Section
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h3 className="text-lg font-medium text-white">Current Sections</h3>
                          {siteSections
                            .sort((a: any, b: any) => parseInt(a.displayOrder || '0') - parseInt(b.displayOrder || '0'))
                            .map((section: any) => {
                              const sectionCards = siteFormAssignments.filter((assignment: any) => assignment.sectionId === section.id);
                              return (
                                <Card key={section.id} className="bg-slate-700/50 border-slate-600">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-white text-lg">{section.name}</CardTitle>
                                        {section.description && (
                                          <CardDescription className="text-slate-400 text-sm">
                                            {section.description}
                                          </CardDescription>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
                                          {sectionCards.length} cards
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingSection(section)}
                                          className="text-slate-400 hover:text-white"
                                          data-testid={`button-edit-section-${section.id}`}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteSectionMutation.mutate(section.id)}
                                          className="text-red-400 hover:text-red-300"
                                          data-testid={`button-delete-section-${section.id}`}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    {sectionCards.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {sectionCards.map((assignment: any) => {
                                          const template = formTemplates.find((t: any) => t.id === assignment.formTemplateId);
                                          if (!template) return null;
                                          return (
                                            <Badge key={assignment.id} variant="secondary" className="text-xs">
                                              {template.config?.title || template.name}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-slate-500 text-sm">No cards assigned to this section</p>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Help Text */}
                    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">About Sections</h4>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• Sections allow you to group related cards together for better organization</li>
                        <li>• Each section can have its own title and description</li>
                        <li>• Cards are assigned to sections in the Form Management tab</li>
                        <li>• Sections are displayed in order on your site's landing page</li>
                        <li>• You can create sections like "Contact Forms", "Investment Options", "Resources", etc.</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Slide Management Tab */}
          <TabsContent value="slides" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="w-5 h-5" />
                  Slide Management
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage custom slides for this site or use global slides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SlideManager siteId={siteId!} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Disclaimers Tab */}
          <TabsContent value="disclaimers" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Legal Disclaimers
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage legal disclaimers attached to this site
                    </CardDescription>
                  </div>
                  <Dialog open={isAttachDisclaimerOpen} onOpenChange={setIsAttachDisclaimerOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-attach-disclaimer"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Attach Disclaimer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 text-white border-slate-600">
                      <DialogHeader>
                        <DialogTitle>Attach Legal Disclaimer</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Select a disclaimer to attach to this site
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAttachDisclaimer} className="space-y-4">
                        <div>
                          <Label htmlFor="disclaimerId">Select Disclaimer</Label>
                          <Select name="disclaimerId" required>
                            <SelectTrigger className="bg-slate-700 border-slate-600">
                              <SelectValue placeholder="Choose a disclaimer" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600 max-h-60">
                              {allDisclaimers
                                .filter(disclaimer => !siteDisclaimers.some(sd => sd.disclaimerId === disclaimer.id))
                                .map((disclaimer) => (
                                <SelectItem key={disclaimer.id} value={disclaimer.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{disclaimer.name}</span>
                                    <span className="text-xs text-slate-400 truncate max-w-xs">
                                      {disclaimer.content.substring(0, 80)}...
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="displayOrder">Display Order</Label>
                            <Input
                              id="displayOrder"
                              name="displayOrder"
                              type="number"
                              defaultValue={siteDisclaimers.length + 1}
                              min={1}
                              className="bg-slate-700 border-slate-600"
                              data-testid="input-display-order"
                            />
                          </div>
                          <div>
                            <Label htmlFor="linkText">Link Text</Label>
                            <Input
                              id="linkText"
                              name="linkText"
                              defaultValue="Legal Disclaimer"
                              placeholder="Legal Disclaimer"
                              className="bg-slate-700 border-slate-600"
                              data-testid="input-link-text"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAttachDisclaimerOpen(false)}
                            className="text-slate-400 hover:text-slate-200"
                            data-testid="button-cancel"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                            disabled={attachDisclaimerMutation.isPending}
                            data-testid="button-submit"
                          >
                            {attachDisclaimerMutation.isPending ? 'Attaching...' : 'Attach Disclaimer'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {siteDisclaimers.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No disclaimers attached to this site</p>
                    <p className="text-sm text-slate-500 mt-1">Click "Attach Disclaimer" to add legal disclaimers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {siteDisclaimers
                      .sort((a, b) => (parseInt(a.displayOrder || "0") || 0) - (parseInt(b.displayOrder || "0") || 0))
                      .map((siteDisclaimer) => {
                        const disclaimer = allDisclaimers.find(d => d.id === siteDisclaimer.disclaimerId);
                        return (
                          <div
                            key={siteDisclaimer.id}
                            className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                                {siteDisclaimer.displayOrder}
                              </Badge>
                              <div>
                                <p className="font-medium">{siteDisclaimer.linkText}</p>
                                <p className="text-sm text-slate-400">
                                  {disclaimer?.name || 'Unknown Disclaimer'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  ID: {siteDisclaimer.disclaimerId.split('-')[0]}...
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/disclaimer/${siteDisclaimer.disclaimerId}`, '_blank')}
                                className="border-slate-600 text-slate-300 hover:bg-slate-600"
                                data-testid={`button-view-disclaimer-${siteDisclaimer.disclaimerId}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => detachDisclaimerMutation.mutate(siteDisclaimer.disclaimerId)}
                                disabled={detachDisclaimerMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid={`button-detach-disclaimer-${siteDisclaimer.disclaimerId}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Managers Tab (Admin & Site Managers) */}
          {canManageSite && (
            <TabsContent value="managers" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Site Managers</CardTitle>
                      <CardDescription className="text-slate-400">
                        Manage who can access this site's admin panel
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isAddManagerOpen} onOpenChange={setIsAddManagerOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-manager">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Manager
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 text-white border-slate-600">
                          <DialogHeader>
                            <DialogTitle>Add Site Manager</DialogTitle>
                            <DialogDescription className="text-slate-400">
                              Select a user to add as a site manager.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddManager} className="space-y-4">
                            <div>
                              <Label htmlFor="userEmail">Select User</Label>
                              <Select name="userEmail" required>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                  <SelectValue placeholder="Choose a user to add as site manager" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                  {(allUsers || [])
                                    .filter((u: any) => !managers.some(m => m.userEmail === u.email))
                                    .map((user: any) => (
                                    <SelectItem key={user.id} value={user.email}>
                                      <div className="flex items-center gap-2">
                                        {user.profilePicture && (
                                          <img
                                            src={user.profilePicture}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            className="w-6 h-6 rounded-full"
                                          />
                                        )}
                                        <div>
                                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                                          <div className="text-sm text-slate-400">{user.email}</div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddManagerOpen(false)}
                                className="text-slate-400 hover:text-slate-200"
                                data-testid="button-cancel"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                                disabled={addManagerMutation.isPending}
                                data-testid="button-submit"
                              >
                                {addManagerMutation.isPending ? 'Adding...' : 'Add Manager'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isInviteManagerOpen} onOpenChange={setIsInviteManagerOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-invite-manager">
                            <Plus className="w-4 h-4 mr-2" />
                            Invite Site Manager
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 text-white border-slate-600">
                          <DialogHeader>
                            <DialogTitle>Invite Site Manager</DialogTitle>
                            <DialogDescription className="text-slate-400">
                              Enter the email address of the user to invite as a site manager.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleInviteManager} className="space-y-4">
                            <div>
                              <Label htmlFor="inviteEmail">Email</Label>
                              <Input
                                id="inviteEmail"
                                type="email"
                                name="inviteEmail"
                                required
                                className="bg-slate-700 border-slate-600"
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsInviteManagerOpen(false)}
                                className="text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                                disabled={inviteManagerMutation.isPending}
                              >
                                {inviteManagerMutation.isPending ? 'Inviting...' : 'Send Invite'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {managers.length > 0 ? (
                      managers.map((manager) => {
                        const managerUser = allUsers?.find((u: any) => u.email === manager.userEmail);
                        return (
                          <div
                            key={manager.id}
                            className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {managerUser?.profilePicture && (
                                <img
                                  src={managerUser.profilePicture}
                                  alt={`${managerUser.firstName} ${managerUser.lastName}`}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {managerUser
                                    ? `${managerUser.firstName} ${managerUser.lastName}`
                                    : manager.userEmail}
                                  {!managerUser && (
                                    <Badge variant="outline" className="text-xs">
                                      Invited
                                    </Badge>
                                  )}
                                </p>
                                {managerUser && (
                                  <p className="text-sm text-slate-400">{manager.userEmail}</p>
                                )}
                                <p className="text-xs text-slate-500">
                                  Added {manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'Unknown date'}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeManagerMutation.mutate(manager.userEmail)}
                              disabled={removeManagerMutation.isPending}
                              data-testid={`button-remove-manager-${manager.userEmail}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No site managers assigned</p>
                        <p className="text-sm">Add managers to give them access to this site's admin panel</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}


        </Tabs>
      </div>

      {/* Create Section Dialog */}
      <Dialog open={isCreateSectionOpen} onOpenChange={setIsCreateSectionOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-600">
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new section to organize your cards
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              const displayOrder = (siteSections.length + 1).toString();
              
              if (name.trim()) {
                createSectionMutation.mutate({
                  name: name.trim(),
                  description: description?.trim() || undefined,
                  displayOrder
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name" className="text-white">Section Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Contact Forms, Investment Options"
                required
                className="bg-slate-700 border-slate-600 text-white"
                data-testid="input-section-name"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="Brief description of this section"
                className="bg-slate-700 border-slate-600 text-white"
                data-testid="input-section-description"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateSectionOpen(false)}
                className="text-slate-400 hover:text-slate-200"
                data-testid="button-cancel-create-section"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createSectionMutation.isPending}
                data-testid="button-submit-create-section"
              >
                {createSectionMutation.isPending ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-600">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update section details
            </DialogDescription>
          </DialogHeader>
          {editingSection && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const description = formData.get('description') as string;
                
                if (name.trim()) {
                  updateSectionMutation.mutate({
                    sectionId: editingSection.id,
                    updates: {
                      name: name.trim(),
                      description: description?.trim() || null
                    }
                  });
                  setEditingSection(null);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="edit-name" className="text-white">Section Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingSection.name}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="input-edit-section-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-white">Description (optional)</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingSection.description || ''}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="input-edit-section-description"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingSection(null)}
                  className="text-slate-400 hover:text-slate-200"
                  data-testid="button-cancel-edit-section"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateSectionMutation.isPending}
                  data-testid="button-submit-edit-section"
                >
                  {updateSectionMutation.isPending ? 'Updating...' : 'Update Section'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Card Assignment Dialog */}
      {cardAssignmentState && (
        <Dialog open={cardAssignmentState.isOpen} onOpenChange={(open) => !open && setCardAssignmentState(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Card to Section</DialogTitle>
              <DialogDescription className="text-slate-400">
                Choose which section to add this card to, or add it without a section.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                onClick={() => {
                  addFormToSiteMutation.mutate({ formTemplateId: cardAssignmentState.templateId });
                  setCardAssignmentState(null);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Add without section
              </Button>
              <div className="space-y-2">
                <p className="text-sm text-slate-400 font-medium">Available Sections:</p>
                {siteSections.map((section: any) => (
                  <Button
                    key={section.id}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                    onClick={() => {
                      addFormToSiteMutation.mutate({ 
                        formTemplateId: cardAssignmentState.templateId,
                        sectionId: section.id
                      });
                      setCardAssignmentState(null);
                    }}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {section.name}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
