import { StorageOptions, StorageMetadata, StorageError } from '@shared/types/storage';
import { StorageContext } from './StorageContext';
import { logger } from '../logger';

/**
 * Base class for all storage implementations
 */
export abstract class BaseStorage {
  protected context: StorageContext;

  constructor(defaultOptions: StorageOptions = {}) {
    this.context = new StorageContext(defaultOptions);
  }

  /**
   * Execute a storage operation with timing and error handling
   */
  protected async executeOperation<T>(
    operation: string,
    options: StorageOptions,
    fn: () => Promise<T>
  ): Promise<T & { metadata: StorageMetadata }> {
    this.context.resetTimer();

    try {
      const result = await fn();
      const metadata = this.context.createMetadata(options);

      if (options.debugMode) {
        logger.debug(`Storage operation '${operation}' completed`, {
          operation,
          options,
          metadata
        });
      }

      // Ensure result is an object
      const resultObj = (result as object) || {};
      return {
        ...resultObj,
        metadata
      } as T & { metadata: StorageMetadata };
    } catch (error) {
      const metadata = this.context.createMetadata(options);
      
      logger.error(`Storage operation '${operation}' failed`, {
        operation,
        options,
        metadata,
        error
      });

      if (error instanceof StorageError) {
        error.metadata = metadata;
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        'INTERNAL',
        `Storage operation '${operation}' failed: ${errorMessage}`,
        metadata
      );
    }
  }

  /**
   * Get storage options for an operation
   */
  protected getOptions(requestOptions?: StorageOptions): StorageOptions {
    return this.context.getOptions(requestOptions);
  }

  /**
   * Add storage headers to response
   */
  protected addResponseHeaders(res: any, metadata: StorageMetadata): void {
    this.context.addResponseHeaders(res, metadata);
  }
}
