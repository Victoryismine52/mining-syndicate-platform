import { describe, it, expect, vi } from "vitest";
import Prism from "prismjs";
import { highlightCode } from "./highlight";

describe("highlightCode", () => {
  it("highlights TypeScript code", () => {
    const code = "const x: number = 1;";
    const result = highlightCode(code, "ts");
    expect(result).not.toBe(code);
  });

  it("returns original code when Prism throws", () => {
    const code = "let x = 1;";
    vi.spyOn(Prism, "highlight").mockImplementationOnce(() => {
      throw new Error("missing grammar");
    });
    const result = highlightCode(code, "ts");
    expect(result).toBe(code);
  });

  it("returns original code for unsupported extension", () => {
    const code = "plain";
    const result = highlightCode(code, "md");
    expect(result).toBe(code);
  });
});
