import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setSiteStorage } from "./site-storage";
import { logger } from './logger';
import { randomUUID } from 'crypto';
import { config } from './config';
import fs from 'fs';
import path from 'path';
import { ensureLocalAssetsDir } from './local-assets';

// Dynamic imports for optional features
const loadMonitoring = async () => {
  if (config.features.monitoring) {
    try {
      const pinoHttp = await import('pino-http');
      return pinoHttp.default;
    } catch (err) {
      logger.warn('pino-http not available, using fallback logging');
      return null;
    }
  }
  return null;
};

const loadMetrics = async () => {
  if (config.features.metrics) {
    try {
      const promClient = await import('prom-client');
      return promClient;
    } catch (err) {
      logger.warn('prom-client not available, metrics disabled');
      return null;
    }
  }
  return null;
};

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
    } catch (error) {
      logger.error("Failed to connect to the Codex API:", error);
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize monitoring and metrics
(async () => {
  // Setup monitoring if enabled
  const pinoHttp = await loadMonitoring();
  if (pinoHttp) {
    app.use(pinoHttp({
      genReqId: () => randomUUID(),
      customLogLevel: function (req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) return 'warn'
        if (res.statusCode >= 500 || err) return 'error'
        if (req.method === 'POST') return 'info'
        return 'debug'
      }
    }));
    logger.info('Detailed logging enabled with pino-http');
  } else {
    // Simple request logging fallback
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (req.path.startsWith("/api")) {
          logger.info(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
        }
      });
      next();
    });
    logger.info('Using fallback request logging');
  }

  // Setup metrics if enabled
  const promClient = await loadMetrics();
  if (promClient) {
    const register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register });
    
    const httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    const httpRequestErrors = new promClient.Counter({
      name: 'http_request_errors_total',
      help: 'Total count of HTTP request errors',
      labelNames: ['method', 'route']
    });

    register.registerMetric(httpRequestDuration);
    register.registerMetric(httpRequestErrors);

    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', register.contentType);
      res.send(await register.metrics());
    });

    logger.info('Prometheus metrics enabled');
  } else {
    logger.info('Metrics collection disabled');
  }
})();


(async () => {
  if (config.storageMode === 'memory') {
    const { memorySiteStorage } = await import('./memory-storage');
    setSiteStorage(memorySiteStorage);
    logger.info('Using in-memory site storage');

    // Setup local filesystem-backed uploads for assets in memory mode
    const assetsDir = ensureLocalAssetsDir();
    const uploadsRoot = '/uploads';
    logger.info(`Serving local uploads from ${assetsDir} at ${uploadsRoot}`);
    // Serve uploaded files
    app.use(uploadsRoot, express.static(assetsDir));
    // Handle uploads using middleware
    app.use('/uploads', express.raw({ type: '*/*', limit: '50mb' }), (req, res, next) => {
      if (req.method !== 'PUT') {
        return next();
      }
      try {
        // Get everything after /uploads/
        const rel = req.url.replace('/uploads/', '');
        if (!rel) {
          return res.status(400).json({ error: 'Invalid upload path' });
        }
        
        const target = path.join(assetsDir, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, req.body);
        res.status(201).json({ ok: true, path: `/uploads/${rel}` });
      } catch (err: any) {
        logger.error('Failed to write upload:', err);
        res.status(500).json({ error: 'Failed to store upload' });
      }
    });
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Unhandled error: ${err.message}`);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.port;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    logger.info(`serving on port ${port}`);
    await init();
  });
})();
