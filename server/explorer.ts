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
import { createFunctionsRouter } from "./functions";
import { config } from './config';
const exec = promisify(execCb);

const app = express();
app.use(express.json());

let currentRepoDir: string | null = null;

app.use("/code-explorer/api/functions", createFunctionsRouter(() => currentRepoDir));

/**
{
  "friendlyName": "clone route",
  "description": "Clones a GitHub repository to a temp directory and returns its file tree.",
  "editCount": 2,
  "tags": ["express", "route"],
  "location": "server/explorer.ts > POST /code-explorer/api/clone",
  "notes": "Updates currentRepoDir for subsequent file fetches."
}
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
{
  "friendlyName": "get file route",
  "description": "Reads and returns the contents of a file within the cloned repository.",
  "editCount": 2,
  "tags": ["express", "route"],
  "location": "server/explorer.ts > GET /code-explorer/api/file",
  "notes": "Validates that requested path resides in the current repository."
}
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
{
  "friendlyName": "save file route",
  "description": "Applies a unified diff patch to the specified file.",
  "editCount": 1,
  "tags": ["express", "route"],
  "location": "server/explorer.ts > POST /code-explorer/api/save",
  "notes": "Validates path against current repository root."
}
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
{
  "friendlyName": "explorer startup",
  "description": "Configures Vite middleware and starts the explorer development server.",
  "editCount": 2,
  "tags": ["startup"],
  "location": "server/explorer.ts > server startup",
  "notes": "Automatically opens the explorer URL in the default browser."
}
*/
(async () => {
  const rootDir = path.resolve(import.meta.dirname, "..", "packages", "code-explorer");
  await setupViteFor(app, server, rootDir, "/code-explorer");

  const port = config.port;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`explorer dev server running on port ${port}`);
    void open(`http://localhost:${port}/code-explorer`, { wait: false }).catch(
      () => {},
    );
  });
})();

