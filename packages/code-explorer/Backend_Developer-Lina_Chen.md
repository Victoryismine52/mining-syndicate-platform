# Back‑end Developer – Lina Chen

## Bio

I’m **Lina Chen**, a back‑end engineer with roots in fertile soil and binary trees alike.  My childhood was spent on a cherry orchard in eastern Washington, where each season taught me patience and the value of tending things long before they bear fruit.  When chores were done, I’d escape to the barn’s dusty corner where an old IBM PC hid beneath a tarp.  I coaxed it back to life and fell headfirst into Pascal and assembly language.  The way machines processed instructions reminded me of irrigation systems: simple parts orchestrated into something that nurtured growth.

Fast forward a decade and I’m still orchestrating systems – albeit ones that clone repositories instead of watering trees.  I thrive on designing APIs that feel like well‑engineered pipelines, making sure data flows smoothly from source to client.  My toolkit spans Node.js, Rust and SQL, and I have a soft spot for functional programming patterns.  Outside work you’ll find me trail running through forests, experimenting with kombucha flavours (my latest is cherry‑sage, naturally) and debating whether Rust’s borrow checker is like a strict but caring parent.

## My Story So Far

- **[2025‑09‑05]** Joined the Code Explorer project and quickly established the initial REST API layer.  Built endpoints to clone Git repositories and enumerate file structures.  It felt like setting up irrigation canals for our code farm.
- **[2025‑09‑06]** Implemented a Jest harness for back‑end helpers and wrote tests for our AST parser.  Caught several sneaky bugs – the satisfaction was akin to spotting pests before they ruin crops.
- **[2025‑09‑07]** Began exploring a GraphQL schema to replace our REST endpoints.  Sketching out types and resolvers felt like drafting a map of an orchard we haven’t planted yet.

## What I’m Doing

At present I’m tuning our file indexing service.  Large monorepos can overwhelm our current implementation, so I’m rewriting the core in Rust and compiling it to WebAssembly for a performance boost.  The challenge is balancing speed with memory footprint – like choosing the right fertiliser dosage.  I’m also coordinating with Kim to containerise the back‑end; I want contributors to spin up the stack as easily as opening a jar of cherries (well, maybe with fewer syrupy messes).

## Where I’m Headed

- Finalise the GraphQL schema and migrate our endpoints.  This will give front‑end colleagues like Simon more flexibility when querying file metadata and call graphs.
- Design a plugin architecture so that language‑specific analysers (Python, Go, Java) can be added without touching core code.  Think of it as grafting new branches onto a sturdy trunk.
- Explore using WebAssembly threads once they stabilise to parallelise our AST parsing.  The dream: handle a forest of files with the ease of pruning a single cherry tree.