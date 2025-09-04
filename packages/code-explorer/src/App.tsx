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
import { FileTree, TreeNode } from "./components/FileTree";
import { FileViewer } from "./components/FileViewer";

/**
 * Type: React component
 * Location: packages/code-explorer/src/App.tsx > CodeExplorerApp
 * Description: Entry component for the Code Explorer, managing home and explorer screens.
 * Notes: Maintains UI state for repository scanning and file viewing.
 * EditCounter: 1
 */
export function CodeExplorerApp() {
  const [screen, setScreen] = useState<"home" | "explorer">("home");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  /**
   * Type: Async function
   * Location: packages/code-explorer/src/App.tsx > CodeExplorerApp > handleScan
   * Description: Calls backend to clone the repo and build the file tree, then switches to explorer view.
   * Notes: Updates loading state while request is in flight.
   * EditCounter: 1
   */
  async function handleScan(repo: string) {
    setLoading(true);
    const res = await fetch("/code-explorer/api/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    });
    const data = await res.json();
    setTree(data);
    setLoading(false);
    setScreen("explorer");
  }

  /**
   * Type: Function
   * Location: packages/code-explorer/src/App.tsx > CodeExplorerApp > handleImport
   * Description: Validates user-entered GitHub URL and triggers repository scan.
   * Notes: Displays error message for invalid URLs.
   * EditCounter: 1
   */
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

  if (screen === "explorer") {
    const relative = selected && tree ? selected.replace(tree.path + "/", "") : null;
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r p-2 flex flex-col">
          <Button variant="outline" size="sm" className="mb-2" onClick={() => setScreen("home")}>Back</Button>
          <Input
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-2"
          />
          {loading && <p className="text-sm">Cloning...</p>}
          {tree && <FileTree node={tree} selected={selected} onSelect={setSelected} filter={filter} />}
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {selected ? (
            <>
              <div className="text-sm text-muted-foreground mb-2">{relative}</div>
              <FileViewer path={selected} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a file to view</p>
          )}
        </div>
      </div>
    );
  }

  return <div />;
}

