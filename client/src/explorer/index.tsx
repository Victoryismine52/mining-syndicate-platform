import { createRoot } from "react-dom/client";
import { CodeExplorerApp } from "../../../packages/code-explorer";
import "@/index.css";

createRoot(document.getElementById("root")!).render(<CodeExplorerApp />);
