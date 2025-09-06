import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "../../packages/theme-framework";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark">
    <App />
  </ThemeProvider>
);
