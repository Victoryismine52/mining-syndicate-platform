import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";

export interface CompositionNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Edge {
  from: string;
  to: string;
}

interface Props {
  nodes: CompositionNode[];
  connections: Edge[];
  onUpdate(state: { nodes: CompositionNode[]; connections: Edge[] }): void;
}

/**
 * Basic composition canvas allowing drag-and-drop of function nodes and wiring.
 */
export function CompositionCanvas({ nodes, connections, onUpdate }: Props) {
  const [localNodes, setLocalNodes] = useState<CompositionNode[]>(nodes);
  const [localConnections, setLocalConnections] = useState<Edge[]>(connections);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    setLocalNodes(nodes);
    setLocalConnections(connections);
  }, [nodes, connections]);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const fn = e.dataTransfer.getData("text/plain");
    if (!fn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node: CompositionNode = { id: nanoid(), name: fn, x, y };
    const updated = { nodes: [...localNodes, node], connections: localConnections };
    setLocalNodes(updated.nodes);
    onUpdate(updated);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function startConnection(id: string) {
    setPending(id);
  }

  function finishConnection(id: string) {
    if (pending && pending !== id) {
      const edge = { from: pending, to: id };
      const updated = { nodes: localNodes, connections: [...localConnections, edge] };
      setLocalConnections(updated.connections);
      onUpdate(updated);
    }
    setPending(null);
  }

  return (
    <div
      className="flex-1 relative bg-white"
      data-testid="canvas"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <svg className="absolute inset-0 pointer-events-none">
        {localConnections.map((c) => {
          const from = localNodes.find((n) => n.id === c.from);
          const to = localNodes.find((n) => n.id === c.to);
          if (!from || !to) return null;
          const x1 = from.x + 120;
          const y1 = from.y + 25;
          const x2 = to.x;
          const y2 = to.y + 25;
          return (
            <line
              key={`${c.from}-${c.to}`}
              data-testid={`edge-${c.from}-${c.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="black"
            />
          );
        })}
      </svg>
      {localNodes.map((n) => (
        <div
          key={n.id}
          className="absolute border rounded p-2 bg-background text-xs"
          style={{ left: n.x, top: n.y, width: 120 }}
        >
          <div>{n.name}</div>
          <div className="flex justify-between mt-2">
            <div
              className="w-3 h-3 bg-blue-500 rounded-full cursor-pointer"
              data-testid={`input-${n.id}`}
              onClick={() => finishConnection(n.id)}
            />
            <div
              className="w-3 h-3 bg-green-500 rounded-full cursor-pointer"
              data-testid={`output-${n.id}`}
              onClick={() => startConnection(n.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

