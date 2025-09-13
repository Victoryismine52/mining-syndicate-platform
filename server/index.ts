import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setSiteStorage } from "./site-storage";
import { logger } from './logger';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { config } from './config';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';
import { createServer } from 'http';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { Socket } from 'net';

const BASE_DEV_URL = config.baseDevUrl;
const BASE_CODEX_URL = config.baseCodexUrl;

async function init() {
  try {
    const response = await fetch(`${BASE_DEV_URL}/visible-slides`);
    if (!response.ok) {
      throw new Error("Local API not reachable");
    }
    // Connected to local API
  } catch (error: any) {
    logger.error("Falling back to Codex API:", error.message);
    try {
      const response = await fetch(`${BASE_CODEX_URL}/visible-slides`);
      if (!response.ok) {
        throw new Error("Codex API call failed");
      }
      // Connected to Codex API
    } catch (error: any) {
      logger.error("Failed to connect to the Codex API:", error);
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(pinoHttp({
  logger,
  genReqId: () => randomUUID(),
}));

// Health check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', pid: process.pid });
});

// Port management utilities
function getLockfilePath(port: number): string {
  return `/tmp/app-${port}.lock`;
}

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false); // Port is closed/available
    }, 300);

    socket.connect(port, '127.0.0.1', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true); // Port is open/busy
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false); // Port is closed/available
    });
  });
}

async function waitForPortClosed(port: number, maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (!(await isPortOpen(port))) {
      return true; // Port is now closed
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false; // Timeout
}

async function ensureSingleInstance(port: number): Promise<void> {
  const lockfilePath = getLockfilePath(port);
  
  if (existsSync(lockfilePath)) {
    const pidStr = readFileSync(lockfilePath, 'utf8').trim();
    const pid = parseInt(pidStr, 10);
    
    if (pid && pid !== process.pid) {
      try {
        // Check if process exists
        process.kill(pid, 0);
        logger.warn(`Found existing process ${pid} on port ${port}, attempting cleanup...`);
        
        // Try graceful termination
        process.kill(pid, 'SIGTERM');
        if (await waitForPortClosed(port, 5000)) {
          logger.info(`Process ${pid} terminated gracefully`);
        } else {
          logger.warn(`Process ${pid} didn't respond to SIGTERM, using SIGKILL...`);
          process.kill(pid, 'SIGKILL');
          if (await waitForPortClosed(port, 5000)) {
            logger.info(`Process ${pid} terminated forcefully`);
          } else {
            logger.fatal(`Failed to terminate process ${pid}, port ${port} still busy`);
            process.exit(1);
          }
        }
      } catch (error: any) {
        if (error.code === 'ESRCH') {
          // Process doesn't exist, remove stale lockfile
          logger.info(`Removing stale lockfile for dead process ${pid}`);
          unlinkSync(lockfilePath);
        } else {
          logger.error(`Failed to kill process ${pid}:`, error);
          process.exit(1);
        }
      }
    }
  }
  
  // Write current PID to lockfile
  writeFileSync(lockfilePath, process.pid.toString());
  logger.info(`Created lockfile for PID ${process.pid} on port ${port}`);
}

function setupGracefulShutdown(server: any, port: number) {
  const cleanup = () => {
    const lockfilePath = getLockfilePath(port);
    try {
      if (existsSync(lockfilePath)) {
        const pidStr = readFileSync(lockfilePath, 'utf8').trim();
        if (parseInt(pidStr, 10) === process.pid) {
          unlinkSync(lockfilePath);
          logger.info('Removed lockfile');
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Error removing lockfile');
    }
  };

  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      cleanup();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    cleanup();
    process.exit(1);
  });
  process.on('exit', cleanup);
}

// Metrics setup
const register = new Registry();
collectDefaultMetrics({ register });

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
});

const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP requests resulting in errors',
  labelNames: ['method', 'path', 'status_code'],
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const endTimer = httpRequestDuration.startTimer({ method: req.method, path });

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    endTimer({ status_code: res.statusCode });
    if (res.statusCode >= 500) {
      httpRequestErrors.inc({ method: req.method, path, status_code: res.statusCode });
    }
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      req.log.info(logLine);
    }
  });

  next();
});


(async () => {
  // Startup guard to prevent multiple server instances
  if ((globalThis as any).__serverStarted) {
    logger.warn('Server startup already in progress, skipping...');
    return;
  }
  (globalThis as any).__serverStarted = true;

  if (config.storageMode === 'memory') {
    const { memorySiteStorage } = await import('./memory-storage');
    setSiteStorage(memorySiteStorage);
    logger.info('Using in-memory site storage');
  }

  await registerRoutes(app);

  // Create HTTP server only once, here
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error({ err }, 'Unhandled error');
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
    
    // Check if setupVite started its own server (debugging port conflict)
    if (server.listening) {
      logger.info('HTTP server already listening after setupVite, skipping second bind');
      await init();
      return;
    }
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.port;
  
  // Ensure single instance before listening
  await ensureSingleInstance(port);
  
  // Setup graceful shutdown handlers
  setupGracefulShutdown(server, port);
  
  // Listen with retry logic
  const listenWithRetry = async (retryCount: number = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      const onListening = async () => {
        logger.info(`serving on port ${port}`);
        await init();
        resolve();
      };

      const onError = async (error: any) => {
        server.removeAllListeners('listening');
        server.removeAllListeners('error');
        
        if (error.code === 'EADDRINUSE' && retryCount === 0) {
          logger.warn(`Port ${port} busy (EADDRINUSE), attempting cleanup and retry...`);
          logger.info(`Current PID: ${process.pid}, Error: ${error.message}`);
          
          try {
            // Close the current server first
            if (server.listening) {
              server.close();
            }
            
            await ensureSingleInstance(port);
            
            // Wait a bit before retry
            await new Promise(r => setTimeout(r, 100));
            
            // Retry with new listeners
            await listenWithRetry(1);
            resolve();
          } catch (retryError) {
            logger.fatal({ err: retryError }, 'Failed to cleanup and retry');
            reject(retryError);
          }
        } else {
          logger.fatal({ err: error }, `Failed to start server on port ${port} after ${retryCount} retries`);
          reject(error);
        }
      };

      server.once('listening', onListening);
      server.once('error', onError);
      
      server.listen({
        port,
        host: "0.0.0.0",
      });
    });
  };
  
  await listenWithRetry();
})();
