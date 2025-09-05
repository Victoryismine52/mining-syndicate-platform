# Code Explorer

## Project Purpose
Code Explorer is a browser-based tool for navigating project source files. It scans a repository, renders a file tree, and displays files with syntax highlighting so contributors can explore code without leaving the app.

## Current Features
- Interactive file tree for browsing directories and selecting files.
- Syntax-highlighted viewer powered by CodeMirror with a plain-text fallback when a language mode is missing.
- Inline error messages and loading indicators for failed or slow file fetches.
- Team profile system that stores member information and project context alongside the code.

## Running Tests
From the repository root run:

```bash
npm test
```

To run only the explorer tests:

```bash
npx vitest run --root packages/code-explorer
```

## Team Profile System
Each team member maintains a Markdown profile in this directory to share status updates and contact information.

Profiles use the naming pattern `<Role>_<Name>-<Surname>.md` and include these sections:
- **Introduction**
- **Biography**
- **Core Skills & Tools**
- **Contact & Availability**
- **Current Assignment**
- **Current Task Notes**
- **Project Notes**
- **Urgent Notes** (leave empty when nothing is pressing)

Current profiles:
- [Tech Lead — Jordan Rowe](Tech_Lead-Jordan_Rowe.md)
- [Frontend Developer — Simon Hesher](Frontend_Developer-Simon_Hesher.md)
- [QA Engineer — Maria Li](QA_Engineer-Maria_Li.md)
- [Documentation & Ops — Alex Kim](Documentation_Ops-Alex_Kim.md)
- [Product Manager — Ava Wu](Product_Manager-Ava_Wu.md)

These documents help the team coordinate work and keep project context in one place. Team members are responsible for keeping their profiles up to date.
