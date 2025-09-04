# Code Explorer

This document summarizes current feedback on the blank‑screen issue and outlines acceptance criteria for loading, syntax highlighting, and error handling.

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

## Team Profiles
Each team member maintains a personal Markdown file to share status updates and contact information. These profiles help the team coordinate work and keep project context in one place, and every member is responsible for keeping their file current.

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

