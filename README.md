# Mining Syndicate Platform

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
