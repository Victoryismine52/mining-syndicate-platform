# Onboarding Guide

This guide covers setting up the project locally, running tests, and establishing profile conventions for contributors.

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd mining-syndicate-platform
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Install Playwright browsers and system dependencies**
   ```bash
   npx playwright install --with-deps
   ```
   Required packages include `libnss3`, `libatk-1.0-0`, and `fonts-liberation`.
   > **Note:** A `403 Domain forbidden` error during `npx playwright install` usually means the CDN is blocked or requires credentials, while `403`s during test execution typically come from anti-bot measures on the target website.
4. **Start the database**
   ```bash
   npm run db:up
   npm run db:migrate
   ```
   Uses port `5432`. Run `npm run db:down` to stop it.
5. **Start the development servers**
   ```bash
   npm run dev
   ```
   Runs on port `5000`. Visit `http://localhost:5000` to view the app.

## Quick start with mock auth

1. Copy the example environment file.
   ```bash
   cp .env.example .env
   ```
2. Set `AUTH_DISABLED=true` in `.env` to bypass OAuth.
3. Start the local Postgres service.
   ```bash
   npm run db:up
   npm run db:migrate
   ```
   Uses port `5432`. Stop with `npm run db:down` when finished.
4. Run the development server.
   ```bash
   npm run dev
   ```

### Switch to the full auth flow

1. Stop the server.
2. Remove `AUTH_DISABLED` or set it to `false`.
3. Add the required auth variables to `.env`.
4. Restart the server to sign in with OAuth.

## Running Tests

- **Full test suite**
  ```bash
  npm test
  ```
- **Targeted tests**
  ```bash
  npx vitest path/to/testfile.ts
  ```

## Function Index & `FunctionBrowser` Flow

- `GET /api/functions` returns the prebuilt **function index** generated at startup by `server/function-index.ts`.
- The index includes standalone functions, class methods, and default exports. Class methods appear as `ClassName.method`, while default exports are recorded as `default` and automatically tagged with `default-export`.
- Functions can carry custom metadata with JSDoc `@tag`; these tags feed the `FunctionBrowser` filter:
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
- The `FunctionBrowser` panel uses this endpoint to enable search, tag filtering, and drag-and-drop:
  1. Open the browser from the explorer sidebar.
  2. Use the tag filter or search field to find a function by name or `@tag`.
  3. Drag the function onto the `CompositionCanvas` to begin a new flow.


## Profile Conventions

- Use your real name and preferred pronouns in documentation.
- Configure Git with your name and email:
  ```bash
  git config user.name "Your Name"
  git config user.email "you@example.com"
  ```
- Follow conventional commit messages (e.g., `feat: add feature`, `fix: resolve bug`).

