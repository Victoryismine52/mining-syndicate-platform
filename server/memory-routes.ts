import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerMemoryRoutes(app: Express): Server {
  // Basic health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Root landing page or delegate to Vite in development
  app.get("/", (_req, res, next) => {
    if (app.get("env") === "development") {
      // Vite middleware will handle this in development
      return next();
    }

    res.type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Mining Syndicate</title>
  </head>
  <body>
    <h1>Mining Syndicate API</h1>
  </body>
</html>`);
  });

  return createServer(app);
}

// Export alias for compatibility with existing imports
export { registerMemoryRoutes as registerRoutes };
