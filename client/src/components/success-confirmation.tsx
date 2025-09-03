import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  showCrossSell?: boolean;
  onCrossSellClick?: () => void;
  crossSellText?: string;
  crossSellButtonText?: string;
}

export function SuccessConfirmation({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  showCrossSell = false,
  onCrossSellClick,
  crossSellText,
  crossSellButtonText 
}: SuccessConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-600">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-base mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {showCrossSell && crossSellText && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300 mb-3">
                {crossSellText}
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onCrossSellClick}
              >
                {crossSellButtonText || "Learn More"}
              </Button>
            </div>
          )}

          <Button 
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}