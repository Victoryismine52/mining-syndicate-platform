# Code Explorer

A standalone module for browsing and editing code repositories in the Mining Syndicate Platform. It can import a GitHub repo, display a file tree and render files with syntax highlighting.

## Development

- `npm run dev:explorer` – start the explorer at `http://localhost:5000/code-explorer`.
- `npm test` – run unit tests for the explorer package.

## Syntax Highlighting & Testing

The viewer uses a small Prism wrapper to highlight TypeScript and JavaScript. To add support for another language:

1. Install or import the appropriate Prism grammar.
2. Update `src/utils/highlight.ts` to map the file extension to that grammar.
3. Run `npm test` to ensure highlighting works and existing tests pass.

## Team Profiles

Each team member maintains a personal Markdown file in this folder to aid handoffs.

Required sections for every profile:

1. **Introduction** – name, role, one‑line mission.
2. **Biography** – background and expertise.
3. **Core Skills & Tools** – key technologies used.
4. **Contact & Availability** – preferred channels and hours.
5. **Current Assignment** – present work focus.
6. **Current Task Notes** – latest status on the assignment.
7. **Project Notes** – archive of important decisions or references (past).
8. **Future Designs** – ideas not yet in scope.
9. **Urgent Notes** – empty when no blockers exist.

### Members

- [Product Manager – Ava Wu](./Product_Manager-Ava_Wu.md)
- [Tech Lead – Jordan Rowe](./Tech_Lead-Jordan_Rowe.md)
- [Frontend Developer – Simon Hesher](./Frontend_Developer-Simon_Hesher.md)
- [QA Engineer – Maria Li](./QA_Engineer-Maria_Li.md)
- [Documentation & Ops – Alex Kim](./Documentation_Ops-Alex_Kim.md)

See `docs/Documentation_Process_Resources.md` for detailed guidelines.
