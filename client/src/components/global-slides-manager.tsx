import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Globe, Settings } from "lucide-react";
import type { GlobalSlide } from "@shared/site-schema";

export function GlobalSlidesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: globalSlides = [], isLoading } = useQuery<GlobalSlide[]>({
    queryKey: ['/api/global-slides'],
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ slideKey, isVisible }: { slideKey: string; isVisible: boolean }) => {
      return await apiRequest(`/api/global-slides/${slideKey}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-slides'] });
      toast({
        title: "Success",
        description: "Global slide visibility updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update global slide visibility",
        variant: "destructive",
      });
    },
  });

  const handleVisibilityToggle = (slideKey: string, isVisible: boolean) => {
    updateVisibilityMutation.mutate({ slideKey, isVisible });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Global Slides</h3>
        </div>
        <div className="text-muted-foreground">Loading global slides...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Globe className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Global Slides</h3>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Global slides appear on all sites. Control their visibility across the platform.
      </div>

      <div className="space-y-4">
        {globalSlides.map((slide) => (
          <Card key={slide.id} data-testid={`card-global-slide-${slide.slideKey}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base" data-testid={`text-slide-title-${slide.slideKey}`}>
                    {slide.title}
                  </CardTitle>
                  <CardDescription data-testid={`text-slide-type-${slide.slideKey}`}>
                    Type: {slide.slideType} • Position: {slide.displayPosition}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`slide-${slide.slideKey}`} className="text-sm">
                    {slide.isVisible ? 'Visible' : 'Hidden'}
                  </Label>
                  <Switch
                    id={`slide-${slide.slideKey}`}
                    checked={slide.isVisible || false}
                    onCheckedChange={(isVisible) => handleVisibilityToggle(slide.slideKey, isVisible)}
                    disabled={updateVisibilityMutation.isPending}
                    data-testid={`switch-visibility-${slide.slideKey}`}
                  />
                </div>
              </div>
            </CardHeader>
            
            {slide.slideType === 'action-cards' && slide.cardConfig?.cards && (
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">Action Cards:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {slide.cardConfig.cards.map((card, index) => (
                    <div 
                      key={index}
                      className="p-2 bg-muted rounded text-sm"
                      data-testid={`card-action-preview-${card.actionType}`}
                    >
                      <div className="font-medium">{card.title}</div>
                      <div className="text-xs text-muted-foreground">{card.buttonText}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {globalSlides.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>No global slides configured</div>
              <div className="text-xs">Global slides appear across all sites in the platform</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}