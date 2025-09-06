# Code Explorer Runbook

## Test Setup
- Install dependencies:
  ```bash
  npm install
  ```
- Run the full test suite:
  ```bash
  npm test
  ```
- Run only explorer tests with Vitest:
  ```bash
  npx vitest run --root packages/code-explorer
  ```
- Focus on a single spec by passing its path to `npx vitest`.

## Save & Patch Workflow
- The FileViewer editor generates a unified diff using `createTwoFilesPatch` when a file is saved.
- The client posts `{ path, patch }` to `/code-explorer/api/save`.
- The server's `applyPatchToFile` utility applies the diff with `Diff.applyPatch` and writes the result back to disk.
- If patching fails, the server responds with an error and the file remains unchanged.

## Viewer Fallback Behavior
- Code highlighting uses Prism grammars.
- When a language definition is missing or Prism throws, `highlightCode` returns the original string so the viewer renders plain text instead of crashing.

## Function Index & `FunctionBrowser` Flow
- `GET /api/functions` exposes the prebuilt **function index** generated at startup by `server/function-index.ts`. Each entry includes a function's name, path, line number, and optional tags.
- Sample response:
  ```json
  [
    { "name": "add", "path": "src/math.ts", "line": 12, "tags": ["math"] }
  ]
  ```
- The **FunctionBrowser** panel queries this endpoint and supports search, filtering, and drag-and-drop:
  1. Open the browser from the explorer sidebar.
  2. Search or filter by tag to locate a function.
  3. Drag the function onto the `CompositionCanvas` to create a node and start a new flow.

## Release Notes Automation
- Changelog generation script: `node packages/code-explorer/scripts/generate-changelog.js CHANGELOG.md`.
- Next steps:
  - Wire the script into CI to run on tagged releases.
  - Enforce conventional commit messages to improve grouping.
  - Publish generated notes to the repository's releases page.
