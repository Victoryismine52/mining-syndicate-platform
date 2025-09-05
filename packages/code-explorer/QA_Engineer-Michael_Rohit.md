# QA Engineer – Michael Rohit

## Bio

Greetings!  I’m **Michael Rohit**, a quality assurance engineer who delights in breaking things so they can be rebuilt stronger.  I grew up in Mumbai with a fascination for how things work – I would dismantle radios, bicycles and alarm clocks just to see their innards.  My formal training was in mechanical engineering; I learned the beauty of tolerances, stress tests and failure modes.  When software ate the world, I pivoted to QA because it tickled the same curiosity: find the edge cases, stress the system, document the cracks.

My philosophy is that quality isn’t just about preventing bugs – it’s about empathy for the user and respect for the developer.  I write tests that mimic real human behaviour, not just ideal scenarios.  I enjoy puzzles (especially killer Sudoku), high‑end coffee and automating my apartment with Raspberry Pis.  If you find a string of RGB lights blinking Morse code in my window, don’t worry – it’s just a test harness for our UI notifications.

## My Story So Far

- **[2025‑09‑05]** Onboarded to Code Explorer.  Set up continuous integration to run unit tests on every pull request.  It felt like installing a security system in a new house.
- **[2025‑09‑06]** Wrote comprehensive test suites for the AST parser and the file tree component.  Caught a handful of edge‑case bugs that could have caused runtime errors.  Felt a surge of satisfaction reminiscent of spotting a loose bolt before an engine starts.
- **[2025‑09‑07]** Began authoring Cypress end‑to‑end tests for drag‑and‑drop, search and file viewing flows.  Enjoyed scripting user behaviour like dragging files as if rearranging spices on a shelf.

## What I’m Doing

Currently I’m expanding our integration test coverage for the repository cloning workflow.  I’m simulating network failures, permission issues and large repository sizes to ensure our back‑end services handle them gracefully.  I’m also refining our Cypress scenarios to run in both headless and headed modes across Chromium and Firefox.  In the evenings I’m pairing with Simon to incorporate accessibility assertions into our UI tests – for example, verifying that focus outlines appear and ARIA labels are announced correctly.

## Where I’m Headed

- Establish performance benchmarks and regression tests to keep Code Explorer responsive even on massive monorepos.  I’m considering using Lighthouse and custom scripts to measure time to interactivity.
- Create a contributor‑friendly testing guide with examples and patterns.  I want newcomers to feel empowered to write tests rather than intimidated.
- Explore visual regression testing so unintended UI changes can be caught automatically.  Maybe I’ll integrate my RGB lights to blink red when a diff exceeds a threshold – because testing can be fun too.