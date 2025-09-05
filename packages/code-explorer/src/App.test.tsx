/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CodeExplorerApp } from "./App";
vi.mock("./components/FileViewer", () => ({ FileViewer: ({ path }: any) => <div>{path}</div> }));
vi.mock("./components/CompositionCanvas", () => ({ CompositionCanvas: () => <div /> }));

vi.mock("prismjs", () => ({
  default: { highlightAll: vi.fn(), highlight: (code: string) => code, languages: { tsx: {} } },
  highlightAll: vi.fn(),
  highlight: (code: string) => code,
  languages: { tsx: {} },
}));
vi.mock("prismjs/components/prism-typescript", () => ({}));
vi.mock("prismjs/components/prism-javascript", () => ({}));
vi.mock("prismjs/components/prism-jsx", () => ({}));
vi.mock("prismjs/components/prism-tsx", () => ({}));
vi.mock("@/components/ui/button", () => ({ Button: (props: any) => <button {...props} /> }));
vi.mock("@/components/ui/input", () => ({ Input: (props: any) => <input {...props} /> }));
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
  global.fetch = vi.fn();
});

afterEach(() => {
  cleanup();
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("CodeExplorerApp", () => {
  it("renders cards and shows error on invalid URL", async () => {
    render(<CodeExplorerApp />);
    // rendering home screen
    expect(screen.getByText("Import GitHub repository")).toBeTruthy();

    // interaction: open import dialog
    fireEvent.click(screen.getAllByText("Import")[0]);
    fireEvent.change(screen.getByPlaceholderText("https://github.com/user/repo"), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getAllByText("Import")[1]);

    // error path: invalid URL message
    expect(await screen.findByText("Please enter a valid GitHub URL")).toBeTruthy();
  });

  it("manages file tabs", async () => {
    const tree = {
      name: "repo",
      path: "/repo",
      children: [
        { name: "one.ts", path: "/repo/one.ts" },
        { name: "two.ts", path: "/repo/two.ts" },
      ],
    };
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => tree });

    render(<CodeExplorerApp />);
    fireEvent.click(screen.getAllByText("Import")[0]);
    fireEvent.change(screen.getByPlaceholderText("https://github.com/user/repo"), {
      target: { value: "https://github.com/user/repo" },
    });
    fireEvent.click(screen.getAllByText("Import")[1]);

    await screen.findByText("one.ts");

    fireEvent.click(screen.getByText("one.ts"));
    expect(await screen.findByText("/repo/one.ts")).toBeTruthy();

    fireEvent.click(screen.getByText("two.ts"));
    expect(await screen.findByText("/repo/two.ts")).toBeTruthy();
    const tabBar = screen.getByTestId("tab-bar");

    // clicking already open file from tree should switch without duplicating
    fireEvent.click(screen.getByText("one.ts"));
    expect(await screen.findByText("/repo/one.ts")).toBeTruthy();
    expect(within(tabBar).getAllByLabelText("Close").length).toBe(2);

    fireEvent.click(within(tabBar).getByText("one.ts"));
    expect(await screen.findByText("/repo/one.ts")).toBeTruthy();

    const closeBtns = within(tabBar).getAllByLabelText("Close");
    fireEvent.click(closeBtns[1]);
    expect(within(tabBar).getAllByLabelText("Close").length).toBe(1);
    expect(await screen.findByText("/repo/one.ts")).toBeTruthy();
  });
});

