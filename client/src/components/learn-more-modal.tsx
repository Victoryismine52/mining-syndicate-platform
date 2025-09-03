import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { SharedContactForm } from "./shared-contact-form";
import { SuccessConfirmation } from "./success-confirmation";
import { Info, Loader2 } from "lucide-react";

interface LearnMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LearnMoreModal({ isOpen, onClose }: LearnMoreModalProps) {
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<Omit<InsertLead, "interests"> & { interests: string[] }>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      interests: [],
    },
  });

  const submitLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const res = await apiRequest("POST", "/api/leads", data);
      return await res.json();
    },
    onSuccess: () => {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        interests: [],
      });
      setInterests([]);
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

  const onSubmit = (data: Omit<InsertLead, "interests"> & { interests: string[] }) => {
    if (data.interests.length === 0) {
      toast({
        title: "Please select your interests",
        description: "You must select at least one area of interest.",
        variant: "destructive",
      });
      return;
    }

    submitLeadMutation.mutate({
      ...data,
      interests: data.interests,
      formType: "learn-more",
    } as any);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-secondary border-border max-w-md">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-accent bg-opacity-20 rounded-full mx-auto flex items-center justify-center mb-4">
              <Info className="text-accent text-2xl" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Get More Information
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tell us about your interest and we'll be in touch
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <SharedContactForm 
              form={form}
              interests={interests}
              onInterestChange={handleInterestChange}
              showInterests={true}
            />

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold mt-6"
              disabled={submitLeadMutation.isPending}
            >
              {submitLeadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Information"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessConfirmation 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Thank You!"
        description="We've received your interest form and will be in touch soon with more information about our mining syndicate opportunities."
      />
    </>
  );
}
