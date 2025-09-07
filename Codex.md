# Codex

> **Entry Template:** `YYYY-MM-DD: summary – reason – impact`

## Summary of Recent Changes

2025-09-07: Removed sqlite references and documented Postgres URI requirements – clarify mandatory Postgres backend – prevents misconfiguration with unsupported databases.
2025-09-09: Added AUTH_DISABLED flag for mock sessions – support local development without OAuth – developers can bypass login.

2025-09-07: Documented mock-auth onboarding steps – clarify .env setup and auth toggle – developers start locally faster.

2025-09-07: Installed Playwright browsers and system packages after npm install – ensure tests run locally and in CI – developers get a consistent E2E environment.
2025-09-07: Documented Playwright browser downloads blocked and missing libs – cdn.playwright.dev returns 403 "Domain forbidden" and system packages like libatk1.0-0 are absent – E2E tests cannot run until network access and dependencies are installed.
2025-09-09: Added Playwright end-to-end tests for form submission, error handling, analytics consent, and translations – expand coverage to success, network failure, malformed data, and consent flows – increases confidence for Code-Explorer and Card-Builder releases.
2025-09-08: Localized form modals using site language – fetch preferred language and translate labels, placeholders, and validation errors – non-English users see correct text; Replit must supply translations for new locales.
2025-09-07: Introduced GitHub Actions CI with caching – automate tests and builds to gate merges – Replit, Code-Explorer, and Card-Builder gain faster feedback and protected main branch.
2025-09-07: Honored site-specific form field translations – ensure forms reflect language configuration with fallbacks – improved localized UX across sites.
2025-09-07: Added `.env.example` documenting environment variables – guide onboarding and track required variables – teams maintain sample file to stay synced.
2025-09-07: Exposed public form fields via unauthenticated API – avoid leaking internal metadata – external consumers retrieve only safe fields.
2025-09-07: Added unit test for sanitized form field endpoint – verify public access and data scrubbing – prevents regressions in security and accessibility.
2025-09-07: Captured `isError` and `error` from the form field query – detect loading failures – modals handle fetch errors gracefully.
2025-09-07: Displayed descriptive error message with retry and close options when form field fetch fails – inform users of issues – better recovery path for failed form loads.
2025-09-07: Memoized dynamic schema and default value calculations with `useMemo` – reduce redundant computations – improved performance for dynamic fields.
2025-09-07: Validated dynamic form fields before schema and default value construction – skip malformed entries – avoid runtime errors from invalid definitions.
2025-09-07: Introduced `publicApiRequest` helper for cookie-free field fetches – support unauthenticated retrieval – consistent public API usage in modals.
2025-09-07: Persisted HubSpot contact IDs on site leads via `updateSiteLead` – CRM ID persistence – marketing analytics can cross-reference leads with HubSpot.
2025-09-07: Enabled internal analytics tracking with consent checks – centralize event logging while respecting user consent – Replit and Card-Builder must configure `VITE_ANALYTICS_PROVIDER` before collecting analytics.
2025-09-07: Added form refresh controls and offline safeguards – allow refetching form fields and block submissions while offline – Replit must display the new refresh button and offline warnings in modals.
2025-09-07: Added `TaskRepo` interface and Express stub generator – decouple task creation and allow repo injection – teams can swap in Snowflake or in-memory implementations as needed.
2025-09-07: Deployed analytics consent modal with timestamped storage and server validation – capture explicit user permission before logging – Replit and Card-Builder pipelines only ingest opted-in data.
2025-09-07: Added `TEST_DATABASE_URL` for test database isolation – avoid cross-environment data pollution – Playwright tests run against ephemeral databases.
