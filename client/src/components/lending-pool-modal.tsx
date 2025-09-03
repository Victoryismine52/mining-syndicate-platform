import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { SharedContactForm } from "./shared-contact-form";
import { SuccessConfirmation } from "./success-confirmation";

interface LendingPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Extended schema for lending pool with lending amount
const lendingPoolSchema = insertLeadSchema.extend({
  lendingAmount: z.string().min(1, "Lending amount is required"),
});

type LendingPoolFormData = z.infer<typeof lendingPoolSchema>;

export function LendingPoolModal({ isOpen, onClose }: LendingPoolModalProps) {
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>(["lending"]);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<Omit<InsertLead, "interests"> & { interests: string[] } & { lendingAmount: string }>({
    resolver: zodResolver(lendingPoolSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      interests: ["lending"],
      lendingAmount: "",
    },
  });

  const submitLendingPoolMutation = useMutation({
    mutationFn: async (data: LendingPoolFormData) => {
      // Convert to lead format and add lending pool info
      const leadData: InsertLead & { 
        lendingAmount?: string;
        formType?: string;
      } = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        interests: data.interests,
        lendingAmount: data.lendingAmount,
        formType: "lending-pool",
      };
      
      const res = await apiRequest("POST", "/api/leads", leadData);
      return await res.json();
    },
    onSuccess: () => {
      form.reset();
      setInterests(["lending"]);
      onClose();
      setShowSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
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

  const onSubmit = (data: LendingPoolFormData) => {
    if (data.interests.length === 0) {
      toast({
        title: "Please select your interests",
        description: "You must select at least one area of interest.",
        variant: "destructive",
      });
      return;
    }

    submitLendingPoolMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-foreground">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span>Join Lending Pool</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Provide capital for guaranteed returns and exclusive benefits. Enter your details and desired lending amount.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact Information */}
            <SharedContactForm
              form={form as any}
              interests={interests}
              onInterestChange={handleInterestChange}
              showInterests={false}
            />

            {/* Lending Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Desired Lending Amount *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="50,000"
                  {...form.register("lendingAmount")}
                  className="pl-10 bg-card border-border text-foreground focus:border-accent"
                />
              </div>
              {form.formState.errors.lendingAmount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lendingAmount.message}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Enter your preferred lending amount (USD). Minimum investment opportunities typically start at $10,000.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-400 hover:bg-green-500 text-black font-bold mt-6"
              disabled={submitLendingPoolMutation.isPending}
            >
              {submitLendingPoolMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Interest...
                </>
              ) : (
                "Submit Lending Interest"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessConfirmation 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Lending Interest Submitted!"
        description="We've received your lending pool interest and will contact you soon with available lending opportunities and detailed terms."
      />
    </>
  );
}