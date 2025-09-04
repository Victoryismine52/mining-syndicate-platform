# Code Explorer

This document summarizes current feedback on the blank‑screen issue and outlines acceptance criteria for loading, syntax highlighting, and error handling.

Documentation & Ops is part of the core team, responsible for maintaining project documentation and operational workflows.

## Blank‑screen bug

Team members reported that selecting a file in the explorer occasionally renders a blank panel. No loading indicator or error message is shown, leaving users unsure if the file is empty, still loading, or if an error occurred.

### Desired behavior

- A loading indicator appears while content is requested from `/code-explorer/api/file`.
- If the request succeeds, the file contents display with syntax highlighting.
- If the request fails, the viewer shows a clear error message and does not lock the UI.
- When highlighting fails (e.g., unknown language), raw text is shown instead of a blank screen.

## Acceptance criteria

### Loading
- Display a spinner or progress message immediately after a file is selected.
- Remove the indicator once the fetch resolves or fails.

### Syntax highlighting
- Use Prism to highlight TypeScript, JavaScript, JSX, and TSX files.
- If Prism throws or lacks a grammar, render the code as plain text.

### Error handling
- Fetch failures show an inline error describing the problem.
- Errors do not obscure the rest of the UI; users can select other files or retry.

## Scenarios and constraints

- Network errors or missing paths may trigger the error state.
- Large files may load slowly; line numbers should still render.
- Only a subset of languages is highlighted out of the box; additional grammars require separate imports.
- The viewer is read‑only and intended for inspection, not editing.

## Syntax Highlighting & Testing

### `highlightCode` utility
- Located at `src/utils/highlight.ts`.
- Wraps Prism to return highlighted HTML and falls back to raw text if a grammar is missing or Prism throws.

### Adding a Prism grammar
1. Import the Prism component in `src/utils/highlight.ts`:
   ```ts
   import "prismjs/components/prism-python";
   ```
2. Call `highlightCode` with the language key:
   ```ts
   highlightCode(source, "python");
   ```

### Troubleshooting
- **Missing grammar:** Unstyled code usually means the Prism component wasn't imported or the language key is wrong.
- **Runtime errors:** `highlightCode` returns the original code string when Prism throws. Check console logs and your imports.

### Testing
Run unit tests to confirm highlighting behavior and file rendering:
```bash
npm test
# or run only the explorer tests
npx vitest run src/components/FileViewer.test.tsx --root packages/code-explorer
```
The suite covers `highlightCode` fallbacks and the `FileViewer` component. Install `@vitest/coverage-v8` and add `--coverage` to gather coverage metrics.

Further reading: [docs/syntax-highlighting.md](docs/syntax-highlighting.md) and internal ops runbooks.

## Team Profiles
Each team member maintains a personal Markdown file to share status updates and contact information. These profiles help the team coordinate work and keep project context in one place, and every member is responsible for keeping their file current.

### Profiles
- [Tech Lead — Jordan Rowe](Tech_Lead-Jordan_Rowe.md): Oversees architecture and technical strategy.
- [Frontend Developer — Simon Hesher](Frontend_Developer-Simon_Hesher.md): Builds user-facing features and UI components.
- [QA Engineer — Maria Li](QA_Engineer-Maria_Li.md): Ensures product quality through testing.
- [Documentation & Ops — Alex Kim](Documentation_Ops-Alex_Kim.md): Maintains project documentation and operational workflows.

### Section ownership and purpose

Include the following headings in your profile and keep each one updated:

- **Introduction** – brief greeting or summary of your role.
- **Biography** – background and relevant experience.
- **Core Skills & Tools** – technical and soft skills plus tooling expertise.
- **Contact & Availability** – how and when to reach you.
- **Current Assignment** – your main responsibility.
- **Current Task Notes** – progress, decisions, or blockers for active tasks.
- **Project Notes** – extra context, research, or references.
- **Urgent Notes** – blockers or urgent needs. Leave this empty when nothing is pending.

### File naming

Name files using the pattern `<Role>_<Name>-<Surname>.md`, for example `Product_Manager-Ava_Wu.md`.

### Creative expression

Feel free to personalize your profile—use lists, emojis, images, or other Markdown styling—as long as the required headings remain intact and the file stays lightweight and readable.

### Editing guidelines

- Update sections as work progresses and remove or clear items that are complete.
- Keep **Urgent Notes** empty when no urgent items remain.
- Commit updates with descriptive messages.
- Team leads may suggest edits for consistency; peer review is encouraged.

### Updating your profile

Open your Markdown file, edit the relevant sections with current information, then save and commit the changes. Repeat whenever your status changes.

