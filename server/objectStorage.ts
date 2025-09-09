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

// Use Replit Object Storage SDK - this handles authentication automatically in Replit
logger.info('Initializing Replit Object Storage for bucket:', process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID);

if (process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) {
  objectStorageClient = new ReplitObjectStorageClient({
    bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
  });
  logger.info('Replit Object Storage client initialized with bucket:', process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID);
} else {
  logger.error('No bucket ID found - using memory storage');
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
        logger.info('Replit: Downloading object:', file.objectName);
        
        const buffer = await file.client.downloadAsBytes(file.objectName);
        logger.info('Replit: Downloaded bytes:', buffer.length);
        
        res.set({
          "Content-Type": "image/jpeg",
          "Content-Length": buffer.length,
          "Cache-Control": `public, max-age=${cacheTtlSec}`,
        });

        res.send(buffer);
      } else {
        // Handle Google Cloud Storage (fallback)
        const [metadata] = await file.getMetadata();
        logger.info('GCS: Downloaded file size:', metadata.size, 'bytes');
        
        res.set({
          "Content-Type": metadata.contentType || "image/jpeg",
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

    // Use Replit Object Storage - this accesses your existing slides
    logger.info('Replit: Full object path:', objectPath);
    
    // Parse the object path to get the actual file path
    // Path format: /replit-objstore-{bucket-id}/.private/slides/{file-id}.jpg
    const pathParts = objectPath.split('/');
    
    if (pathParts.length >= 4 && pathParts[2] === '.private') {
      // Extract the file path: ".private/slides/{file-id}.jpg"
      const objectName = pathParts.slice(2).join('/');
      logger.info('Replit: Looking for object:', objectName);
      
      return { type: 'replit', objectName, client: objectStorageClient };
    } else {
      logger.error('Replit: Invalid path format:', objectPath);
      throw new ObjectNotFoundError();
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