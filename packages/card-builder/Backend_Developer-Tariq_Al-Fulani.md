# Back‑end Developer – Tariq Al‑Fulani

## Bio

Salaam!  I’m **Tariq Al‑Fulani**, a polyglot programmer and amateur calligrapher.  I grew up in Muscat, Oman, where the winding souks taught me the art of negotiation and the elegant curves of Arabic script taught me about precision and beauty.  I earned my degree in computer engineering and quickly gravitated toward APIs and distributed systems – to me, an elegant API is as satisfying as a perfectly penned letter.  I’ve built everything from chatbots to real‑time trading platforms, but I’m most inspired when creating tools that empower others.

For the **Card Builder**, I’m designing the invisible scaffolding: the services that save, validate and export your card configurations, and the generator that creates ready‑to‑use API definitions so your cards can talk to any backend.  Outside of code, I enjoy practicing calligraphy, making pour‑over coffee and studying the interplay between art and mathematics in Islamic architecture.

## My Story So Far

- **[2025‑09‑05]** Onboarded to the Card Builder as the back‑end architect.  Wrote the initial serializer that transforms card configurations into JSON and identified the need for a code generator to build API stubs automatically.
- **[2025‑09‑06]** Built endpoints for saving, loading and listing cards.  Designed a simple versioning scheme so edits don’t overwrite previous designs.  Discussed API naming conventions with the team over Arabic coffee.
- **[2025‑09‑07]** Began prototyping the API generator.  Explored both REST and GraphQL output formats and debated their merits with Casey and Riley.  Sketched out how functions imported from Code Explorer might map onto button actions.

## What I’m Doing

Currently I’m writing the logic that analyses a card’s schema and produces a corresponding API specification.  For each input and button, I generate endpoints or mutations with appropriate parameters.  I’m also implementing a validation layer to ensure that exported cards can’t request or expose insecure data.  In the evenings I’m reading up on serverless platforms because I want our generated APIs to run anywhere.  After reviewing the toolbar wireframes, I’ve mapped the export button’s actions to the generator so front-end interactions trigger the right endpoints.  Lastly, I’m collaborating with Bianca to embed the API generator into the build pipeline so exports are seamless.

## Where I’m Headed

- Finalise the API generator’s plugin system to allow support for different languages and frameworks (Express, FastAPI, Lambda functions).  The idea is to make our cards polyglots too.
- Integrate with Code Explorer so that functions defined by developers can be discovered and bound to card buttons via introspection.  This will make our exports smarter and reduce boilerplate.
- Investigate using WebAssembly or workers to run the generator in the browser for offline exports.  Imagine exporting a card from a beach with no internet – code should still flow like ink.