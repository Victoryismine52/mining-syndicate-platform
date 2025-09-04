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

