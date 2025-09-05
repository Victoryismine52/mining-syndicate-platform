import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { generateOpenApi } from "./exportApi";

// ---- Data element library -------------------------------------------------
type DisplayMode = "display" | "input" | "edit";

export type ElementDefinition = {
  id: string;
  label: string;
  type: "text" | "number" | "image" | "button";
  displayModes: DisplayMode[];
  defaultProps: Record<string, any>;
  validation?: Record<string, any>;
};

export const elementLibrary: ElementDefinition[] = [
  {
    id: "title",
    label: "Title",
    type: "text",
    displayModes: ["display"],
    defaultProps: { label: "Sample Title" },
    validation: { required: true },
  },
  {
    id: "description",
    label: "Description",
    type: "text",
    displayModes: ["display"],
    defaultProps: { label: "Sample description" },
  },
  {
    id: "image",
    label: "Image",
    type: "image",
    displayModes: ["display"],
    defaultProps: {
      src: "https://via.placeholder.com/300x100?text=Image",
      alt: "sample image",
    },
  },
  {
    id: "input",
    label: "Input Field",
    type: "text",
    displayModes: ["input"],
    defaultProps: { label: "Field", placeholder: "Enter text" },
    validation: { required: false },
  },
  {
    id: "button",
    label: "Button",
    type: "button",
    displayModes: ["display"],
    defaultProps: { label: "Click" },
  },
];

// ---- Palette item ---------------------------------------------------------
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

// ---- Card canvas ----------------------------------------------------------
export function CardCanvas({
  theme,
  shadow,
  lighting,
  animation,
  children,
}: {
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
  children: React.ReactNode;
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
      {children}
    </div>
  );
}

// ---- Card item ------------------------------------------------------------
export type ElementInstance = {
  id: string;
  elementId: string;
  displayMode: DisplayMode;
  props: Record<string, any>;
};

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
            placeholder={
              item.props.placeholder || def.defaultProps.placeholder
            }
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

// ---- Code serialization helpers -----------------------------------------
export function buildConfig({
  name,
  elements,
  theme,
  shadow,
  lighting,
  animation,
}: {
  name: string;
  elements: ElementInstance[];
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
}) {
  return {
    name,
    theme,
    shadow,
    lighting,
    animation,
    elements: elements.map((el) => ({
      id: el.id,
      elementId: el.elementId,
      displayMode: el.displayMode,
      props: el.props,
    })),
  };
}

export function parseConfig(json: string): {
  name: string;
  elements: ElementInstance[];
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
} | null {
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    const elements: ElementInstance[] = Array.isArray(obj.elements)
      ? obj.elements
          .map((el: any) => {
            const def = elementLibrary.find((d) => d.id === el.elementId);
            if (!def) return null;
            const mode: DisplayMode = def.displayModes.includes(el.displayMode)
              ? el.displayMode
              : def.displayModes[0];
            return {
              id: el.id || Date.now().toString(),
              elementId: def.id,
              displayMode: mode,
              props: el.props || {},
            };
          })
          .filter(Boolean)
      : [];
    return {
      name: typeof obj.name === "string" ? obj.name : "Untitled Card",
      elements,
      theme: obj.theme || "light",
      shadow: obj.shadow || "none",
      lighting: obj.lighting || "none",
      animation: obj.animation || "none",
    };
  } catch (e) {
    return null;
  }
}

// ---- Main app ------------------------------------------------------------
export interface CardConfig {
  name: string;
  elements: ElementInstance[];
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
}

