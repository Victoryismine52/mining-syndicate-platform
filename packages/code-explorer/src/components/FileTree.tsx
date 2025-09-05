import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FileText } from "lucide-react";
import clsx from "clsx";

export interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

interface FileTreeProps {
  node: TreeNode;
  selected?: string | null;
  onSelect: (path: string) => void;
  filter: string;
  collapseKey?: number;
  isRoot?: boolean;
}

/**
{
  "friendlyName": "matches filter",
  "description": "Checks if a tree node or its descendants match the search filter.",
  "editCount": 2,
  "tags": [],
  "location": "packages/code-explorer/src/components/FileTree.tsx > matchesFilter",
  "notes": "Recursively examines child nodes."
}
*/
function matchesFilter(node: TreeNode, filter: string): boolean {
  if (!filter) return true;
  const lower = filter.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  return node.children?.some((c) => matchesFilter(c, filter)) ?? false;
}

/**
{
  "friendlyName": "file color",
  "description": "Returns a Tailwind text color class based on file extension.",
  "editCount": 2,
  "tags": [],
  "location": "packages/code-explorer/src/components/FileTree.tsx > fileColor",
  "notes": "Used for syntax-aware coloring in the tree."
}
*/
function fileColor(name: string): string {
  if (/\.(ts|tsx|js|jsx)$/.test(name)) return "text-blue-500";
  if (/\.json$/.test(name)) return "text-green-500";
  if (/\.css$/.test(name)) return "text-purple-500";
  return "";
}

/**
{
  "friendlyName": "file tree",
  "description": "Renders a collapsible file tree with selectable nodes.",
  "editCount": 2,
  "tags": ["ui", "tree"],
  "location": "src/components/FileTree",
  "notes": "Highlights selected path, supports search filtering and collapse-all."
}
*/
export function FileTree({
  node,
  selected,
  onSelect,
  filter,
  collapseKey = 0,
  isRoot = false,
}: FileTreeProps) {
  const [open, setOpen] = useState(isRoot);
  const isDir = !!node.children;
  useEffect(() => {
    if (isDir) setOpen(isRoot);
  }, [collapseKey, isDir, isRoot]);
  if (!matchesFilter(node, filter)) return null;
  return (
    <div className="ml-2">
      <div
        className={clsx(
          "flex items-center cursor-pointer py-0.5",
          selected === node.path && "bg-accent text-accent-foreground"
        )}
        onClick={() => {
          if (isDir) setOpen((o) => !o);
          else onSelect(node.path);
        }}
      >
        {isDir ? (
          open ? (
            <ChevronDown className="mr-1 h-4 w-4" />
          ) : (
            <ChevronRight className="mr-1 h-4 w-4" />
          )
        ) : (
          <FileText className={clsx("mr-1 h-4 w-4", fileColor(node.name))} />
        )}
        {isDir && <Folder className="mr-1 h-4 w-4" />}
        <span className={clsx(isDir ? "font-semibold" : fileColor(node.name))}>
          {node.name}
        </span>
      </div>
      {isDir && open && (
        <div className="ml-4">
          {node.children?.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              selected={selected}
              onSelect={onSelect}
              filter={filter}
              collapseKey={collapseKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

