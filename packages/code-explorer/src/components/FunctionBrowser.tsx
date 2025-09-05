import React, { useEffect, useState } from "react";

export interface FunctionMeta {
  name: string;
  signature: string;
  path: string;
  tags: string[];
}

interface Props {
  onSelect?(fn: FunctionMeta): void;
}

/**
 * Displays repository functions and supports dragging them onto the composition canvas.
 */
export function FunctionBrowser({ onSelect }: Props) {
  const [functions, setFunctions] = useState<FunctionMeta[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/functions")
      .then((res) => res.json())
      .then((data) => setFunctions(data))
      .catch(() => setFunctions([]));
  }, []);

  const filtered = functions.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-32 border-r p-2" data-testid="function-browser">
      <input
        className="mb-2 w-full border rounded px-1 py-0.5 text-xs"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="function-search"
      />
      {filtered.map((fn) => (
        <div
          key={`${fn.path}-${fn.name}`}
          draggable
          data-testid={`function-${fn.name}`}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", fn.name);
            onSelect?.(fn);
          }}
          className="p-2 mb-2 border rounded bg-background cursor-move text-xs"
        >
          {fn.name}
        </div>
      ))}
    </div>
  );
}

export default FunctionBrowser;
