import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const palette = [
  { id: "button", label: "Button" },
  { id: "field", label: "Field" },
];

function PaletteItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="border p-2 mb-2 cursor-move bg-gray-200"
    >
      {label}
    </div>
  );
}

function CardCanvas({ theme, children }: { theme: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "card" });
  const themeClass =
    theme === "dark"
      ? "bg-gray-900 text-white"
      : theme === "neon"
      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
      : "bg-white text-black";
  return (
    <div
      ref={setNodeRef}
      className={`w-96 h-60 border relative ${themeClass}`}
      style={{ perspective: "1000px" }}
    >
      {children}
    </div>
  );
}

type ElementItem = { id: string; type: string; x: number; y: number };

export function CardBuilderApp() {
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [theme, setTheme] = useState("light");

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (over && over.id === "card") {
      const newEl: ElementItem = {
        id: Date.now().toString(),
        type: active.id as string,
        x: 10 + elements.length * 10,
        y: 10 + elements.length * 10,
      };
      setElements((els) => [...els, newEl]);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <label>Theme:</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="neon">Neon</option>
        </select>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          <div>
            {palette.map((p) => (
              <PaletteItem key={p.id} id={p.id} label={p.label} />
            ))}
          </div>
          <CardCanvas theme={theme}>
            {elements.map((el) => (
              <div
                key={el.id}
                className="absolute p-2 shadow-md"
                style={{ left: el.x, top: el.y, transform: "translateZ(20px)" }}
              >
                {el.type === "button" ? (
                  <button className="px-2">Button</button>
                ) : (
                  <input
                    className="border px-1"
                    placeholder="Field"
                    type="text"
                  />
                )}
              </div>
            ))}
          </CardCanvas>
        </div>
      </DndContext>
    </div>
  );
}
