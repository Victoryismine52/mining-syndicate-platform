import { config } from './config';

// Define logger interface
export interface Logger {
  level?: string;
  fatal?: (msg: string, ...args: any[]) => void;
  error: (msg: string, ...args: any[]) => void;
  warn: (msg: string, ...args: any[]) => void;
  info: (msg: string, ...args: any[]) => void;
  debug: (msg: string, ...args: any[]) => void;
  trace?: (msg: string, ...args: any[]) => void;
  silent?: () => void;
}

// Simple console logger implementation
const consoleLogger: Logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args),
};

// Create an async function to load pino if detailed logging is enabled
export const initLogger = async (): Promise<Logger> => {
  if (config.features.detailedLogging) {
    try {
      const pino = await import('pino');
      const logger = pino.default({
        level: config.logLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true
          }
        }
      });
      
      // Wrap pino logger to match our Logger interface
      return {
        level: logger.level,
        error: (msg: string, ...args: any[]) => logger.error(msg, ...args),
        warn: (msg: string, ...args: any[]) => logger.warn(msg, ...args),
        info: (msg: string, ...args: any[]) => logger.info(msg, ...args),
        debug: (msg: string, ...args: any[]) => logger.debug(msg, ...args),
        trace: (msg: string, ...args: any[]) => logger.trace && logger.trace(msg, ...args),
        fatal: (msg: string, ...args: any[]) => logger.fatal && logger.fatal(msg, ...args),
        silent: () => logger.silent && logger.silent('silent')
      };
    } catch (err) {
      console.warn('Failed to initialize pino logger, falling back to console logger');
      return consoleLogger;
    }
  }
  return consoleLogger;
};

// Export a basic logger initially, which will be replaced with pino if available
export let logger: Logger = consoleLogger;

// Initialize the proper logger
(async () => {
  logger = await initLogger();
})();
