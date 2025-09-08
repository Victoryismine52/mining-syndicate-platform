import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { setSiteStorage } from "./site-storage";
import { logger } from './logger';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { config } from './config';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';
import fs from 'fs';
import path from 'path';
import { ensureLocalAssetsDir } from './local-assets';

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
app.use(pinoHttp({
  logger,
  genReqId: () => randomUUID(),
}));

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
    // Accept raw binary uploads to /uploads/*
    app.put(`${uploadsRoot}/*`, express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
      try {
        const rel = req.path.substring(uploadsRoot.length); // e.g., /slides/abc.jpg
        const target = path.join(assetsDir, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, req.body);
        res.status(201).json({ ok: true, path: `${uploadsRoot}${rel}` });
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

    logger.error({ err }, 'Unhandled error');
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
