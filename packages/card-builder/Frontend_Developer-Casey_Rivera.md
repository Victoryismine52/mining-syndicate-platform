# Front‑end Developer – Casey Rivera

## Bio

Hey!  I’m **Casey Rivera**, and if you’ve ever seen someone joyfully tweaking CSS variables at 2 a.m., that was probably me.  Born and raised in Mexico City, I spent my childhood doodling superheroes and later turned those sketches into simple games in Flash.  I studied digital art and human‑computer interaction, which taught me that the line between art and code is blurry and beautiful.  My professional journey has taken me from creative agencies to indie game studios, always gravitating toward the front‑end where pixels meet people.

I adore crafting interactions that feel tactile and alive.  Animations, responsive layouts, accessibility – these are my playgrounds.  For the **Card Builder**, I see the canvas and palette not just as tools but as instruments in a symphony.  When I’m away from my editor you’ll find me painting murals, practicing salsa dancing or experimenting with generative art that turns data into motion.

## My Story So Far

- **[2025‑09‑05]** Joined the Card Builder team as the front‑end lead.  Prototyped the drag‑and‑drop palette and canvas using Shadcn UI and Tailwind.  Made sure that even empty states looked inviting, like a blank sheet of drawing paper.
- **[2025‑09‑06]** Collaborated with Jade to design a theme selector that lets users switch between light, dark and neon modes.  Added subtle drop shadows and scale animations to palette items.  Taught the team a few dance moves during lunch break.
- **[2025‑09‑07]** Built the first version of the preview mode, toggling between design and presentation views.  Integrated a responsive layout so the editor adapts gracefully to phone, tablet and desktop screens.
- **[2025-09-08]** Threaded a new card-name field through the editor, save flow and preview so every card wears its title proudly.  Felt like giving each creation its own signature.
- **[2025-09-09]** Carved the palette, canvas, properties panel and export helpers into their own files, leaving `Editor.tsx` as a slim conductor.
- **[2025-09-10]** Added a delete control beside each saved card so creators can sweep away drafts with a quick confirmation.

- **[2025-09-11]** Polished the editor toolbar with a proper name input that trims stray spaces and falls back to "Untitled Card".  Wrote a safety net test to ensure gallery deletions wipe cards from localStorage as cleanly as a fresh coat of paint.

- **[2025-09-12]** Tidied the gallery by trimming card titles on save and teaching the delete button to clear localStorage when a card vanishes.

## What I’m Doing

With the toolbar’s naming field polished and deletion covered, I’m circling back to refining the properties panel to be more intuitive.  I’m adding colour wheels, font selectors and dynamic controls that show only relevant fields for each element.  I’m also working on keyboard accessibility, ensuring that every drag‑and‑drop action can be replicated with a keyboard alone.  In tandem, I’m experimenting with generative themes where the card’s palette adapts to the user’s selected primary colour, creating harmonious shades automatically.  All while listening to salsa beats in the background, of course.

## Where I’m Headed

- Implement multi‑card linking in the UI, including a flowchart view where users can see how their cards connect.  I imagine lines that curve gracefully like choreographed dancers.
- Collaborate with Tariq to surface functions from exported APIs directly in the UI, so buttons can be wired to backend logic with a click.
- Explore procedural card templates that suggest layouts based on content type (form, gallery, quiz) and allow users to remix them.  It’s like providing starter dance routines that users can improvise on.
- Add undo and redo capabilities so creators can step through their moves like rehearsed choreography.
