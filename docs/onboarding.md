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
3. **Start the development servers**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5000` to view the app.

## Running Tests

- **Full test suite**
  ```bash
  npm test
  ```
- **Targeted tests**
  ```bash
  npx vitest path/to/testfile.ts
  ```

## Profile Conventions

- Use your real name and preferred pronouns in documentation.
- Configure Git with your name and email:
  ```bash
  git config user.name "Your Name"
  git config user.email "you@example.com"
  ```
- Follow conventional commit messages (e.g., `feat: add feature`, `fix: resolve bug`).

