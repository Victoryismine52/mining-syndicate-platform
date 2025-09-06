import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const BASE_DEV_URL = process.env.BASE_DEV_URL || "http://0.0.0.0:5000/api";
const BASE_CODEX_URL = process.env.BASE_CODEX_URL || `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api`;

async function init() {
  try {
    const response = await fetch(`${BASE_DEV_URL}/visible-slides`);
    if (!response.ok) {
      throw new Error("Local API not reachable");
    }
    console.log("Successfully connected to the local API!");
  } catch (error: any) {
    console.error("Falling back to Codex API:", error.message);
    try {
      const response = await fetch(`${BASE_CODEX_URL}/visible-slides`);
      if (!response.ok) {
        throw new Error("Codex API call failed");
      }
      console.log("Successfully connected to the Codex API!");
    } catch (error) {
      console.error("Failed to connect to the Codex API:", error);
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});


(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    await init();
  });
})();
