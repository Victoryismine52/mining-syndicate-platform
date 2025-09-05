/* @vitest-environment jsdom */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const toast = vi.fn();

describe("FileViewer fallback", () => {
  it("renders raw text and warns for extensionless files", async () => {
    vi.resetModules();
    toast.mockReset();
    document.body.innerHTML = "";
    vi.doMock("@/components/ui/button", () => ({
      Button: (props: any) => <button {...props} />,
    }));
    vi.doMock("@/hooks/use-toast", () => ({
      useToast: () => ({ toast }),
    }));
    vi.doMock("@uiw/react-codemirror", () => ({
      default: (props: any) => <textarea {...props} />,
    }));

    const source = "hello";
    const originalFetch = global.fetch;
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => source }) as any;

    const { FileViewer } = await import("../src/components/FileViewer");

    render(<FileViewer path="/repo/README" />);

    await screen.findByText(source);
    const pre = screen.getByTestId("raw-code");
    expect(pre.textContent).toBe(source);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Syntax highlighting unavailable" })
      )
    );

    global.fetch = originalFetch;
  });

  it("renders raw text and warns when CodeMirror crashes", async () => {
    vi.resetModules();
    toast.mockReset();
    document.body.innerHTML = "";
    vi.doMock("@/components/ui/button", () => ({
      Button: (props: any) => <button {...props} />,
    }));
    vi.doMock("@/hooks/use-toast", () => ({
      useToast: () => ({ toast }),
    }));
    vi.doMock("@uiw/react-codemirror", () => ({
      default: () => {
        throw new Error("boom");
      },
    }));
    vi.doMock("@codemirror/lang-javascript", () => ({
      javascript: () => ({}),
    }));

    const source = "const a = 1;";
    const originalFetch = global.fetch;
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => source }) as any;

    const { FileViewer } = await import("../src/components/FileViewer");

    render(<FileViewer path="/repo/test.ts" />);

    await screen.findByText(source);
    const pre = screen.getByTestId("raw-code");
    expect(pre.textContent).toBe(source);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Editor failed to load" })
      )
    );

    global.fetch = originalFetch;
  });
});
