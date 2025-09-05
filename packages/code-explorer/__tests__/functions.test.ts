import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { createFunctionsRouter } from "../../../server/functions";

let repoDir: string;

beforeAll(() => {
  repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "fn-api-"));
  fs.writeFileSync(
    path.join(repoDir, "a.ts"),
    [
      "/** @tag util */",
      "function hi(){}",
      "/** @tag edge */",
      "const bye = () => {}",
      "/** @tag gen */",
      "function* gen(){}",
    ].join("\n"),
  );
});

afterAll(() => {
  fs.rmSync(repoDir, { recursive: true, force: true });
});

describe("GET /code-explorer/api/functions", () => {
  it("returns function metadata", async () => {
    const app = express();
    app.use("/code-explorer/api/functions", createFunctionsRouter(() => repoDir));
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://localhost:${port}/code-explorer/api/functions`);
    const data = await res.json();
    server.close();
    expect(res.status).toBe(200);
    expect(data).toEqual([
      { name: "hi", signature: "hi(): any", path: "a.ts", tags: ["util"] },
      { name: "bye", signature: "bye(): any", path: "a.ts", tags: ["edge"] },
      { name: "gen", signature: "*gen(): any", path: "a.ts", tags: ["gen"] },
    ]);
  });

  it("filters by tag", async () => {
    const app = express();
    app.use("/code-explorer/api/functions", createFunctionsRouter(() => repoDir));
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://localhost:${port}/code-explorer/api/functions?tag=util`);
    const data = await res.json();
    server.close();
    expect(res.status).toBe(200);
    expect(data).toEqual([
      { name: "hi", signature: "hi(): any", path: "a.ts", tags: ["util"] },
    ]);
  });

  it("returns 400 when repository is not loaded", async () => {
    const app = express();
    app.use("/code-explorer/api/functions", createFunctionsRouter(() => null));
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://localhost:${port}/code-explorer/api/functions`);
    server.close();
    expect(res.status).toBe(400);
  });

  it("returns 500 when scan fails", async () => {
    const app = express();
    // provide non-existent directory to trigger scan error
    app.use("/code-explorer/api/functions", createFunctionsRouter(() => "/no/such/dir"));
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://localhost:${port}/code-explorer/api/functions`);
    server.close();
    expect(res.status).toBe(500);
  });
});
