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
  const [tagQuery, setTagQuery] = useState("");

  useEffect(() => {
    fetch("/code-explorer/api/functions")
      .then((res) => res.json())
      .then((data) => setFunctions(data))
      .catch(() => setFunctions([]));
  }, []);

  const filtered = functions.filter((f) => {
    const matchesName = f.name.toLowerCase().includes(query.toLowerCase());
    const matchesTag =
      tagQuery === "" ||
      f.tags.map((t) => t.toLowerCase()).includes(tagQuery.toLowerCase());
    return matchesName && matchesTag;
  });

  return (
    <div className="w-32 border-r p-2" data-testid="function-browser">
      <div className="mb-2 flex gap-1">
        <input
          className="w-full border rounded px-1 py-0.5 text-xs"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="function-search"
        />
        <input
          className="w-full border rounded px-1 py-0.5 text-xs"
          placeholder="Tag"
          value={tagQuery}
          onChange={(e) => setTagQuery(e.target.value)}
          data-testid="function-tag-filter"
        />
      </div>
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
          <div>{fn.name}</div>
          {fn.tags?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1" data-testid="function-tags">
              {fn.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-1 text-[10px]"
                  data-testid={`function-tag-${tag}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default FunctionBrowser;
