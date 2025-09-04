import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import { Button } from "@/components/ui/button";

interface Props {
  path: string;
}

/**
 * Type: React component
 * Location: packages/code-explorer/src/components/FileViewer.tsx > FileViewer
 * Description: Fetches and displays highlighted source code with line numbers.
 * Notes: Provides copy and fullscreen controls for the current file.
 * EditCounter: 1
 */
export function FileViewer({ path }: Props) {
  const [code, setCode] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    /**
     * Type: Async helper function
     * Location: packages/code-explorer/src/components/FileViewer.tsx > useEffect load
     * Description: Retrieves file contents from the backend for the specified path.
     * Notes: Updates local state once the content is loaded.
     * EditCounter: 1
     */
    async function load() {
      const res = await fetch(`/code-explorer/api/file?path=${encodeURIComponent(path)}`);
      const text = await res.text();
      setCode(text);
    }
    if (path) load();
  }, [path]);

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  const lines = code.split("\n");

  return (
    <div className={fullscreen ? "fixed inset-4 bg-background z-50 p-4" : "relative"}>
      <div className="mb-2 flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigator.clipboard.writeText(code)}
        >
          Copy
        </Button>
        <Button size="sm" variant="outline" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? "Exit" : "Full screen"}
        </Button>
      </div>
      <div className="overflow-auto h-full border rounded">
        <pre className="language-tsx text-sm flex">
          <code className="text-right pr-4 select-none border-r">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </code>
          <code className="pl-4" dangerouslySetInnerHTML={{ __html: Prism.highlight(code, Prism.languages.tsx, "tsx") }} />
        </pre>
      </div>
    </div>
  );
}

