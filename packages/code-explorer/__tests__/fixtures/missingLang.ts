import { vi } from "vitest";

// Simulate a missing CodeMirror language module by throwing on import.
vi.mock("@codemirror/lang-javascript", () => {
  throw new Error("Cannot find module '@codemirror/lang-javascript'");
});
