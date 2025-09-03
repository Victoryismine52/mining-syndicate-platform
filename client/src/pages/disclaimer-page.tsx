import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { LegalDisclaimer } from '@shared/site-schema';

export function DisclaimerPage() {
  const { disclaimerId } = useParams<{ disclaimerId: string }>();
  const [, setLocation] = useLocation();

  const { data: disclaimer, isLoading, error } = useQuery<LegalDisclaimer>({
    queryKey: ['/api/disclaimers', disclaimerId],
    enabled: !!disclaimerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading disclaimer...</div>
      </div>
    );
  }

  if (error || !disclaimer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Disclaimer Not Found</h1>
          <p className="text-slate-400 mb-6">The requested legal disclaimer could not be found.</p>
          <Button onClick={() => setLocation('/sites')} variant="outline" className="border-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/sites')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">{disclaimer.name}</h1>
            <div className="flex justify-center items-center gap-4 text-slate-400">
              <span>Version {disclaimer.version}</span>
              <span>•</span>
              <span>{getLanguageDisplay(disclaimer.language)}</span>
              {disclaimer.createdAt && (
                <>
                  <span>•</span>
                  <span>Effective {new Date(disclaimer.createdAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
            {disclaimer.description && (
              <p className="text-slate-300 mt-4 max-w-2xl mx-auto">
                {disclaimer.description}
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-600 rounded-lg p-8">
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {disclaimer.content}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>
            This document was last updated on{' '}
            {disclaimer.updatedAt 
              ? new Date(disclaimer.updatedAt).toLocaleDateString() 
              : disclaimer.createdAt 
                ? new Date(disclaimer.createdAt).toLocaleDateString()
                : 'Unknown'
            }
          </p>
        </div>
      </div>
    </div>
  );
}