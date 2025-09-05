# Syntax Highlighting

The Code Explorer uses [Prism](https://prismjs.com/) to render source code snippets.

## `highlightCode` utility
- **Location:** `src/utils/highlight.ts`
- Exports `highlightCode(code, language)` which returns HTML for Prism to render.
- If the requested grammar is missing or throws, the function returns the original code string to avoid runtime crashes.

## Adding a new language grammar
1. Import the Prism component for the language in `src/utils/highlight.ts`, e.g.:
   ```ts
   import "prismjs/components/prism-python";
   ```
2. Pass the language key when calling `highlightCode` in components:
   ```ts
   highlightCode(source, "python");
   ```

If the grammar is not registered, `highlightCode` falls back to plain text.

## Future extensibility
- Lazy‑load grammar modules to keep bundle size small.
- Add automatic language detection based on file extension.
- Support alternative highlighters if Prism becomes a bottleneck.
