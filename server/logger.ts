import pino from 'pino';
import { config } from './config';

// Create and export the pino logger directly
export const logger = pino({
  level: config.logLevel,
}) as any; // Type cast to avoid TS issues while keeping all pino functionality
