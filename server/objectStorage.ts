import { File, Storage } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { logger } from './logger';
import { config } from './config';
import { BaseStorage } from './storage/BaseStorage';
import { IObjectStorageService } from './interfaces/IObjectStorageService';
import { StorageOptions as SharedStorageOptions, StorageError } from '@shared/types/storage';
import { ObjectNotFoundError } from './errors';

const REPLIT_SIDECAR_ENDPOINT = config.objectStorage.replitSidecarEndpoint;le, Storage } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { logger } from './logger';
import { config } from './config';
import { BaseStorage } from './storage/BaseStorage';
import { IObjectStorageService } from './interfaces/IObjectStorageService';
import { StorageOptions as SharedStorageOptions, StorageError } from '@shared/types/storage';

const REPLIT_SIDECAR_ENDPOINT = config.objectStorage.replitSidecarEndpoint;

interface FileMetadata {
  contentType: string;
  size: number;
  [key: string]: any;
}

class MemoryFile implements Partial<File> {
  private content?: Buffer;

  constructor(private store: Map<string, Buffer>, private key: string) {}

  async exists(): Promise<[boolean]> {
    return [this.store.has(this.key)];
  }

  async getMetadata(): Promise<[FileMetadata, any]> {
    const data = this.store.get(this.key);
    if (!data) throw new StorageError('NOT_FOUND', "File not found");
    return [{ contentType: "application/octet-stream", size: data.length }, {}];
  }

  createReadStream() {
    const data = this.store.get(this.key) || Buffer.alloc(0);
    return Readable.from(data);
  }

  async delete(): Promise<[any]> {
    this.store.delete(this.key);
    return [{}];
  }

  async save(data: Buffer) {
    this.store.set(this.key, data);
  }
}

class MemoryBucket {
  constructor(private store: Map<string, Buffer>, private name: string) {}

  file(objectName: string): MemoryFile {
    const key = `${this.name}/${objectName}`;
    return new MemoryFile(this.store, key);
  }
}

class MemoryStorage {
  private store = new Map<string, Buffer>();

  bucket(name: string): MemoryBucket {
    return new MemoryBucket(this.store, name);
  }
}

import { Storage } from '@google-cloud/storage';

// Create cloud storage client for Replit environment
function createCloudStorageClient() {
  if (!REPLIT_SIDECAR_ENDPOINT) return null;

  const storage = new Storage();
  storage.authClient.configure({
    credentials: {
      client_id: "replit",
      client_secret: "",
      quota_project_id: "",
      type: "external_account",
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: {
          type: "json",
          subject_token_field_name: "access_token"
        },
        headers: {}
      }
    }
  });

  return storage;
}

// Initialize storage client based on environment
const cloudStorageClient = createCloudStorageClient();
const memoryStorageClient = new MemoryStorage();

let objectStorageClient: Storage | MemoryStorage = cloudStorageClient || memoryStorageClient;

export function setObjectStorageClient(client: Storage | MemoryStorage) {
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
export interface StorageOptions {
  useMemoryStorage?: boolean;
}

export class ObjectStorageService {
  private memoryStorage: MemoryStorage;
  
  constructor() {
    this.memoryStorage = new MemoryStorage();
  }

  private getStorageClient(options?: StorageOptions) {
    if (options?.useMemoryStorage || config.storageMode === 'memory') {
      return this.memoryStorage;
    }
    return objectStorageClient;
  }

  // Gets the public object search paths.
  getPublicObjectSearchPaths(options?: StorageOptions): Array<string> {
    // In memory mode, default to local public and uploads buckets
    const useMemory = options?.useMemoryStorage || config.storageMode === 'memory';
    const pathsStr = config.objectStorage.publicObjectSearchPaths || (useMemory ? '/public,/uploads' : "");
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
    // In memory mode, default to /uploads
    const dir = config.objectStorage.privateObjectDir || (config.storageMode === 'memory' ? '/uploads' : "");
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string, options?: StorageOptions): Promise<File | null> {
    const storage = this.getStorageClient(options);
    for (const searchPath of this.getPublicObjectSearchPaths(options)) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = storage.bucket(bucketName);
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
        logger.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      logger.error("Error downloading file:", error);
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
  async getSlideFile(objectPath: string, options?: StorageOptions): Promise<File> {
    if (!objectPath.startsWith("/")) {
      objectPath = `/${objectPath}`;
    }

    const storage = this.getStorageClient(options);
    const { bucketName, objectName } = parseObjectPath(objectPath);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return file;
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
