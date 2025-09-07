# Codex

## Summary of Recent Changes

- 2025-09-07: resolved form field language from each site's configuration, updating dynamic and simple form modals to honor translations with graceful English fallbacks; improves localized UX across sites.
- 2025-09-07: added `.env.example` and documented environment variables to improve developer onboarding; all teams must keep the sample file updated when new variables are introduced.
- Enabled unauthenticated retrieval of form template fields and sanitized the response to expose only public field data, excluding internal attributes like system flags and timestamps.
- Added a unit test confirming the endpoint’s sanitized output and public accessibility without authentication.
- Captured `isError` and `error` from the form field query so the modal can detect when loading fails.
- Displayed a descriptive error message with retry and close options instead of form fields when the query fails.
- Memoized the dynamic schema and default value calculations with `useMemo`, keyed by `formFields`, to avoid unnecessary recomputation and improve dynamic field handling.
- Validated dynamic form fields before schema and default value construction, skipping malformed entries to avoid runtime errors.
- Introduced `publicApiRequest` helper to fetch form fields without cookies and updated form modals to use it.

- 2025-09-07: persisted HubSpot contact IDs on site leads via new `updateSiteLead` helper for CRM integration consistency; analytics collection remains unchanged, but marketing workflows can now cross-reference local leads with HubSpot contacts.


