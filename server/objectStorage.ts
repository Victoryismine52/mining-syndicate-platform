import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { basename } from "path";
import { MemoryStorage } from "./memoryStorage";

// Check if we're in a published deployment (production)
// Only use REPLIT_DEPLOYMENT as the definitive indicator
const isPublishedDeployment = !!(
  process.env.REPLIT_DEPLOYMENT || 
  process.env.REPL_DEPLOYMENT
);

// Use environment-appropriate endpoint
const REPLIT_SIDECAR_ENDPOINT = isPublishedDeployment 
  ? "https://util.replit.com" 
  : "http://127.0.0.1:1106";

// Check if we're running on Replit with object storage enabled
// In deployment, we might only have one of these set
const HAS_OBJECT_STORAGE = !!(process.env.PRIVATE_OBJECT_DIR || process.env.PUBLIC_OBJECT_SEARCH_PATHS);

console.log('Object Storage Configuration:', {
  isPublishedDeployment,
  hasPrivateDir: !!process.env.PRIVATE_OBJECT_DIR,
  hasPublicPaths: !!process.env.PUBLIC_OBJECT_SEARCH_PATHS,
  hasObjectStorage: HAS_OBJECT_STORAGE,
  endpoint: REPLIT_SIDECAR_ENDPOINT
});

// The object storage client is used to interact with the object storage service.
export const objectStorageClient: any = HAS_OBJECT_STORAGE
  ? new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    })
  : new MemoryStorage();

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * Sanitizes a file name to prevent path traversal attacks and ensure safe storage
 * @param fileName - The original file name to sanitize
 * @returns A safe file name containing only allowed characters
 */
function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid file name provided');
  }

  // Extract just the basename to prevent directory traversal
  let safeName = basename(fileName);
  
  // Remove any remaining path separators and null bytes
  safeName = safeName.replace(/[\/\\:*?"<>|]/g, '');
  safeName = safeName.replace(/\0/g, '');
  
  // Allow only alphanumeric characters, dots, hyphens, underscores, and spaces
  safeName = safeName.replace(/[^a-zA-Z0-9.\-_\s]/g, '');
  
  // Remove multiple consecutive dots to prevent .. attacks
  safeName = safeName.replace(/\.{2,}/g, '.');
  
  // Trim whitespace and dots from start/end
  safeName = safeName.trim().replace(/^\.+|\.+$/g, '');
  
  // Ensure the filename is not empty and not too long
  if (!safeName || safeName.length === 0) {
    throw new Error('File name resulted in empty string after sanitization');
  }
  
  if (safeName.length > 255) {
    // Truncate while preserving extension if possible
    const lastDot = safeName.lastIndexOf('.');
    if (lastDot > 0) {
      const extension = safeName.substring(lastDot);
      const nameWithoutExt = safeName.substring(0, lastDot);
      safeName = nameWithoutExt.substring(0, 255 - extension.length) + extension;
    } else {
      safeName = safeName.substring(0, 255);
    }
  }
  
  return safeName;
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Get the single public directory - simplified without fallbacks
  private getPublicDirectory(): string {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = pathsStr
      .split(",")
      .map((path) => path.trim())
      .filter((path) => path.length > 0);
    
    if (paths.length === 0) {
      throw new Error("Object storage not configured. PUBLIC_OBJECT_SEARCH_PATHS environment variable required.");
    }
    
    return paths[0]; // Use first public directory
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();

      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for a slide image - simplified
  async getSlideUploadURL(fileExtension?: string): Promise<string> {
    const slideId = randomUUID();
    const publicDir = this.getPublicDirectory();
    const extension = fileExtension || '.jpg'; // Default to .jpg but allow override
    const fullPath = `${publicDir}/slides/${slideId}${extension}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Gets the upload URL for a document - with security sanitization  
  async getDocumentUploadURL(fileName?: string, fileExtension?: string): Promise<string> {
    const documentId = randomUUID();
    const publicDir = this.getPublicDirectory();
    
    // Use provided fileName with proper sanitization or generate a secure one
    let objectPath;
    if (fileName) {
      try {
        // Sanitize the fileName to prevent path traversal attacks
        const sanitizedFileName = sanitizeFileName(fileName);
        objectPath = `${publicDir}/documents/${sanitizedFileName}`;
      } catch (error) {
        // If sanitization fails, log the error and generate a secure filename instead
        const errorMessage = error instanceof Error ? error.message : 'Unknown sanitization error';
        console.warn('Failed to sanitize fileName, generating secure alternative:', errorMessage);
        const extension = fileExtension || '.pdf';
        objectPath = `${publicDir}/documents/${documentId}${extension}`;
      }
    } else {
      const extension = fileExtension || '.pdf'; // Default to .pdf for documents
      objectPath = `${publicDir}/documents/${documentId}${extension}`;
    }
    
    const { bucketName, objectName } = parseObjectPath(objectPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Gets slide file from object storage path - handles both absolute and relative paths
  async getSlideFile(objectPath: string): Promise<File> {
    // Handle both absolute paths (/bucket/object) and relative paths (slides/id.jpg)
    if (!objectPath.startsWith("/")) {
      // Relative path - prefix with public directory
      const publicDir = this.getPublicDirectory();
      objectPath = `${publicDir}/${objectPath}`;
    }

    if (!HAS_OBJECT_STORAGE) {
      throw new Error('Object storage not configured');
    }

    const { bucketName, objectName } = parseObjectPath(objectPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new ObjectNotFoundError();
    }

    return file;
  }

  // Enhanced path normalization - extracts path from various storage URL formats
  normalizeSlideObjectPath(rawPath: string): string {
    // Handle various URL formats
    if (rawPath.startsWith("https://storage.googleapis.com/") ||
        rawPath.startsWith("https://storage.cloud.google.com/") ||
        rawPath.includes("googleapis.com") ||
        rawPath.includes(".storage.")) {
      try {
        const url = new URL(rawPath);
        return url.pathname;
      } catch {
        // If URL parsing fails, try to extract path manually
        const pathMatch = rawPath.match(/\/([^/]+\/.*?)(?:\?|$)/);
        if (pathMatch) {
          return `/${pathMatch[1]}`;
        }
      }
    }

    // Handle signed URLs with query parameters
    if (rawPath.includes('?')) {
      try {
        const url = new URL(rawPath);
        return url.pathname;
      } catch {
        // Fallback: remove query parameters manually
        return rawPath.split('?')[0];
      }
    }

    // Return as-is if already a path or unrecognized format
    return rawPath;
  }

}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  if (!HAS_OBJECT_STORAGE) {
    return `/${bucketName}/${objectName}`;
  }

  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}