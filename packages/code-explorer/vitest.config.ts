import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../client/src"),
      "@uiw/react-codemirror": path.resolve(__dirname, "test-stubs/codemirror.tsx"),
      diff: path.resolve(__dirname, "test-stubs/diff.ts"),
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
      "@codemirror/lang-javascript": path.resolve(
        __dirname,
        "test-stubs/lang-javascript.ts"
      ),
      "@codemirror/lang-json": path.resolve(
        __dirname,
        "test-stubs/lang-json.ts"
      ),
      "@codemirror/lang-css": path.resolve(
        __dirname,
        "test-stubs/lang-css.ts"
      ),
      "@codemirror/lang-html": path.resolve(
        __dirname,
        "test-stubs/lang-html.ts"
      ),
    },
  },
  test: {
    setupFiles: path.resolve(__dirname, "./test-setup.tsx"),
    exclude: ["e2e/**"],
  },
});
