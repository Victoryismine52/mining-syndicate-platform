import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, publicApiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ExternalLink, Mail, Users, Phone, FileText, Info, DollarSign, Pickaxe, Star, Heart, Shield, Plus, Minus, HelpCircle } from 'lucide-react';
import { SuccessConfirmation } from '@/components/success-confirmation';

interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTemplate: any;
  siteId: string;
  colorTheme?: any;
  selectedLanguage?: string;
}

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

export function SimpleFormModal({ isOpen, onClose, formTemplate, siteId, colorTheme, selectedLanguage = 'en' }: DynamicFormModalProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const config = formTemplate.config || {};

  // Fetch the actual form template fields
  const formFieldsUrl = `/api/form-templates/${formTemplate.id}/fields`;
  const {
    data: formFields = [],
    isLoading,
    isError,
    error,
  } = useQuery<any[]>({
    queryKey: [formFieldsUrl],
    enabled: !!formTemplate.id && isOpen,
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
    queryFn: () => publicApiRequest('GET', formFieldsUrl).then((res) => res.json()),
  });

  // Create dynamic form schema based on actual fields - memoized to prevent recreations
  const dynamicSchema = useMemo(() => {
    if (!formFields || formFields.length === 0) {
      return z.object({});
    }

    let schemaFields: any = {};
    
    formFields.forEach((field) => {
      try {
        const fieldName = field.fieldLibrary?.name;
        if (!fieldName) return;

        let fieldSchema: any;
        
        // Handle extensible_list fields
        if (field.fieldLibrary.dataType === 'extensible_list') {
          if (field.isRequired) {
            fieldSchema = z.array(z.string()).min(1, "At least one item is required");
          } else {
            fieldSchema = z.array(z.string()).optional();
          }
        }
        // Handle radio fields with special validation
        else if (field.fieldLibrary.dataType === 'radio') {
          const options = field.fieldLibrary.defaultValidation?.options || [];
          if (options.length > 0) {
            if (field.isRequired) {
              fieldSchema = z.string()
                .min(1, "Please select an option")
                .refine(
                  (value) => options.includes(value),
                  { message: "Please select one of the available options" }
                );
            } else {
              fieldSchema = z.string()
                .optional()
                .refine(
                  (value) => !value || value === "" || options.includes(value),
                  { message: "Please select one of the available options" }
                );
            }
          } else {
            fieldSchema = field.isRequired ? z.string().min(1, "This field is required") : z.string().optional();
          }
        } else {
          // Handle standard string fields
          fieldSchema = z.string();
          
          // Apply validation based on field type
          if (field.fieldLibrary.dataType === 'email') {
            fieldSchema = z.string().email("Please enter a valid email address");
          } else if (field.fieldLibrary.dataType === 'phone') {
            fieldSchema = z.string().regex(/^[\+]?[1-9][\d]{0,14}$/, "Please enter a valid phone number");
          } else if (field.fieldLibrary.dataType === 'number') {
            fieldSchema = z.string().regex(/^\d+$/, "Please enter a valid number");
          }

          // Apply required validation
          if (field.isRequired) {
            fieldSchema = fieldSchema.min(1, "This field is required");
          } else {
            fieldSchema = fieldSchema.optional();
          }
        }

        schemaFields[fieldName] = fieldSchema;
      } catch (error) {
        console.error('Error creating schema for field:', field, error);
      }
    });

    return z.object(schemaFields);
  }, [formFields]);

  // Create default values based on form fields - memoized
  const defaultValues = useMemo(() => {
    if (!formFields || formFields.length === 0) {
      return {};
    }

    let values: any = {};
    
    formFields.forEach((field) => {
      try {
        const fieldName = field.fieldLibrary?.name;
        if (!fieldName) return;

        if (field.fieldLibrary.dataType === 'checkbox') {
          values[fieldName] = 'false';
        } else if (field.fieldLibrary.dataType === 'extensible_list') {
          values[fieldName] = [''];
        } else {
          values[fieldName] = '';
        }
      } catch (error) {
        console.error('Error creating default value for field:', field, error);
      }
    });

    return values;
  }, [formFields]);

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
  });

  // Reset form when formFields change
  useEffect(() => {
    if (formFields.length > 0 && defaultValues) {
      form.reset(defaultValues);
    }
  }, [formFields, defaultValues, form]);

  // Submit mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/sites/${siteId}/leads`, {
        formTemplateId: formTemplate.id,
        formData: data
      });
    },
    onSuccess: () => {
      setShowSuccess(true);
      form.reset();
      onClose(); // Close the main modal when success modal opens
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Field label component with tooltip support
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
          {label} {isRequired && <span className="text-red-400">*</span>}
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

  // Extensible List Field Component
  const ExtensibleListFieldComponent = ({
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
    if (!field || !field.fieldLibrary) {
      console.error('Invalid field data:', field);
      return null;
    }

    const fieldName = field.fieldLibrary.name;
    if (!fieldName) {
      console.error('Field missing name:', field);
      return null;
    }
    
    const language = selectedLanguage || 'en';

    // Use translations if available, otherwise fall back to default
    const translation = field.fieldLibrary.translations?.[language];
    const label = field.customLabel || translation?.label || field.fieldLibrary.label || fieldName;
    const placeholder = field.placeholder || translation?.placeholder || field.fieldLibrary.defaultPlaceholder || '';
    const description = translation?.description || field.fieldLibrary.defaultValidation?.description;
    const isRequired = field.isRequired || false;
    
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
        const options = field.fieldLibrary.defaultValidation?.options || [];
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
                {options.map((option: string, index: number) => (
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
          <ExtensibleListFieldComponent
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
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-400">Loading form fields...</div>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="p-4 border-2 border-dashed border-red-500 rounded-lg">
                <p className="text-red-400 text-center font-medium">
                  Failed to load form fields
                </p>
                <p className="text-red-300 text-center text-sm mt-2">
                  {error instanceof Error ? error.message : 'Please try closing and reopening the form.'}
                </p>
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            )}

            {/* Dynamic Form Fields */}
            {!isLoading && !isError && formFields.length > 0 && (
              <TooltipProvider>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {formFields
                      .sort((a, b) => {
                        const orderA = parseInt(a.order) || 0;
                        const orderB = parseInt(b.order) || 0;
                        return orderA - orderB;
                      })
                      .map((field) => {
                        try {
                          return renderFormField(field);
                        } catch (error) {
                          console.error('Error rendering field:', field, error);
                          return (
                            <div key={field.id} className="p-2 border border-red-500 rounded text-red-400">
                              Error rendering field: {field.fieldLibrary?.name || 'Unknown'}
                            </div>
                          );
                        }
                      })}
                  </div>
                </div>
              </TooltipProvider>
            )}

            {/* No Fields Message */}
            {!isLoading && !isError && formFields.length === 0 && (
              <div className="p-4 border-2 border-dashed border-yellow-500 rounded-lg">
                <p className="text-yellow-400 text-center">
                  No form fields configured. Please contact the administrator to set up this form.
                </p>
              </div>
            )}

            {/* Form Actions */}
            {!isError && (
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
                  disabled={submitFormMutation.isPending || isLoading || formFields.length === 0}
                  className={`${colorTheme?.button || 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white font-semibold min-w-[120px] transition-all duration-300`}
                >
                  {submitFormMutation.isPending ? 'Submitting...' : (config.buttonText || 'Submit')}
                </Button>
              </div>
            )}

            {/* Error State Actions */}
            {isError && (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Close
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <SuccessConfirmation 
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
        }}
        title="Thank You!"
        description={config.successMessage || "We've received your submission and will be in touch soon."}
      />
    </>
  );
}