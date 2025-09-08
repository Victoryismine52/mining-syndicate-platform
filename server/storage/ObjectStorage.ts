import { File, Storage } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { logger } from '../logger';
import { config } from '../config';
import { BaseStorage } from './BaseStorage';
import { IObjectStorageService } from '../interfaces/IObjectStorageService';
import { StorageOptions, StorageError } from '@shared/types/storage';
import { ObjectNotFoundError } from '../errors';
import { MemoryStorage } from './MemoryStorage';

const REPLIT_SIDECAR_ENDPOINT = config.objectStorage.replitSidecarEndpoint;

// Create cloud storage client for Replit environment
function createCloudStorageClient() {
  if (!REPLIT_SIDECAR_ENDPOINT) return null;

  const storage = new Storage();
  const authClient = storage.authClient as any;
  authClient.credentials = {
    client_id: "replit",
    client_secret: "",
    quota_project_id: "",
    type: "external_account",
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      headers: {},
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    }
  };

  return storage;
}

export class ObjectStorageService extends BaseStorage implements IObjectStorageService {
  private cloudStorage: Storage | null;
  private memoryStorage: MemoryStorage;

  constructor() {
    super({ debugMode: config.nodeEnv === 'development' });
    this.cloudStorage = createCloudStorageClient();
    this.memoryStorage = new MemoryStorage();
  }

  private getStorageClient(options?: StorageOptions) {
    const useMemory = options?.useMemoryStorage ?? (config.storageMode === 'memory');
    return useMemory ? this.memoryStorage : (this.cloudStorage || this.memoryStorage);
  }

  getPublicObjectSearchPaths(options?: StorageOptions): Array<string> {
    const mergedOptions = this.getOptions(options);
    const pathsStr = config.objectStorage.publicObjectSearchPaths || 
                    (mergedOptions.useMemoryStorage ? '/public,/uploads' : "");
    
    return Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path: string) => path.trim())
          .filter((path: string) => path.length > 0)
      )
    );
  }

  getPrivateObjectDir(options?: StorageOptions): string {
    const mergedOptions = this.getOptions(options);
    const dir = config.objectStorage.privateObjectDir || 
                (mergedOptions.useMemoryStorage ? '/uploads' : "");
                
    if (!dir) {
      throw new StorageError(
        'FAILED_PRECONDITION',
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string, options?: StorageOptions): Promise<File | null> {
    return this.executeOperation('searchPublicObject', this.getOptions(options), async () => {
      const storage = this.getStorageClient(options);
      
      for (const searchPath of this.getPublicObjectSearchPaths(options)) {
        const fullPath = `${searchPath}/${filePath}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectName);

        const [exists] = await file.exists();
        if (exists) {
          return file as File;
        }
      }

      return null;
    });
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600, options?: StorageOptions): Promise<void> {
    await this.executeOperation('downloadObject', this.getOptions(options), async () => {
      try {
        const [metadata] = await file.getMetadata();
        
        res.set({
          "Content-Type": metadata.contentType || "application/octet-stream",
          "Content-Length": metadata.size,
          "Cache-Control": `public, max-age=${cacheTtlSec}`,
        });

        const stream = file.createReadStream();

        stream.on("error", (err: Error) => {
          logger.error("Stream error:", err);
          if (!res.headersSent) {
            throw new StorageError('INTERNAL', "Error streaming file");
          }
        });

        await new Promise((resolve, reject) => {
          stream.pipe(res)
            .on('finish', resolve)
            .on('error', reject);
        });

        return {};
      } catch (error) {
        if (error instanceof StorageError) throw error;
        
        logger.error("Error downloading file:", error);
        if (!res.headersSent) {
          throw new StorageError('INTERNAL', "Error downloading file");
        }
        return {};
      }
    });
  }

  async getSlideUploadURL(options?: StorageOptions): Promise<string> {
    const result = await this.executeOperation('getSlideUploadURL', this.getOptions(options), async () => {
      const privateObjectDir = this.getPrivateObjectDir(options);
      const slideId = randomUUID();
      const fullPath = `${privateObjectDir}/slides/${slideId}.jpg`;

      if (!REPLIT_SIDECAR_ENDPOINT || options?.useMemoryStorage) {
        return { uploadURL: fullPath };
      }

      return {
        uploadURL: await signObjectURL({
          bucketName: parseObjectPath(fullPath).bucketName,
          objectName: parseObjectPath(fullPath).objectName,
          method: "PUT",
          ttlSec: 900
        })
      };
    });
    return result.uploadURL;
  }

  async getSlideFile(objectPath: string, options?: StorageOptions): Promise<File> {
    return this.executeOperation('getSlideFile', this.getOptions(options), async () => {
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
      
      return file as File;
    });
  }

  normalizeSlideObjectPath(rawPath: string, _options?: StorageOptions): string {
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
    throw new StorageError(
      'INVALID_ARGUMENT',
      "Invalid path: must contain at least a bucket name"
    );
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
    throw new StorageError(
      'INTERNAL',
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
