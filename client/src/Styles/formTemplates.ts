// client/src/styles/formTemplates.ts
export type FormTemplate = {
  wrapper: string;
  label: string;
  input: string;
  textarea: string;
  select: string;
  checkbox: string;
  file: string;
  error: string;
  button: string;
};

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  default: {
    wrapper: "space-y-3",
    label: "text-sm font-medium",
    input: "mt-1 w-full rounded-lg border p-2",
    textarea: "mt-1 w-full rounded-lg border p-2",
    select: "mt-1 w-full rounded-lg border p-2",
    checkbox: "h-4 w-4",
    file: "w-full",
    error: "text-xs text-red-600",
    button: "rounded-lg bg-black px-3 py-1 text-white disabled:opacity-50",
  },
  bordered: {
    wrapper: "space-y-4 border p-4 rounded-xl bg-gray-50",
    label: "text-sm font-semibold",
    input: "mt-1 w-full border border-gray-300 p-2 rounded-md",
    textarea: "mt-1 w-full border border-gray-300 p-2 rounded-md",
    select: "mt-1 w-full border border-gray-300 p-2 rounded-md",
    checkbox: "h-5 w-5 text-blue-600",
    file: "w-full border border-dashed p-3 rounded-md",
    error: "text-xs text-red-500 italic",
    button: "rounded-lg bg-blue-600 px-3 py-1 text-white disabled:opacity-50",
  },
  // add more templates as needed
};
