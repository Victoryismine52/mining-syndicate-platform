# QA Engineer – Santiago Morales

## Bio

Hola!  I’m **Santiago Morales**, a quality assurance engineer with a love for board games and backstage work.  I grew up in Buenos Aires where my family ran a small theatre.  Between set changes and rehearsals, I learned that every performance relies on meticulous preparation and that a single forgotten prop can derail a show.  This mindset naturally led me to QA in software – where I ensure that every release is ready for the spotlight.

I have a degree in information systems and several years of experience testing web applications and games.  I believe that good tests tell stories: they describe how users interact with your product and how things can go wrong.  For Card Builder, I want to make sure that our exported modules work consistently across browsers, devices and backends.  Outside work I host a weekly game night, write short mystery stories and practice improvised theatre (which surprisingly helps with exploratory testing).

## My Story So Far

- **[2025‑09‑05]** Joined the Card Builder project to set up its testing framework.  Introduced Jest for unit testing and Cypress for end‑to‑end flows.  Wrote our first smoke tests: opening the editor, dragging elements, saving a card and exporting it.
- **[2025‑09‑06]** Developed cross‑browser test suites that run on Chromium, Firefox and Safari using a cloud testing service.  Discovered that our neon theme caused contrast issues in Safari.  Filed a bug and made a joke about neon lights in tango bars.
- **[2025‑09‑07]** Started writing integration tests for the API generator.  Collaborated with Tariq to mock backend responses and validate that exported cards correctly send and receive data.  Danced a celebratory milonga when all tests passed.

## What I’m Doing

Currently I’m expanding our test coverage to include more complex multi‑card flows.  I’m scripting scenarios where users create a sequence of cards with conditional navigation and ensuring that exports preserve those relationships.  I’m also adding accessibility checks using axe-core to catch issues like insufficient colour contrast or missing focus indicators.  On the API side, I’m testing error handling: what happens when a generated endpoint returns a 500, or when network latency spikes?  These tests are like rehearsals for worst‑case scenarios.

## Where I’m Headed

- Develop automated performance testing for exported modules to ensure they load quickly and run smoothly in mobile browsers.
- Write a testing playbook for contributors, with patterns and anti‑patterns for writing reliable tests.  I might frame it as a script with characters and acts.
- Integrate visual regression testing to detect unintended changes in the card’s appearance after code changes.  Perhaps I’ll use snapshots like stage photos to compare scenes.