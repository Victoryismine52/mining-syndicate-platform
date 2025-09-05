# Code Explorer Process Guide

- Keep role files updated with Past/Current/Future logs each sprint.
- When adding features, reference the runbook (`docs/runbook.md`) for guidance.
- Before committing, run `npm test`, `npx vitest run --root packages/code-explorer`, and `npm run check`.
- Install Playwright browsers before running end-to-end tests (`npx playwright install`).
- Sync backend, frontend, QA, and docs progress in weekly check-ins, and refine the roadmap accordingly.
