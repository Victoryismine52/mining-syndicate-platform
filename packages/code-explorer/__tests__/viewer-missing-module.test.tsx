/* @vitest-environment jsdom */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock UI components and toast used by FileViewer
vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));
const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

// Import fixture that mocks missing editor and language modules
import "./fixtures/missingModules";

import { FileViewer } from "../src/components/FileViewer";

describe("FileViewer missing language module", () => {
  it("renders raw text and emits a warning toast when module is missing", async () => {
    const source = "const a = 1;";
    const originalFetch = global.fetch;
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => source }) as any;

    render(<FileViewer path="/repo/test.ts" />);

    const pre = await screen.findByTestId("raw-code");
    expect(pre.textContent).toBe(source);

    await waitFor(() => expect(toast).toHaveBeenCalled());

    global.fetch = originalFetch;
  });
});
