import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { nanoid } from "nanoid";
import open from "open";
import { setupViteFor, log } from "./vite";
import { buildFileTree } from "../packages/code-explorer/file-tree.js";
import { applyPatchToFile } from "./save";

const exec = promisify(execCb);

const app = express();
app.use(express.json());

let currentRepoDir: string | null = null;

/**
 * Type: Express route handler
 * Location: server/explorer.ts > POST /code-explorer/api/clone
 * Description: Clones a GitHub repository to a temp directory and returns its file tree.
 * Notes: Updates currentRepoDir for subsequent file fetches.
 * EditCounter: 1
 */
app.post("/code-explorer/api/clone", async (req, res) => {
  try {
    const repo: string = req.body.repo;
    if (!repo) {
      return res.status(400).json({ error: "repo is required" });
    }
    const baseDir = path.join(os.tmpdir(), "explorer", nanoid());
    await fs.promises.mkdir(baseDir, { recursive: true });
    await exec(`git clone --depth=1 ${repo} ${baseDir}`);
    currentRepoDir = baseDir;
    const tree = buildFileTree(baseDir);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Type: Express route handler
 * Location: server/explorer.ts > GET /code-explorer/api/file
 * Description: Reads and returns the contents of a file within the cloned repository.
 * Notes: Validates that requested path resides in the current repository.
 * EditCounter: 1
 */
app.get("/code-explorer/api/file", async (req, res) => {
  const filePath = req.query.path as string | undefined;
  try {
    if (!filePath || (currentRepoDir && !filePath.startsWith(currentRepoDir))) {
      return res.status(400).send("Invalid path");
    }
    const data = await fs.promises.readFile(filePath, "utf8");
    res.type("text/plain").send(data);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

/**
 * Type: Express route handler
 * Location: server/explorer.ts > POST /code-explorer/api/save
 * Description: Applies a unified diff patch to the specified file.
 * Notes: Validates path against current repository root.
 */
app.post("/code-explorer/api/save", async (req, res) => {
  const { path: filePath, patch } = req.body || {};
  try {
    if (!filePath || !patch) {
      return res.status(400).json({ error: "path and patch are required" });
    }
    if (!currentRepoDir || !filePath.startsWith(currentRepoDir)) {
      return res.status(400).json({ error: "Invalid path" });
    }
    await applyPatchToFile(filePath, patch);
    res.json({ status: "ok" });
  } catch (err: any) {
    const status = err.message === "Patch failed" ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

const server = createServer(app);

/**
 * Type: Async IIFE
 * Location: server/explorer.ts > server startup
 * Description: Configures Vite middleware and starts the explorer development server.
 * Notes: Automatically opens the explorer URL in the default browser.
 * EditCounter: 1
 */
(async () => {
  const rootDir = path.resolve(import.meta.dirname, "..", "packages", "code-explorer");
  await setupViteFor(app, server, rootDir, "/code-explorer");

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`explorer dev server running on port ${port}`);
    void open(`http://localhost:${port}/code-explorer`, { wait: false }).catch(
      () => {},
    );
  });
})();

