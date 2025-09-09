import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info, Pickaxe, DollarSign, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, ArrowRight, Mail, Users, Phone, FileText, Star, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MiningPoolModal } from "./mining-pool-modal";
import { LendingPoolModal } from "./lending-pool-modal";
import { FinalActionSlide } from "./final-action-slide";
import { SimpleFormModal } from "./simple-form-modal";
import type { SiteSlide, GlobalSlide } from "@shared/site-schema";
import type { Site } from "@shared/site-schema";

interface PresentationViewerProps {
  siteId: string;
  siteType?: string;
  onOpenLearnMore: () => void;
}

// Helper function for form icons in presentation
const getFormIcon = (iconName: string) => {
  switch (iconName) {
    case 'mail': return <Mail className="w-6 h-6 text-white" />;
    case 'users': return <Users className="w-6 h-6 text-white" />;
    case 'phone': return <Phone className="w-6 h-6 text-white" />;
    case 'file': return <FileText className="w-6 h-6 text-white" />;
    case 'info': return <Info className="w-6 h-6 text-white" />;
    case 'dollar': return <DollarSign className="w-6 h-6 text-white" />;
    case 'pickaxe': return <Pickaxe className="w-6 h-6 text-white" />;
    case 'star': return <Star className="w-6 h-6 text-white" />;
    case 'heart': return <Heart className="w-6 h-6 text-white" />;
    case 'shield': return <Shield className="w-6 h-6 text-white" />;
    default: return <FileText className="w-6 h-6 text-white" />;
  }
};

