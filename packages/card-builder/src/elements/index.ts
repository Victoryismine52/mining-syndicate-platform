export type DisplayMode = "display" | "input" | "edit";

export type ElementDefinition = {
  id: string;
  label: string;
  type: "text" | "number" | "image" | "button";
  displayModes: DisplayMode[];
  defaultProps: Record<string, any>;
  validation?: Record<string, any>;
};

export type ElementInstance = {
  id: string;
  elementId: string;
  displayMode: DisplayMode;
  props: Record<string, any>;
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
