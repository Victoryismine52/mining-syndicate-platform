import { StorageOptions } from '@shared/types/storage';
import { File } from '@google-cloud/storage';
import { Response } from 'express';

export interface IObjectStorageService {
  /**
   * Gets the public object search paths
   */
  getPublicObjectSearchPaths(options?: StorageOptions): Array<string>;
  
  /**
   * Gets the private object directory
   */
  getPrivateObjectDir(options?: StorageOptions): string;
  
  /**
   * Search for a public object from the search paths
   */
  searchPublicObject(filePath: string, options?: StorageOptions): Promise<File | null>;
  
  /**
   * Downloads an object to the response
   */
  downloadObject(file: File, res: Response, cacheTtlSec?: number, options?: StorageOptions): Promise<void>;
  
  /**
   * Gets the upload URL for a slide image
   */
  getSlideUploadURL(options?: StorageOptions): Promise<string>;
  
  /**
   * Gets slide file from object storage path
   */
  getSlideFile(objectPath: string, options?: StorageOptions): Promise<File>;
  
  /**
   * Normalizes a slide object path
   */
  normalizeSlideObjectPath(rawPath: string, options?: StorageOptions): string;
}
