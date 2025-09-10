# Mining Syndicate Platform


See our key guides:

- [Onboarding Guide](docs/onboarding.md) for setup, tests, and profile conventions.
- [Exporting Cards](docs/exporting-cards.md) explains how to grab the configuration `JSON` and matching `OpenAPI` spec.
- [Documentation Style Guide](docs/style-guide.md) outlines tone and formatting.

Install CodeMirror and its language packages with `npm install` so code snippets can be highlighted.
Afterwards, run `npx playwright install --with-deps` to fetch browsers and system libraries.
Required packages include `libnss3`, `libatk-1.0-0`, and `fonts-liberation`.

## Team roster

| Role | Persona file |
|-----|--------------|
| Accessibility Specialist | `Accessibility_Specialist-Logan_Patel.md` |

## Development

- **Full application**: `npm run dev`
  - Starts the Express API and Vite client with `NODE_ENV=development` via [cross-env](https://www.npmjs.com/package/cross-env) for cross‑platform compatibility.
  - Visit `http://localhost:5000` to view the site.
- **Isolated Code Explorer**: `npm run dev:explorer`
  - Launches only the Code Explorer module at `http://localhost:5000/code-explorer`.
  - Shares React, Tailwind and all Shadcn UI components with the main app.
  - Requires `git` and network access to import public repositories.
  - Automatically opens your browser to the explorer page.

### Local Development Modes

Choose how to run the stack during development. Copy `.env.example` to `.env` and provide values for required
variables like `DATABASE_URL`, `SESSION_SECRET`, and others listed below.

- **Docker Postgres**: `npm run db:up`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`
  - Spins up a Postgres container and loads seed data from `server/seeds/`.
- **In-memory**: `npm run dev:mem`
  - Starts the server with `AUTH_DISABLED=true` and `STORAGE_MODE=memory` for ephemeral data.

### Environment variables

Environment configuration is managed through Replit's Secrets manager. For local development, copy `.env.example` to `.env` and provide values. The server reads settings through `server/config.ts`, which validates required variables at startup and throws descriptive errors when they're missing. Keep this sample file in sync whenever new variables are introduced. Database URLs must use the standard Postgres URI format (e.g., `postgres://user:pass@localhost:5432/db`).

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials for login. |
| `GOOGLE_OAUTH_CALLBACK_URL` | Callback URL used by Google during OAuth. |
| `DATABASE_URL` | Postgres connection string for application data and sessions. |
| `TEST_DATABASE_URL` | Overrides `DATABASE_URL` during tests for a separate Postgres database. |
| `SESSION_SECRET` | Secret used to sign Express session cookies. |
| `HUBSPOT_API_KEY` | Token for submitting forms to HubSpot. |
| `AUTH_DISABLED` | Set to `true` to bypass authentication with a mock admin user. |
| `PORT` | Port for the combined Express and Vite servers (defaults to `5000`). |
| `BASE_DEV_URL` | Local API base URL used during initialization. |
| `BASE_CODEX_URL` | Fallback Codex API endpoint when the local API is unavailable. |
| `REPLIT_SIDECAR_ENDPOINT` | Internal endpoint for object storage auth on Replit; when absent, storage falls back to an in-memory filesystem for local development. |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Comma-separated object storage paths for public assets. |
| `PRIVATE_OBJECT_DIR` | Object storage path for private uploads. |
| `ISSUER_URL` | OIDC issuer for Replit authentication. |
| `REPL_ID` | Replit workspace identifier required for OIDC. |
| `REPLIT_DEV_DOMAIN` | Default Replit domain during development. |
| `REPLIT_DOMAINS` | Comma-separated list of domains allowed for OIDC callbacks. |
| `STORAGE_MODE` | Set to `memory` to use in-memory JSON storage for sites. |

The server exits on startup if `DATABASE_URL` is missing. When `AUTH_DISABLED` is not `true`, Google and Replit auth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REPL_ID`) must also be provided.

Switch between Postgres databases by editing `.env`:

- Set `DATABASE_URL` to your primary Postgres instance.
- Define `TEST_DATABASE_URL` for a dedicated test Postgres database (e.g., `postgres://user:pass@localhost:5432/testdb`). When present, test runners use this value, keeping test data isolated from the remote database.

### Database migrations and seeds

Run migrations and load baseline data with:

```
npm run db:seed
```

This command applies pending schema changes and inserts records from `server/seeds/`.

`git` must be available in your PATH for repository cloning.

### Overriding slide assets

Default presentation slides are listed in `server/seeds/slides.json` using relative
file names. At runtime, the server prefixes each entry with the first path from
`PUBLIC_OBJECT_SEARCH_PATHS` to build full URLs. If the Replit sidecar isn't
available, uploads are stored in an in-memory filesystem and are cleared on
restart.

To customize slides for a deployment:

1. Upload images to a bucket referenced by `PUBLIC_OBJECT_SEARCH_PATHS`.
2. Replace file names in `server/seeds/slides.json` with your assets.
3. Rerun `npm run db:seed` or create a new site to apply the changes.

This allows each environment to ship branded decks without modifying source code.

### Memory storage mode

Setting `STORAGE_MODE=memory` launches the API using JSON files loaded into RAM
instead of Postgres. Seed data lives in `server/data/seed.json`. Because changes
aren't persisted, restart the server to reset to the contents of that file. Use
`npm run dev:mem` to start the server with these settings and authentication
disabled.

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
