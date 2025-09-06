import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children?: ReactNode;
  disabled?: boolean;
}

/**
 * A simple file upload component that allows users to select and upload images.
 * Uses direct browser upload to signed URLs for efficiency.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (files.length > maxNumberOfFiles) {
      alert(`Please select no more than ${maxNumberOfFiles} files`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not an image. Please select image files only (PNG, JPG, GIF, etc.)`);
        return;
      }
    }

    try {
      setUploading(true);

      const successful = [];
      const failed = [];

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          
          // Get upload parameters for this file
          const { method, url } = await onGetUploadParameters();

          // Upload file directly to signed URL
          const uploadResponse = await fetch(url, {
            method,
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
          }

          // Extract the object path from the upload URL
          const uploadUrl = url.split('?')[0]; // Remove query parameters
          
          successful.push({
            name: file.name,
            uploadURL: uploadUrl,
            size: file.size,
            type: file.type
          });
        } catch (error) {
          console.error('Upload error for', file.name, ':', error);
          failed.push({
            name: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Call onComplete with results
      if (files.length === 1 && successful.length === 1) {
        // Single file upload - return just the URL for backward compatibility
        onComplete?.(successful[0].uploadURL);
      } else {
        // Multiple files - return full result object
        onComplete?.({ successful, failed });
      }

      if (failed.length > 0) {
        alert(`${failed.length} file(s) failed to upload: ${failed.map(f => f.name).join(', ')}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxNumberOfFiles > 1}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />
      <Button 
        type="button"
        disabled={disabled || uploading}
        className={buttonClassName}
        data-testid="button-upload-slide"
        onClick={handleButtonClick}
      >
        {uploading ? (
          <>Uploading...</>
        ) : (
          children || (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </>
          )
        )}
      </Button>
    </div>
  );
}