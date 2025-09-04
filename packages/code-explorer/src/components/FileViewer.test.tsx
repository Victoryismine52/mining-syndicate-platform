/* @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FileViewer } from "./FileViewer";
import Prism from "prismjs";

vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));

const originalFetch = global.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("FileViewer", () => {
  it("renders fetched code with line numbers", async () => {
    const source = "const a = 1;\nconsole.log(a);";
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => source });
    global.fetch = fetchMock as any;

    const { container } = render(<FileViewer path="/repo/test.ts" />);
    await screen.findByText((_, node) => node.textContent === source);
    const lineNumbers = container.querySelectorAll("code.text-right div");
    expect(lineNumbers.length).toBe(2);
  });

  it("renders code even when Prism lacks grammar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "let x = 1;" });
    global.fetch = fetchMock as any;
    vi.spyOn(Prism, "highlight").mockImplementationOnce(() => {
      throw new Error("missing grammar");
    });

    render(<FileViewer path="/repo/test.ts" />);
    await screen.findByText((_, el) => el?.textContent === "let x = 1;");
  });
});
