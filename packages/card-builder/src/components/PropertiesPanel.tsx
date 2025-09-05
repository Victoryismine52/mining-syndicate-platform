import React from "react";
import { ElementInstance } from "../elements";

export function PropertiesPanel({
  selected,
  updateSelected,
}: {
  selected: ElementInstance | null;
  updateSelected: (props: Record<string, any>) => void;
}) {
  if (!selected) return null;
  return (
    <div className="border p-2 w-96">
      <div className="mb-2 font-bold">Element Properties</div>
      <div className="flex flex-col gap-2">
        <label className="flex gap-2 items-center">
          <span className="w-24">Label</span>
          <input
            className="border px-2 py-1 flex-1"
            value={selected.props.label || ""}
            onChange={(e) => updateSelected({ label: e.target.value })}
          />
        </label>
        {selected.displayMode === "input" && (
          <label className="flex gap-2 items-center">
            <span className="w-24">Placeholder</span>
            <input
              className="border px-2 py-1 flex-1"
              value={selected.props.placeholder || ""}
              onChange={(e) => updateSelected({ placeholder: e.target.value })}
            />
          </label>
        )}
        {selected.elementId === "image" && (
          <label className="flex gap-2 items-center">
            <span className="w-24">Image URL</span>
            <input
              className="border px-2 py-1 flex-1"
              value={selected.props.src || ""}
              onChange={(e) => updateSelected({ src: e.target.value })}
            />
          </label>
        )}
      </div>
    </div>
  );
}
