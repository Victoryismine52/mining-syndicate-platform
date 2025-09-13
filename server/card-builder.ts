import express from "express";
import { createServer } from "http";
import path from "path";
import open from "open";
import { setupViteFor, log } from "./vite";
import { config } from './config';

const app = express();

const server = createServer(app);

(async () => {
  const rootDir = path.resolve(import.meta.dirname, "..", "packages", "card-builder");
  await setupViteFor(app, server, rootDir, "/card-builder");

  const port = config.port;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`card builder dev server running on port ${port}`);
    void open(`http://localhost:${port}/card-builder`, { wait: false }).catch(() => {});
  });
})();
