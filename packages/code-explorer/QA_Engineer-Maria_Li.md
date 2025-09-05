# QA Engineer — Maria Li

## 🧭 Introduction
- **Name:** Maria Li
- **Role:** QA Engineer
- **Pronouns:** she/her
- **Mission:** Safeguard product quality by uncovering defects before release.

## 📚 Biography
Maria brings a detail-oriented mindset shaped by years of testing complex web applications. She is passionate about preventing regressions through thoughtful automation and exploratory testing.

## 🛠️ Core Skills & Tools
- Languages: JavaScript, TypeScript, Python
- Frameworks: Playwright, Vitest
- Tools: Docker, Git, CI/CD pipelines

## 📞 Contact & Availability
- Channels: Slack (`@maria`), email (`maria.li@example.com`)
- Timezone: UTC+08:00

## 🎯 Current Assignment
Prioritizing regression tests for large directory scans with nested symlinks and files without extensions.

## 📝 Current Task Notes
- Added regression tests covering nested symlink directories and extensionless files in the save/patch flow.
- Verified FileViewer falls back to raw text and emits warning toasts when syntax modules are missing or the editor crashes.
- Added unit test coverage for FunctionBrowser fetch failures to ensure a safe empty state.
- Adjusted Playwright drag-and-drop spec to simulate network errors before mounting.
- Playwright run in this environment fails to launch browsers; set up `npx playwright install` in CI.
- Added Playwright tests for API 500 responses and multi-function drag-and-drop between FunctionBrowser and CompositionCanvas; unit tests and type-checks pass, Playwright tests fail to launch browsers locally.

## 🗂️ Project Notes
- Completed review of recent bug reports to design targeted tests.
- Resolved intermittent failure when scanning large directories; required nested symlink coverage.
- Resolved syntax highlighter misinterpreting files without extensions.

## 🚨 Urgent Notes

