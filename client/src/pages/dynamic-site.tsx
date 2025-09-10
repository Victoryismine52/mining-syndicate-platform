import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Pickaxe, Coins, DollarSign, ArrowRight, Lock, Shield, Settings, Rocket, Clock, FileText, Users, Mail, Phone, Info, Minus, Plus, Star, Heart, Trash2, HelpCircle, ExternalLink } from 'lucide-react';
import { LearnMoreModal } from '@/components/learn-more-modal';
import { MiningPoolModal } from '@/components/mining-pool-modal';
import { LendingPoolModal } from '@/components/lending-pool-modal';
import { SharedContactForm } from '@/components/shared-contact-form';
import { SuccessConfirmation } from '@/components/success-confirmation';
import { SiteFooter } from '@/components/site-footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest, publicApiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertLeadSchema, type InsertLead } from '@shared/schema';
import { z } from 'zod';
import { PresentationViewer } from '@/components/presentation-viewer';
import { ComingSoon } from '@/components/coming-soon';
import { VideoCard } from '@/components/video-card';
import { YouTubeCard } from '@/components/youtube-card';
import { useAuth } from '@/hooks/use-auth';
import { useAnalyticsConsent } from '@/components/analytics-consent-modal';
import type { Site } from '@shared/site-schema';
import { validationMessages } from '@/lib/validationMessages';

const ANALYTICS_PROVIDER = import.meta.env.VITE_ANALYTICS_PROVIDER || 'internal';

// Helper function for form icons
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

// Site-specific gradient utility function
function getSiteGradient(gradientType?: string) {
  const gradients = {
    pitchme: {
      bg: 'bg-gradient-to-r from-blue-600 to-purple-600',
      hover: 'hover:from-blue-700 hover:to-purple-700',
      shadow: 'shadow-blue-500/25',
      icon: 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30',
      overlay: 'bg-gradient-to-r from-blue-600/20 to-purple-600/20'
    },
    ocean: {
      bg: 'bg-gradient-to-r from-blue-500 to-teal-500',
      hover: 'hover:from-blue-600 hover:to-teal-600',
      shadow: 'shadow-blue-400/25',
      icon: 'bg-gradient-to-r from-blue-500/20 to-teal-500/20 border-blue-400/30',
      overlay: 'bg-gradient-to-r from-blue-500/20 to-teal-500/20'
    },
    sunset: {
      bg: 'bg-gradient-to-r from-orange-500 to-pink-500',
      hover: 'hover:from-orange-600 hover:to-pink-600',
      shadow: 'shadow-orange-400/25',
      icon: 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-400/30',
      overlay: 'bg-gradient-to-r from-orange-500/20 to-pink-500/20'
    },
    forest: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      hover: 'hover:from-green-600 hover:to-emerald-700',
      shadow: 'shadow-green-400/25',
      icon: 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-400/30',
      overlay: 'bg-gradient-to-r from-green-500/20 to-emerald-600/20'
    },
    lavender: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
      hover: 'hover:from-purple-600 hover:to-pink-600',
      shadow: 'shadow-purple-400/25',
      icon: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30',
      overlay: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20'
    },
    gold: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      hover: 'hover:from-yellow-600 hover:to-orange-600',
      shadow: 'shadow-yellow-400/25',
      icon: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30',
      overlay: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
    },
    midnight: {
      bg: 'bg-gradient-to-r from-slate-600 to-blue-600',
      hover: 'hover:from-slate-700 hover:to-blue-700',
      shadow: 'shadow-slate-400/25',
      icon: 'bg-gradient-to-r from-slate-600/20 to-blue-600/20 border-slate-400/30',
      overlay: 'bg-gradient-to-r from-slate-600/20 to-blue-600/20'
    }
  };

  return gradients[gradientType as keyof typeof gradients] || gradients.pitchme;
}

interface DynamicSiteParams {
  siteId: string;
}

interface PitchSiteInterfaceProps {
  site: Site;
  siteId: string | undefined;
  showPresentation: boolean;
  setShowPresentation: (show: boolean) => void;
}

// Dynamic Form Modal Component
interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTemplate: any;
  siteId: string;
  colorTheme?: any;
  selectedLanguage?: string;
}

