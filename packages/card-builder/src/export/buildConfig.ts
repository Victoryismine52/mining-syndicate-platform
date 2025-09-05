import { CardConfig } from "./types";

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
