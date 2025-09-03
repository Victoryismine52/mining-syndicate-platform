import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { InsertLead } from "@shared/schema";

interface SharedContactFormProps {
  form: UseFormReturn<Omit<InsertLead, "interests"> & { interests: string[] }>;
  interests: string[];
  onInterestChange: (interest: string, checked: boolean) => void;
  showInterests?: boolean;
}

export function SharedContactForm({ form, interests, onInterestChange, showInterests = true }: SharedContactFormProps) {
  // Graceful error handling for undefined form
  if (!form) {
    return (
      <div className="p-4 border-2 border-dashed border-red-500 rounded-lg">
        <p className="text-red-400 text-center">
          Form configuration not found. Please contact support or try again later.
        </p>
      </div>
    );
  }

  // Graceful error handling for form register function
  if (!form.register) {
    return (
      <div className="p-4 border-2 border-dashed border-red-500 rounded-lg">
        <p className="text-red-400 text-center">
          Form not properly initialized. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-300">
            First Name *
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            autoComplete="given-name"
            autoCapitalize="words"
            spellCheck="true"
            className="bg-card border-border text-foreground focus:border-accent"
            {...form.register("firstName")}
            data-testid="input-firstName"
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">
            Last Name *
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            autoComplete="family-name"
            autoCapitalize="words"
            spellCheck="true"
            className="bg-card border-border text-foreground focus:border-accent"
            {...form.register("lastName")}
            data-testid="input-lastName"
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-300">
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          className="bg-card border-border text-foreground focus:border-accent"
          {...form.register("email")}
          data-testid="input-email"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
          Phone Number *
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          className="bg-card border-border text-foreground focus:border-accent"
          {...form.register("phone")}
          data-testid="input-phone"
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      {showInterests && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">
            I'm interested in: *
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mining"
                checked={interests.includes("mining")}
                onCheckedChange={(checked) => onInterestChange("mining", checked as boolean)}
              />
              <Label htmlFor="mining" className="text-gray-300">
                Mining Pool
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lending"
                checked={interests.includes("lending")}
                onCheckedChange={(checked) => onInterestChange("lending", checked as boolean)}
              />
              <Label htmlFor="lending" className="text-gray-300">
                Lending Pool
              </Label>
            </div>

          </div>
        </div>
      )}
    </>
  );
}