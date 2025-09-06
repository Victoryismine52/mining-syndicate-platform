/* @vitest-environment jsdom */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const toast = vi.fn();

vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

import { FileViewer, loadLanguageFromPath } from "./FileViewer";
import { javascript } from "@codemirror/lang-javascript";

const originalFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

describe("loadLanguageFromPath", () => {
  it("loads javascript module for ts files", async () => {
    javascript.mockClear();
    const exts = await loadLanguageFromPath("/repo/file.ts");
    expect(javascript).toHaveBeenCalled();
    expect(exts).not.toBeNull();
    expect(exts).toHaveLength(1);
  });

  it("falls back to plain text for unknown extensions", async () => {
    javascript.mockClear();
    const exts = await loadLanguageFromPath("/repo/file.unknown");
    expect(javascript).not.toHaveBeenCalled();
    expect(exts).toBeNull();
  });
});

describe("FileViewer", () => {
  it("renders fetched code in editor", async () => {
    const source = "const a = 1;";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => source });
    global.fetch = fetchMock as any;

    render(<FileViewer path="/repo/test.ts" />);
    const [textarea] = await screen.findAllByTestId("editor");
    expect((textarea as HTMLTextAreaElement).value).toBe(source);
  });

  it("sends patch on save", async () => {
    const source = "const a = 1;";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: async () => source })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock as any;

    render(<FileViewer path="/repo/test.ts" />);
    const [textarea] = await screen.findAllByTestId("editor");
    fireEvent.change(textarea, { target: { value: "const a = 2;" } });
    const [saveBtn] = await screen.findAllByText("Save");
    fireEvent.click(saveBtn);

    expect(fetchMock).toHaveBeenCalledWith(
      "/code-explorer/api/save",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse((fetchMock.mock.calls[1][1] as any).body);
    expect(body.patch).toContain("-const a = 1;");
    expect(body.patch).toContain("+const a = 2;");
    await waitFor(() => expect(toast).toHaveBeenCalledWith({ title: "File saved" }));
  });

  it("supports keyboard shortcuts for save and fullscreen", async () => {
    const source = "const a = 1;";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: async () => source })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock as any;

    render(<FileViewer path="/repo/test.ts" />);
    const [textarea] = await screen.findAllByTestId("editor");
    fireEvent.change(textarea, { target: { value: "const a = 2;" } });

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/code-explorer/api/save",
      expect.objectContaining({ method: "POST" })
    );
    await waitFor(() => expect(toast).toHaveBeenCalledWith({ title: "File saved" }));

    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
    expect(await screen.findByText("Exit")).toBeTruthy();
  });

  it("announces shortcuts and allows override", async () => {
    const source = "const a = 1;";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => source });
    global.fetch = fetchMock as any;

    const blocker = (e: KeyboardEvent) => e.preventDefault();
    window.addEventListener("keydown", blocker);

    render(<FileViewer path="/repo/test.ts" />);
    const [saveBtn] = await screen.findAllByText("Save");
    const [fsBtn] = await screen.findAllByText("Full screen");

    expect(saveBtn.getAttribute("aria-keyshortcuts")).toContain("Ctrl+S");
    expect(fsBtn.getAttribute("aria-keyshortcuts")).toContain("Ctrl+Enter");

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    window.removeEventListener("keydown", blocker);
  });

    it("renders raw code when CodeMirror fails to load", async () => {
      const source = "const a = 1;";
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, text: async () => source });
      global.fetch = fetchMock as any;

      vi.resetModules();
      vi.doMock("@uiw/react-codemirror", () => {
        throw new Error("failed import");
      });

      const { FileViewer: FallbackViewer } = await import("./FileViewer");

      render(<FallbackViewer path="/repo/test.ts" />);
      const pre = await screen.findByTestId("raw-code");
      expect(pre.textContent).toBe(source);

      vi.unmock("@uiw/react-codemirror");
      vi.resetModules();
    });

    it("renders raw code when CodeMirror throws during render", async () => {
      const source = "const a = 1;";
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, text: async () => source });
      global.fetch = fetchMock as any;

      vi.resetModules();
      vi.doMock("@uiw/react-codemirror", () => ({
        default: () => {
          throw new Error("render error");
        },
      }));

      const { FileViewer: CrashViewer } = await import("./FileViewer");

      render(<CrashViewer path="/repo/test.ts" />);
      const pre = await screen.findByTestId("raw-code");
      expect(pre.textContent).toBe(source);
      await waitFor(() =>
        expect(toast).toHaveBeenCalledWith({
          title: "Editor failed to load",
          variant: "destructive",
        })
      );

      vi.unmock("@uiw/react-codemirror");
      vi.resetModules();
    });

    it("renders raw code when language module is missing", async () => {
      const source = "const a = 1;";
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => source });
      global.fetch = fetchMock as any;

    render(<FileViewer path="/repo/test.unknown" />);
    const pre = await screen.findByTestId("raw-code");
    expect(pre.textContent).toBe(source);
  });
});
