/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FileViewer } from "./FileViewer";

const toast = vi.fn();

vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
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
