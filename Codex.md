# Codex

## Summary of Recent Changes

- Enabled unauthenticated retrieval of form template fields and sanitized the response to expose only public field data, excluding internal attributes like system flags and timestamps.
- Added a unit test confirming the endpoint’s sanitized output and public accessibility without authentication.
- Captured `isError` and `error` from the form field query so the modal can detect when loading fails.
- Displayed a descriptive error message with retry and close options instead of form fields when the query fails.
- Validated dynamic form fields before schema and default value construction, skipping malformed entries to avoid runtime errors.
- Introduced `publicApiRequest` helper to fetch form fields without cookies and updated form modals to use it.

