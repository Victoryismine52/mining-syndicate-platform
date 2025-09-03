import React, { useState } from "react";

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

function FileTree({ node }: { node: TreeNode }) {
  if (!node.children) return null;
  return (
    <ul className="ml-4">
      {node.children.map((child) => (
        <li key={child.path}>
          {child.children ? (
            <>
              <span className="font-semibold">{child.name}</span>
              <FileTree node={child} />
            </>
          ) : (
            <span>{child.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function CodeExplorerApp() {
  const [repo, setRepo] = useState("");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    setLoading(true);
    const res = await fetch("/explorer/api/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    });
    const data = await res.json();
    setTree(data);
    setLoading(false);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Code Explorer</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/user/repo.git"
          className="border px-2 py-1 flex-grow"
        />
        <button
          onClick={handleScan}
          className="px-4 py-1 bg-blue-600 text-white"
        >
          Scan
        </button>
      </div>
      {loading && <p>Cloning...</p>}
      {tree && <FileTree node={tree} />}
    </div>
  );
}
