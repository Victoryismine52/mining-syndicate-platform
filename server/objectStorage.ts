import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { basename } from "path";
import { MemoryStorage } from "./memoryStorage";
import { logger } from './logger';
import { config } from './config';

// Use shared config for deployment detection and endpoint
const isPublishedDeployment = config.objectStorage.isDeployed;
const REPLIT_SIDECAR_ENDPOINT = config.objectStorage.endpoint;

// Check if we're running on Replit with object storage enabled
// In deployment, we might only have one of these set
const HAS_OBJECT_STORAGE = !!(process.env.PRIVATE_OBJECT_DIR || process.env.PUBLIC_OBJECT_SEARCH_PATHS);

// Validate PUBLIC_OBJECT_SEARCH_PATHS format
if (process.env.PUBLIC_OBJECT_SEARCH_PATHS) {
  const paths = process.env.PUBLIC_OBJECT_SEARCH_PATHS.split(',').map(p => p.trim());
  const invalidPaths = paths.filter(path => !path.startsWith('/') || path.split('/').length < 2);
  if (invalidPaths.length > 0) {
    logger.error('❌ INVALID PUBLIC_OBJECT_SEARCH_PATHS format. Must be "/<bucket>" format, got: %o', invalidPaths);
    logger.error('❌ Example correct format: "/my-bucket" or "/my-bucket,/another-bucket"');
  }
}

logger.info('Object Storage Configuration: %o', {
  isPublishedDeployment,
  hasPrivateDir: !!process.env.PRIVATE_OBJECT_DIR,
  hasPublicPaths: !!process.env.PUBLIC_OBJECT_SEARCH_PATHS,
  hasObjectStorage: HAS_OBJECT_STORAGE,
  endpoint: REPLIT_SIDECAR_ENDPOINT,
  publicPathsValue: process.env.PUBLIC_OBJECT_SEARCH_PATHS,
  deploymentDetection: {
    REPLIT_DEPLOYMENT: !!process.env.REPLIT_DEPLOYMENT,
    REPL_DEPLOYMENT: !!process.env.REPL_DEPLOYMENT
  }
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
    logger.info('🔍 Environment variables check: %o', {
      PUBLIC_OBJECT_SEARCH_PATHS: process.env.PUBLIC_OBJECT_SEARCH_PATHS,
      PRIVATE_OBJECT_DIR: process.env.PRIVATE_OBJECT_DIR,
      DEFAULT_OBJECT_STORAGE_BUCKET_ID: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
    });
    
    const paths = pathsStr
      .split(",")
      .map((path) => path.trim())
      .filter((path) => path.length > 0);
    
    if (paths.length === 0) {
      throw new Error("Object storage not configured. PUBLIC_OBJECT_SEARCH_PATHS environment variable required.");
    }
    
    logger.info('🔍 Using public directory: %s', paths[0]);
    return paths[0]; // Use first public directory
  }

  // Get all public object search paths as an array
  getPublicObjectSearchPaths(): string[] {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = pathsStr
      .split(",")
      .map((path) => path.trim())
      .filter((path) => path.length > 0);
    
    if (paths.length === 0) {
      throw new Error("Object storage not configured. PUBLIC_OBJECT_SEARCH_PATHS environment variable required.");
    }
    
    return paths;
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
        logger.error("Stream error: %o", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      logger.error("Error downloading file: %o", error as Error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for a slide image - simplified
  async getSlideUploadURL(fileExtension?: string): Promise<string> {
    logger.info('🔍 getSlideUploadURL started with extension: %s', fileExtension);
    
    try {
      const slideId = randomUUID();
      logger.info('🔍 Generated slideId: %s', slideId);
      
      const publicDir = this.getPublicDirectory();
      logger.info('🔍 Public directory obtained: %s', publicDir);
      
      const extension = fileExtension || '.jpg'; // Default to .jpg but allow override
      const fullPath = `${publicDir}/slides/${slideId}${extension}`;
      logger.info('🔍 Full path constructed: %s', fullPath);
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      logger.info('🔍 Parsed path - bucket: %s object: %s', bucketName, objectName);

      logger.info('🔍 Calling signObjectURL with: %o', {
        bucketName,
        objectName,
        method: "PUT",
        ttlSec: 900,
        HAS_OBJECT_STORAGE,
        REPLIT_SIDECAR_ENDPOINT
      });

      const signedUrl = await signObjectURL({
        bucketName,
        objectName,
        method: "PUT",
        ttlSec: 900, // 15 minutes
      });
      
      logger.info('🔍 Successfully got signed URL: %s', signedUrl);
      return signedUrl;
    } catch (error) {
      logger.error('❌ Error in getSlideUploadURL: %o', error as Error);
      throw error;
    }
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
        logger.warn('Failed to sanitize fileName, generating secure alternative: %s', errorMessage);
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

  // Simple, direct URL builder - eliminates indirections
  async buildAssetUrl(path: string, ttlSec: number = 3600): Promise<string> {
    // Normalize path - handle relative, absolute, or full URLs
    let normalizedPath = path;
    if (path.startsWith('http')) {
      // Extract path from full URL
      normalizedPath = new URL(path).pathname;
    } else if (!path.startsWith('/')) {
      // Add bucket prefix for relative paths
      normalizedPath = `${this.getPublicDirectory()}/${path}`;
    }

    // Security: only allow slides and documents
    const bucket = this.getPublicDirectory();
    const allowedPrefixes = [`${bucket}/slides/`, `${bucket}/documents/`];
    if (!allowedPrefixes.some(prefix => normalizedPath.startsWith(prefix))) {
      throw new Error('Invalid asset path - only slides and documents allowed');
    }

    // Return signed URL for production, normalized path for dev
    if (HAS_OBJECT_STORAGE) {
      const { bucketName, objectName } = parseObjectPath(normalizedPath);
      return await signObjectURL({ 
        bucketName,
        objectName,
        method: 'GET',
        ttlSec: Math.min(ttlSec, 3600) // Cap at 1 hour
      });
    } else {
      return normalizedPath; // Fallback for dev without object storage
    }
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
  logger.info('🔍 signObjectURL called with: %o', { bucketName, objectName, method, ttlSec });
  logger.info('🔍 HAS_OBJECT_STORAGE: %s', HAS_OBJECT_STORAGE);
  logger.info('🔍 REPLIT_SIDECAR_ENDPOINT: %s', REPLIT_SIDECAR_ENDPOINT);
  
  if (!HAS_OBJECT_STORAGE) {
    logger.info('🔍 Object storage not available, returning local path');
    return `/${bucketName}/${objectName}`;
  }

  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  logger.info('🔍 Request payload: %o', request);
  logger.info('🔍 Making fetch request to: %s', `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`);
  
  try {
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
    
    logger.info('🔍 Response status: %d', response.status);
    logger.info('🔍 Response ok: %s', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ Sidecar response error: %o', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        endpoint: REPLIT_SIDECAR_ENDPOINT,
        bucket: bucketName,
        object: objectName
      });
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}, ` +
          `make sure you're running on Replit. Error: ${errorText}`
      );
    }

    const responseData = await response.json();
    logger.info('🔍 Response data: %o', responseData);
    const { signed_url: signedURL } = responseData;
    logger.info('🔍 Extracted signed URL: %s', signedURL);
    return signedURL;
  } catch (error) {
    logger.error('❌ Error in signObjectURL: %o', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bucket: bucketName,
      object: objectName,
      endpoint: REPLIT_SIDECAR_ENDPOINT
    });
    throw error;
  }
}