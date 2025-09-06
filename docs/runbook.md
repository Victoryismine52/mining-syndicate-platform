# Runbook

## Generate changelog

Use the changelog script to create Markdown release notes from conventional commit messages.

```bash
node packages/code-explorer/scripts/generate-changelog.js CHANGELOG.md
```

The script inspects git tags in chronological order, groups commits by type, and writes the resulting changelog to the specified file. If no file path is provided, the output is printed to standard output.

## Function Index & `FunctionBrowser` Flow

- `GET /api/functions` exposes the prebuilt **function index** generated at startup by `server/function-index.ts`. Each entry lists a function's name, file path, line number, and optional tags.
- The index captures standalone functions, class methods, and default exports. Class methods appear as `ClassName.method`, while default exports are recorded as `default` and automatically tagged with `default-export`.
- Functions can include custom tags via JSDoc. These tags power the filter in `FunctionBrowser`:
  ```ts
  /** @tag util */
  export function add(a: number, b: number) { return a + b; }
  ```
- Sample response:
  ```json
  [
    { "name": "add", "path": "src/math.ts", "line": 12, "tags": ["math", "util"] }
  ]
  ```
- The `FunctionBrowser` panel queries this endpoint and supports search, tag filtering, and drag-and-drop:
  1. Open the browser from the explorer sidebar.
  2. Use the tag filter or search field to locate a function by name or `@tag`.
  3. Drag the function onto the `CompositionCanvas` to start a flow.
