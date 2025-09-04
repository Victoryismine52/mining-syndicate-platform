/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { CodeExplorerApp } from "./App";

vi.mock("prismjs", () => ({
  default: { highlightAll: vi.fn(), highlight: (code: string) => code, languages: { tsx: {} } },
  highlightAll: vi.fn(),
  highlight: (code: string) => code,
  languages: { tsx: {} },
}));
vi.mock("prismjs/components/prism-typescript", () => ({}));
vi.mock("prismjs/components/prism-javascript", () => ({}));
vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

const originalFetch = global.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("import workflow", () => {
  it("notifies on start, collapses folders, and loads viewer on success", async () => {
    const tree = {
      path: "/repo",
      name: "repo",
      children: [
        { name: "docs", path: "/repo/docs", children: [{ name: "intro.md", path: "/repo/docs/intro.md" }] },
        { name: "README.md", path: "/repo/README.md" },
      ],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => tree })
      .mockResolvedValueOnce({ ok: true, text: async () => "file content" });
    global.fetch = fetchMock as any;

    render(<CodeExplorerApp />);

    fireEvent.click(screen.getAllByText("Import")[0]);
    fireEvent.change(screen.getByPlaceholderText("https://github.com/user/repo"), {
      target: { value: "https://github.com/user/repo" },
    });
    fireEvent.click(screen.getAllByText("Import")[1]);

    await screen.findByText("Import started");
    expect(fetchMock).toHaveBeenCalledWith(
      "/code-explorer/api/clone",
      expect.objectContaining({ method: "POST" })
    );

    const folderNode = await screen.findByText("docs");
    expect(screen.queryByText("intro.md")).toBeNull();
    fireEvent.click(folderNode);
    const fileNode = await screen.findByText("intro.md");
    fireEvent.click(fileNode);
    await screen.findByText("file content");
    fireEvent.click(screen.getByText("Collapse All"));
    expect(screen.queryByText("intro.md")).toBeNull();
  });

  it("shows failure message when clone fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    global.fetch = fetchMock as any;

    render(<CodeExplorerApp />);

    fireEvent.click(screen.getAllByText("Import")[0]);
    fireEvent.change(screen.getByPlaceholderText("https://github.com/user/repo"), {
      target: { value: "https://github.com/user/repo" },
    });
    fireEvent.click(screen.getAllByText("Import")[1]);

    await screen.findByText("Import started");
    await screen.findByText("Import failed");
  });
});

