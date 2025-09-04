import React, { useState } from "react";
import { Folder, Github, FilePlus } from "lucide-react";
import { ActionCard } from "./components/ActionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [screen, setScreen] = useState<"home" | "explorer">("home");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");

  async function handleScan(repo: string) {
    setLoading(true);
    const res = await fetch("/explorer/api/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    });
    const data = await res.json();
    setTree(data);
    setLoading(false);
    setScreen("explorer");
  }

  function handleImport() {
    if (!/^https:\/\/github.com\/.+/.test(repoUrl)) {
      setError("Please enter a valid GitHub URL");
      return;
    }
    setShowImport(false);
    setError("");
    handleScan(repoUrl);
  }

  if (screen === "home") {
    return (
      <div className="p-6 flex justify-center">
        <div className="grid gap-6 md:grid-cols-3">
          <ActionCard
            icon={Folder}
            title="Load local directory"
            description="Open a folder from your device"
            cta="Browse"
            onClick={() => alert("File system access not available in this demo")}
          />
          <ActionCard
            icon={Github}
            title="Import GitHub repository"
            description="Clone a public repository"
            cta="Import"
            onClick={() => setShowImport(true)}
          />
          <ActionCard
            icon={FilePlus}
            title="Start a new file"
            description="Create a blank file to edit"
            cta="Create"
            onClick={() => {
              setTree(null);
              setScreen("explorer");
            }}
          />
        </div>
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import repository</DialogTitle>
              <DialogDescription>Enter a public GitHub URL.</DialogDescription>
            </DialogHeader>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button onClick={handleImport}>Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Button variant="outline" className="mb-4" onClick={() => setScreen("home")}>
        Back
      </Button>
      {loading && <p>Cloning...</p>}
      {tree ? <FileTree node={tree} /> : <p className="text-sm text-muted-foreground">No file loaded.</p>}
    </div>
  );
}

