import { useState } from "react";
import { arrayMove, DragEndEvent } from "@dnd-kit/sortable";
import { ElementInstance, elementLibrary, DisplayMode } from "../elements";

export function useDragAndDrop(initial: ElementInstance[] = []) {
  const [elements, setElements] = useState<ElementInstance[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (!over) return;

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

  return {
    elements,
    setElements,
    selectedId,
    setSelectedId,
    handleDragEnd,
    removeElement,
    selected,
    updateSelected,
  };
}