export function CardEditor({ initial, onSave, onBack }: { initial?: CardConfig; onSave: (config: CardConfig) => void; onBack: () => void; }) {
  const [name, setName] = useState("Untitled Card");
  const [elements, setElements] = useState<ElementInstance[]>([]);
  const [theme, setTheme] = useState("light");
  const [shadow, setShadow] = useState("none");
  const [lighting, setLighting] = useState("none");
  const [animation, setAnimation] = useState("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("{}");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setElements(initial.elements || []);
      setTheme(initial.theme);
      setShadow(initial.shadow);
      setLighting(initial.lighting);
      setAnimation(initial.animation);
    }
  }, [initial]);

  useEffect(() => {
    setCode(
      JSON.stringify(
        buildConfig({ name, elements, theme, shadow, lighting, animation }),
        null,
        2,
      ),
    );
  }, [name, elements, theme, shadow, lighting, animation]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (!over) return;

    // dropping from palette onto card
    if (active.data.current?.from === "palette" && over.id === "card") {
      const def = elementLibrary.find((d) => d.id === active.id);
      if (!def) return;
      let mode: DisplayMode = def.displayModes[0];
      if (def.displayModes.length > 1) {
        const input = window.prompt(
          `Display mode (${def.displayModes.join(",")}):`,
          def.displayModes[0],
        );
        if (input && def.displayModes.includes(input as DisplayMode)) {
          mode = input as DisplayMode;
        }
      }
      const instance: ElementInstance = {
        id: Date.now().toString(),
        elementId: def.id,
        displayMode: mode,
        props: { ...def.defaultProps },
      };
      setElements((els) => [...els, instance]);
      return;
    }

    // reorder within card
    if (active.data.current?.from === "card" && over.id !== "card") {
      const oldIndex = elements.findIndex((el) => el.id === active.id);
      const newIndex = elements.findIndex((el) => el.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setElements((els) => arrayMove(els, oldIndex, newIndex));
      }
    }
  };

  const removeElement = (id: string) => {
    setElements((els) => els.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = elements.find((el) => el.id === selectedId) || null;

  const updateSelected = (props: Record<string, any>) => {
    if (!selected) return;
    setElements((els) =>
      els.map((el) =>
        el.id === selected.id ? { ...el, props: { ...el.props, ...props } } : el,
      ),
    );
  };

  const exportAssets = () => {
    const config = buildConfig({
      name,
      elements,
      theme,
      shadow,
      lighting,
      animation,
    });

    // Export configuration as JSON
    const data = JSON.stringify(config, null, 2);
    const jsonBlob = new Blob([data], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = "card.json";
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // Export OpenAPI spec as YAML
    const yaml = generateOpenApi(config);
    const yamlBlob = new Blob([yaml], { type: "application/yaml" });
    const yamlUrl = URL.createObjectURL(yamlBlob);
    const yamlLink = document.createElement("a");
    yamlLink.href = yamlUrl;
    yamlLink.download = "card.yaml";
    yamlLink.click();
    URL.revokeObjectURL(yamlUrl);
  };

  const applyCode = () => {
    const parsed = parseConfig(code);
    if (!parsed) {
      alert("Invalid JSON configuration");
      return;
    }
    setName(parsed.name);
    setElements(parsed.elements);
    setTheme(parsed.theme);
    setShadow(parsed.shadow);
    setLighting(parsed.lighting);
    setAnimation(parsed.animation);
    setShowCode(false);
  };

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="flex gap-2 items-center flex-wrap">
        <label>Name:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border px-2 py-1"
        />
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

        <label>Shadow:</label>
        <select
          value={shadow}
          onChange={(e) => setShadow(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="none">None</option>
          <option value="soft">Soft</option>
          <option value="strong">Strong</option>
        </select>

        <label>Lighting:</label>
        <select
          value={lighting}
          onChange={(e) => setLighting(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="none">None</option>
          <option value="glow">Glow</option>
          <option value="neon">Neon</option>
        </select>

        <label>Animation:</label>
        <select
          value={animation}
          onChange={(e) => setAnimation(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="none">None</option>
          <option value="fade">Fade In</option>
          <option value="hover">Hover Grow</option>
        </select>

        <Button onClick={onBack} variant="outline">Back</Button>
        <Button
          onClick={() =>
            onSave(
              buildConfig({ name, elements, theme, shadow, lighting, animation }),
            )
          }
        >
          Save
        </Button>
        <Button onClick={() => setShowCode((v) => !v)} className="ml-auto">
          {showCode ? "Design View" : "Code View"}
        </Button>
        <Button onClick={exportAssets} variant="secondary">
          Export Assets
        </Button>
      </div>

      {showCode ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border p-2 font-mono h-80"
          />
          <div>
            <Button onClick={applyCode} className="mr-2">Apply</Button>
            <Button onClick={() => setShowCode(false)} variant="outline">Cancel</Button>
          </div>
        </div>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            <div>
              {elementLibrary.map((def) => (
                <PaletteItem key={def.id} def={def} />
              ))}
            </div>
            <CardCanvas
              theme={theme}
              shadow={shadow}
              lighting={lighting}
              animation={animation}
            >
              <SortableContext
                items={elements.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {elements.map((el) => (
                  <CardItem
                    key={el.id}
                    item={el}
                    onRemove={removeElement}
                    onSelect={(id) => setSelectedId(id)}
                    selected={selectedId === el.id}
                  />
                ))}
              </SortableContext>
            </CardCanvas>
          </div>
        </DndContext>
      )}

      {selected && (
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
                  onChange={(e) =>
                    updateSelected({ placeholder: e.target.value })
                  }
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
      )}
    </div>
  );
}

