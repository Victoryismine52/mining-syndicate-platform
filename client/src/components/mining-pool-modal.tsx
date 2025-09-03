import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { SharedContactForm } from "./shared-contact-form";
import { SuccessConfirmation } from "./success-confirmation";
import { Pickaxe, Loader2, Minus, Plus } from "lucide-react";
import { z } from "zod";

interface MiningPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLendingPoolOpen?: () => void;
}

// Extended schema for mining pool with founders units
const miningPoolSchema = insertLeadSchema.extend({
  foundersUnitCount: z.string().min(1, "Must select unit count"),
  foundersUnitIds: z.array(z.string()).optional(),
  hasMoreThanTenUnits: z.boolean().optional(),
});

type MiningPoolFormData = z.infer<typeof miningPoolSchema>;

export function MiningPoolModal({ isOpen, onClose, onLendingPoolOpen }: MiningPoolModalProps) {
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>(["mining"]);
  const [foundersUnitCount, setFoundersUnitCount] = useState<string>("1");
  const [foundersUnitIds, setFoundersUnitIds] = useState<string[]>([""]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<Omit<InsertLead, "interests"> & { interests: string[] } & { foundersUnitCount: string; foundersUnitIds?: string[]; hasMoreThanTenUnits?: boolean }>({
    resolver: zodResolver(miningPoolSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      interests: ["mining"],
      foundersUnitCount: "1",
      foundersUnitIds: [""],
      hasMoreThanTenUnits: false,
    },
  });

  const submitMiningPoolMutation = useMutation({
    mutationFn: async (data: MiningPoolFormData) => {
      // Convert to lead format and add special mining pool info
      const leadData: InsertLead & { 
        foundersUnitCount?: number; 
        foundersUnitIds?: string[]; 
        hasMoreThanTenUnits?: boolean;
        formType?: string;
      } = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        interests: data.interests,
        foundersUnitCount: data.foundersUnitCount === "10+" ? 10 : parseInt(data.foundersUnitCount),
        foundersUnitIds: data.foundersUnitIds || [],
        hasMoreThanTenUnits: data.foundersUnitCount === "10+",
        formType: "mining-pool-reservation",
      };
      
      const res = await apiRequest("POST", "/api/leads", leadData);
      return await res.json();
    },
    onSuccess: () => {
      form.reset();
      setInterests(["mining"]);
      setFoundersUnitCount("1");
      setFoundersUnitIds([""]);
      onClose();
      setShowSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Reservation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInterestChange = (interest: string, checked: boolean) => {
    const newInterests = checked
      ? [...interests, interest]
      : interests.filter(i => i !== interest);
    setInterests(newInterests);
    form.setValue("interests", newInterests);
  };

  const handleFoundersUnitCountChange = (value: string) => {
    setFoundersUnitCount(value);
    form.setValue("foundersUnitCount", value);
    
    if (value === "10+") {
      // For 10 or more units, clear the IDs and set the flag
      setFoundersUnitIds([]);
      form.setValue("foundersUnitIds", []);
      form.setValue("hasMoreThanTenUnits", true);
    } else {
      // For specific counts, create that many ID fields
      const count = parseInt(value);
      const newIds = Array(count).fill("");
      setFoundersUnitIds(newIds);
      form.setValue("foundersUnitIds", newIds);
      form.setValue("hasMoreThanTenUnits", false);
    }
  };

  const handleFoundersUnitIdChange = (index: number, value: string) => {
    const newIds = [...foundersUnitIds];
    newIds[index] = value;
    setFoundersUnitIds(newIds);
    form.setValue("foundersUnitIds", newIds);
  };

  const onSubmit = (data: MiningPoolFormData) => {
    if (data.interests.length === 0) {
      toast({
        title: "Please select your interests",
        description: "You must select at least one area of interest.",
        variant: "destructive",
      });
      return;
    }

    // Only validate IDs if not selecting "10 or more"
    if (data.foundersUnitCount !== "10+" && data.foundersUnitIds) {
      const emptyIds = data.foundersUnitIds.filter(id => !id.trim());
      if (emptyIds.length > 0) {
        toast({
          title: "Missing Founders Unit IDs",
          description: "Please provide all Founders Unit ID numbers.",
          variant: "destructive",
        });
        return;
      }
    }

    submitMiningPoolMutation.mutate(data);
  };

  const handleCrossSell = () => {
    setShowSuccess(false);
    if (onLendingPoolOpen) {
      onLendingPoolOpen();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto bg-primary border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Pickaxe className="h-5 w-5 text-orange-400" />
              <span>Reserve Your Mining Pool Slot</span>
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Convert your Founders Units to secure your position in the Mining Pool
            </DialogDescription>
          </DialogHeader>

          {formError ? (
            <div className="p-4 border-2 border-dashed border-red-500 rounded-lg">
              <p className="text-red-400 text-center">
                Form initialization error: {formError}. Please close and try again.
              </p>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error boundary for contact form */}
              {form ? (
                <SharedContactForm 
                  form={form as any}
                  interests={interests}
                  onInterestChange={handleInterestChange}
                  showInterests={false}
                />
              ) : (
                <div className="p-4 border-2 border-dashed border-red-500 rounded-lg">
                  <p className="text-red-400 text-center">
                    Form not initialized. Please refresh and try again.
                  </p>
                </div>
              )}

            {/* Founders Unit Count */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                How many Founders Units do you wish to convert? *
              </Label>
              <Select
                value={foundersUnitCount}
                onValueChange={handleFoundersUnitCountChange}
              >
                <SelectTrigger className="bg-card border-border text-foreground focus:border-accent">
                  <SelectValue placeholder="Select unit count" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} unit{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                  <SelectItem value="10+">10 or more units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Founders Unit IDs or Contact Message */}
            {foundersUnitCount === "10+" ? (
              <div className="space-y-2 p-4 bg-orange-400/10 border border-orange-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Pickaxe className="h-5 w-5 text-orange-400" />
                  <Label className="text-sm font-medium text-orange-400">
                    Direct Contact Required
                  </Label>
                </div>
                <p className="text-sm text-gray-300">
                  For conversions of 10 or more Founders Units, our team will contact you directly to discuss your specific needs and coordinate the conversion process.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Founders Unit ID Numbers *
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {foundersUnitIds.map((id, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Label className="text-xs text-gray-400 w-12">
                        Unit {index + 1}:
                      </Label>
                      <Input
                        type="text"
                        placeholder="FU-XXXX-XXXX"
                        value={id}
                        onChange={(e) => handleFoundersUnitIdChange(index, e.target.value)}
                        className="bg-card border-border text-foreground focus:border-accent"
                      />
                    </div>
                  ))}
                </div>
                {form.formState.errors.foundersUnitIds && (
                  <p className="text-sm text-destructive">
                    Please provide all Founders Unit ID numbers
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-400 hover:bg-orange-500 text-black font-bold mt-6"
              disabled={submitMiningPoolMutation.isPending}
            >
              {submitMiningPoolMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reserving Slot...
                </>
              ) : (
                "Reserve Your Slot"
              )}
            </Button>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <SuccessConfirmation 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Mining Pool Slot Reserved!"
        description="We've received your mining pool reservation and will contact you soon with next steps for converting your Founders Units."
        showCrossSell={!!onLendingPoolOpen}
        onCrossSellClick={handleCrossSell}
        crossSellText="Looking to diversify your investment? Our Lending Pool offers fixed returns with lower risk."
        crossSellButtonText="Explore Lending Pool"
      />
    </>
  );
}