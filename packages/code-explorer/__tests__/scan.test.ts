import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { scan } from "../scan.js";

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-"));
  fs.writeFileSync(
    path.join(dir, "a.ts"),
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
      "class MyClass {",
      "  method() {}",
      "}",
    ].join("\n"),
  );
  fs.writeFileSync(path.join(dir, "b.ts"), "export default () => {}\n");
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("scan", () => {
  it("parses functions including class methods and default exports", () => {
    const result = scan(dir).sort((a, b) =>
      a.path === b.path ? a.name.localeCompare(b.name) : a.path.localeCompare(b.path),
    );
    expect(result).toEqual([
      {
        name: "arrow",
        signature: "arrow(x: string): any",
        path: "a.ts",
        tags: [],
      },
      {
        name: "asyncArrow",
        signature: "async asyncArrow(): any",
        path: "a.ts",
        tags: [],
      },
      {

        name: "asyncGen",
        signature: "async *asyncGen(): any",
        path: "a.ts",
        tags: [],
      },
      {
        name: "decl",
        signature: "decl(a: number, b: number): number",
        path: "a.ts",
        tags: ["util"],
      },
      {
        name: "defaultDecl",
        signature: "defaultDecl(): any",
        path: "a.ts",
        tags: ["default-export"],
      },
      {
        name: "gen",
        signature: "*gen(): any",
        path: "a.ts",
        tags: [],
      },
      {
        name: "MyClass.method",
        signature: "MyClass.method(): any",
        path: "a.ts",
        tags: ["class-method"],
      },
      {
        name: "default",
        signature: "default(): any",
        path: "b.ts",
        tags: ["default-export"],
      },
    ]);
  });

  it("filters by tag", () => {
    const result = scan(dir, { tag: "util" });
    expect(result).toEqual([
      {
        name: "decl",
        signature: "decl(a: number, b: number): number",
        path: "a.ts",
        tags: ["util"],
      },
    ]);
  });

  it("filters by default-export tag", () => {
    const result = scan(dir, { tag: "default-export" }).sort((a, b) =>
      a.path === b.path ? a.name.localeCompare(b.name) : a.path.localeCompare(b.path),
    );
    expect(result).toEqual([
      {
        name: "defaultDecl",
        signature: "defaultDecl(): any",
        path: "a.ts",
        tags: ["default-export"],
      },
      {
        name: "default",
        signature: "default(): any",
        path: "b.ts",
        tags: ["default-export"],
      },
    ]);
  });
});
