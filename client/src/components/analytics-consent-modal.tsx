import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConsentRecord {
  status: 'granted' | 'denied';
  timestamp: number;
}

function getStoredConsent(): ConsentRecord | null {
  try {
    const stored = localStorage.getItem('analytics-consent');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentRecord | null>(() => getStoredConsent());
  const [open, setOpen] = useState(!consent);

  useEffect(() => {
    setOpen(!consent);
  }, [consent]);

  const saveConsent = (status: 'granted' | 'denied') => {
    const record: ConsentRecord = { status, timestamp: Date.now() };
    try {
      localStorage.setItem('analytics-consent', JSON.stringify(record));
    } catch {
      // ignore storage errors
    }
    setConsent(record);
  };

  const ConsentModal = () => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allow analytics?</DialogTitle>
          <DialogDescription>
            We collect anonymous usage data to improve our services. Do you consent to analytics tracking?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => saveConsent('denied')}>Decline</Button>
          <Button onClick={() => saveConsent('granted')}>Allow</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { consent, ConsentModal };
}