export function DynamicFormModal({ isOpen, onClose, formTemplate, siteId, colorTheme, selectedLanguage = 'en' }: DynamicFormModalProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const config = formTemplate.config || {};

  // Fetch the actual form template fields
  const formFieldsUrl = `/api/form-templates/${formTemplate.id}/fields`;
  const {
    data: formFields = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<any[]>({
    queryKey: [formFieldsUrl],
    enabled: !!formTemplate.id && isOpen,
    queryFn: () => publicApiRequest('GET', formFieldsUrl).then((res) => res.json()),
  });

  if (isError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Failed to load form</DialogTitle>
            <DialogDescription>
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred while loading the form."}
            </DialogDescription>
          </DialogHeader>
          {!isOnline && (
            <div className="bg-yellow-500 text-black p-2 rounded text-center mb-4" data-testid="offline-warning">
              You are offline. Form submissions are disabled.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => refetch()} data-testid="refresh-form-button">Refresh Form</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Memoize dynamic schema based on actual fields
  const formSchema = useMemo(() => {
    const msgs = validationMessages[selectedLanguage] || validationMessages.en;
    let schemaFields: any = {};

    formFields.forEach((field, index) => {
      if (!field?.fieldLibrary || !field.fieldLibrary.name) {
        console.warn('Skipping malformed field entry', { index, field });
        return;
      }
      const fieldName = field.fieldLibrary.name;
      let fieldSchema: any;

      // Handle array fields first since they have completely different schema structure
      if (field.fieldLibrary.dataType === 'array') {
        const options = field.fieldLibrary.defaultValidation?.options || [];
        if (options.length > 0) {
          // For array fields with predefined options (multiselect)
          const minItems = field.fieldLibrary.defaultValidation?.minItems || 0;

          // Start with basic array schema
          fieldSchema = z.array(z.string());

          // Apply min constraint BEFORE refine
          if (field.isRequired && minItems > 0) {
            fieldSchema = fieldSchema.min(minItems, msgs.selectOption);
          } else if (field.isRequired) {
            fieldSchema = fieldSchema.min(1, msgs.selectOption);
          }

          // Apply refine constraint AFTER min
          fieldSchema = fieldSchema.refine(
            (values: string[]) => values.every((value: string) => options.includes(value)),
            { message: msgs.selectOneOption }
          );
        } else {
          // For array fields without predefined options (extensible lists)
          const minItems = field.fieldLibrary.defaultValidation?.minItems || 0;
          fieldSchema = z.array(z.string());

          if (field.isRequired && minItems > 0) {
            fieldSchema = fieldSchema.min(minItems, msgs.atLeastOne);
          } else if (field.isRequired) {
            fieldSchema = fieldSchema.min(1, msgs.atLeastOne);
          }
        }
      }
      // Handle radio fields
      else if (field.fieldLibrary.dataType === 'radio') {
        const options = field.fieldLibrary.defaultValidation?.options || [];
        if (options.length > 0) {
          if (field.isRequired) {
            // For required radio fields, ensure a value is selected and it's valid
            fieldSchema = z.string()
              .min(1, msgs.selectOption)
              .refine(
                (value) => options.includes(value),
                { message: msgs.selectOneOption }
              );
          } else {
            // For optional radio fields
            fieldSchema = z.string()
              .optional()
              .refine(
                (value) => !value || value === "" || options.includes(value),
                { message: msgs.selectOneOption }
              );
          }
        } else {
          fieldSchema = field.isRequired ? z.string().min(1, msgs.required) : z.string().optional();
        }
      }
      // Handle all other field types (string-based)
      else {
        // Start with basic string validation
        if (field.fieldLibrary.dataType === 'email') {
          fieldSchema = z.string().email(msgs.invalidEmail);
        } else if (field.fieldLibrary.dataType === 'phone') {
          fieldSchema = z.string().regex(/^[\+]?[1-9][\d]{0,14}$/, msgs.invalidPhone);
        } else if (field.fieldLibrary.dataType === 'number') {
          fieldSchema = z.string().regex(/^\d+$/, msgs.invalidNumber);
        } else {
          fieldSchema = z.string();
        }

        // Apply custom validation
        if (field.customValidation) {
          if (field.customValidation.minLength) {
            fieldSchema = fieldSchema.min(field.customValidation.minLength, msgs.required);
          }
          if (field.customValidation.maxLength) {
            fieldSchema = fieldSchema.max(field.customValidation.maxLength, msgs.required);
          }
          if (field.customValidation.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.customValidation.pattern), msgs.invalidNumber);
          }
        }

        // Apply required validation
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, msgs.required);
        } else {
          fieldSchema = fieldSchema.optional();
        }
      }

      schemaFields[fieldName] = fieldSchema;
    });

    return z.object(schemaFields);
  }, [formFields, selectedLanguage]);

  // Memoize default values based on form fields
  const defaultValues = useMemo(() => {
    let defaultValues: any = {};
    
    formFields.forEach((field, index) => {
      if (!field?.fieldLibrary || !field.fieldLibrary.name) {
        console.warn('Skipping malformed field entry', { index, field });
        return;
      }
      const fieldName = field.fieldLibrary.name;
      // Array fields should default to empty array, others to empty string
      defaultValues[fieldName] = field.fieldLibrary.dataType === 'array' ? [] : "";
    });

    return defaultValues;
  }, [formFields]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.control._options.resolver = zodResolver(formSchema);
    form.reset(defaultValues, { keepDefaultValues: true });
  }, [formFields, formSchema, defaultValues, form]);

  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      // Build lead data from form fields
      let leadData: any = {
        formType: 'custom-form',
        formTemplateId: formTemplate.id,
        siteId: siteId,
        formData: data, // Use 'formData' to match the database schema
      };

      // Extract standard fields if they exist
      if (data.firstName) leadData.firstName = data.firstName;
      if (data.lastName) leadData.lastName = data.lastName;
      if (data.email) leadData.email = data.email;
      if (data.phone) leadData.phone = data.phone;

      const res = await apiRequest("POST", "/api/leads", leadData);
      return await res.json();
    },
    onSuccess: () => {
      form.reset();
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

  // FieldLabel component with help icon for descriptions
  const FieldLabel = ({ 
    label, 
    isRequired, 
    description,
    htmlFor 
  }: {
    label: string;
    isRequired: boolean;
    description?: string;
    htmlFor?: string;
  }) => {
    return (
      <div className="flex items-center gap-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-300">
          {label} {isRequired && '*'}
        </Label>
        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-slate-300 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  // ExtensibleListField component for handling dynamic lists
  const ExtensibleListField = ({ 
    fieldName, 
    label, 
    isRequired, 
    description,
    itemLabel, 
    itemPlaceholder, 
    minItems, 
    maxItems, 
    form, 
    commonClasses 
  }: {
    fieldName: string;
    label: string;
    isRequired: boolean;
    description?: string;
    itemLabel: string;
    itemPlaceholder: string;
    minItems: number;
    maxItems?: number;
    form: any;
    commonClasses: string;
  }) => {
    const [items, setItems] = useState<string[]>([""]);

    useEffect(() => {
      // Set form value whenever items change
      form.setValue(fieldName, items);
    }, [items, fieldName, form]);

    const addItem = () => {
      if (!maxItems || items.length < maxItems) {
        setItems([...items, ""]);
      }
    };

    const removeItem = (index: number) => {
      if (items.length > minItems) {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
      }
    };

    const updateItem = (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      setItems(newItems);
    };

    return (
      <div className="space-y-3">
        <FieldLabel 
          label={label}
          isRequired={isRequired}
          description={description}
        />
        
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={itemPlaceholder}
                className={commonClasses}
                data-testid={`input-${fieldName}-${index}`}
              />
              
              {items.length > minItems && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="flex-shrink-0 text-red-400 hover:text-red-300"
                  data-testid={`button-remove-${fieldName}-${index}`}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {(!maxItems || items.length < maxItems) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="text-slate-300 hover:text-white"
            data-testid={`button-add-${fieldName}`}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add {itemLabel}
          </Button>
        )}

        {form.formState.errors[fieldName] && (
          <p className="text-sm text-destructive">
            {form.formState.errors[fieldName]?.message?.toString()}
          </p>
        )}
      </div>
    );
  };

  // Dynamic field renderer component
  const renderFormField = (field: any) => {
    const fieldName = field.fieldLibrary.name;
    const language = selectedLanguage || 'en';

    // Use translations if available, otherwise fall back to default
    const translation = field.fieldLibrary.translations?.[language];
    const label = field.customLabel || translation?.label || field.fieldLibrary.label;
    const placeholder = field.placeholder || translation?.placeholder || field.fieldLibrary.defaultPlaceholder || '';
    const description = translation?.description || field.fieldLibrary.defaultValidation?.description;
    const isRequired = field.isRequired;
    
    const commonClasses = "bg-card border-border text-foreground focus:border-accent";
    
    switch (field.fieldLibrary.dataType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <FieldLabel 
              label={label}
              isRequired={isRequired}
              description={description}
              htmlFor={fieldName}
            />
            <Input
              id={fieldName}
              type={field.fieldLibrary.dataType === 'email' ? 'email' : field.fieldLibrary.dataType === 'phone' ? 'tel' : field.fieldLibrary.dataType === 'number' ? 'number' : 'text'}
              placeholder={placeholder}
              className={commonClasses}
              {...form.register(fieldName)}
              data-testid={`input-${fieldName}`}
            />
            {form.formState.errors[fieldName] && (
              <p className="text-sm text-destructive">
                {form.formState.errors[fieldName]?.message?.toString()}
              </p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <FieldLabel 
              label={label}
              isRequired={isRequired}
              description={description}
              htmlFor={fieldName}
            />
            <textarea
              id={fieldName}
              placeholder={placeholder}
              className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${commonClasses}`}
              {...form.register(fieldName)}
              data-testid={`textarea-${fieldName}`}
            />
            {form.formState.errors[fieldName] && (
              <p className="text-sm text-destructive">
                {form.formState.errors[fieldName]?.message?.toString()}
              </p>
            )}
          </div>
        );
      
      case 'select':
        const options = field.fieldLibrary.enumList || [];
        return (
          <div key={field.id} className="space-y-2">
            <FieldLabel 
              label={label}
              isRequired={isRequired}
              description={description}
              htmlFor={fieldName}
            />
            <Select onValueChange={(value) => form.setValue(fieldName, value)}>
              <SelectTrigger className={commonClasses}>
                <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options
                  .filter((option: string) => option && option.trim() !== '') // Remove empty values
                  .map((option: string, index: number) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.formState.errors[fieldName] && (
              <p className="text-sm text-destructive">
                {form.formState.errors[fieldName]?.message?.toString()}
              </p>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={fieldName}
                onCheckedChange={(checked: boolean) => form.setValue(fieldName, checked ? 'true' : 'false')}
                data-testid={`checkbox-${fieldName}`}
              />
              <FieldLabel 
                label={label}
                isRequired={isRequired}
                description={description}
                htmlFor={fieldName}
              />
            </div>
            {form.formState.errors[fieldName] && (
              <p className="text-sm text-destructive">
                {form.formState.errors[fieldName]?.message?.toString()}
              </p>
            )}
          </div>
        );
      
      case 'radio':
        const radioOptions = translation?.options || field.fieldLibrary.defaultValidation?.options || [];
        
        return (
          <div key={field.id} className="space-y-3">
            <FieldLabel 
              label={label}
              isRequired={isRequired}
              description={description}
            />
            <div className="space-y-2">
              {radioOptions.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${fieldName}_${index}`}
                    value={option}
                    className="text-accent-foreground focus:ring-accent"
                    {...form.register(fieldName)}
                    data-testid={`radio-${fieldName}-${index}`}
                  />
                  <Label 
                    htmlFor={`${fieldName}_${index}`} 
                    className="text-sm text-gray-300 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors[fieldName] && (
              <p className="text-sm text-destructive">
                {form.formState.errors[fieldName]?.message?.toString()}
              </p>
            )}
          </div>
        );
      
      case 'array':
        const arrayOptions = translation?.options || field.fieldLibrary.defaultValidation?.options || [];
        
        if (arrayOptions.length > 0) {
          // Multi-select checkboxes for predefined options
          return (
            <div key={field.id} className="space-y-3">
              <FieldLabel 
                label={label}
                isRequired={isRequired}
                description={description}
              />
              <div className="space-y-2">
                {arrayOptions.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldName}_${index}`}
                      checked={form.watch(fieldName)?.includes(option) || false}
                      onCheckedChange={(checked: boolean) => {
                        const currentValues = form.getValues(fieldName) || [];
                        let updatedValues;
                        if (checked) {
                          updatedValues = [...currentValues, option];
                        } else {
                          updatedValues = currentValues.filter((val: string) => val !== option);
                        }
                        form.setValue(fieldName, updatedValues);
                      }}
                      data-testid={`checkbox-${fieldName}-${index}`}
                    />
                    <Label 
                      htmlFor={`${fieldName}_${index}`} 
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors[fieldName] && (
                <p className="text-sm text-destructive">
                  {form.formState.errors[fieldName]?.message?.toString()}
                </p>
              )}
            </div>
          );
        }
        // Fall through to extensible_list for arrays without predefined options
        
      case 'extensible_list':
        const itemLabel = field.fieldLibrary.defaultValidation?.itemLabel || 'Item';
        const itemPlaceholder = field.fieldLibrary.defaultValidation?.itemPlaceholder || `Enter ${itemLabel.toLowerCase()}...`;
        const minItems = field.fieldLibrary.defaultValidation?.minItems || 1;
        const maxItems = field.fieldLibrary.defaultValidation?.maxItems;
        
        return (
          <ExtensibleListField
            key={field.id}
            fieldName={fieldName}
            label={label}
            isRequired={isRequired}
            description={description}
            itemLabel={itemLabel}
            itemPlaceholder={itemPlaceholder}
            minItems={minItems}
            maxItems={maxItems}
            form={form}
            commonClasses={commonClasses}
          />
        );
      
      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium text-gray-300">
              {label} {isRequired && '*'}
            </Label>
            <Input
              id={fieldName}
              type="text"
              placeholder={placeholder}
              className={commonClasses}
              {...form.register(fieldName)}
              data-testid={`input-${fieldName}`}
            />
            {form.formState.errors[fieldName] && (
              <p className="text-sm text-destructive">
                {form.formState.errors[fieldName]?.message?.toString()}
              </p>
            )}
          </div>
        );
    }
  };

  const onSubmit = (data: any) => {
    // Let the Zod schema validation handle field validation
    // No need for hardcoded checks since the schema handles all validation

    submitFormMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`w-[95vw] max-w-lg mx-auto bg-slate-800 border-slate-600 backdrop-blur-sm ${colorTheme?.shadow || 'shadow-lg shadow-blue-500/25'}`}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${colorTheme?.icon || 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                {getFormIcon(config.icon || 'file')}
              </div>
              {config.title || formTemplate.name}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {config.subtitle || formTemplate.description || 'Please fill out the form below to get in touch.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                data-testid="refresh-form-button"
                className="text-slate-300"
              >
                Refresh Form
              </Button>
            </div>

            {!isOnline && (
              <div
                className="bg-yellow-500 text-black p-2 rounded text-center mb-4"
                data-testid="offline-warning"
              >
                You are offline. Form submissions are disabled.
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-400">Loading form fields...</div>
              </div>
            )}

            {/* Dynamic Form Fields */}
            {!isLoading && formFields.length > 0 && (
              <TooltipProvider>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formFields
                      .sort((a, b) => parseInt(a.order) - parseInt(b.order))
                      .map(renderFormField)}
                  </div>
                </div>
              </TooltipProvider>
            )}

            {/* No Fields Message */}
            {!isLoading && formFields.length === 0 && (
              <div className="p-4 border-2 border-dashed border-yellow-500 rounded-lg">
                <p className="text-yellow-400 text-center">
                  No form fields configured. Please contact the administrator to set up this form.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitFormMutation.isPending ||
                  isLoading ||
                  formFields.length === 0 ||
                  !isOnline
                }
                className={`${colorTheme?.button || 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white font-semibold min-w-[120px] transition-all duration-300`}
              >
                {submitFormMutation.isPending ? 'Submitting...' : (config.buttonText || 'Submit')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessConfirmation 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Thank You!"
        description={config.successMessage || "We've received your submission and will be in touch soon."}
      />
    </>
  );
}

// Component for rendering pitch sites (coming soon or customizable landing pages)
function PitchSiteInterface({ site, siteId, showPresentation, setShowPresentation }: PitchSiteInterfaceProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedFormAssignment, setSelectedFormAssignment] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  const config = site.landingConfig || {};
  const heroTitle = config.heroTitle || `${site.name}`;
  // Use different default subtitle based on site type
  const defaultSubtitle = site.siteType === 'collective' 
    ? 'Coming Soon - Exciting community features in development'
    : 'Coming Soon - Exciting pitch deck presentation in development';
  const heroSubtitle = config.heroSubtitle || defaultSubtitle;
  const companyName = config.companyName || site.name;
  
  // Get site-specific gradient theme
  const siteGradient = getSiteGradient(config.brandGradient);

  // Fetch assigned forms for this site
  const { data: assignedForms = [] } = useQuery<any[]>({
    queryKey: [`/api/sites/${siteId}/form-assignments`],
    enabled: !!siteId,
    staleTime: 0, // Always consider stale to force refresh
    gcTime: 0, // Don't cache this query
    queryFn: async () => {
      // Add aggressive cache-busting to force fresh data
      const response = await fetch(`/api/sites/${siteId}/form-assignments?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Fetch site sections
  const { data: siteSections = [] } = useQuery<any[]>({
    queryKey: [`/api/sites/${siteId}/sections`],
    enabled: !!siteId,
  });

  // Group assigned forms by sections
  const groupFormsBySection = () => {
    const grouped: { [key: string]: any[] } = {
      'no-section': [] // For forms without a section
    };
    
    // Initialize groups for each section (with null check)
    if (siteSections && Array.isArray(siteSections)) {
      siteSections.forEach((section: any) => {
        grouped[section.id] = [];
      });
    }
    
    // Group forms by their sectionId (with null check)
    if (assignedForms && Array.isArray(assignedForms)) {
      assignedForms.forEach((form: any) => {
        const sectionId = form.sectionId || 'no-section';
        if (!grouped[sectionId]) {
          grouped[sectionId] = [];
        }
        grouped[sectionId].push(form);
      });
    }
    
    // Sort forms within each section by display order
    Object.keys(grouped).forEach(sectionId => {
      grouped[sectionId].sort((a, b) => parseInt(a.displayOrder || '0') - parseInt(b.displayOrder || '0'));
    });
    
    return grouped;
  };

  const groupedForms = groupFormsBySection();

  // Join collective mutation
  const joinCollectiveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sites/${siteId}/join`, {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: data.message || "You have successfully joined the collective!",
        duration: 5000,
      });
      
      // Redirect to collective home after successful join or if already a member
      setTimeout(() => {
        setLocation(`/site/${siteId}/home`);
      }, 1500);
    },
    onError: (error: any) => {
      // Check if error is "already a member" - if so, still redirect to home
      if (error.message && error.message.includes("already a member")) {
        toast({
          title: "Welcome back!",
          description: "You're already a member of this collective.",
          duration: 3000,
        });
        setTimeout(() => {
          setLocation(`/site/${siteId}/home`);
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to join collective. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleJoinCollective = (cardTemplate: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join this collective.",
        variant: "destructive",
      });
      // Redirect to login
      window.location.href = '/api/login';
      return;
    }

    // Check if it's actually a collective site
    if (site?.siteType !== 'collective') {
      toast({
        title: "Invalid Action",
        description: "This feature is only available for collective sites.",
        variant: "destructive",
      });
      return;
    }

    joinCollectiveMutation.mutate();
  };

  const handleCardClick = (cardAssignment: any) => {
    const cardTemplate = cardAssignment.formTemplate;
    const cardType = cardTemplate.cardType || 'form';
    
    if (cardType === 'hyperlink') {
      // Handle hyperlink cards
      const url = cardTemplate.config?.url || cardAssignment.overrideConfig?.url;
      const openInNewTab = cardTemplate.config?.openInNewTab ?? cardAssignment.overrideConfig?.openInNewTab ?? true;
      
      if (url) {
        if (openInNewTab) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = url;
        }
      }
    } else if (cardType === 'youtube') {
      // YouTube cards don't need click handling - they display video directly
      return;
    } else if (cardType === 'document') {
      // Handle document cards
      const documentUrl = cardTemplate.config?.documentUrl || cardAssignment.overrideConfig?.documentUrl;
      if (documentUrl) {
        // Open document in new tab for download
        window.open(documentUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (cardType === 'join-card') {
      // Handle join collective cards
      handleJoinCollective(cardTemplate);
    } else {
      // Handle form cards (default behavior)
      setSelectedFormAssignment(cardAssignment);
      setIsFormModalOpen(true);
    }
  };


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
      case 'indigo': return {
        icon: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        button: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
        shadow: 'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
      };
      case 'pink': return {
        icon: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        button: 'bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800',
        shadow: 'shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40'
      };
      case 'pitchme': return {
        icon: 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/30',
        button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        shadow: 'shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
      };
      default: return {
        icon: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        button: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        shadow: 'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${siteGradient.overlay}`} />
        
        {/* Site ID Badge */}
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-slate-300 border border-slate-600">
            Site: {site.siteId}
          </div>
        </div>

        <div className="relative container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo or fallback icon */}
            {(config.logoUrl || site.logoUrl) ? (
              <div className="max-w-32 max-h-20 mx-auto mb-8 flex items-center justify-center">
                <img 
                  src={config.logoUrl || site.logoUrl || ''} 
                  alt={`${companyName} logo`}
                  className="max-w-full max-h-full object-contain rounded-lg border-2 border-white/20 bg-white/5 backdrop-blur-sm p-2"
                />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-lg mx-auto mb-8 flex items-center justify-center border-2 ${siteGradient.icon}`}>
                <Rocket className="w-10 h-10 text-white" />
              </div>
            )}
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {heroTitle}
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              {heroSubtitle}
            </p>
            
            {/* Only show presentation button for non-collective sites */}
            {site.siteType !== 'collective' && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <Button 
                  size="lg"
                  className={`${siteGradient.bg} ${siteGradient.hover} text-white px-8 py-3 font-semibold transition-all duration-300 ${siteGradient.shadow}`}
                  onClick={() => setShowPresentation(true)}
                  data-testid="button-hero-presentation"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  View Presentation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel Button for Unlaunched Sites */}
      {!site.isLaunched && (
        <div className="container mx-auto px-6 pt-8 pb-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-600 mb-4">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Site in Development</span>
            </div>
            <div>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white px-6"
                onClick={() => setLocation(`/site/${siteId}/admin`)}
                data-testid="button-admin-access-dev"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Defined Sections - Stacked vertically */}
      {siteSections && siteSections.map((section: any) => {
        const sectionForms = groupedForms[section.id] || [];
        if (sectionForms.length === 0) return null;
        
        return (
          <div key={section.id} className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto">
              {/* Section Cards - No header, just cards */}
              <div className={`grid gap-6 ${
                sectionForms.length === 1 
                  ? "justify-items-center" 
                  : sectionForms.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-2 lg:grid-cols-3"
              }`}>
                        {sectionForms.map((cardAssignment: any) => {
                          const cardTemplate = cardAssignment.formTemplate;
                          const config = cardTemplate.config || {};
                          const cardType = cardTemplate.cardType || 'form';
                          // Use override color first, then template color, then default to blue
                          const effectiveColor = cardAssignment.overrideConfig?.color || config.color || 'blue';
                          const colorTheme = getFormColor(effectiveColor);

                          // Get button text - for hyperlinks, default is "Visit" instead of "Get Started"
                          const defaultButtonText = cardType === 'hyperlink' ? 'Visit' : 'Get Started';
                          const buttonText = cardAssignment.overrideConfig?.buttonText || config.buttonText || defaultButtonText;

                          // Content overrides
                          const effectiveTitle = cardAssignment.overrideConfig?.title || config.title || cardTemplate.name;
                          const effectiveSubtitle = cardAssignment.overrideConfig?.subtitle ?? config.subtitle;
                          const effectiveDescription = cardAssignment.overrideConfig?.description || config.description || cardTemplate.description || (cardType === 'hyperlink' ? 'Click to visit the link' : 'Click to learn more and get in touch');

                          // Render video cards (YouTube and Vimeo) differently from standard cards
                          if (cardType === 'youtube' || cardType === 'vimeo') {
                            return (
                              <div
                                key={cardAssignment.id}
                                className="w-full max-w-md mx-auto"
                                data-testid={`card-${cardType}-${cardTemplate.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <VideoCard
                                  template={cardTemplate}
                                  className="transition-all duration-300 hover:scale-105"
                                />
                              </div>
                            );
                          }

                          // Standard cards for forms and hyperlinks
                          return (
                            <Card
                              key={cardAssignment.id}
                              className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-600 backdrop-blur-sm hover:border-slate-500 transition-all duration-300 cursor-pointer transform hover:scale-105 flex flex-col h-full ${colorTheme.shadow}`}
                              onClick={() => handleCardClick(cardAssignment)}
                              data-testid={`card-${cardType}-${cardTemplate.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <CardHeader className="text-center pb-4 flex-grow">
                                {/* Logo for hyperlink cards or icon for form cards */}
                                {cardType === 'hyperlink' && config.logo ? (
                                  <div className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-slate-600 bg-white p-2">
                                    <img
                                      src={config.logo}
                                      alt={`${effectiveTitle} logo`}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className={`w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 ${colorTheme.icon}`}>
                                    {getFormIcon(config.icon || 'file')}
                                  </div>
                                )}
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
                                    handleCardClick(cardAssignment);
                                  }}
                                >
                                  {buttonText}
                                  {cardType === 'hyperlink' ?
                                    <ExternalLink className="w-4 h-4 ml-2" /> :
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  }
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Forms Section - For cards without sections */}
      {groupedForms['no-section'] && groupedForms['no-section'].length > 0 && (
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Forms Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                {site?.landingConfig?.formsTitle || "Get Connected"}
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                {site?.landingConfig?.formsDescription || (site.siteType === 'collective' 
                  ? "Explore our opportunities and connect with us through the cards below."
                  : "Explore our opportunities and connect with us through the forms below.")}
              </p>
            </div>
            
            <div className={`grid gap-6 ${
              groupedForms['no-section'].length === 1 
                ? "justify-items-center" 
                : groupedForms['no-section'].length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-2 lg:grid-cols-3"
            }`}>
                      {groupedForms['no-section'].map((cardAssignment: any) => {
                        const cardTemplate = cardAssignment.formTemplate;
                        const config = cardTemplate.config || {};
                        const cardType = cardTemplate.cardType || 'form';
                        const effectiveColor = cardAssignment.overrideConfig?.color || config.color || 'blue';
                        const colorTheme = getFormColor(effectiveColor);
                        const defaultButtonText = cardType === 'hyperlink' ? 'Visit' : 'Get Started';
                        const buttonText = cardAssignment.overrideConfig?.buttonText || config.buttonText || defaultButtonText;
                        const effectiveTitle = cardAssignment.overrideConfig?.title || config.title || cardTemplate.name;
                        const effectiveSubtitle = cardAssignment.overrideConfig?.subtitle ?? config.subtitle;
                        const effectiveDescription = cardAssignment.overrideConfig?.description || config.description || cardTemplate.description || (cardType === 'hyperlink' ? 'Click to visit the link' : 'Click to learn more and get in touch');
                        
                        if (cardType === 'youtube') {
                          return (
                            <div 
                              key={cardAssignment.id}
                              className="w-full max-w-md mx-auto"
                              data-testid={`card-${cardType}-${cardTemplate.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <YouTubeCard 
                                template={cardTemplate}
                                className="transition-all duration-300 hover:scale-105"
                              />
                            </div>
                          );
                        }
                        
                        return (
                          <Card 
                            key={cardAssignment.id}
                            className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-600 backdrop-blur-sm hover:border-slate-500 transition-all duration-300 cursor-pointer transform hover:scale-105 flex flex-col h-full ${colorTheme.shadow}`}
                            onClick={() => handleCardClick(cardAssignment)}
                            data-testid={`card-${cardType}-${cardTemplate.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <CardHeader className="text-center pb-4 flex-grow">
                                {cardType === 'hyperlink' && config.logo ? (
                                  <div className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-slate-600 bg-white p-2">
                                    <img
                                      src={config.logo}
                                      alt={`${effectiveTitle} logo`}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className={`w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 ${colorTheme.icon}`}>
                                    {getFormIcon(config.icon || 'file')}
                                  </div>
                                )}
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
                                  handleCardClick(cardAssignment);
                                }}
                              >
                                {buttonText}
                                {cardType === 'hyperlink' ? 
                                  <ExternalLink className="w-4 h-4 ml-2" /> : 
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                }
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
            </div>
          </div>
        </div>
      )}


      {/* Fallback content when no forms are assigned */}
      {(!assignedForms || assignedForms.length === 0) && (
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-600 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl text-white mb-4">
                  Coming Soon
                </CardTitle>
                <CardDescription className="text-lg text-slate-300 max-w-2xl mx-auto">
                  This {site.siteType === 'collective' ? 'collective' : 'pitch site'} is currently being configured. 
                  Site administrators can set up {site.siteType === 'collective' ? 'cards' : 'forms'} and content through the management panel.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Add {site.siteType === 'collective' ? 'cards' : 'forms'} to this site through the Site Settings to see them appear here as action cards.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Site Footer */}
      <SiteFooter 
        siteId={siteId || ''} 
        companyName={companyName} 
      />

      {/* Dynamic Form Modal */}
      {selectedFormAssignment && (
        <DynamicFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedFormAssignment(null);
          }}
          formTemplate={selectedFormAssignment.formTemplate}
          siteId={siteId || ''}
          colorTheme={getFormColor(selectedFormAssignment.overrideConfig?.color || selectedFormAssignment.formTemplate.config?.color || 'blue')}
          selectedLanguage={selectedFormAssignment.selectedLanguage || siteLanguage}
        />
      )}

      {/* Full-screen Presentation Viewer for Pitch Site */}
      {showPresentation && siteId && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresentation(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Close Presentation
            </Button>
          </div>
          <PresentationViewer 
            siteId={siteId}
            siteType={site.siteType || 'pitch-site'}
            onOpenLearnMore={() => {
              setShowPresentation(false);
              // Could open a learn more modal here if needed
            }}
          />
        </div>
      )}
    </div>
  );
}

export function DynamicSite() {
  const { siteId } = useParams<DynamicSiteParams>();
  const { user } = useAuth();
  
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [miningPoolOpen, setMiningPoolOpen] = useState(false);
  const [lendingPoolOpen, setLendingPoolOpen] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  const { consent, ConsentModal } = useAnalyticsConsent();

  const { data: site, isLoading, error } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
    enabled: !!siteId,
  });

  const siteLanguage = site?.landingConfig?.language || 'en';

  // Query to check if user is a site manager for this site
  const { data: siteManagers = [], isLoading: managersLoading } = useQuery<any[]>({
    queryKey: [`/api/sites/${siteId}/managers`],
    enabled: !!siteId && !!user, // Always query when we have siteId and user
  });

  // Check if user already has access to this site
  useEffect(() => {
    if (site && siteId) {
      if (!site.password) {
        // Public site, grant access immediately
        setIsAuthenticated(true);
      } else {
        // Check if user already has access stored
        const hasAccess = sessionStorage.getItem(`site_access_${siteId}`) === 'granted';
        setIsAuthenticated(hasAccess);
      }
    }
  }, [site, siteId]);

  // Track page view analytics
  useEffect(() => {
    if (site && isAuthenticated) {
      const doNotTrack = navigator.doNotTrack === '1';
      if (ANALYTICS_PROVIDER === 'internal' && consent?.status === 'granted' && !doNotTrack) {
        apiRequest('POST', `/api/sites/${siteId}/analytics`, {
          eventType: 'page_view',
          eventData: { path: window.location.pathname },
          consent,
        }).catch((err) => {
          console.error('Analytics tracking failed', err);
        });
      }
    }
  }, [site, isAuthenticated, siteId, consent]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingPassword(true);
    setPasswordError('');

    // Check if password matches site password
    if (password === site?.password) {
      // Store access in sessionStorage
      if (siteId) {
        sessionStorage.setItem(`site_access_${siteId}`, 'granted');
      }
      setIsAuthenticated(true);
    } else {
      setPasswordError('Incorrect password');
    }
    setIsCheckingPassword(false);
  };

  if (isLoading) {
    return (
      <>
        <ConsentModal />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !site) {
    return (
      <>
        <ConsentModal />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Site not found</div>
        </div>
      </>
    );
  }

  // Show password form if site is protected and user is not authenticated
  if (site.password && !isAuthenticated) {
    return (
      <>
        <ConsentModal />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto p-6">
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-600">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Lock className="text-yellow-400 w-8 h-8" />
                </div>
                <CardTitle className="text-2xl text-white">Password Required</CardTitle>
              <CardDescription className="text-slate-400">
                This site is password protected. Please enter the password to access {site.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="site-password" className="text-white">Password</Label>
                  <Input
                    id="site-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter site password"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    data-testid="input-site-password"
                  />
                  {passwordError && (
                    <p className="text-red-400 text-sm mt-2 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      {passwordError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isCheckingPassword}
                  data-testid="button-submit-password"
                >
                  {isCheckingPassword ? 'Checking...' : 'Access Site'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </>
    );
  }

  // Check if site is launched and user has access
  // Treat only explicit true as launched; otherwise show Coming Soon (unless admin/manager)
  if (site.isLaunched !== true) {
    // Wait for authentication and manager data to load before making access decision
    if (!user || managersLoading) {
      return (
        <>
          <ConsentModal />
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </>
      );
    }
    
    // Check if user is admin or site manager
    const isAdmin = user?.isAdmin === true;
    const isSiteManager = siteManagers.some(manager => manager.userEmail === user?.email);
    
    // If user is not admin AND not site manager, show coming soon
    if (!isAdmin && !isSiteManager) {
      return (
        <>
          <ConsentModal />
          <ComingSoon />
        </>
      );
    }
  }

  // Check site type and render appropriate interface
  if (site.siteType === 'pitch-site') {
    // Render pitch site interface
    return (
      <>
        <ConsentModal />
        <PitchSiteInterface site={site} siteId={siteId} showPresentation={showPresentation} setShowPresentation={setShowPresentation} />
      </>
    );
  }

  // Render mining syndicate site content
  const config = site.landingConfig || {};
  const heroTitle = config.heroTitle || "Welcome to the Future of Decentralized Mining";
  const heroSubtitle = config.heroSubtitle || "Join the Mutualized Economy revolution with two distinct participation pathways";
  const companyName = config.companyName || "Mining Syndicate";

  return (
    <>
      <ConsentModal />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* For collective sites, use dynamic section/card rendering; for others, show hardcoded hero and participation pathways */}
      {site?.siteType === 'collective' ? (
        // For collective sites, show ONLY the PitchSiteInterface (which includes its own hero)
        <PitchSiteInterface
          siteId={siteId || ''}
          site={site} 
          showPresentation={showPresentation} 
          setShowPresentation={setShowPresentation}
        />
      ) : (
        <>
          {/* Hero Section for non-collective sites */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            
            {/* Conduit Logo - Top Left */}
            <div className="absolute top-6 left-6 z-10">
              <a href="https://cndt.io" target="_blank" rel="noopener noreferrer">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                  <img 
                    src="https://cndt.io/nav2/logo-full.svg" 
                    alt="Conduit Network Logo" 
                    className="h-6 w-auto"
                  />
                </div>
              </a>
            </div>

            {/* Site ID Badge */}
            <div className="absolute top-6 right-6 z-10">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-slate-300 border border-slate-600">
                Site: {site.siteId}
              </div>
            </div>

            <div className="relative container mx-auto px-6 pt-32 pb-20">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {heroTitle}
                </h1>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                  {heroSubtitle}
                </p>
                <div className="pt-8">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                    onClick={() => setShowPresentation(true)}
                    data-testid="button-view-presentation"
                  >
                    View Full Presentation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Participation Pathways for non-collective sites */}
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Participation Pathways</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose your path to participate in the {companyName} ecosystem
            </p>
          </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Learn More Panel */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full min-h-[500px]">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <BookOpen className="text-blue-400 text-3xl" />
              </div>
              <CardTitle className="text-2xl text-white">Learn More</CardTitle>
              <CardDescription className="text-slate-400">
                Get detailed information about the Mining Syndicate opportunity and how you can participate.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4 flex-1 flex flex-col">
              <ul className="space-y-2 text-slate-300 flex-1">
                <li>• Comprehensive opportunity overview</li>
                <li>• Investment pathway details</li>
                <li>• Risk and reward analysis</li>
                <li>• Partnership opportunities</li>
              </ul>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                onClick={() => setLearnMoreOpen(true)}
                data-testid="button-learn-more"
              >
                Get Information
                <BookOpen className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full min-h-[500px]">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <Pickaxe className="text-purple-400 text-3xl" />
              </div>
              <CardTitle className="text-2xl text-white">Contributing Nodes</CardTitle>
              <CardDescription className="text-slate-400">
                Secure founding units to participate in Managed Node Deployment and earn from the Mutualized Economy.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4 flex-1 flex flex-col">
              <ul className="space-y-2 text-slate-300 flex-1">
                <li>• Exclusive access to founding units</li>
                <li>• Hyper-incentive packages</li>
                <li>• All mining is pooled</li>
                <li>• Nodes are strategically deployed</li>
                <li>• Limited slots available</li>
              </ul>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-auto"
                onClick={() => setMiningPoolOpen(true)}
                data-testid="button-mining-pool"
              >
                Reserve Your Spot
                <Pickaxe className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full min-h-[500px]">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <Coins className="text-green-400 text-3xl" />
              </div>
              <CardTitle className="text-2xl text-white">Lending Capital</CardTitle>
              <CardDescription className="text-slate-400">
                Lend capital to unlock the next wave of token mining and infrastructure rewards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <ul className="space-y-2 text-slate-300 flex-1">
                <li>• Greater than 300% targeted ROI</li>
                <li>• Earn CNDT, Squares and Points</li>
                <li>• Jumpstart the Mutualized Economy</li>
                <li>• First come, first-served</li>
              </ul>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-auto"
                onClick={() => setLendingPoolOpen(true)}
                data-testid="button-lending-pool"
              >
                Join Lending Pool
                <DollarSign className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
          {/* Modals for non-collective sites */}
          <LearnMoreModal 
            isOpen={learnMoreOpen} 
            onClose={() => setLearnMoreOpen(false)}
          />
          <MiningPoolModal 
            isOpen={miningPoolOpen} 
            onClose={() => setMiningPoolOpen(false)}
            onLendingPoolOpen={() => {
              setMiningPoolOpen(false);
              setLendingPoolOpen(true);
            }}
          />
          <LendingPoolModal 
            isOpen={lendingPoolOpen} 
            onClose={() => setLendingPoolOpen(false)}
          />

          {/* Full-screen Presentation Viewer for non-collective sites */}
          {showPresentation && siteId && (
            <div className="fixed inset-0 bg-black z-50">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresentation(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Close Presentation
                </Button>
              </div>
              <PresentationViewer 
                siteId={siteId}
                siteType={site.siteType || 'pitch-site'}
                onOpenLearnMore={() => {
                  setShowPresentation(false);
                  setLearnMoreOpen(true);
                }}
              />
            </div>
          )}

          {/* Site Footer for non-collective sites */}
          <SiteFooter 
            siteId={siteId || ''} 
            companyName={site?.landingConfig?.companyName || "Mining Syndicate"} 
          />
        </>
      )}
      </div>
    </>
  );
}
