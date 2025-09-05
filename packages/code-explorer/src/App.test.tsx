/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CodeExplorerApp } from "./App";
vi.mock("./components/FileViewer", () => ({ FileViewer: () => <div>viewer</div> }));
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
});

