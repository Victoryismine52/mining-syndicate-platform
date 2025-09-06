import { ElementInstance } from "../elements";

export interface CardConfig {
  /** Human-readable card name */
  name: string;
  elements: ElementInstance[];
  theme: string;
  shadow: string;
  lighting: string;
  animation: string;
}
