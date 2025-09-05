import fs from "fs/promises";
import os from "os";
import path from "path";
import { describe, it, expect } from "vitest";
import { createTwoFilesPatch } from "diff";
import { applyPatchToFile } from "../../../server/save";

describe("applyPatchToFile", () => {
  it("writes patched content", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "patch-test"));
    const file = path.join(dir, "file.ts");
    await fs.writeFile(file, "const a = 1;\n");
    const patch = createTwoFilesPatch("file.ts", "file.ts", "const a = 1;\n", "const a = 2;\n");
    await applyPatchToFile(file, patch);
    const result = await fs.readFile(file, "utf8");
    expect(result).toBe("const a = 2;\n");
  });

  it("patches files without extensions", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "patch-extless"));
    const file = path.join(dir, "README");
    await fs.writeFile(file, "hello\n");
    const patch = createTwoFilesPatch("README", "README", "hello\n", "world\n");
    await applyPatchToFile(file, patch);
    const result = await fs.readFile(file, "utf8");
    expect(result).toBe("world\n");
  });

  it("follows nested symlinks when patching", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "patch-symlink"));
    const target = path.join(dir, "target.txt");
    await fs.writeFile(target, "one\n");
    const link1 = path.join(dir, "link1");
    const link2 = path.join(dir, "link2");
    await fs.symlink(target, link1);
    await fs.symlink(link1, link2);
    const patch = createTwoFilesPatch("link2", "link2", "one\n", "two\n");
    await applyPatchToFile(link2, patch);
    const result = await fs.readFile(target, "utf8");
    expect(result).toBe("two\n");
  });
});
