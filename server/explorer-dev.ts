import express from "express";
import fs from "fs";
import path from "path";
import { createServer } from "http";
import { setupViteFor } from "./vite";
import { buildFileTree } from "../packages/code-explorer/file-tree.js";

const app = express();
app.use(express.json());

app.post("/explorer/api/clone", async (_req, res) => {
  const repoDir = path.resolve(import.meta.dirname, "..", "packages", "code-explorer");
  const tree = buildFileTree(repoDir);
  res.json(tree);
});

app.get("/explorer/api/file", (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).send("Missing path");
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    res.type("text/plain").send(content);
  } catch (err) {
    res.status(404).send("File not found");
  }
});

const server = createServer(app);
await setupViteFor(app, server, path.resolve(import.meta.dirname, "..", "client", "explorer"), "/explorer");

const port = parseInt(process.env.PORT || "3200", 10);
server.listen(port, () => {
  console.log(`Explorer dev server running at http://localhost:${port}/explorer`);
});
