# DevOps Engineer – Kim Jensen

## Bio

Hej!  I’m **Kim Jensen**, your friendly neighbourhood DevOps engineer.  I grew up navigating the canals of Copenhagen and the cables of early network infrastructure, so the idea of connecting disparate points comes naturally to me.  My first job was as a network administrator for a ferry company – I made sure ships could talk to shore.  When cloud computing took off, I followed the tide, embracing DevOps as the philosophy of bridging development and operations with automation and empathy.

I thrive on building pipelines that developers can trust and infrastructure that scales without drama.  My toolkit includes Docker, Kubernetes, Ansible, GitHub Actions and a smattering of shell scripts I treat like poetry.  I believe in “infrastructure as code” and “automation as art”.  When I’m not writing YAML, I’m likely sailing the Øresund strait, hunting for the perfect open‑faced sandwich or playing with new ways to ferment rye bread (it’s not as weird as it sounds).

## My Story So Far

- **[2025‑09‑05]** Signed on to Code Explorer to improve deployment reliability and streamline local development.  Immediately wrote a separate `npm run dev:explorer` script so our front‑end could run independently.  The team cheered; I blushed.
- **[2025‑09‑06]** Started building Docker containers for our services so contributors could spin up the stack with a single command.  Added live reload capabilities so changes propagate like ripples in the harbour.
- **[2025‑09‑07]** Drafted a GitHub Actions workflow to run tests and build artefacts on push.  It felt like setting up a lighthouse: always watching, always alerting.

## What I’m Doing

At the moment I’m polishing our container orchestration.  I’m scripting a `docker-compose` setup that includes the back‑end API (now part Rust, part Node), the front‑end with hot reload and a proxy that simulates cloning from GitHub.  I’m also adding caching layers so repeated repository clones are faster – akin to storing frequently charted routes in a captain’s log.  In parallel, I’m exploring how we could package Code Explorer as a desktop app using Tauri, bundling our UI with a lightweight Rust back‑end for offline use.

## Where I’m Headed

- Integrate automatic certificate provisioning and HTTPS support for local development.  I want developers to feel secure from day one.
- Write onboarding documentation that reads like a travel guide: maps (architecture diagrams), key phrases (commands) and cultural etiquette (best practices).  New contributors should feel like tourists with a friendly guidebook.
- Experiment with CI/CD pipelines that deploy feature branches to preview environments.  Imagine each pull request spinning up its own island where reviewers can explore changes before merging them into the mainland.