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
  const [tag, setTag] = useState("");

  const tags = React.useMemo(() => {
    const set = new Set<string>();
    for (const fn of functions) {
      fn.tags.forEach((t) => set.add(t));
    }
    return Array.from(set).sort();
  }, [functions]);

  useEffect(() => {
    fetch("/code-explorer/api/functions")
      .then((res) => res.json())
      .then((data) => setFunctions(data))
      .catch(() => setFunctions([]));
  }, []);

  const filtered = functions.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) &&
      (tag === "" || f.tags.includes(tag))
  );

  return (
    <div className="w-32 border-r p-2" data-testid="function-browser">
      <div className="mb-2 flex gap-1">
        <input
          className="flex-1 border rounded px-1 py-0.5 text-xs"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="function-search"
        />
        <select
          className="border rounded px-1 py-0.5 text-xs"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          data-testid="tag-filter"
        >
          <option value="">All</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
          {fn.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {fn.tags.map((t) => (
                <span
                  key={t}
                  className="border rounded px-1"
                  data-testid={`tag-${t}`}
                >
                  {t}
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
