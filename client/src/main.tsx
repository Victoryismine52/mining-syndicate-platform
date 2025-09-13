import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "../../packages/theme-framework";

// Disabled MSW to prevent interference with real API calls
// if (import.meta.env.VITE_VISUAL_DEV === "1") {
//   import("./mocks/browser").then(({ worker }) => worker.start());
// }

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark">
    <App />
  </ThemeProvider>
);
