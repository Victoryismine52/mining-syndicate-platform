import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlugValidationResult {
  available: boolean;
  slug: string;
  message: string;
}

interface SlugInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  originalSlug?: string; // For edit mode, to avoid checking against current slug
  'data-testid'?: string;
}

export function SlugInput({
  label,
  name,
  value = '',
  onChange,
  className,
  placeholder,
  required,
  disabled,
  originalSlug,
  'data-testid': dataTestId,
}: SlugInputProps) {
  const [validationResult, setValidationResult] = useState<SlugValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Debounced validation
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setValidationResult(null);
      setHasChecked(false);
      return;
    }

    // Don't check if it's the same as the original slug (for edit mode)
    if (originalSlug && slug === originalSlug) {
      setValidationResult({ available: true, slug, message: "Current site URL" });
      setHasChecked(true);
      return;
    }

    setIsValidating(true);
    
    try {
      const response = await fetch(`/api/sites/check-slug/${encodeURIComponent(slug)}`);
      const result: SlugValidationResult = await response.json();
      setValidationResult(result);
      setHasChecked(true);
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setValidationResult(null);
      setHasChecked(false);
    } finally {
      setIsValidating(false);
    }
  }, [originalSlug]);

  // Debounce the slug checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value && value.trim()) {
        checkSlugAvailability(value.trim());
      } else {
        setValidationResult(null);
        setHasChecked(false);
      }
    }, 800); // 800ms delay after user stops typing

    return () => clearTimeout(timeoutId);
  }, [value, checkSlugAvailability]);

  // Format slug as user types (lowercase, convert spaces to hyphens, etc.)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-') // Convert spaces to hyphens
      .replace(/[^a-z0-9-]/g, '') // Only allow lowercase letters, numbers, hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+/g, ''); // Only remove leading hyphens (not trailing while typing)

    onChange(newValue);
    
    // Reset validation state when user types
    if (newValue !== value) {
      setValidationResult(null);
      setHasChecked(false);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
    }
    
    if (!hasChecked || !validationResult) {
      return null;
    }

    if (validationResult.available) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getValidationMessage = () => {
    if (isValidating) {
      return "Checking availability...";
    }
    
    if (!hasChecked || !validationResult) {
      return null;
    }

    return validationResult.message;
  };

  const getMessageColor = () => {
    if (isValidating) {
      return "text-blue-400";
    }
    
    if (!validationResult) {
      return "";
    }

    return validationResult.available ? "text-green-400" : "text-red-400";
  };

  return (
    <div>
      <Label htmlFor={name} className="text-slate-300">{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "bg-slate-700/50 border-slate-600 focus:border-blue-500 pr-10",
            validationResult && !validationResult.available && "border-red-500 focus:border-red-500",
            validationResult && validationResult.available && "border-green-500 focus:border-green-500",
            className
          )}
          required={required}
          disabled={disabled}
          data-testid={dataTestId}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      
      {/* Validation message */}
      <div className="min-h-[1.25rem] mt-1">
        {getValidationMessage() && (
          <p className={cn("text-xs flex items-center gap-1", getMessageColor())}>
            {getValidationMessage()}
          </p>
        )}
        
        {/* URL preview */}
        {value && (
          <p className="text-xs text-slate-500">
            URL: /sites/{value}
          </p>
        )}
      </div>
    </div>
  );
}