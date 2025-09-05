/* @vitest-environment jsdom */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock UI components and toast used by FileViewer
vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Import fixture that mocks missing language module
import "./fixtures/missingLang";

import { FileViewer } from "../src/components/FileViewer";

describe("FileViewer missing language module", () => {
  it("renders raw text and warns when module is missing", async () => {
    const source = "const a = 1;";
    const originalFetch = global.fetch;
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => source }) as any;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<FileViewer path="/repo/test.ts" />);

    const textarea = await screen.findByTestId("editor");
    expect((textarea as HTMLTextAreaElement).value).toBe(source);
    expect(textarea.getAttribute("extensions")).toBeNull();

    await waitFor(() => expect(warn).toHaveBeenCalled());

    warn.mockRestore();
    global.fetch = originalFetch;
  });
});
