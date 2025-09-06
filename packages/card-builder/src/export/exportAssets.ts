import type { CardConfig } from "./types";
import { exportApi } from "../exportApi";

export function exportAssets(config: CardConfig) {
  const data = JSON.stringify(config, null, 2);
  const jsonBlob = new Blob([data], { type: "application/json" });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement("a");
  jsonLink.href = jsonUrl;
  jsonLink.download = "card.json";
  jsonLink.click();
  URL.revokeObjectURL(jsonUrl);

  const yaml = exportApi(config);
  const yamlBlob = new Blob([yaml], { type: "application/yaml" });
  const yamlUrl = URL.createObjectURL(yamlBlob);
  const yamlLink = document.createElement("a");
  yamlLink.href = yamlUrl;
  yamlLink.download = "card.yaml";
  yamlLink.click();
  URL.revokeObjectURL(yamlUrl);
}
