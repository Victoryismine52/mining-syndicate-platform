import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ElementInstance, elementLibrary } from "../elements";

function CardItem({
  item,
  onRemove,
  onSelect,
  selected,
}: {
  item: ElementInstance;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, data: { from: "card" } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const def = elementLibrary.find((d) => d.id === item.elementId)!;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(item.id)}
      className={`relative border p-2 bg-white text-black cursor-move ${
        selected ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <button
        onClick={() => onRemove(item.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
      >
        ×
      </button>
      {def.type === "text" && item.displayMode !== "input" && (
        <div>{item.props.label || def.defaultProps.label}</div>
      )}
      {def.type === "text" && item.displayMode === "input" && (
        <div>
          <label className="block mb-1">
            {item.props.label || def.defaultProps.label}
          </label>
          <input
            className="border px-1"
            placeholder={item.props.placeholder || def.defaultProps.placeholder}
          />
        </div>
      )}
      {def.type === "number" && (
        <div>{item.props.value ?? 0}</div>
      )}
      {def.type === "image" && (
        <img
          src={item.props.src || def.defaultProps.src}
          alt={item.props.alt || def.defaultProps.alt}
          className="w-full h-24 object-cover"
        />
      )}
      {def.type === "button" && (
        <button className="px-2 py-1 border">
          {item.props.label || def.defaultProps.label}
        </button>
      )}
    </div>
  );
}

export function CardCanvas({
  theme,
  shadow,
  lighting,
  animation,
  elements,
  onRemove,
  onSelect,
  selectedId,
}: {
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
  elements: ElementInstance[];
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: "card" });
  const themeClass =
    theme === "dark"
      ? "bg-gray-900 text-white"
      : theme === "neon"
      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
      : "bg-white text-black";
  const shadowClass =
    shadow === "soft" ? "shadow-md" : shadow === "strong" ? "shadow-xl" : "";
  const lightingClass =
    lighting === "glow"
      ? "ring-2 ring-blue-400"
      : lighting === "neon"
      ? "ring-2 ring-pink-500"
      : "";
  const animationClass =
    animation === "fade"
      ? "animate-in fade-in"
      : animation === "hover"
      ? "transition-transform hover:scale-105"
      : "";
  return (
    <div
      ref={setNodeRef}
      className={`w-96 min-h-[15rem] border p-4 flex flex-col gap-2 ${themeClass} ${shadowClass} ${lightingClass} ${animationClass}`}
    >
      <SortableContext items={elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {elements.map((el) => (
          <CardItem
            key={el.id}
            item={el}
            onRemove={onRemove}
            onSelect={onSelect}
            selected={selectedId === el.id}
          />
        ))}
      </SortableContext>
    </div>
  );
}
