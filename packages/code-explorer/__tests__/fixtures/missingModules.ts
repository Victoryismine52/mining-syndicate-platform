import { vi } from "vitest";

// Simulate missing editor and language modules by throwing on import.
vi.mock("@uiw/react-codemirror", () => {
  throw new Error("Cannot find module '@uiw/react-codemirror'");
});

vi.mock("@codemirror/lang-javascript", () => {
  throw new Error("Cannot find module '@codemirror/lang-javascript'");
});
