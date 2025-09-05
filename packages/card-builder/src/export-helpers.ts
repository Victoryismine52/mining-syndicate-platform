import { ElementInstance, elementLibrary, DisplayMode } from "./elements";
import { generateOpenApi } from "./exportApi";

export interface CardConfig {
  name: string;
  elements: ElementInstance[];
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
}

export function buildConfig({
  name,
  elements,
  theme,
  shadow,
  lighting,
  animation,
}: CardConfig) {
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

export function exportAssets(config: CardConfig) {
  const data = JSON.stringify(config, null, 2);
  const jsonBlob = new Blob([data], { type: "application/json" });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement("a");
  jsonLink.href = jsonUrl;
  jsonLink.download = "card.json";
  jsonLink.click();
  URL.revokeObjectURL(jsonUrl);

  const yaml = generateOpenApi(config);
  const yamlBlob = new Blob([yaml], { type: "application/yaml" });
  const yamlUrl = URL.createObjectURL(yamlBlob);
  const yamlLink = document.createElement("a");
  yamlLink.href = yamlUrl;
  yamlLink.download = "card.yaml";
  yamlLink.click();
  URL.revokeObjectURL(yamlUrl);
}
