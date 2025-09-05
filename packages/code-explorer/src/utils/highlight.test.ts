import { describe, it, expect, vi } from "vitest";
import Prism from "prismjs";
import { highlightCode } from "./highlight";

describe("highlightCode", () => {
  it("returns highlighted HTML when grammar exists", () => {
    const code = "const a = 1;";
    const result = highlightCode(code, "tsx");
    expect(result).toContain("<span");
  });

  it("falls back to plain code when Prism throws", () => {
    const code = "let b = 2;";
    const spy = vi.spyOn(Prism, "highlight").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const result = highlightCode(code, "tsx");
    expect(result).toBe(code);
    spy.mockRestore();
  });
});
