import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Globe, Users, FileText, Eye, EyeOff, Upload, Plus, GripVertical, Trash2, ArrowUp, ArrowDown, ArrowLeft, Download, BarChart3, TrendingUp, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { GlobalSlide, Site, SiteLead, LegalDisclaimer } from "@shared/site-schema";
import type { FormTemplate, InsertFormTemplate } from "@shared/schema";
import { FormBuilder } from "@/components/form-builder";
import { FieldLibraryManager } from "@/components/field-library-manager";
import { UserManagement } from "@/components/user-management";
import * as XLSX from 'xlsx';

// Sortable slide component
interface SortableSlideProps {
  slide: GlobalSlide;
  onToggleVisibility: (slideKey: string, currentlyVisible: boolean) => void;
  onDelete: (slideId: string, slideKey: string) => void;
  isLocked?: boolean;
}

function SortableSlide({ slide, onToggleVisibility, onDelete, isLocked = false }: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-slate-800/50 border-slate-700 border-l-4 ${slide.slideType === 'action-cards' ? 'border-l-amber-500' : 'border-l-blue-500'} ${isDragging ? 'shadow-lg' : ''} hover:bg-slate-800/70 transition-colors`}
    >
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isLocked && (
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-slate-400 hover:text-white" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-white">{slide.title}</h4>
                <Badge variant={slide.slideType === 'action-cards' ? 'default' : 'secondary'}>
                  {slide.slideType}
                </Badge>
                <Badge variant={slide.displayPosition === 'end' ? 'outline' : 'secondary'}>
                  {slide.displayPosition}
                </Badge>
                {isLocked && (
                  <Badge variant="destructive" className="text-xs">
                    LOCKED TO END
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Slide Key: <code className="bg-slate-700 px-1 rounded text-white">{slide.slideKey}</code>
              </p>
              {slide.slideType === 'action-cards' && slide.cardConfig && (
                <div className="mt-2">
                  <p className="text-xs text-slate-400 mb-1">
                    {slide.cardConfig.cards?.length || 0} action cards configured
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {slide.cardConfig.cards?.map((card: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {card.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor={`slide-${slide.id}`} className="text-sm">
                {slide.isVisible ? (
                  <Eye className="h-4 w-4 text-green-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                )}
              </Label>
              <Switch
                id={`slide-${slide.id}`}
                checked={slide.isVisible ?? false}
                onCheckedChange={() => onToggleVisibility(slide.slideKey, slide.isVisible ?? false)}
                data-testid={`switch-slide-visibility-${slide.slideKey}`}
              />
            </div>
            {!isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(slide.id, slide.slideKey)}
                className="h-8 w-8 p-0 border-slate-600 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                data-testid={`button-delete-${slide.slideKey}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Form Library Management Component
function FormLibraryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [currentFormFields, setCurrentFormFields] = useState<any[]>([]);
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch form templates
  const { data: formTemplates = [], isLoading } = useQuery({
    queryKey: ['/api/form-templates'],
  });

  // Create form template mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData: InsertFormTemplate) => {
      const response = await apiRequest('POST', '/api/form-templates', formData);
      return await response.json();
    },
    onSuccess: (createdForm) => {
      setCreatedFormId(createdForm.id);
      // Save fields after form is created
      if (formFields.length > 0) {
        saveFormFields(createdForm.id);
      } else {
        // No fields to save, complete the creation
        queryClient.invalidateQueries({ queryKey: ['/api/form-templates'] });
        setIsCreateOpen(false);
        setFormFields([]);
        setCreatedFormId(null);
        toast({
          title: "Success",
          description: "Form template created successfully",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save form template fields mutation
  const saveFormFieldsMutation = useMutation({
    mutationFn: async ({ formTemplateId, fields }: { formTemplateId: string; fields: any[] }) => {
      const promises = fields.map((field, index) => {
        return apiRequest('POST', `/api/form-templates/${formTemplateId}/fields`, {
          fieldLibraryId: field.fieldLibraryId,
          isRequired: field.isRequired,
          order: (index + 1).toString(),
          customLabel: field.customLabel || null,
          placeholder: field.placeholder || null,
          customValidation: field.customValidation || {}
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/form-templates'] });
      // Also invalidate form assignments queries to update site displays
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.some(key =>
            typeof key === 'string' && key.includes('/form-assignments')
          )
      });
      setIsCreateOpen(false);
      setFormFields([]);
      setCreatedFormId(null);
      toast({
        title: "Success",
        description: "Form template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save form fields: " + error.message,
        variant: "destructive",
      });
    },
  });

  const loadFormFields = async (formTemplateId: string) => {
    try {
      const response = await fetch(`/api/form-templates/${formTemplateId}/fields`);
      if (response.ok) {
        const fields = await response.json();
        const fieldLibraryResponse = await fetch('/api/field-library');
        const fieldLibrary = fieldLibraryResponse.ok ? await fieldLibraryResponse.json() : [];

        // Convert database fields to FormField format
        const convertedFields = fields.map((dbField: any) => {
          const libraryField = fieldLibrary.find((lib: any) => lib.id === dbField.fieldLibraryId);
          return {
            id: dbField.id,
            fieldLibraryId: dbField.fieldLibraryId,
            name: libraryField?.name || 'Unknown Field',
            label: dbField.customLabel || libraryField?.label || 'Unknown Field',
            type: libraryField?.dataType || 'text',
            required: dbField.isRequired,
            placeholder: dbField.customPlaceholder || '',
            order: dbField.orderIndex
          };
        }).sort((a: any, b: any) => a.order - b.order);

        setFormFields(convertedFields);
      } else {
        setFormFields([]);
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
      setFormFields([]);
    }
  };

  const saveFormFields = (formTemplateId: string) => {
    saveFormFieldsMutation.mutate({ formTemplateId, fields: formFields });
  };

  // Update form template mutation
  const updateFormMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<InsertFormTemplate> }) => {
      const response = await apiRequest('PUT', `/api/form-templates/${id}`, formData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/form-templates'] });
      // Also invalidate form assignments queries to update site displays
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.some(key =>
            typeof key === 'string' && key.includes('/form-assignments')
          )
      });
      setEditingForm(null);
      toast({
        title: "Success",
        description: "Form template updated successfully",
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

  // Delete form template mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/form-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/form-templates'] });
      toast({
        title: "Success",
        description: "Form template deleted successfully",
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

  const handleCreateForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const cardType = formData.get('cardType') as string || 'form';

    if (!name) {
      toast({
        title: "Error",
        description: "Form name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate hyperlink fields if cardType is hyperlink
    if (cardType === 'hyperlink') {
      const url = formData.get('url') as string;
      if (!url) {
        toast({
          title: "Error",
          description: "URL is required for hyperlink cards",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate YouTube fields if cardType is youtube
    if (cardType === 'youtube') {
      const videoId = formData.get('videoId') as string;
      if (!videoId) {
        toast({
          title: "Error",
          description: "YouTube Video ID is required for YouTube cards",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate Vimeo fields if cardType is vimeo
    if (cardType === 'vimeo') {
      const videoId = formData.get('vimeoVideoId') as string;
      if (!videoId) {
        toast({
          title: "Error",
          description: "Vimeo Video ID is required for Vimeo cards",
          variant: "destructive",
        });
        return;
      }
    }

    const config: any = {
      title: formData.get('cardTitle') as string,
      subtitle: formData.get('cardSubtitle') as string,
      description: formData.get('cardDescription') as string,
      buttonText: formData.get('buttonText') as string,
      icon: formData.get('icon') as string,
      color: formData.get('cardColor') as string || 'blue',
      successMessage: 'Thank you for your submission!'
    };

    // Add hyperlink-specific config
    if (cardType === 'hyperlink') {
      config.url = formData.get('url') as string;
      config.openInNewTab = formData.get('openInNewTab') === 'on';
      const logo = formData.get('logo') as string;
      if (logo) config.logo = logo;
    }

    // Add YouTube-specific config
    if (cardType === 'youtube') {
      config.youtubeVideoId = formData.get('videoId') as string;
      config.autoplay = formData.get('autoplay') === 'on';
      config.showControls = formData.get('showControls') === 'on';
    }

    // Add Vimeo-specific config
    if (cardType === 'vimeo') {
      config.vimeoVideoId = formData.get('vimeoVideoId') as string;
      config.autoplay = formData.get('autoplay') === 'on';
      config.showControls = formData.get('showControls') === 'on';
    }

    const newForm: InsertFormTemplate = {
      name,
      description: formData.get('description') as string,
      cardType,
      identifierField: cardType === 'form' ? 'email' : null,
      config,
      isBuiltIn: false,
    };

    createFormMutation.mutate(newForm);
  };

  const handleUpdateForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingForm) return;

    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
      toast({
        title: "Error",
        description: "Form name is required",
        variant: "destructive",
      });
      return;
    }

    const updateData: Partial<InsertFormTemplate> = {
      name,
      description,
      config: {
        title: formData.get('cardTitle') as string,
        subtitle: formData.get('cardSubtitle') as string,
        description: formData.get('cardDescription') as string,
        buttonText: formData.get('buttonText') as string,
        icon: formData.get('icon') as string,
        color: formData.get('cardColor') as string || editingForm.config?.color || 'blue',
        successMessage: editingForm.config?.successMessage || 'Thank you for your submission!',
        hubspotFormId: editingForm.config?.hubspotFormId,
        requiresApproval: editingForm.config?.requiresApproval,
        // Keep existing or add new hyperlink fields
        ...(editingForm.cardType === 'hyperlink' && {
          url: formData.get('url') as string || editingForm.config?.url,
          openInNewTab: formData.get('openInNewTab') === 'on' || editingForm.config?.openInNewTab,
          logo: formData.get('logo') as string || editingForm.config?.logo
        }),
        // Keep existing or add new YouTube fields
        ...(editingForm.cardType === 'youtube' && {
          youtubeVideoId: formData.get('videoId') as string || editingForm.config?.youtubeVideoId,
          autoplay: formData.get('autoplay') === 'on' || editingForm.config?.autoplay,
          showControls: formData.get('showControls') === 'on' || editingForm.config?.showControls
        }),
        // Keep existing or add new Vimeo fields
        ...(editingForm.cardType === 'vimeo' && {
          vimeoVideoId: formData.get('vimeoVideoId') as string || editingForm.config?.vimeoVideoId,
          autoplay: formData.get('autoplay') === 'on' || editingForm.config?.autoplay,
          showControls: formData.get('showControls') === 'on' || editingForm.config?.showControls
        }),
      },
    };

    updateFormMutation.mutate({ id: editingForm.id, formData: updateData });

    // Always save current form fields state
    if (currentFormFields.length > 0 || formFields.length > 0) {
      // Delete existing fields and add new ones
      const fieldsToSave = currentFormFields.length > 0 ? currentFormFields : formFields;
      saveFormFieldsMutation.mutate({ formTemplateId: editingForm.id, fields: fieldsToSave });
    }
  };

  const filteredForms = (formTemplates as FormTemplate[]).filter((form: FormTemplate) =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Card Library</CardTitle>
              <CardDescription className="text-slate-400">
                Manage card templates for pitch sites - forms and hyperlinks
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-form">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Card Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Card Template</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Define a new card template - form or hyperlink with display configuration
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateForm} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-slate-300">Card Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Contact Sales, Learn More"
                        className="bg-slate-700/50 border-slate-600"
                        required
                        data-testid="input-form-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-slate-300">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        placeholder="Brief description of the card"
                        className="bg-slate-700/50 border-slate-600"
                        data-testid="input-form-description"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardType" className="text-slate-300">Card Type</Label>
                    <select
                      id="cardType"
                      name="cardType"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                      required
                      data-testid="select-card-type"
                      onChange={(e) => {
                        const selectedType = e.target.value;
                        const formFieldsSection = document.getElementById('form-fields-section');
                        const hyperlinkFieldsSection = document.getElementById('hyperlink-fields');
                        const youtubeFieldsSection = document.getElementById('youtube-fields');
                        const vimeoFieldsSection = document.getElementById('vimeo-fields');
                        const urlField = document.getElementById('url') as HTMLInputElement;
                        const videoIdField = document.getElementById('videoId') as HTMLInputElement;
                        const vimeoVideoIdField = document.getElementById('vimeoVideoId') as HTMLInputElement;

                        // Hide all conditional sections first
                        if (formFieldsSection) formFieldsSection.style.display = 'none';
                        if (hyperlinkFieldsSection) hyperlinkFieldsSection.style.display = 'none';
                        if (youtubeFieldsSection) youtubeFieldsSection.style.display = 'none';
                        if (vimeoFieldsSection) vimeoFieldsSection.style.display = 'none';

                        // Show relevant section and set requirements
                        if (selectedType === 'hyperlink') {
                          if (hyperlinkFieldsSection) hyperlinkFieldsSection.style.display = 'block';
                          if (urlField) urlField.required = true;
                          if (videoIdField) videoIdField.required = false;
                          if (vimeoVideoIdField) vimeoVideoIdField.required = false;
                        } else if (selectedType === 'youtube') {
                          if (youtubeFieldsSection) youtubeFieldsSection.style.display = 'block';
                          if (videoIdField) videoIdField.required = true;
                          if (urlField) urlField.required = false;
                          if (vimeoVideoIdField) vimeoVideoIdField.required = false;
                        } else if (selectedType === 'vimeo') {
                          if (vimeoFieldsSection) vimeoFieldsSection.style.display = 'block';
                          if (vimeoVideoIdField) vimeoVideoIdField.required = true;
                          if (videoIdField) videoIdField.required = false;
                          if (urlField) urlField.required = false;
                        }
                        else { // form
                          if (formFieldsSection) formFieldsSection.style.display = 'block';
                          if (urlField) urlField.required = false;
                          if (videoIdField) videoIdField.required = false;
                          if (vimeoVideoIdField) vimeoVideoIdField.required = false;
                        }
                      }}
                    >
                      <option value="form">Form Card - Collects user information</option>
                      <option value="hyperlink">Hyperlink Card - Links to external content</option>
                      <option value="youtube">YouTube Video Card - Embeds YouTube videos</option>
                      <option value="vimeo">Vimeo Video Card - Embeds Vimeo videos</option>
                    </select>
                  </div>

                  <div className="space-y-2" id="form-fields-section">
                    <Label className="text-slate-300">Form Fields</Label>
                    <FormBuilder
                      onFieldsChange={setFormFields}
                    />
                  </div>

                  <Separator />
                  <h4 className="text-slate-200 font-medium">Display Card Configuration</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardTitle" className="text-slate-300">Card Title</Label>
                      <Input
                        id="cardTitle"
                        name="cardTitle"
                        placeholder="e.g., Contact Our Sales Team"
                        className="bg-slate-700/50 border-slate-600"
                        required
                        data-testid="input-card-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardSubtitle" className="text-slate-300">Card Subtitle</Label>
                      <Input
                        id="cardSubtitle"
                        name="cardSubtitle"
                        placeholder="e.g., Get in touch today"
                        className="bg-slate-700/50 border-slate-600"
                        data-testid="input-card-subtitle"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardDescription" className="text-slate-300">Card Description</Label>
                    <Textarea
                      id="cardDescription"
                      name="cardDescription"
                      placeholder="Detailed description for the display card"
                      className="bg-slate-700/50 border-slate-600"
                      rows={3}
                      data-testid="textarea-card-description"
                    />
                  </div>

                  {/* Hyperlink-specific fields */}
                  <div id="hyperlink-fields" className="space-y-4" style={{display: 'none'}}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="url" className="text-slate-300">Target URL</Label>
                        <Input
                          id="url"
                          name="url"
                          type="url"
                          placeholder="https://example.com"
                          className="bg-slate-700/50 border-slate-600"
                          data-testid="input-url"
                        />
                      </div>
                      <div>
                        <Label htmlFor="logo" className="text-slate-300">Logo URL</Label>
                        <Input
                          id="logo"
                          name="logo"
                          type="url"
                          placeholder="https://example.com/logo.png"
                          className="bg-slate-700/50 border-slate-600"
                          data-testid="input-logo"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="openInNewTab"
                        name="openInNewTab"
                        defaultChecked={true}
                        className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                        data-testid="checkbox-open-new-tab"
                      />
                      <Label htmlFor="openInNewTab" className="text-slate-300">Open in new tab</Label>
                    </div>
                  </div>

                  {/* YouTube-specific fields */}
                  <div id="youtube-fields" className="space-y-4" style={{display: 'none'}}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="videoId" className="text-slate-300">YouTube Video ID</Label>
                        <Input
                          id="videoId"
                          name="videoId"
                          placeholder="dQw4w9WgXcQ"
                          className="bg-slate-700/50 border-slate-600 text-white"
                          data-testid="input-video-id"
                        />
                        <p className="text-xs text-slate-400 mt-1">Extract from: youtube.com/watch?v=<strong>VIDEO_ID</strong></p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="autoplay"
                            name="autoplay"
                            defaultChecked={false}
                            className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                            data-testid="checkbox-autoplay"
                          />
                          <Label htmlFor="autoplay" className="text-slate-300">Auto-play video</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showControls"
                            name="showControls"
                            defaultChecked={true}
                            className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                            data-testid="checkbox-show-controls"
                          />
                          <Label htmlFor="showControls" className="text-slate-300">Show video controls</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vimeo-specific fields */}
                  <div id="vimeo-fields" className="space-y-4" style={{display: 'none'}}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vimeoVideoId" className="text-slate-300">Vimeo Video ID</Label>
                        <Input
                          id="vimeoVideoId"
                          name="vimeoVideoId"
                          placeholder="e.g., 123456789"
                          className="bg-slate-700/50 border-slate-600 text-white"
                          data-testid="input-vimeo-video-id"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Extract from Vimeo URL: vimeo.com/<strong>VIDEO_ID</strong>
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="vimeoAutoplay"
                            name="autoplay"
                            defaultChecked={false}
                            className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                            data-testid="checkbox-vimeo-autoplay"
                          />
                          <Label htmlFor="vimeoAutoplay" className="text-slate-300">Auto-play video</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="vimeoShowControls"
                            name="showControls"
                            defaultChecked={true}
                            className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                            data-testid="checkbox-vimeo-show-controls"
                          />
                          <Label htmlFor="vimeoShowControls" className="text-slate-300">Show video controls</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buttonText" className="text-slate-300">Button Text</Label>
                      <Input
                        id="buttonText"
                        name="buttonText"
                        placeholder="e.g., Contact Sales"
                        className="bg-slate-700/50 border-slate-600"
                        required
                        data-testid="input-button-text"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardColor" className="text-slate-300">Card Color</Label>
                      <Select name="cardColor" defaultValue="blue">
                        <SelectTrigger className="bg-slate-700/50 border-slate-600" data-testid="select-card-color">
                          <SelectValue placeholder="Select color accent" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="blue">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                              Blue
                            </div>
                          </SelectItem>
                          <SelectItem value="purple">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                              Purple
                            </div>
                          </SelectItem>
                          <SelectItem value="green">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-500"></div>
                              Green
                            </div>
                          </SelectItem>
                          <SelectItem value="red">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-500"></div>
                              Red
                            </div>
                          </SelectItem>
                          <SelectItem value="orange">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                              Orange
                            </div>
                          </SelectItem>
                          <SelectItem value="yellow">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                              Yellow
                            </div>
                          </SelectItem>
                          <SelectItem value="indigo">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                              Indigo
                            </div>
                          </SelectItem>
                          <SelectItem value="pink">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                              Pink
                            </div>
                          </SelectItem>
                          <SelectItem value="pitchme">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                              PitchMe
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setFormFields([]);
                      }}
                      className="text-slate-400"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={createFormMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createFormMutation.isPending ? 'Creating...' : 'Create Card'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search card templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600"
                data-testid="input-search-forms"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading card templates...</div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No card templates found. Create your first template to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForms.map((form: FormTemplate) => {
                // Get card type for display
                const cardType = form.cardType || 'form';
                const getCardTypeInfo = (type: string) => {
                  switch (type) {
                    case 'form':
                      return { label: 'Form', color: 'bg-green-600/20 text-green-400', icon: '📝' };
                    case 'hyperlink':
                      return { label: 'Hyperlink', color: 'bg-blue-600/20 text-blue-400', icon: '🔗' };
                    case 'join-card':
                      return { label: 'Join Card', color: 'bg-purple-600/20 text-purple-400', icon: '👥' };
                    case 'youtube':
                      return { label: 'YouTube', color: 'bg-red-600/20 text-red-400', icon: '📹' };
                    case 'vimeo':
                      return { label: 'Vimeo', color: 'bg-blue-600/20 text-blue-400', icon: '▶️' };
                    default:
                      return { label: 'Unknown', color: 'bg-gray-600/20 text-gray-400', icon: '❓' };
                  }
                };
                const typeInfo = getCardTypeInfo(cardType);

                return (
                <Card key={form.id} className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{form.name}</CardTitle>
                        {form.description && (
                          <CardDescription className="text-slate-400 text-sm mt-1">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={`${typeInfo.color} text-xs`}>
                          {typeInfo.icon} {typeInfo.label}
                        </Badge>
                        {form.isBuiltIn && (
                          <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 text-xs">
                            Built-in
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Display Card</div>
                        <div className="text-sm text-slate-300">{form.config?.title || 'No title set'}</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Fields</div>
                        <div className="text-sm text-slate-300">Configurable with Form Builder</div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingForm(form);
                            // Load existing form fields when editing
                            loadFormFields(form.id);
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600"
                          data-testid={`button-edit-${form.id}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {!(form.isBuiltIn ?? false) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteFormMutation.mutate(form.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                            disabled={deleteFormMutation.isPending}
                            data-testid={`button-delete-${form.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <Dialog open={!!editingForm} onOpenChange={(open) => !open && setEditingForm(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Card Template</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update card template and display configuration
            </DialogDescription>
          </DialogHeader>
          {editingForm && (
            <form onSubmit={handleUpdateForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-slate-300">Card Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingForm.name}
                    className="bg-slate-700/50 border-slate-600"
                    required
                    data-testid="input-edit-form-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-slate-300">Description</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingForm.description || ''}
                    className="bg-slate-700/50 border-slate-600"
                    data-testid="input-edit-form-description"
                  />
                </div>
              </div>

              {/* Conditional content based on card type */}
              {(editingForm.cardType || 'form') === 'form' ? (
                <div className="space-y-2">
                  <Label className="text-slate-300">Form Fields</Label>
                  <FormBuilder
                    formTemplateId={editingForm.id}
                    onFieldsChange={(fields) => {
                      setFormFields(fields);
                      setCurrentFormFields(fields);
                    }}
                  />
                </div>
              ) : editingForm.cardType === 'hyperlink' ? (
                <div className="space-y-4">
                  <Label className="text-slate-300">Hyperlink Configuration</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-url" className="text-slate-300">Target URL</Label>
                      <Input
                        id="edit-url"
                        name="url"
                        defaultValue={editingForm.config?.url || ''}
                        className="bg-slate-700/50 border-slate-600"
                        required
                        placeholder="https://example.com"
                        data-testid="input-edit-url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-logo" className="text-slate-300">Logo URL</Label>
                      <Input
                        id="edit-logo"
                        name="logo"
                        defaultValue={editingForm.config?.logo || ''}
                        className="bg-slate-700/50 border-slate-600"
                        placeholder="https://example.com/logo.png"
                        data-testid="input-edit-logo"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-openInNewTab"
                      name="openInNewTab"
                      defaultChecked={editingForm.config?.openInNewTab || false}
                      className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                      data-testid="checkbox-edit-open-new-tab"
                    />
                    <Label htmlFor="edit-openInNewTab" className="text-slate-300">Open in new tab</Label>
                  </div>
                </div>
              ) : editingForm.cardType === 'join-card' ? (
                <div className="space-y-6">
                  <div className="border border-purple-500/30 bg-purple-500/10 rounded-lg p-4">
                    <Label className="text-purple-400 font-medium flex items-center gap-2">
                      👥 Join Card Configuration
                    </Label>
                    <p className="text-sm text-slate-400 mt-1">
                      Configure the membership invite card for collective sites. This card allows users to request to join your community.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-joinText" className="text-slate-300">Join Button Text</Label>
                      <Input
                        id="edit-joinText"
                        name="joinText"
                        defaultValue={editingForm.config?.joinText || 'Join Collective'}
                        className="bg-slate-700/50 border-slate-600"
                        placeholder="Join Collective"
                        data-testid="input-edit-join-text"
                      />
                      <p className="text-xs text-slate-400 mt-1">Text displayed on the join button</p>
                    </div>
                    <div>
                      <Label htmlFor="edit-joinSuccessMessage" className="text-slate-300">Success Message</Label>
                      <Input
                        id="edit-joinSuccessMessage"
                        name="joinSuccessMessage"
                        defaultValue={editingForm.config?.joinSuccessMessage || 'Welcome to the collective!'}
                        className="bg-slate-700/50 border-slate-600"
                        placeholder="Welcome to the collective!"
                        data-testid="input-edit-join-success"
                      />
                      <p className="text-xs text-slate-400 mt-1">Message shown after successful join request</p>
                    </div>
                    <div>
                      <Label htmlFor="edit-pendingMessage" className="text-slate-300">Pending Message</Label>
                      <Input
                        id="edit-pendingMessage"
                        name="pendingMessage"
                        defaultValue={editingForm.config?.pendingMessage || 'Your request is pending approval.'}
                        className="bg-slate-700/50 border-slate-600"
                        placeholder="Your request is pending approval."
                        data-testid="input-edit-pending-message"
                      />
                      <p className="text-xs text-slate-400 mt-1">Message shown when approval is required</p>
                    </div>
                    <div>
                      <Label htmlFor="edit-rejectedMessage" className="text-slate-300">Rejection Message</Label>
                      <Input
                        id="edit-rejectedMessage"
                        name="rejectedMessage"
                        defaultValue={editingForm.config?.rejectedMessage || 'Your request was not approved.'}
                        className="bg-slate-700/50 border-slate-600"
                        placeholder="Your request was not approved."
                        data-testid="input-edit-rejected-message"
                      />
                      <p className="text-xs text-slate-400 mt-1">Message shown if request is rejected</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-600 pt-4 space-y-3">
                    <Label className="text-slate-300 font-medium">Membership Settings</Label>
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                      <input
                        type="checkbox"
                        id="edit-joinRequiresApproval"
                        name="joinRequiresApproval"
                        defaultChecked={editingForm.config?.joinRequiresApproval || false}
                        className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        data-testid="checkbox-edit-join-approval"
                      />
                      <Label htmlFor="edit-joinRequiresApproval" className="text-slate-300">Require manual approval for new members</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                      <input
                        type="checkbox"
                        id="edit-autoAssignRole"
                        name="autoAssignRole"
                        defaultChecked={editingForm.config?.autoAssignRole || true}
                        className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        data-testid="checkbox-edit-auto-assign-role"
                      />
                      <Label htmlFor="edit-autoAssignRole" className="text-slate-300">Automatically assign "Member" role</Label>
                    </div>
                  </div>
                </div>
              ) : editingForm.cardType === 'youtube' ? (
                <div className="space-y-4">
                  <h4 className="text-slate-200 font-medium">YouTube Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-videoId" className="text-slate-300">YouTube Video ID</Label>
                      <Input
                        id="edit-videoId"
                        name="videoId"
                        defaultValue={editingForm.config?.youtubeVideoId || ''}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="dQw4w9WgXcQ"
                        data-testid="input-edit-video-id"
                      />
                      <p className="text-xs text-slate-400 mt-1">Extract from: youtube.com/watch?v=<strong>VIDEO_ID</strong></p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-autoplay"
                          name="autoplay"
                          defaultChecked={editingForm.config?.autoplay || false}
                          className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                          data-testid="checkbox-edit-autoplay"
                        />
                        <Label htmlFor="edit-autoplay" className="text-slate-300">Auto-play video</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-showControls"
                          name="showControls"
                          defaultChecked={editingForm.config?.showControls || true}
                          className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                          data-testid="checkbox-edit-show-controls"
                        />
                        <Label htmlFor="edit-showControls" className="text-slate-300">Show video controls</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : editingForm.cardType === 'vimeo' ? (
                <div className="space-y-4">
                  <h4 className="text-slate-200 font-medium">Vimeo Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-vimeoVideoId" className="text-slate-300">Vimeo Video ID</Label>
                      <Input
                        id="edit-vimeoVideoId"
                        name="vimeoVideoId"
                        defaultValue={editingForm.config?.vimeoVideoId || ''}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="e.g., 123456789"
                        data-testid="input-edit-vimeo-video-id"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Extract from Vimeo URL: vimeo.com/<strong>VIDEO_ID</strong>
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-vimeoAutoplay"
                          name="autoplay"
                          defaultChecked={editingForm.config?.autoplay || false}
                          className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                          data-testid="checkbox-edit-vimeo-autoplay"
                        />
                        <Label htmlFor="edit-vimeoAutoplay" className="text-slate-300">Auto-play video</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-vimeoShowControls"
                          name="showControls"
                          defaultChecked={editingForm.config?.showControls || true}
                          className="w-4 h-4 bg-slate-700/50 border-slate-600 rounded"
                          data-testid="checkbox-edit-vimeo-show-controls"
                        />
                        <Label htmlFor="edit-vimeoShowControls" className="text-slate-300">Show video controls</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <Separator />
              <h4 className="text-slate-200 font-medium">Display Card Configuration</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cardTitle" className="text-slate-300">Card Title</Label>
                  <Input
                    id="edit-cardTitle"
                    name="cardTitle"
                    defaultValue={editingForm.config?.title || ''}
                    className="bg-slate-700/50 border-slate-600"
                    required
                    data-testid="input-edit-card-title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cardSubtitle" className="text-slate-300">Card Subtitle</Label>
                  <Input
                    id="edit-cardSubtitle"
                    name="cardSubtitle"
                    defaultValue={editingForm.config?.subtitle || ''}
                    className="bg-slate-700/50 border-slate-600"
                    data-testid="input-edit-card-subtitle"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-cardDescription" className="text-slate-300">Card Description</Label>
                <Textarea
                  id="edit-cardDescription"
                  name="cardDescription"
                  defaultValue={editingForm.config?.description || ''}
                  className="bg-slate-700/50 border-slate-600"
                  rows={3}
                  data-testid="textarea-edit-card-description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-icon" className="text-slate-300">Card Icon</Label>
                  <select
                    id="edit-icon"
                    name="icon"
                    defaultValue={editingForm.config?.icon || 'file'}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                    data-testid="select-edit-icon"
                  >
                    <option value="file">📄 Document</option>
                    <option value="mail">✉️ Mail</option>
                    <option value="users">👥 Users</option>
                    <option value="phone">📞 Phone</option>
                    <option value="info">ℹ️ Info</option>
                    <option value="dollar">💰 Dollar</option>
                    <option value="pickaxe">⛏️ Mining</option>
                    <option value="star">⭐ Star</option>
                    <option value="heart">❤️ Heart</option>
                    <option value="shield">🛡️ Shield</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-buttonText" className="text-slate-300">Button Text</Label>
                  <Input
                    id="edit-buttonText"
                    name="buttonText"
                    defaultValue={editingForm.config?.buttonText || ''}
                    className="bg-slate-700/50 border-slate-600"
                    required
                    data-testid="input-edit-button-text"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cardColor" className="text-slate-300">Card Color</Label>
                  <Select name="cardColor" defaultValue={editingForm.config?.color || 'blue'}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600" data-testid="select-edit-card-color">
                      <SelectValue placeholder="Select color accent" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="blue">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          Blue
                        </div>
                      </SelectItem>
                      <SelectItem value="purple">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                          Purple
                        </div>
                      </SelectItem>
                      <SelectItem value="green">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          Green
                        </div>
                      </SelectItem>
                      <SelectItem value="red">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          Red
                        </div>
                      </SelectItem>
                      <SelectItem value="orange">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                          Orange
                        </div>
                      </SelectItem>
                      <SelectItem value="yellow">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                          Yellow
                        </div>
                      </SelectItem>
                      <SelectItem value="indigo">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                          Indigo
                        </div>
                      </SelectItem>
                      <SelectItem value="pink">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                          Pink
                        </div>
                      </SelectItem>
                      <SelectItem value="pitchme">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                          PitchMe
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingForm(null);
                    setFormFields([]);
                  }}
                  className="text-slate-400"
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateFormMutation.isPending}
                  data-testid="button-edit-submit"
                >
                  {updateFormMutation.isPending ? 'Updating...' : 'Update Form'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSlides, setLocalSlides] = useState<GlobalSlide[]>([]);

  // Legal Disclaimer management state
  const [isCreateDisclaimerOpen, setIsCreateDisclaimerOpen] = useState(false);
  const [isEditDisclaimerOpen, setIsEditDisclaimerOpen] = useState(false);
  const [editingDisclaimer, setEditingDisclaimer] = useState<LegalDisclaimer | null>(null);

  // Fetch global slides
  const { data: globalSlides = [], isLoading: slidesLoading } = useQuery<GlobalSlide[]>({
    queryKey: ['/api/global-slides'],
  });

  // Update local slides when global slides change
  useEffect(() => {
    if (globalSlides.length > 0 || localSlides.length > 0) {
      setLocalSlides(globalSlides);
    }
  }, [globalSlides]);

  // Separate slides into draggable and locked
  const { draggableSlides, lockedSlides } = useMemo(() => {
    const draggable = localSlides.filter(slide =>
      slide.slideType !== 'action-cards' || slide.displayPosition !== 'end'
    );
    const locked = localSlides.filter(slide =>
      slide.slideType === 'action-cards' && slide.displayPosition === 'end'
    );
    return { draggableSlides: draggable, lockedSlides: locked };
  }, [localSlides]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch all sites for overview
  const { data: allSites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Fetch all site leads across all sites
  const { data: allSiteLeads = [], isLoading: leadsLoading } = useQuery<(SiteLead & { siteName: string })[]>({
    queryKey: ['/api/all-site-leads'],
  });

  // Fetch legal disclaimers
  const { data: disclaimers = [], isLoading: disclaimersLoading } = useQuery<LegalDisclaimer[]>({
    queryKey: ['/api/disclaimers'],
  });

  // Update global slide visibility mutation
  const updateSlideVisibilityMutation = useMutation({
    mutationFn: async ({ slideKey, isVisible }: { slideKey: string; isVisible: boolean }) => {
      const response = await apiRequest('PATCH', `/api/global-slides/${slideKey}/visibility`, { isVisible });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-slides'] });
      toast({
        title: "Global slide updated",
        description: "Slide visibility has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update slide visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upload global slide image mutation
  const uploadGlobalSlideMutation = useMutation({
    mutationFn: async (uploadData: { imageUrl: string; title: string }) => {
      const response = await apiRequest('POST', '/api/global-slides', {
        slideKey: `global-${Date.now()}`,
        title: uploadData.title,
        slideType: 'image',
        isVisible: true,
        displayPosition: 'start',
        imageUrl: uploadData.imageUrl,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-slides'] });
      toast({
        title: "Global slide added",
        description: "New global slide has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload global slide. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete global slide mutation
  const deleteGlobalSlideMutation = useMutation({
    mutationFn: async (slideKey: string) => {
      const response = await apiRequest('DELETE', `/api/global-slides/${slideKey}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-slides'] });
      toast({
        title: "Global slide deleted",
        description: "Slide has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete slide. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reorder global slides mutation
  const reorderGlobalSlidesMutation = useMutation({
    mutationFn: async (slides: GlobalSlide[]) => {
      const response = await apiRequest('PATCH', '/api/global-slides/reorder', {
        slides: slides.map((slide, index) => ({
          id: slide.id,
          slideKey: slide.slideKey,
          order: index
        }))
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-slides'] });
      toast({
        title: "Slides reordered",
        description: "Slide order has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reorder slides. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSlideVisibility = (slideKey: string, currentlyVisible: boolean) => {
    updateSlideVisibilityMutation.mutate({
      slideKey,
      isVisible: !currentlyVisible,
    });
  };

  const handleDeleteSlide = (slideId: string, slideKey: string) => {
    deleteGlobalSlideMutation.mutate(slideKey);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = draggableSlides.findIndex((slide) => slide.id === active.id);
      const newIndex = draggableSlides.findIndex((slide) => slide.id === over.id);

      const newDraggableSlides = arrayMove(draggableSlides, oldIndex, newIndex);
      const newAllSlides = [...newDraggableSlides, ...lockedSlides];

      setLocalSlides(newAllSlides);
      reorderGlobalSlidesMutation.mutate(newAllSlides);
    }
  };

  // Handle global slide upload
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('POST', '/api/global-slides/upload');
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      for (const uploadedFile of result.successful) {
        const fileName = uploadedFile.name || 'Untitled Slide';

        try {
          await uploadGlobalSlideMutation.mutateAsync({
            imageUrl: uploadedFile.uploadURL,
            title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
          });
        } catch (error) {
          console.error('Error completing upload:', error);
        }
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading administration...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-center text-white">Access Denied</CardTitle>
            <CardDescription className="text-center text-slate-400">
              You need admin privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isLoading = slidesLoading || sitesLoading || leadsLoading;

  // Calculate aggregate metrics
  const totalLeads = allSiteLeads.length;
  const learnMoreLeads = allSiteLeads.filter(lead => lead.formType === 'learn-more').length;
  const miningPoolLeads = allSiteLeads.filter(lead => lead.formType === 'mining-pool').length;
  const lendingPoolLeads = allSiteLeads.filter(lead => lead.formType === 'lending-pool').length;

  // Site-specific metrics
  const siteMetrics = allSites.map(site => {
    const siteLeads = allSiteLeads.filter(lead => lead.siteId === site.siteId);
    return {
      siteId: site.siteId,
      siteName: site.name,
      totalLeads: siteLeads.length,
      learnMore: siteLeads.filter(lead => lead.formType === 'learn-more').length,
      miningPool: siteLeads.filter(lead => lead.formType === 'mining-pool').length,
      lendingPool: siteLeads.filter(lead => lead.formType === 'lending-pool').length,
    };
  });

  // Excel export function for all site leads
  const exportAllSiteLeadsToExcel = () => {
    const exportData = allSiteLeads.map(lead => ({
      'Site ID': lead.siteId,
      'Site Name': lead.siteName || 'Unknown Site',
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Site Leads');

    const fileName = `all-mining-syndicate-leads-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export Complete",
      description: `Downloaded ${totalLeads} leads across ${allSites.length} sites to ${fileName}`,
    });
  };

  // Legal Disclaimer mutations and handlers
  const createDisclaimerMutation = useMutation({
    mutationFn: async (disclaimerData: any) => {
      const response = await apiRequest('POST', '/api/disclaimers', disclaimerData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disclaimers'] });
      setIsCreateDisclaimerOpen(false);
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
      setIsEditDisclaimerOpen(false);
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

    const siteTypeValue = formData.get('siteType') as string;
    const disclaimerData = {
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      language: formData.get('language') as string,
      content: formData.get('content') as string,
      description: formData.get('description') as string || undefined,
      siteType: siteTypeValue === 'global' ? null : siteTypeValue || null,
    };

    createDisclaimerMutation.mutate(disclaimerData);
  };

  const handleEditDisclaimer = (disclaimer: LegalDisclaimer) => {
    setEditingDisclaimer(disclaimer);
    setIsEditDisclaimerOpen(true);
  };

  const handleUpdateDisclaimer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDisclaimer) return;

    const formData = new FormData(e.currentTarget);

    const siteTypeValue = formData.get('siteType') as string;
    const updates = {
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      language: formData.get('language') as string,
      content: formData.get('content') as string,
      description: formData.get('description') as string || undefined,
      siteType: siteTypeValue === 'global' ? null : siteTypeValue || null,
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

  const getScopeDisplay = (siteType: string | null) => {
    if (!siteType) return { text: 'Global', color: 'bg-green-600' };
    if (siteType === 'mining-syndicate-pitch') return { text: 'Mining Syndicate', color: 'bg-orange-600' };
    if (siteType === 'pitch-site') return { text: 'Pitch Site', color: 'bg-blue-600' };
    return { text: siteType, color: 'bg-gray-600' };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2 justify-center">
                <Settings className="h-8 w-8" />
                System Administration
              </h1>
              <p className="text-slate-400 mt-1">
                Manage global settings and website configurations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/sites">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  data-testid="button-back-to-sites"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Sites
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">

        <div className="mt-4 space-y-2">
          <h2 className="text-base font-semibold">Tools</h2>
          <Link href="/card-builder">
            <button className="rounded-lg border px-3 py-2 w-full text-left">
              Card Builder
            </button>
          </Link>
          <Link href="/code-explorer">
            <button className="rounded-lg border px-3 py-2 w-full text-left">
              Code Explorer
            </button>
          </Link>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-6 bg-slate-800/50 border border-slate-700">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
              >
                <Globe className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="website-types"
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
              >
                <FileText className="h-4 w-4" />
                Website Types
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
              >
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="fields"
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
                data-testid="tab-fields"
              >
                <FileText className="h-4 w-4" />
                Field Library
              </TabsTrigger>
              <TabsTrigger
                value="disclaimers"
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
              >
                <FileText className="h-4 w-4" />
                Legal Disclaimers
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white">Total Sites</CardTitle>
                  <CardDescription className="text-slate-400">Active sites across all types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">{allSites.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white">Global Slides</CardTitle>
                  <CardDescription className="text-slate-400">Configured global slides</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">{localSlides.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white">Website Types</CardTitle>
                  <CardDescription className="text-slate-400">Configured site templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-400">1</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Mining Syndicate Pitch
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Website Types Tab */}
          <TabsContent value="website-types" className="mt-6">
            <Tabs defaultValue="mining-syndicate" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-3 bg-slate-800/50 border border-slate-700">
                  <TabsTrigger
                    value="mining-syndicate"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Mining Syndicate
                  </TabsTrigger>
                  <TabsTrigger
                    value="pitch-sites"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Pitch Sites
                  </TabsTrigger>
                  <TabsTrigger
                    value="aggregate-data"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 border-0 hover:text-white transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Aggregate Data
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Mining Syndicate Sub-tab */}
              <TabsContent value="mining-syndicate">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Mining Syndicate Pitch Type</CardTitle>
                    <CardDescription className="text-slate-400">
                      Configure global slides and settings for Mining Syndicate Pitch sites
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Global Slides Configuration</h3>
                    <ObjectUploader
                      maxNumberOfFiles={50}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={uploadGlobalSlideMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Global Slides (up to 50 files)
                    </ObjectUploader>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    These slides appear on all Mining Syndicate Pitch sites. When a site has uploaded slides,
                    these global slides appear at the end. When a site has no uploaded slides, only these global slides are shown.
                  </p>

                  {isLoading ? (
                    <div className="text-center py-4 text-slate-400">Loading global slides...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Draggable slides section */}
                      {draggableSlides.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold mb-3 text-white flex items-center gap-2">
                            <GripVertical className="h-4 w-4" />
                            Presentation Slides (Drag to reorder)
                          </h4>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext items={draggableSlides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-3">
                                {draggableSlides.map((slide) => (
                                  <SortableSlide
                                    key={slide.id}
                                    slide={slide}
                                    onToggleVisibility={handleToggleSlideVisibility}
                                    onDelete={handleDeleteSlide}
                                    isLocked={false}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}

                      {/* Locked slides section */}
                      {lockedSlides.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold mb-3 text-amber-400">
                            Final Action Cards (Locked to end)
                          </h4>
                          <div className="space-y-3">
                            {lockedSlides.map((slide) => (
                              <SortableSlide
                                key={slide.id}
                                slide={slide}
                                onToggleVisibility={handleToggleSlideVisibility}
                                onDelete={handleDeleteSlide}
                                isLocked={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {localSlides.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No global slides uploaded yet. Upload some slides to get started.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-white">Presentation Logic</h3>
                      <div className="text-sm text-slate-400 space-y-2">
                        <p>• <strong className="text-white">Sites with uploaded slides:</strong> Show site slides + visible global slides</p>
                        <p>• <strong className="text-white">Sites without uploaded slides:</strong> Show only visible global slides</p>
                        <p>• <strong className="text-white">Global slides position:</strong> Final action cards appear at the end</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pitch Sites Sub-tab */}
              <TabsContent value="pitch-sites">
                <FormLibraryManagement />
              </TabsContent>

              {/* Aggregate Data Sub-tab */}
              <TabsContent value="aggregate-data">
                <div className="space-y-6">
                  {/* Export Section */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export All Mining Syndicate Pitch Leads
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Download comprehensive lead data from all Mining Syndicate Pitch sites
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={exportAllSiteLeadsToExcel}
                        disabled={totalLeads === 0}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid="button-export-all-leads"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export All Site Leads ({totalLeads} total)
                      </Button>
                      <p className="text-sm text-slate-400 mt-2">
                        Includes site identification, contact details, form type, and submission metadata
                      </p>
                    </CardContent>
                  </Card>

                  {/* Form Type Metrics */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Mining Syndicate Pitch Form Metrics
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Lead breakdown by form type across all Mining Syndicate Pitch sites
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-400">{learnMoreLeads}</div>
                          <div className="text-sm text-slate-400">Learn More</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {totalLeads > 0 ? Math.round((learnMoreLeads / totalLeads) * 100) : 0}% of total
                          </div>
                        </div>
                        <div className="bg-slate-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-orange-400">{miningPoolLeads}</div>
                          <div className="text-sm text-slate-400">Mining Pool</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {totalLeads > 0 ? Math.round((miningPoolLeads / totalLeads) * 100) : 0}% of total
                          </div>
                        </div>
                        <div className="bg-slate-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-400">{lendingPoolLeads}</div>
                          <div className="text-sm text-slate-400">Lending Pool</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {totalLeads > 0 ? Math.round((lendingPoolLeads / totalLeads) * 100) : 0}% of total
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Site-Specific Metrics */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Mining Syndicate Pitch Site Performance</CardTitle>
                      <CardDescription className="text-slate-400">
                        Lead generation performance by site
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {siteMetrics.map((site) => (
                            <div key={site.siteId} className="bg-slate-700/50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-white">{site.siteName}</h4>
                                  <p className="text-sm text-slate-400">{site.siteId}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-blue-400">{site.totalLeads}</div>
                                  <div className="text-xs text-slate-500">total leads</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <div className="text-blue-400 font-medium">{site.learnMore}</div>
                                  <div className="text-slate-500">Learn More</div>
                                </div>
                                <div>
                                  <div className="text-orange-400 font-medium">{site.miningPool}</div>
                                  <div className="text-slate-500">Mining Pool</div>
                                </div>
                                <div>
                                  <div className="text-green-400 font-medium">{site.lendingPool}</div>
                                  <div className="text-slate-500">Lending Pool</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          {/* Field Library Tab */}
          <TabsContent value="fields" className="mt-6">
            <FieldLibraryManager />
          </TabsContent>

          {/* Legal Disclaimers Tab */}
          <TabsContent value="disclaimers" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Legal Disclaimer Library
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage legal disclaimers for your sites
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDisclaimerOpen} onOpenChange={setIsCreateDisclaimerOpen}>
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

                        <div className="grid grid-cols-3 gap-4">
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
                            <Label htmlFor="siteType">Scope</Label>
                            <Select name="siteType" defaultValue="global">
                              <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="select-disclaimer-scope">
                                <SelectValue placeholder="Select scope" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="global">Global (All Sites)</SelectItem>
                                <SelectItem value="mining-syndicate-pitch">Mining Syndicate Only</SelectItem>
                                <SelectItem value="pitch-site">Pitch Site Only</SelectItem>
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
                            onClick={() => setIsCreateDisclaimerOpen(false)}
                            className="border-slate-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {disclaimersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-slate-400">Loading disclaimers...</div>
                  </div>
                ) : disclaimers.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No Legal Disclaimers</h3>
                    <p className="text-slate-400 mb-4">
                      Create your first legal disclaimer to manage legal documents across your sites.
                    </p>
                    <Button
                      onClick={() => setIsCreateDisclaimerOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Disclaimer
                    </Button>
                  </div>
                ) : (
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
                                <Badge className={`text-white ${getScopeDisplay(disclaimer.siteType).color}`}>
                                  {getScopeDisplay(disclaimer.siteType).text}
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDisclaimerOpen} onOpenChange={setIsEditDisclaimerOpen}>
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

                    <div className="grid grid-cols-3 gap-4">
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
                        <Label htmlFor="edit-siteType">Scope</Label>
                        <Select name="siteType" defaultValue={editingDisclaimer.siteType || 'global'}>
                          <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="select-edit-disclaimer-scope">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="global">Global (All Sites)</SelectItem>
                            <SelectItem value="mining-syndicate-pitch">Mining Syndicate Only</SelectItem>
                            <SelectItem value="pitch-site">Pitch Site Only</SelectItem>
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
                        onClick={() => setIsEditDisclaimerOpen(false)}
                        className="border-slate-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">System Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure global system preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-400">
                  System settings coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}