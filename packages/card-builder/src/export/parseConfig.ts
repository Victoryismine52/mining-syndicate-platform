import { ElementInstance, elementLibrary, DisplayMode } from "../elements";
import { CardConfig } from "./types";

export function parseConfig(json: string): CardConfig | null {
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
          .filter(Boolean as any)
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
