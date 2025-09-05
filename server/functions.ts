import express from "express";
import { scan } from "../packages/code-explorer/scan.js";

/**
{
  "friendlyName": "functions route",
  "description": "Exposes parsed function metadata for the active repository.",
  "editCount": 1,
  "tags": ["express", "route"],
  "location": "server/functions.ts > createFunctionsRouter",
  "notes": "Requires the repository to be cloned before use."
}
*/
export function createFunctionsRouter(getRepoDir: () => string | null) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const dir = getRepoDir();
    if (!dir) {
      return res.status(400).json({ error: "Repository not loaded" });
    }
    try {
      const data = scan(dir);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
