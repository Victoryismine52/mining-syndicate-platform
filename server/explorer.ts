import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { nanoid } from "nanoid";
import { setupViteFor, log } from "./vite";
import { buildFileTree } from "../packages/code-explorer/file-tree.js";

const exec = promisify(execCb);

const app = express();
app.use(express.json());

let currentRepoDir: string | null = null;

app.post("/explorer/api/clone", async (req, res) => {
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

app.get("/explorer/api/file", async (req, res) => {
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

const server = createServer(app);

(async () => {
  const rootDir = path.resolve(import.meta.dirname, "..", "packages", "code-explorer");
  await setupViteFor(app, server, rootDir, "/explorer");

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`explorer dev server running on port ${port}`);
  });
})();

