/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
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
});

