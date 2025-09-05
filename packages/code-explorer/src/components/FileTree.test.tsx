/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { FileTree, TreeNode } from "./FileTree";

vi.mock("lucide-react", () => ({
  ChevronRight: (props: any) => <span data-testid="chevron-right" {...props} />,
  ChevronDown: (props: any) => <span data-testid="chevron-down" {...props} />,
  Folder: (props: any) => <span data-testid="folder" {...props} />,
  FileText: (props: any) => <span data-testid="file-text" {...props} />,
}));

const tree: TreeNode = {
  name: "root",
  path: "/root",
  children: [
    {
      name: "src",
      path: "/root/src",
      children: [{ name: "index.ts", path: "/root/src/index.ts" }],
    },
    { name: "README.md", path: "/root/README.md" },
  ],
};

afterEach(() => cleanup());
// react-virtualized relies on layout measurements, which are zeroed in JSDOM.
// Provide fixed offsets so the virtualized List can compute its dimensions.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 500,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 500,
  });
});

describe("FileTree", () => {
  it("renders directories and files", () => {
    render(<FileTree node={tree} selected={null} onSelect={() => {}} filter="" isRoot />);
    expect(screen.getByText("root")).toBeTruthy();
    expect(screen.getByText("src")).toBeTruthy();
    expect(screen.getByText("README.md")).toBeTruthy();
  });

  it("toggles folder and selects file", () => {
    const onSelect = vi.fn();
    render(<FileTree node={tree} selected={null} onSelect={onSelect} filter="" isRoot />);
    const folder = screen.getByText("src");
    expect(screen.queryByText("index.ts")).toBeNull();
    fireEvent.click(folder);
    const file = screen.getByText("index.ts");
    fireEvent.click(file);
    expect(onSelect).toHaveBeenCalledWith("/root/src/index.ts");
  });

  it("returns null when filter excludes node", () => {
    const { container } = render(
      <FileTree node={tree} selected={null} onSelect={() => {}} filter="xyz" isRoot />
    );
    expect(container.innerHTML).toBe("");
  });

  it("collapses when collapseKey changes", () => {
    const { rerender } = render(
      <FileTree node={tree} selected={null} onSelect={() => {}} filter="" isRoot collapseKey={0} />
    );
    const folder = screen.getByText("src");
    fireEvent.click(folder); // open
    expect(screen.getByText("index.ts")).toBeTruthy();
    rerender(
      <FileTree node={tree} selected={null} onSelect={() => {}} filter="" isRoot collapseKey={1} />
    );
    expect(screen.queryByText("index.ts")).toBeNull();
  });

  it("virtualizes large trees and preserves filtering and selection", () => {
    const large: TreeNode = {
      name: "root",
      path: "/root",
      children: Array.from({ length: 1000 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/root/file${i}.txt`,
      })),
    };
    const onSelect = vi.fn();
    const { rerender } = render(
      <FileTree node={large} selected={null} onSelect={onSelect} filter="" isRoot />
    );
    // Only a subset of rows should be rendered due to virtualization.
    expect(screen.getAllByTestId("file-text").length).toBeLessThanOrEqual(25);
    expect(screen.queryByText("file999.txt")).toBeNull();
    rerender(
      <FileTree node={large} selected={null} onSelect={onSelect} filter="file999" isRoot />
    );
    const target = screen.getByText("file999.txt");
    fireEvent.click(target);
    expect(onSelect).toHaveBeenCalledWith("/root/file999.txt");
  });
});

