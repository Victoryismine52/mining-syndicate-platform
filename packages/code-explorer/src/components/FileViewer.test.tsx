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
