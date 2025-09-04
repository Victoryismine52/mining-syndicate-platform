import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildFileTree } from "../file-tree.js";
import fs from "fs";
import path from "path";
import os from "os";

const tmpPrefix = path.join(os.tmpdir(), "file-tree-test-");
let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(tmpPrefix);
  fs.mkdirSync(path.join(tmpDir, "sub"));
  fs.writeFileSync(path.join(tmpDir, "root.txt"), "root");
  fs.writeFileSync(path.join(tmpDir, "sub", "a.txt"), "hi");
  fs.mkdirSync(path.join(tmpDir, "node_modules"));
  fs.writeFileSync(path.join(tmpDir, "node_modules", "ignore.js"), "" );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("buildFileTree", () => {
  it("includes files and subdirectories and ignores node_modules", () => {
    const tree = buildFileTree(tmpDir);
    const names = tree.children?.map((c) => c.name) ?? [];
    expect(names).toContain("root.txt");
    expect(names).toContain("sub");
    expect(names).not.toContain("node_modules");
    const sub = tree.children?.find((c) => c.name === "sub");
    expect(sub?.children?.map((c) => c.name)).toContain("a.txt");
  });
});
