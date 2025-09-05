import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ElementDefinition } from "../elements";

function PaletteItem({ def }: { def: ElementDefinition }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: def.id,
    data: { from: "palette" },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="border p-2 mb-2 cursor-move bg-gray-200 text-sm"
    >
      {def.label}
    </div>
  );
}

export function Palette({ elements }: { elements: ElementDefinition[] }) {
  return <div>{elements.map((def) => <PaletteItem key={def.id} def={def} />)}</div>;
}
