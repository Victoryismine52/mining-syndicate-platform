import { Storage, File } from "@google-cloud/storage";
import { Client as ReplitObjectStorageClient } from "@replit/object-storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { logger } from './logger';
import { config } from './config';

const REPLIT_SIDECAR_ENDPOINT = config.objectStorage.replitSidecarEndpoint;

class MemoryFile {
  private content?: Buffer;

  constructor(private store: Map<string, Buffer>, private key: string) {}

  async exists(): Promise<[boolean]> {
    return [this.store.has(this.key)];
  }

  async getMetadata(): Promise<any[]> {
    const data = this.store.get(this.key);
    if (!data) throw new Error("File not found");
    return [{ contentType: "application/octet-stream", size: data.length }];
  }

  createReadStream() {
    const data = this.store.get(this.key) || Buffer.alloc(0);
    return Readable.from(data);
  }

  async delete() {
    this.store.delete(this.key);
  }

  async save(data: Buffer) {
    this.store.set(this.key, data);
  }
}

class MemoryBucket {
  constructor(private store: Map<string, Buffer>, private name: string) {}

  file(objectName: string) {
    const key = `${this.name}/${objectName}`;
    return new MemoryFile(this.store, key);
  }
}

class MemoryStorage {
  private store = new Map<string, Buffer>();

  bucket(name: string) {
    return new MemoryBucket(this.store, name);
  }
}

// Initialize object storage client
// Use Replit's native object storage SDK which handles authentication automatically
let objectStorageClient: any;

if (REPLIT_SIDECAR_ENDPOINT) {
  // Use Google Cloud Storage with sidecar credentials (original working method)
  logger.info('Using Google Cloud Storage with sidecar endpoint');
  objectStorageClient = new Storage({
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
  });
} else if (process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) {
  // PRIORITIZE Google Cloud Storage to access existing files
  logger.info('Using Google Cloud Storage with default credentials for bucket:', process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID);
  try {
    objectStorageClient = new Storage();
    logger.info('Google Cloud Storage client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Google Cloud Storage, falling back to Replit SDK:', error);
    // Fallback to Replit's native object storage SDK
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    logger.info('Using Replit Object Storage SDK for bucket:', bucketId);
    objectStorageClient = new ReplitObjectStorageClient({
      bucketId: bucketId
    });
  }
} else {
  // Fallback to memory storage for true local development
  logger.info('Using memory storage fallback');
  objectStorageClient = new MemoryStorage();
}

export function setObjectStorageClient(client: any) {
  objectStorageClient = client;
}

export { objectStorageClient };

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = config.objectStorage.publicObjectSearchPaths || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = config.objectStorage.privateObjectDir || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: any, res: Response, cacheTtlSec: number = 3600) {
    try {
      if (file.type === 'replit') {
        // Handle Replit Object Storage
        logger.info('Replit SDK: Downloading object:', file.objectName);
        
        try {
          const buffer = await file.client.downloadAsBytes(file.objectName);
          logger.info('Replit SDK: Downloaded bytes:', buffer.length);
          
          // Set appropriate headers for images
          res.set({
            "Content-Type": "image/jpeg", // Default to jpeg, could be improved to detect actual type
            "Content-Length": buffer.length,
            "Cache-Control": `public, max-age=${cacheTtlSec}`,
          });

          res.send(buffer);
        } catch (downloadError) {
          logger.error('Replit SDK download error:', downloadError);
          throw downloadError;
        }
      } else {
        // Handle Google Cloud Storage
        const [metadata] = await file.getMetadata();
        
        res.set({
          "Content-Type": metadata.contentType || "application/octet-stream",
          "Content-Length": metadata.size,
          "Cache-Control": `public, max-age=${cacheTtlSec}`,
        });

        const stream = file.createReadStream();

        stream.on("error", (err: Error) => {
          logger.error("Stream error:", { error: err.message });
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });

        stream.pipe(res);
      }
    } catch (error) {
      logger.error("Error downloading file:", { error: error instanceof Error ? error.message : String(error) });
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for a slide image.
  async getSlideUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const slideId = randomUUID();
    const fullPath = `${privateObjectDir}/slides/${slideId}.jpg`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    if (!REPLIT_SIDECAR_ENDPOINT) {
      return fullPath;
    }

    // Sign URL for PUT method with TTL
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Gets slide file from object storage path
  async getSlideFile(objectPath: string): Promise<any> {
    if (!objectPath.startsWith("/")) {
      objectPath = `/${objectPath}`;
    }

    // Check if we're using Replit's SDK (only if it's actually a ReplitObjectStorageClient)
    if (objectStorageClient instanceof ReplitObjectStorageClient) {
      logger.info('Replit SDK: Full object path received:', objectPath);
      
      // For Replit SDK, need to parse the path correctly
      // Path format: /replit-objstore-{bucket-id}/.private/slides/{file-id}.jpg
      const pathParts = objectPath.split('/');
      logger.info('Replit SDK: Path parts:', pathParts);
      
      if (pathParts.length >= 4 && pathParts[2] === '.private') {
        // Extract just the file path after .private  
        const objectName = pathParts.slice(2).join('/'); // ".private/slides/{file-id}.jpg"
        logger.info('Replit SDK: Parsed object name:', objectName);
        
        try {
          // First try to list all files to see what's actually there
          logger.info('Replit SDK: Listing all files in bucket...');
          const allFiles = await objectStorageClient.list({ maxResults: 50 });
          logger.info('Replit SDK: Total files in bucket:', allFiles.length);
          if (allFiles.length > 0) {
            logger.info('Replit SDK: Sample files:', allFiles.slice(0, 3).map(f => f.key));
          }
          
          // Now try to find our specific file
          const files = await objectStorageClient.list({ prefix: objectName, maxResults: 1 });
          logger.info('Replit SDK: Files matching prefix:', files.length);
          
          if (files.length > 0) {
            logger.info('Replit SDK: Found matching file:', files[0].key);
            return { type: 'replit', objectName: files[0].key, client: objectStorageClient };
          } else {
            // Try alternative paths in case the structure is different
            const alternativeObjectName = pathParts.slice(3).join('/'); // "slides/{file-id}.jpg"
            logger.info('Replit SDK: Trying alternative path:', alternativeObjectName);
            
            const altFiles = await objectStorageClient.list({ prefix: alternativeObjectName, maxResults: 1 });
            if (altFiles.length > 0) {
              logger.info('Replit SDK: Found with alternative path:', altFiles[0].key);
              return { type: 'replit', objectName: altFiles[0].key, client: objectStorageClient };
            }
            
            logger.error('File not found in object storage with any path variant');
            throw new ObjectNotFoundError();
          }
        } catch (error) {
          logger.error('Replit object storage error:', error);
          throw new ObjectNotFoundError();
        }
      } else {
        logger.error('Invalid object path format:', objectPath, 'parts:', pathParts);
        throw new ObjectNotFoundError();
      }
    } else {
      // Use Google Cloud Storage API
      const { bucketName, objectName } = parseObjectPath(objectPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        throw new ObjectNotFoundError();
      }
      
      return file;
    }
  }

  normalizeSlideObjectPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    return url.pathname;
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