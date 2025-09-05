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
});
