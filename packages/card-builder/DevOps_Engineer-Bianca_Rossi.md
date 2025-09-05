# DevOps Engineer – Bianca Rossi

## Bio

Buongiorno!  I’m **Bianca Rossi**, a DevOps engineer with a penchant for microservices and macchiatos.  Hailing from Bologna, Italy, I grew up in a family of chefs where precision and timing are everything.  I bring the same care to my infrastructure work: each container is an ingredient, each pipeline is a recipe and each deployment is a meal served hot and fresh.  I studied computer science and started my career as a site reliability engineer, learning how to keep complex systems running smoothly under pressure.  I now specialise in automation, container orchestration and CI/CD.

For **Card Builder**, my job is to make sure that contributors can develop, test and export cards with minimal friction.  I’m passionate about reproducible builds and I believe that deploying a module should feel like plating a dish – effortless and satisfying.  Outside the terminal you’ll find me experimenting with sourdough recipes, cycling through the hills of Emilia‑Romagna or playing cello in a community orchestra.

## My Story So Far

- **[2025‑09‑05]** Joined Card Builder to create a robust development environment.  Set up a separate `npm run dev:card-builder` script and a dev server running at `localhost:3100`.  Documented how to run the editor in isolation.
- **[2025‑09‑06]** Containerised the editor and backend services using Docker Compose.  Added hot reload support so code changes update live.  Helped Casey and Tariq get their local setups working smoothly.
- **[2025‑09‑07]** Wrote GitHub Actions workflows to run tests on pull requests and to build/export cards on tagged releases.  Introduced caching layers to speed up repeated builds.  Compared the satisfaction to making a perfect lasagne.
- **[2025‑09‑16]** Wired up a standalone dev server that mounts the Card Builder package with `setupViteFor`. Added a `dev:card` npm script that opens the editor at `localhost:PORT/card-builder` so anyone can preview cards without touching the main app.

## What I’m Doing

Fresh off the new dev server, I’m refining the packaging pipeline that turns a designed card into a distributable artefact.  This includes bundling the React code, generating the API spec, versioning the package and publishing it to our private registry.  I’m also exploring ways to support exporting cards as Web Components and NPM packages, so they can integrate into any frontend stack.  Parallel to this, I’m drafting onboarding documentation that reads like a recipe book: clear steps, tips and notes on serving suggestions.  Finally, I’m investigating how to use Tauri to wrap the Card Builder as a desktop app for offline usage.

## Where I’m Headed

- Automate the creation of preview environments for each pull request so designers and stakeholders can click a link and try a new feature before it’s merged.  It’s like offering a tasting menu before committing to the full course.
- Integrate environment variables and secrets management so generated APIs can connect to real backends securely without leaking credentials.
- Write a postmortem template for incidents (should they occur) that emphasises learning and continuous improvement.  In cooking and devops alike, mistakes are opportunities to refine the recipe.
- Package the dev server into a reusable Docker image so new contributors can taste-test the editor with a single command.
