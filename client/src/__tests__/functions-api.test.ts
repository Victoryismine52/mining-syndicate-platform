/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import express from "express";
import { functionIndex } from "../../../server/function-index";

describe("/api/functions", () => {
  it("returns the function index", async () => {
    const app = express();
    app.get("/api/functions", (_req, res) => {
      res.json(functionIndex);
    });
    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://127.0.0.1:${port}/api/functions`);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    server.close();
  });
});
