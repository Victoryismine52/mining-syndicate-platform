import React, { useState } from "react";
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
}

function matchesFilter(node: TreeNode, filter: string): boolean {
  if (!filter) return true;
  const lower = filter.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  return node.children?.some((c) => matchesFilter(c, filter)) ?? false;
}

function fileColor(name: string): string {
  if (/\.(ts|tsx|js|jsx)$/.test(name)) return "text-blue-500";
  if (/\.json$/.test(name)) return "text-green-500";
  if (/\.css$/.test(name)) return "text-purple-500";
  return "";
}

export function FileTree({ node, selected, onSelect, filter }: FileTreeProps) {
  const [open, setOpen] = useState(true);
  const isDir = !!node.children;
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

