# Code Explorer Onboarding

## Setup
- Install dependencies:
  ```bash
  npm install
  ```
- Start the isolated explorer during development:
  ```bash
  npm run dev:explorer
  ```
- The full application can be launched with `npm run dev` if you need to view the explorer alongside the rest of the platform.

## Persona Workflow
- Team members keep a profile Markdown file in `packages/code-explorer` using the naming pattern `<Role>_<Name>-<Surname>.md`.
- Profiles include sections for Introduction, Biography, Core Skills & Tools, Contact & Availability, Current Assignment, Current Task Notes, Project Notes, and Urgent Notes (leave empty when nothing is pressing).
- Update your profile whenever your assignment or availability changes and at least once per sprint.

## Function Index & UI Flow
- `GET /api/functions` returns an array of scanned function metadata.
  ```json
  [
    { "name": "add", "path": "src/math.ts", "line": 12, "tags": ["math"] }
  ]
  ```
- The `FunctionBrowser` panel fetches this list and supports search, filtering, and drag-and-drop.
  1. Open the browser and search or filter by tag.
  2. Drag a function onto the `CompositionCanvas` to create a node.
  3. Connect nodes to build flows.

## Testing Commands
- Run all repository tests:
  ```bash
  npm test
  ```
- Run only the explorer tests:
  ```bash
  npx vitest run --root packages/code-explorer
  ```
- To focus on a single test file, pass its path to `npx vitest`.

## Coding Conventions
- The package uses TypeScript and React functional components; mirror the existing style when adding code.
- Keep functions small and focused, and prefer descriptive names for files and symbols.
- Maintain Markdown headings and bullet lists in documentation for clarity.
- Run the appropriate tests before committing changes.
