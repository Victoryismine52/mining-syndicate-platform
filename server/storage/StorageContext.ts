import { config } from '../config';
import { StorageOptions, StorageMetadata } from '@shared/types/storage';
import { logger } from '../logger';

/**
 * Manages storage context and provides a consistent interface for storage operations
 */
export class StorageContext {
  private startTime: number;

  constructor(private defaultOptions: StorageOptions = {}) {
    this.startTime = Date.now();
  }

  /**
   * Get merged storage options combining defaults, environment config, and request options
   */
  getOptions(requestOptions?: StorageOptions): StorageOptions {
    const useMemory = requestOptions?.useMemoryStorage ?? 
                     ((requestOptions?.storageType === 'memory') ||
                     (this.defaultOptions.useMemoryStorage ?? false) ||
                     (config.storageMode === 'memory'));

    const options: StorageOptions = {
      ...this.defaultOptions,
      ...requestOptions,
      useMemoryStorage: useMemory,
      storageType: useMemory ? 'memory' : 'cloud' as const
    };

    if (options.debugMode) {
      logger.debug('Storage options:', {
        requestOptions,
        defaultOptions: this.defaultOptions,
        mergedOptions: options,
        envConfig: { storageMode: config.storageMode }
      });
    }

    return options;
  }

  /**
   * Create metadata for storage operation
   */
  createMetadata(options: StorageOptions): StorageMetadata {
    const metadata: StorageMetadata = {
      storageType: options.useMemoryStorage ? 'memory' : 'cloud',
      latencyMs: Date.now() - this.startTime
    };

    if (options.debugMode) {
      metadata.debug = {
        startTime: this.startTime,
        endTime: Date.now(),
        options
      };
    }

    return metadata;
  }

  /**
   * Reset operation timer
   */
  resetTimer(): void {
    this.startTime = Date.now();
  }

  /**
   * Add storage information to response headers
   */
  addResponseHeaders(res: any, metadata: StorageMetadata): void {
    res.set({
      'X-Storage-Type': metadata.storageType,
      'X-Storage-Latency': `${metadata.latencyMs}ms`
    });

    if (metadata.cacheStatus) {
      res.set('X-Storage-Cache', metadata.cacheStatus);
    }

    if (metadata.debug && config.nodeEnv === 'development') {
      res.set('X-Storage-Debug', JSON.stringify(metadata.debug));
    }
  }
}
