import React from "react";
import { createRoot } from "react-dom/client";
import { CodeExplorerApp } from "../../../packages/code-explorer";

const root = createRoot(document.getElementById("root")!);
root.render(<CodeExplorerApp />);
