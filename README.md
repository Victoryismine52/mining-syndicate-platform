# Mining Syndicate Platform

See [Onboarding Guide](docs/onboarding.md) for setup, tests, and profile conventions. Consult [Exporting Cards](docs/exporting-cards.md) to download card modules with JSON or OpenAPI specs, and follow our [Documentation Style Guide](docs/style-guide.md). Install CodeMirror and its language packages with `npm install` so code snippets can be highlighted.

## Development

- **Full application**: `npm run dev`
  - Starts the Express API and Vite client with `NODE_ENV=development` via [cross-env](https://www.npmjs.com/package/cross-env) for cross‑platform compatibility.
  - Visit `http://localhost:5000` to view the site.
- **Isolated Code Explorer**: `npm run dev:explorer`
  - Launches only the Code Explorer module at `http://localhost:5000/code-explorer`.
  - Shares React, Tailwind and all Shadcn UI components with the main app.
  - Requires `git` and network access to import public repositories.
  - Automatically opens your browser to the explorer page.

Assumptions/Env vars:

- `PORT` (optional) – port for both servers (defaults to `5000`).
- `git` must be available in your PATH for repository cloning.
- No other environment variables are required for local development.

## Self-Contained Tools

This repository includes optional tools that run separately from the main application.

- **Card Builder**: `npm run card-builder` starts a local drag-and-drop card editor at `http://localhost:3100`. See [Card Builder – Use Case and Requirements](docs/card-builder-use-case-requirements.md) for details on the MVP.

- **Code Explorer**: `npm run dev:explorer` as noted above. A mock repository based on the local code-explorer package is served for testing.

These tools are standalone and do not affect production or the main development server.

## Syntax Highlighting & Testing

The Code Explorer renders source examples with [CodeMirror](https://codemirror.net/).
Use the `highlightCode` utility to convert raw strings into HTML with the
desired language grammar.

### `highlightCode` utility

- **Location:** `packages/code-explorer/src/utils/highlight.ts`
- `highlightCode(code, language)` returns highlighted HTML.
- If the grammar is missing or CodeMirror throws, the original code string is
  returned, causing the snippet to render as plain text to avoid runtime errors.

### Extending CodeMirror languages

1. Import the CodeMirror language package in `highlight.ts`, e.g.:
   ```ts
   import { python } from "@codemirror/lang-python";
   ```
2. Pass the matching language key when calling `highlightCode`:
   ```ts
   highlightCode(source, "python");
   ```

### Troubleshooting

- Unstyled code usually means the grammar wasn't imported or the language key
  doesn't match.
- Ensure CodeMirror dependencies are installed; reinstall with `npm install` if
  language packages are missing.
- Run targeted tests to verify highlighting logic: `npx vitest packages/code-explorer/src/utils/highlight.test.ts`.

### Running tests

- `npm test` – run the full unit and integration test suite.
- `npx vitest packages/code-explorer/src/utils/highlight.test.ts` – execute only
  the `highlightCode` tests (replace the path to target other files as needed).

Both commands work in standard Node environments and on Replit. To interact with
the Code Explorer during development, start it via `npm run dev:explorer`.
