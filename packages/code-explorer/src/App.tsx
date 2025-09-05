import React, { useState, useEffect } from "react";
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
import {
  CompositionCanvas,
  CompositionNode,
  Edge,
} from "./components/CompositionCanvas";

/**
{
  "friendlyName": "Code Explorer App",
  "description": "Entry component for the Code Explorer, managing home and explorer screens.",
  "editCount": 3,
  "tags": ["ui", "app"],
  "location": "src/App",
  "notes": "Maintains UI state for repository scanning, file viewing and tree collapse."

}
*/
export function CodeExplorerApp() {
  const [screen, setScreen] = useState<"home" | "explorer">("home");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [collapseKey, setCollapseKey] = useState(0);
  const [composition, setComposition] = useState<{
    nodes: CompositionNode[];
    connections: Edge[];
  }>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("composition");
      if (stored) return JSON.parse(stored);
    }
    return { nodes: [], connections: [] };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("composition", JSON.stringify(composition));
    }
  }, [composition]);


  /**
  {
    "friendlyName": "handle repository scan",
    "description": "Clones the repository and builds the file tree before switching to explorer view.",
    "editCount": 2,
    "tags": ["data", "repo"],
    "location": "src/App > handleScan",
    "notes": "Sets status messages for import progress and handles failure states."
  }
  */
  async function handleScan(repo: string) {
    setStatus("Import started");
    setLoading(true);
    try {
      const res = await fetch("/code-explorer/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      if (!res.ok) throw new Error("clone failed");
      const data = await res.json();
      setTree(data);
      setStatus("");
      setScreen("explorer");
    } catch {
      setStatus("Import failed");
    } finally {
      setLoading(false);
    }
  }

  /**
  {
    "friendlyName": "handle import action",
    "description": "Validates user-entered GitHub URL and triggers repository scan.",
    "editCount": 2,
    "tags": ["user-input", "repo"],
    "location": "src/App > handleImport",
    "notes": "Closes the dialog and clears previous errors before scanning."
  }
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

  /**
  {
    "friendlyName": "collapse file tree",
    "description": "Collapses all folders in the file tree to root level.",
    "editCount": 1,
    "tags": ["ui", "tree"],
    "location": "src/App > collapseAll",
    "notes": "Triggers FileTree components via an incrementing key."
  }
  */
  function collapseAll() {
    setCollapseKey((k) => k + 1);
  }

  function openTab(path: string) {
    setTabs((prev) => {
      const idx = prev.indexOf(path);
      if (idx !== -1) {
        setActive(idx);
        return prev;
      }
      setActive(prev.length);
      return [...prev, path];
    });
  }

  function closeTab(index: number) {
    setTabs((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setActive((a) => {
        if (a === index) return index > 0 ? index - 1 : 0;
        if (a > index) return a - 1;
        return a;
      });
      return next;
    });
  }

  if (screen === "home") {
    return (
      <div className="p-6 flex flex-col items-center">
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
        {status && (
          <p className={`mt-4 text-sm ${status.includes("failed") ? "text-red-500" : ""}`}>
            {status}
          </p>
        )}
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
    const activePath = tabs[active];
    const relative = activePath && tree ? activePath.replace(tree.path + "/", "") : null;
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r p-2 flex flex-col">
          <Button variant="outline" size="sm" className="mb-2" onClick={() => setScreen("home")}>Back</Button>
          <Button variant="outline" size="sm" className="mb-2" onClick={collapseAll}>Collapse All</Button>
          <Input
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-2"
          />
          {loading && <p className="text-sm">Cloning...</p>}
          {tree && (
            <FileTree
              node={tree}
              selected={activePath}
              onSelect={openTab}
              filter={filter}
              collapseKey={collapseKey}
              isRoot
            />
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {tabs.length ? (
            <div className="flex h-full gap-4">
              <div className="flex-1">
                <div className="mb-2 flex border-b text-sm" data-testid="tab-bar">
                  {tabs.map((t, i) => {
                    const rel = tree ? t.replace(tree.path + "/", "") : t;
                    return (
                      <div
                        key={t}
                        className={`px-2 py-1 cursor-pointer flex items-center ${
                          i === active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        }`}
                        onClick={() => setActive(i)}
                      >
                        <span>{rel}</span>
                        <button
                          aria-label="Close"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(i);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                {activePath && <FileViewer path={activePath} />}
              </div>
              <div className="w-1/2 border-l pl-4">
                <CompositionCanvas
                  functions={relative ? [relative] : []}
                  nodes={composition.nodes}
                  connections={composition.connections}
                  onUpdate={setComposition}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a file to view</p>
          )}
        </div>
      </div>
    );
  }

  return <div />;
}

