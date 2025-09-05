import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { createFunctionsRouter } from "../../../server/functions";

let repoDir: string;

beforeAll(() => {
  repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "fn-api-"));
  fs.writeFileSync(path.join(repoDir, "a.ts"), "function hi(){}\n");
});

afterAll(() => {
  fs.rmSync(repoDir, { recursive: true, force: true });
});

describe("GET /functions", () => {
  it("returns function metadata", async () => {
    const app = express();
    app.use("/functions", createFunctionsRouter(() => repoDir));
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://localhost:${port}/functions`);
    const data = await res.json();
    server.close();
    expect(res.status).toBe(200);
    expect(data).toEqual([
      { name: "hi", signature: "hi(): any", path: "a.ts", tags: [] },
    ]);
  });

  it("returns 400 when repository is not loaded", async () => {
    const app = express();
    app.use("/functions", createFunctionsRouter(() => null));
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://localhost:${port}/functions`);
    server.close();
    expect(res.status).toBe(400);
  });
});