// Get color theme for form cards
function getFormColorTheme(colorOverride?: string) {
  const colorThemes = {
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', button: 'bg-blue-500 hover:bg-blue-600' },
    green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', button: 'bg-green-500 hover:bg-green-600' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', button: 'bg-purple-500 hover:bg-purple-600' },
    red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', button: 'bg-red-500 hover:bg-red-600' },
    orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', button: 'bg-orange-500 hover:bg-orange-600' },
    yellow: { bg: 'bg-yellow-600', hover: 'hover:bg-yellow-700', button: 'bg-yellow-500 hover:bg-yellow-600' },
    pink: { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', button: 'bg-pink-500 hover:bg-pink-600' },
    indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', button: 'bg-indigo-500 hover:bg-indigo-600' },
    teal: { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', button: 'bg-teal-500 hover:bg-teal-600' },
    pitchme: { bg: 'bg-gradient-to-r from-blue-600 to-purple-600', hover: 'hover:from-blue-700 hover:to-purple-700', button: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' }
  };
  return colorThemes[colorOverride as keyof typeof colorThemes] || colorThemes.pitchme;
}

// Dynamic Forms Slide Component
interface DynamicFormsSlideProps {
  forms: any[];
  siteId: string;
  siteLanguage: string;
  onPrevSlide: () => void;
  onNextSlide: () => void;
}

function DynamicFormsSlide({ forms, siteId, siteLanguage, onPrevSlide, onNextSlide }: DynamicFormsSlideProps) {
  const [selectedFormAssignment, setSelectedFormAssignment] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const handleFormCardClick = (formAssignment: any) => {
    setSelectedFormAssignment(formAssignment);
    setIsFormModalOpen(true);
  };

  // Use the exact same color function as the site page
  const getFormColor = (colorName: string) => {
    switch (colorName) {
      case 'blue': return {
        icon: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        button: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        shadow: 'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
      };
      case 'green': return {
        icon: 'bg-green-500/20 text-green-400 border-green-500/30',
        button: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
        shadow: 'shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
      };
      case 'purple': return {
        icon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        button: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
        shadow: 'shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
      };
      case 'orange': return {
        icon: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        button: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
        shadow: 'shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
      };
      case 'red': return {
        icon: 'bg-red-500/20 text-red-400 border-red-500/30',
        button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        shadow: 'shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
      };
      case 'yellow': return {
        icon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        button: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
        shadow: 'shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40'
      };
      case 'pink': return {
        icon: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        button: 'bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800',
        shadow: 'shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40'
      };
      case 'indigo': return {
        icon: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        button: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
        shadow: 'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
      };
      case 'teal': return {
        icon: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        button: 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800',
        shadow: 'shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40'
      };
      default: return {
        icon: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        button: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        shadow: 'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
      };
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Get In Touch
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Ready to take the next step? Choose from our engagement options below.
          </p>
        </div>

        {/* Form Cards Grid - Responsive layout for presentation constraints */}
        <div className={`grid gap-6 mx-auto ${
          forms.length === 1 ? 'grid-cols-1 max-w-md' : 
          forms.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 
          'md:grid-cols-3 max-w-6xl'
        }`}>
          {forms.map((formAssignment) => {
            // Use the exact same logic as the site page
            const formTemplate = formAssignment.formTemplate;
            const config = formTemplate.config || {};
            // Use override color first, then template color, then default to blue
            const effectiveColor = formAssignment.overrideConfig?.color || config.color || 'blue';
            const colorTheme = getFormColor(effectiveColor);
            const effectiveTitle = formAssignment.overrideConfig?.title || config.title || formTemplate.name;
            const effectiveSubtitle = formAssignment.overrideConfig?.subtitle ?? config.subtitle;
            const effectiveDescription = formAssignment.overrideConfig?.description || config.description || formTemplate.description || 'Click to learn more and get in touch';
            const buttonText = formAssignment.overrideConfig?.buttonText || config.buttonText || 'Get Started';
            
            return (
              <Card 
                key={formAssignment.id}
                className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-600 backdrop-blur-sm hover:border-slate-500 transition-all duration-300 cursor-pointer transform hover:scale-105 flex flex-col h-full ${colorTheme.shadow}`}
                onClick={() => handleFormCardClick(formAssignment)}
                data-testid={`form-card-${formTemplate.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="text-center pb-4 flex-grow">
                  <div className={`w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 ${colorTheme.icon}`}>
                    {getFormIcon(config.icon || 'file')}
                  </div>
                  <CardTitle className="text-xl text-white mb-2">
                    {effectiveTitle}
                  </CardTitle>
                  {effectiveSubtitle && (
                    <p className="text-slate-400 text-xs mb-2 font-medium">
                      {effectiveSubtitle}
                    </p>
                  )}
                  <CardDescription className="text-slate-300 text-sm whitespace-pre-line">
                    {effectiveDescription}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pt-0 mt-auto">
                  <Button
                    className={`w-full ${colorTheme.button} text-white font-semibold transition-all duration-300`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFormCardClick(formAssignment);
                    }}
                  >
                    {buttonText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Simple Form Modal */}
        {selectedFormAssignment && (
          <SimpleFormModal
            isOpen={isFormModalOpen}
            onClose={() => {
              setIsFormModalOpen(false);
              setSelectedFormAssignment(null);
            }}
            formTemplate={selectedFormAssignment.formTemplate}
            siteId={siteId}
            colorTheme={getFormColor(selectedFormAssignment.overrideConfig?.color || selectedFormAssignment.formTemplate.config?.color || 'blue')}
            selectedLanguage={selectedFormAssignment.selectedLanguage || siteLanguage}
          />
        )}

        {/* Navigation Hints */}
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevSlide}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextSlide}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PresentationViewer({ siteId, siteType, onOpenLearnMore }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isMiningPoolModalOpen, setIsMiningPoolModalOpen] = useState(false);
  const [isLendingPoolModalOpen, setIsLendingPoolModalOpen] = useState(false);

  const { data: site } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
    enabled: !!siteId,
  });
  const siteLanguage = site?.landingConfig?.language || 'en';

  // Fetch slides from the database
  const { data: dbSlides = [], isLoading: slidesLoading } = useQuery<SiteSlide[]>({
    queryKey: [`/api/sites/${siteId}/slides`],
  });

  // Fetch global slides
  const { data: globalSlides = [], isLoading: globalLoading } = useQuery<GlobalSlide[]>({
    queryKey: ['/api/global-slides'],
  });

  // Fetch form assignments that are marked for inclusion in presentation
  const { data: formAssignments = [], isLoading: formsLoading } = useQuery<any[]>({
    queryKey: [`/api/sites/${siteId}/form-assignments`],
  });

  const isLoading = slidesLoading || globalLoading || formsLoading;

  // Convert database slides to presentation format
  console.log('dbSlides for siteId', siteId, ':', dbSlides);
  const siteSlides = dbSlides
    .filter(slide => slide.isVisible)
    .sort((a, b) => parseInt(a.slideOrder || "0") - parseInt(b.slideOrder || "0"))
    .map(slide => {
      console.log('Processing slide:', slide.title, 'imageUrl:', slide.imageUrl);
      // For object storage paths, use the slide-images endpoint
      let imageUrl = slide.imageUrl;
      if (imageUrl && imageUrl.startsWith('/replit-objstore-')) {
        imageUrl = `/slide-images${imageUrl}`;
      }
      
      return {
        id: slide.id,
        title: slide.title,
        content: imageUrl,
        type: "image" as const,
        slideType: "site" as const,
      };
    });
  
  console.log('Processed siteSlides:', siteSlides.length, 'slides');

  // Filter for the final action cards slide that should always appear at the end
  const finalActionSlide = globalSlides
    .filter(slide => slide.isVisible && slide.displayPosition === 'end' && slide.slideKey === 'final-action-cards')
    .map(slide => ({
      id: slide.id,
      title: slide.title,
      content: slide.slideKey,
      type: "action-cards" as const,
      slideType: "global" as const,
      globalSlide: slide,
    }));

  // Get forms marked for inclusion in presentation
  const presentationForms = formAssignments.filter(assignment => 
    assignment.overrideConfig?.includeInPresentation === true
  );

  // Create dynamic form slide if there are forms marked for presentation
  const dynamicFormSlide = presentationForms.length > 0 ? [{
    id: 'dynamic-forms',
    title: 'Get In Touch',
    content: 'dynamic-forms',
    type: "dynamic-forms" as const,
    slideType: "dynamic" as const,
    forms: presentationForms,
  }] : [];

  // CRITICAL: Pitch Sites should NEVER inherit global slides - they have independent slide management
  // Only Mining Syndicate sites should fall back to global slides when no site-specific content exists
  const slides = siteSlides.length > 0 
    ? [...siteSlides, ...dynamicFormSlide]  // Site has custom slides: show site slides + any forms
    : dynamicFormSlide.length > 0
    ? [...dynamicFormSlide]  // Site has forms but no slides: show only the forms
    : siteType === 'pitch-site'
    ? []  // Pitch Sites with no content: show empty array (triggers "coming soon" screen)
    : [
        // Mining Syndicate sites with no content: show global slides as fallback
        ...globalSlides
          .filter(slide => slide.isVisible && slide.displayPosition !== 'end')
          .sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)) // Sort by creation time
          .map(slide => {
            // Handle different slide types properly
            if (slide.slideType === 'action-cards') {
              return {
                id: slide.id,
                title: slide.title,
                content: slide.slideKey,
                type: "action-cards" as const,
                slideType: "global" as const,
                globalSlide: slide,
              };
            } else {
              // Handle image slides - use imageUrl and apply same processing as site slides
              let imageUrl = slide.imageUrl;
              if (imageUrl && imageUrl.startsWith('/replit-objstore-')) {
                imageUrl = `/slide-images${imageUrl}`;
              }
              
              return {
                id: slide.id,
                title: slide.title,
                content: imageUrl,
                type: "image" as const,
                slideType: "global" as const,
                globalSlide: slide,
              };
            }
          }),
        // Then add the final action slide at the end
        ...finalActionSlide
      ];
  
  console.log('Final slides array:', slides.length, 'slides - siteSlides:', siteSlides.length, 'finalActionSlide:', finalActionSlide.length);

  // All hooks must be defined before any conditional returns
  const nextSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  }, [slides.length]);

  const jumpToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const jumpToStart = useCallback(() => {
    setCurrentSlide(0);
  }, []);

  const jumpToEnd = useCallback(() => {
    if (slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
        case " ":
          event.preventDefault();
          nextSlide();
          break;
        case "ArrowLeft":
          event.preventDefault();
          prevSlide();
          break;
        case "Home":
          event.preventDefault();
          jumpToStart();
          break;
        case "End":
          event.preventDefault();
          jumpToEnd();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, jumpToStart, jumpToEnd]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setTouchStart(null);
  };

  // Handle loading and empty states after all hooks are defined
  if (isLoading) {
    return (
      <div className="relative w-full h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading presentation...</div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-8 flex items-center justify-center">
            <div className="text-white text-4xl">🚀</div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Presentation Coming Soon
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            We're working hard to bring you an amazing pitch deck presentation. 
            Our slides are currently being prepared and will be available shortly.
          </p>
          
          <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-3">What to expect:</h3>
            <ul className="text-slate-300 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Interactive slide navigation
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Detailed project information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Investment opportunities
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Contact and engagement options
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-slate-400 mt-6">
            Check back soon or contact us for more information about when the presentation will be ready.
          </p>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div 
      className="relative w-full h-screen bg-slate-900 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentSlideData.type === "action-cards" && currentSlideData.slideType === "global" ? (
          // Render final action cards slide
          <FinalActionSlide
            globalSlide={(currentSlideData as any).globalSlide}
            onLearnMore={onOpenLearnMore}
            onMiningPool={() => setIsMiningPoolModalOpen(true)}
            onLendingPool={() => setIsLendingPoolModalOpen(true)}
          />
        ) : currentSlideData.type === "dynamic-forms" ? (
          // Render dynamic forms slide
          <DynamicFormsSlide
            forms={(currentSlideData as any).forms}
            siteId={siteId}
            siteLanguage={siteLanguage}
            onPrevSlide={prevSlide}
            onNextSlide={nextSlide}
          />
        ) : (
          // Render regular image slide
          <>
            <img
              src={currentSlideData.content || currentSlideData.imageUrl || ''}
              alt={currentSlideData.title}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
            
            {/* Navigation Overlay for image slides */}
            <div className="absolute inset-0 flex">
              {/* Left click area */}
              <div
                className="flex-1 cursor-pointer flex items-center justify-start pl-4"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-8 h-8 text-white opacity-0 hover:opacity-70 transition-opacity" />
              </div>
              
              {/* Right click area */}
              <div
                className="flex-1 cursor-pointer flex items-center justify-end pr-4"
                onClick={nextSlide}
              >
                <ChevronRight className="w-8 h-8 text-white opacity-0 hover:opacity-70 transition-opacity" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <h2 className="text-white font-semibold text-lg truncate max-w-md">
            {currentSlideData.title}
          </h2>
          <span className="text-slate-300 text-sm">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Hard-coded modal buttons removed - forms only appear on final action slide */}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={jumpToStart}
            className="text-white hover:bg-white/20"
            data-testid="button-jump-start"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpToSlide(Math.max(0, currentSlide - 5))}
            className="text-white hover:bg-white/20"
            data-testid="button-skip-back"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            className="text-white hover:bg-white/20"
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            className="text-white hover:bg-white/20"
            data-testid="button-next-slide"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpToSlide(Math.min(slides.length - 1, currentSlide + 5))}
            className="text-white hover:bg-white/20"
            data-testid="button-skip-forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={jumpToEnd}
            className="text-white hover:bg-white/20"
            data-testid="button-jump-end"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <Progress 
          value={progress} 
          className="h-2 bg-slate-700"
          data-testid="progress-presentation"
        />
      </div>

      {/* Mining Pool Modal */}
      <MiningPoolModal
        isOpen={isMiningPoolModalOpen}
        onClose={() => setIsMiningPoolModalOpen(false)}
      />

      {/* Lending Pool Modal */}
      <LendingPoolModal
        isOpen={isLendingPoolModalOpen}
        onClose={() => setIsLendingPoolModalOpen(false)}
      />
    </div>
  );
}