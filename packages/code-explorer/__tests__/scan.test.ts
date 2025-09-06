import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { scan } from "../scan.js";

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-"));
  fs.writeFileSync(
    path.join(dir, "sample.ts"),
    [
      "/** @tag util */",
      "function decl(a: number, b: number): number { return a + b; }",
      "const arrow = (x: string) => x;",
      "const asyncArrow = async () => {};",
      "class MyClass { method() {} }",
      "export default function defaultDecl() {}",
      "export default () => {}",
      "function* gen() {}",
      "async function* asyncGen() {}",
    ].join("\n"),
  );
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("scan", () => {
  it("parses functions including class methods and defaults", () => {
    const result = scan(dir);
    expect(result).toEqual([
      {
        name: "decl",
        signature: "decl(a: number, b: number): number",
        path: "sample.ts",
        tags: ["util"],
      },
      {
        name: "arrow",
        signature: "arrow(x: string): any",
        path: "sample.ts",
        tags: [],
      },
      {
        name: "asyncArrow",
        signature: "async asyncArrow(): any",
        path: "sample.ts",
        tags: [],
      },
      {
        name: "MyClass.method",
        signature: "MyClass.method(): any",
        path: "sample.ts",
        tags: ["class-method"],
      },
      {
        name: "defaultDecl",
        signature: "defaultDecl(): any",
        path: "sample.ts",
        tags: ["default-export"],
      },
      {
        name: "default",
        signature: "default(): any",
        path: "sample.ts",
        tags: ["default-export"],
      },
      {
        name: "gen",
        signature: "*gen(): any",
        path: "sample.ts",
        tags: [],
      },
      {
        name: "asyncGen",
        signature: "async *asyncGen(): any",
        path: "sample.ts",
        tags: [],
      },
    ]);
  });

  it("filters by tag", () => {
    const result = scan(dir, { tag: "util" });
    expect(result).toEqual([
      {
        name: "decl",
        signature: "decl(a: number, b: number): number",
        path: "sample.ts",
        tags: ["util"],
      },
    ]);
  });
});
