import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DndContext } from "@dnd-kit/core";
import { Palette } from "./components/Palette";
import { CardCanvas } from "./components/CardCanvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { elementLibrary } from "./elements";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import {
  buildConfig,
  parseConfig,
  exportAssets,
  CardConfig,
} from "./export";

export { buildConfig, parseConfig, exportAssets, type CardConfig } from "./export";

export function CardEditor({
  initial,
  onSave,
  onBack,
}: {
  initial?: CardConfig;
  onSave: (config: CardConfig) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("Untitled Card");
  const [theme, setTheme] = useState("light");
  const [shadow, setShadow] = useState("none");
  const [lighting, setLighting] = useState("none");
  const [animation, setAnimation] = useState("none");
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("{}");
  const [codeError, setCodeError] = useState<string | null>(null);

  const {
    elements,
    setElements,
    selected,
    selectedId,
    setSelectedId,
    handleDragEnd,
    removeElement,
    updateSelected,
  } = useDragAndDrop();

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setElements(initial.elements || []);
      setTheme(initial.theme);
      setShadow(initial.shadow);
      setLighting(initial.lighting);
      setAnimation(initial.animation);
    }
  }, [initial, setElements]);

  useEffect(() => {
    const resolvedName = name.trim() || "Untitled Card";
    setCode(
      JSON.stringify(
        buildConfig({
          name: resolvedName,
          elements,
          theme,
          shadow,
          lighting,
          animation,
        }),
        null,
        2,
      ),
    );
  }, [name, elements, theme, shadow, lighting, animation]);

  const applyCode = () => {
    const parsed = parseConfig(code);
    if (!parsed) {
      console.error("Invalid JSON configuration");
      setCodeError("Invalid JSON configuration");
      return;
    }
    setCodeError(null);
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
        <label htmlFor="card-name">Card Name:</label>
        <Input
          id="card-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-48"
          placeholder="Untitled Card"
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
          onClick={() => {
            const config = buildConfig({
              name: name.trim() || "Untitled Card",
              elements,
              theme,
              shadow,
              lighting,
              animation,
            });
            onSave(config);
          }}
        >
          Save
        </Button>
        <Button onClick={() => setShowCode((v) => !v)} className="ml-auto">
          {showCode ? "Design View" : "Code View"}
        </Button>
        <Button
          onClick={() => {
            const config = buildConfig({
              name: name.trim() || "Untitled Card",
              elements,
              theme,
              shadow,
              lighting,
              animation,
            });
            exportAssets(config);
          }}
          variant="secondary"
        >
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
          {codeError && (
            <div className="text-red-600">{codeError}</div>
          )}
          <div>
            <Button onClick={applyCode} className="mr-2">
              Apply
            </Button>
            <Button onClick={() => setShowCode(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            <Palette elements={elementLibrary} />
            <CardCanvas
              theme={theme}
              shadow={shadow}
              lighting={lighting}
              animation={animation}
              elements={elements}
              onRemove={removeElement}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>
        </DndContext>
      )}

      <PropertiesPanel selected={selected} updateSelected={updateSelected} />
    </div>
  );
}
