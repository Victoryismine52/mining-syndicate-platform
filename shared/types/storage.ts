/**
 * Storage options interface for controlling storage behavior on a per-request basis
 */
export interface StorageOptions {
  /** Use in-memory storage instead of cloud storage */
  useMemoryStorage?: boolean;
  
  /** Explicit storage type selection */
  storageType?: 'memory' | 'cloud';
  
  /** Enable detailed logging for this operation */
  debugMode?: boolean;
  
  /** Cache duration in seconds */
  cacheTTL?: number;
}

/**
 * Response metadata for storage operations
 */
export interface StorageMetadata {
  /** Type of storage used for the operation */
  storageType: 'memory' | 'cloud';
  
  /** Operation timing in milliseconds */
  latencyMs: number;
  
  /** Cache status for the operation */
  cacheStatus?: 'hit' | 'miss' | 'bypass';
  
  /** Additional debug information when debugMode is enabled */
  debug?: Record<string, unknown>;
}

/**
 * Base interface for all storage operations
 */
export interface BaseStorageOperation {
  /** Operation options */
  options?: StorageOptions;
  
  /** Operation metadata */
  metadata?: StorageMetadata;
}

/**
 * Storage error types
 */
export type StorageErrorType = 
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_ARGUMENT'
  | 'ALREADY_EXISTS'
  | 'FAILED_PRECONDITION'
  | 'INTERNAL';

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  constructor(
    public type: StorageErrorType,
    message: string,
    public metadata?: StorageMetadata
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
