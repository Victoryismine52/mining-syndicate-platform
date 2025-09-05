/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
});

describe("loadLanguageFromPath", () => {
  it("loads javascript module for ts files", async () => {
    javascript.mockClear();
    const exts = await loadLanguageFromPath("/repo/file.ts");
    expect(javascript).toHaveBeenCalled();
    expect(exts).toHaveLength(1);
  });

  it("falls back to plain text for unknown extensions", async () => {
    javascript.mockClear();
    const exts = await loadLanguageFromPath("/repo/file.unknown");
    expect(javascript).not.toHaveBeenCalled();
    expect(exts).toEqual([]);
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
});
