import React, { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { Extension } from "@codemirror/state";
import { createTwoFilesPatch } from "diff";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  path: string;
}

/**
{
  "friendlyName": "file viewer",
  "description": "Fetches and displays highlighted source code with line numbers.",
  "editCount": 4,
  "tags": ["ui", "code"],
  "location": "src/components/FileViewer",
  "notes": "Provides copy and fullscreen controls for the current file."
}
*/
export async function loadLanguageFromPath(path: string): Promise<Extension[]> {
  const ext = path.split(".").pop()?.toLowerCase();
  const loaders: Record<string, () => Promise<Extension>> = {
    js: () =>
      import(/* @vite-ignore */ "@codemirror/lang-javascript").then((m) =>
        m.javascript()
      ),
    jsx: () =>
      import(/* @vite-ignore */ "@codemirror/lang-javascript").then((m) =>
        m.javascript({ jsx: true })
      ),
    ts: () =>
      import(/* @vite-ignore */ "@codemirror/lang-javascript").then((m) =>
        m.javascript({ typescript: true })
      ),
    tsx: () =>
      import(/* @vite-ignore */ "@codemirror/lang-javascript").then((m) =>
        m.javascript({ jsx: true, typescript: true })
      ),
    json: () =>
      import(/* @vite-ignore */ "@codemirror/lang-json").then((m) => m.json()),
    css: () =>
      import(/* @vite-ignore */ "@codemirror/lang-css").then((m) => m.css()),
    html: () =>
      import(/* @vite-ignore */ "@codemirror/lang-html").then((m) => m.html()),
  };
  try {
    const lang = await loaders[ext ?? ""]?.();
    return lang ? [lang] : [];
  } catch {
    return [];
  }
}

export function FileViewer({ path }: Props) {
  const [code, setCode] = useState("");
  const [original, setOriginal] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    /**
    {
      "friendlyName": "load file",
      "description": "Retrieves file contents from the backend for the specified path.",
      "editCount": 2,
      "tags": [],
      "location": "packages/code-explorer/src/components/FileViewer.tsx > useEffect load",
      "notes": "Updates local state once the content is loaded."
    }
    */
    async function load() {
      const res = await fetch(`/code-explorer/api/file?path=${encodeURIComponent(path)}`);
      const text = await res.text();
      setCode(text);
      setOriginal(text);
    }
    if (path) load();
  }, [path]);

  useEffect(() => {
    loadLanguageFromPath(path).then(setExtensions);
  }, [path]);

  async function handleSave() {
    const patch = createTwoFilesPatch(path, path, original, code);
    const res = await fetch(`/code-explorer/api/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, patch }),
    });
    if (res.ok) {
      toast({ title: "File saved" });
      setOriginal(code);
    } else {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

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
        <Button size="sm" variant="outline" onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? "Exit" : "Full screen"}
        </Button>
      </div>
      <div className="overflow-auto h-full border rounded">
        <CodeMirror
          value={code}
          height="100%"
          extensions={extensions}
          onChange={(value) => setCode(value)}
        />
      </div>
    </div>
  );
}

