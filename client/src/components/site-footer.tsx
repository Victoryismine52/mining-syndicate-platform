import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, QrCode, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SiteDisclaimer, Site } from '@shared/site-schema';

interface SiteFooterProps {
  siteId: string;
  companyName?: string;
}

export function SiteFooter({ siteId, companyName }: SiteFooterProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  
  const { data: siteDisclaimers = [] } = useQuery<SiteDisclaimer[]>({
    queryKey: [`/api/sites/${siteId}/disclaimers`],
    enabled: !!siteId,
  });

  const { data: siteData, isLoading: siteDataLoading } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
    enabled: !!siteId,
  });

  // Show loading state while data is being fetched
  if (siteDataLoading) {
    return null;
  }

  // Determine footer text - use smart fallback logic if data is missing
  const getFooterText = () => {
    if (siteData?.footerText) {
      return siteData.footerText;
    }
    
    // Default text based on site type (if available)
    if (siteData?.siteType === 'pitch-site') {
      return 'PitchMe';
    }
    
    // Use companyName prop or landingConfig, or fallback based on URL
    if (companyName) {
      return companyName;
    }
    
    if (siteData?.landingConfig?.companyName) {
      return siteData.landingConfig.companyName;
    }
    
    // Smart fallback based on site ID for pitch sites
    if (siteId && (siteId.includes('pitch') || siteId === 'my-pitch')) {
      return 'PitchMe';
    }
    
    return 'Mining Syndicate';
  };

  const footerText = getFooterText();

  const handleDownloadQr = () => {
    if (siteData?.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = siteData.qrCodeUrl;
      link.download = `${siteId}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasQrCode = !!siteData?.qrCodeUrl;
  const hasDisclaimers = siteDisclaimers.length > 0;

  if (!hasDisclaimers && !hasQrCode) {
    return (
      <footer className="bg-slate-900 border-t border-slate-700 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} {footerText}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-900 border-t border-slate-700 mt-16">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-slate-400">
            <p>&copy; {new Date().getFullYear()} {footerText}. All rights reserved.</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-end">
            {hasQrCode && siteData?.qrCodeUrl && (
              <button
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm cursor-pointer"
                data-testid="footer-qr-code"
              >
                QR Code
                <QrCode className="w-3 h-3" />
              </button>
            )}
            {hasDisclaimers && (
              <a
                href={`/site/${siteId}/disclaimer`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                data-testid="footer-legal-disclaimers"
              >
                Legal Disclaimers
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Additional Legal Notice if disclaimers exist */}
        {siteDisclaimers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Please review all legal disclaimers before proceeding with any investment decisions.
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-white">Site QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {siteData?.qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={siteData.qrCodeUrl} 
                  alt={`QR Code for ${siteId}`}
                  className="w-64 h-64 object-contain"
                />
              </div>
            )}
            <p className="text-slate-400 text-sm text-center">
              Scan with your phone to visit this site
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadQr}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                data-testid="button-download-qr"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => setQrModalOpen(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                data-testid="button-close-qr-modal"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}