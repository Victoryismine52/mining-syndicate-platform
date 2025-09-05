/* @vitest-environment node */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { scan } from "../../../packages/code-explorer/scan.js";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-test-"));
  const file = path.join(tmpDir, "a.ts");
  fs.writeFileSync(
    file,
    `/**\n * Example\n * @tag util\n */\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n`
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("scan", () => {
  it("produces function metadata", () => {
    const index = scan(tmpDir);
    expect(index).toEqual([
      {
        name: "add",
        signature: "add(a: number, b: number): number",
        path: "a.ts",
        tags: ["util"],
      },
    ]);
  });
});
