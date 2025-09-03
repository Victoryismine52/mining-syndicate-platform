import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "./ObjectUploader";
import { 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  GripVertical, 
  Eye, 
  EyeOff,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSlide } from "@shared/site-schema";

interface SlideManagerProps {
  siteId: string;
}

interface EditingSlide extends SiteSlide {
  isEditing?: boolean;
}

export function SlideManager({ siteId }: SlideManagerProps) {
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);
  const [dragOverSlide, setDragOverSlide] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch slides
  const { data: slides = [], isLoading } = useQuery<SiteSlide[]>({
    queryKey: [`/api/sites/${siteId}/slides`],
  });

  // Create slide mutation
  const createSlideMutation = useMutation({
    mutationFn: async (slideData: { title: string; imageUrl: string; description?: string; slideOrder?: string; isVisible?: boolean; slideType?: string }) => {
      // Get the next slide order if not provided
      const nextOrder = slideData.slideOrder || slides.length.toString();
      
      console.log('Making POST request to create slide:', {
        url: `/api/sites/${siteId}/slides`,
        data: {
          ...slideData,
          slideOrder: nextOrder,
          isVisible: slideData.isVisible ?? true,
          slideType: slideData.slideType || "image"
        }
      });
      
      const response = await fetch(`/api/sites/${siteId}/slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...slideData,
          slideOrder: nextOrder,
          isVisible: slideData.isVisible ?? true,
          slideType: slideData.slideType || "image"
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create slide: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/slides`] });
      toast({
        title: "Success",
        description: "Slide created successfully",
      });
    },
    onError: (error) => {
      console.error('Create slide mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to create slide",
        variant: "destructive",
      });
    },
  });

  // Update slide mutation
  const updateSlideMutation = useMutation({
    mutationFn: async ({ slideId, updates }: { slideId: string; updates: Partial<SiteSlide> }) => {
      return apiRequest("PUT", `/api/sites/${siteId}/slides/${slideId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/slides`] });
      setEditingSlide(null);
      toast({
        title: "Success",
        description: "Slide updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update slide",
        variant: "destructive",
      });
    },
  });

  // Delete slide mutation
  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId: string) => {
      return apiRequest("DELETE", `/api/sites/${siteId}/slides/${slideId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/slides`] });
      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete slide",
        variant: "destructive",
      });
    },
  });

  // Reorder slides mutation
  const reorderSlidesMutation = useMutation({
    mutationFn: async (slideOrders: Array<{ id: string; slideOrder: string }>) => {
      return apiRequest("POST", `/api/sites/${siteId}/slides/reorder`, { slideOrders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/slides`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder slides",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleSlideUpload = async () => {
    try {
      console.log('Fetching upload URL from:', `/api/sites/${siteId}/slides/upload`);
      const response = await fetch(`/api/sites/${siteId}/slides/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.status}`);
      }
      
      const data = await response.json() as { uploadURL: string };
      console.log('Got upload URL:', data.uploadURL);
      return {
        method: "PUT" as const,
        url: data.uploadURL
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed, result:', result);
    
    // Handle both single file (string) and multiple files (object with successful array)
    if (typeof result === 'string') {
      // Single file upload
      const uploadUrl = result;
      console.log('Creating single slide with data:', {
        title: `Slide ${slides.length + 1}`,
        imageUrl: uploadUrl,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        slideOrder: slides.length.toString()
      });
      
      createSlideMutation.mutate({
        title: `Slide ${slides.length + 1}`,
        imageUrl: uploadUrl,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        slideOrder: slides.length.toString(),
        isVisible: true,
        slideType: "image"
      });
    } else if (result.successful && result.successful.length > 0) {
      // Multiple files upload
      const successfulFiles = result.successful;
      console.log(`Processing ${successfulFiles.length} uploaded files`);
      
      successfulFiles.forEach((file: any, index: number) => {
        const uploadUrl = file.uploadURL;
        const fileName = file.name || `Slide ${slides.length + index + 1}`;
        
        console.log(`Creating slide ${index + 1}/${successfulFiles.length}:`, {
          title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
          imageUrl: uploadUrl,
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          slideOrder: (slides.length + index).toString()
        });
        
        // Create each slide with a small delay to prevent overwhelming the server
        setTimeout(() => {
          createSlideMutation.mutate({
            title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
            imageUrl: uploadUrl,
            description: `Uploaded on ${new Date().toLocaleDateString()}`,
            slideOrder: (slides.length + index).toString(),
            isVisible: true,
            slideType: "image"
          });
        }, index * 100); // 100ms delay between each slide creation
      });
      
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successfulFiles.length} slide${successfulFiles.length > 1 ? 's' : ''}`,
      });
    }
  };



  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    setDraggedSlide(slideId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, slideId: string) => {
    e.preventDefault();
    setDragOverSlide(slideId);
  };

  const handleDrop = (e: React.DragEvent, dropSlideId: string) => {
    e.preventDefault();
    
    if (!draggedSlide || draggedSlide === dropSlideId) {
      setDraggedSlide(null);
      setDragOverSlide(null);
      return;
    }

    const draggedIndex = slides.findIndex((s: SiteSlide) => s.id === draggedSlide);
    const dropIndex = slides.findIndex((s: SiteSlide) => s.id === dropSlideId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    // Create new order
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, removed);

    // Generate new slide orders
    const slideOrders = newSlides.map((slide, index) => ({
      id: slide.id,
      slideOrder: index.toString()
    }));

    reorderSlidesMutation.mutate(slideOrders);
    setDraggedSlide(null);
    setDragOverSlide(null);
  };

  const handleEditSlide = (slideId: string, field: string, value: any) => {
    const slide = slides.find((s: SiteSlide) => s.id === slideId);
    if (!slide) return;

    updateSlideMutation.mutate({
      slideId,
      updates: { [field]: value }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading slides...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" data-testid="heading-slide-manager">Slide Management</h2>
          <p className="text-muted-foreground">
            Manage presentation slides for your site. Drag to reorder, click to edit.
          </p>
        </div>
        
        <ObjectUploader
          maxNumberOfFiles={50}
          onGetUploadParameters={handleSlideUpload}
          onComplete={handleUploadComplete}
          disabled={createSlideMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Slides
        </ObjectUploader>
      </div>

      <div className="grid gap-4">
        {slides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No slides yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first slide to get started with your presentation.
              </p>
              <ObjectUploader
                maxNumberOfFiles={50}
                onGetUploadParameters={handleSlideUpload}
                onComplete={handleUploadComplete}
                disabled={createSlideMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Slides
              </ObjectUploader>
            </CardContent>
          </Card>
        ) : (
          slides
            .sort((a, b) => parseInt(a.slideOrder || "0") - parseInt(b.slideOrder || "0"))
            .map((slide: SiteSlide, index: number) => (
            <Card
              key={slide.id}
              className={`transition-all ${
                dragOverSlide === slide.id ? "border-primary" : ""
              } ${editingSlide === slide.id ? "ring-2 ring-primary" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, slide.id)}
              onDragOver={(e) => handleDragOver(e, slide.id)}
              onDrop={(e) => handleDrop(e, slide.id)}
              data-testid={`card-slide-${slide.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <Badge variant="outline">#{index + 1}</Badge>
                    {editingSlide === slide.id ? (
                      <Input
                        value={slide.title}
                        onChange={(e) => handleEditSlide(slide.id, "title", e.target.value)}
                        className="h-8"
                        data-testid={`input-slide-title-${slide.id}`}
                      />
                    ) : (
                      <CardTitle className="text-lg" data-testid={`text-slide-title-${slide.id}`}>
                        {slide.title}
                      </CardTitle>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`visible-${slide.id}`} className="text-sm">
                        {slide.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Label>
                      <Switch
                        id={`visible-${slide.id}`}
                        checked={slide.isVisible || false}
                        onCheckedChange={(checked) => handleEditSlide(slide.id, "isVisible", checked)}
                        data-testid={`switch-slide-visibility-${slide.id}`}
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSlide(editingSlide === slide.id ? null : slide.id)}
                      data-testid={`button-edit-slide-${slide.id}`}
                    >
                      {editingSlide === slide.id ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSlideMutation.mutate(slide.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-slide-${slide.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {slide.imageUrl ? (
                      <img
                        src={slide.imageUrl.startsWith('http') ? slide.imageUrl : `/slide-images/${slide.imageUrl.replace(/^\/+/, '')}`}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-slide-preview-${slide.id}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {editingSlide === slide.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`order-${slide.id}`}>Slide Order</Label>
                          <Input
                            id={`order-${slide.id}`}
                            value={slide.slideOrder}
                            onChange={(e) => handleEditSlide(slide.id, "slideOrder", e.target.value)}
                            className="w-20"
                            data-testid={`input-slide-order-${slide.id}`}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`description-${slide.id}`}>Description</Label>
                          <Textarea
                            id={`description-${slide.id}`}
                            value={slide.description || ""}
                            onChange={(e) => handleEditSlide(slide.id, "description", e.target.value)}
                            placeholder="Optional slide description..."
                            data-testid={`textarea-slide-description-${slide.id}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <strong>Order:</strong> {slide.slideOrder}
                        </p>
                        {slide.description && (
                          <p className="text-sm" data-testid={`text-slide-description-${slide.id}`}>
                            {slide.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {slide.createdAt ? new Date(slide.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}