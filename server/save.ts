import fs from "fs/promises";
import * as Diff from "diff";

/**
 * Applies a unified diff patch to a file on disk.
 * Throws if the patch cannot be applied.
 */
export async function applyPatchToFile(filePath: string, patch: string): Promise<void> {
  const original = await fs.readFile(filePath, "utf8");
  const updated = Diff.applyPatch(original, patch);
  if (updated === false) {
    throw new Error("Patch failed");
  }
  await fs.writeFile(filePath, updated, "utf8");
}
