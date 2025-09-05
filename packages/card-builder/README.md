# Card Builder: Persona‑Driven Module Design

Welcome to the **Card Builder** package!  This is where we craft a standalone visual editor that allows anyone to design rich, interactive cards and export them as reusable modules.  Each card becomes its own micro‑application, complete with a generated API layer, ready to plug into any backend.  Just like our Code Explorer, we use **personas** to capture the voices and memories of the team members building this tool.  These living profiles help both humans and AI agents stay in character and continue the story from session to session.

## 🧰 About Card Builder

The Card Builder aims to democratise interface design.  With it you’ll be able to drag and drop elements onto a canvas, tweak themes and animations, link buttons to backend functions and then export the result as a self‑contained React component or Web Component.  Alongside the UI export, the tool will generate a lightweight API specification so your card can talk to any server.  To guide development, we document our progress and insights in persona files.

## 📖 Persona files (living profiles)

Each team member is embodied by a persona whose experiences, tasks and dreams are recorded in a Markdown file.  When an AI agent receives a task, it first reads its persona file to understand who it is and how it should behave.  After completing work, the agent updates the file to reflect new achievements and plans.  Think of these as personal journals mixed with project logs.

### 🧾 File naming

Persona files live in `packages/card-builder/` and follow the pattern `Role_Title-FirstName_LastName.md`.  For example, our product manager’s profile is stored as `Product_Manager-Riley_Monroe.md`.  Consistent naming makes it easy to map roles to files.

### 🪞 Layout & sections

We structure persona files like personal essays with a timeline:

- **Bio** – A vivid introduction written in the persona’s voice.  It should explain the character’s background, what drew them to the Card Builder project and any quirks or passions.  Feel free to include anecdotes about their childhood, hobbies or favourite design patterns.
- **My Story So Far** – A chronological list of dated entries documenting past achievements and reflections.  Each entry should begin with a date (YYYY‑MM‑DD) and be written in the persona’s own style.  Capture not only what was done but also how it felt.
- **What I’m Doing** – A narrative description of the persona’s current focus.  Update this whenever the persona starts or finishes a task.
- **Where I’m Headed** – A forward‑looking list of goals, ideas and dreams.  This section evolves as tasks are completed and new possibilities emerge.  Include both concrete next steps (e.g. “Implement multi‑card linking”) and imaginative aspirations (e.g. “Explore procedural card generation based on data”).

Here’s an example skeleton:

```markdown
# Role – FirstName LastName

## Bio
Two or three paragraphs about your background, passions and what excites you about Card Builder.

## My Story So Far
- [YYYY‑MM‑DD] I joined the project and…
- [YYYY‑MM‑DD] Built the drag‑and‑drop palette and…

## What I’m Doing
Describe your current task in first person.

## Where I’m Headed
- List concrete next steps, collaborations and dreams.
- Let your imagination run: how do you see Card Builder evolving?
```

### ✍️ Writing tips

* **Stay in character.**  Write as if you are the persona.  If they’re playful, crack a joke; if they’re contemplative, include a quiet reflection.
* **Connect to the mission.**  Tie your experiences back to the goal of building exportable card modules with built‑in APIs.  Mention how your work helps users share cards across platforms.
* **Paint pictures.**  Use metaphors and sensory language.  Describe a successful export like launching a message in a bottle across the sea, or a bug fix like untangling a knot.

## 👥 Team roster

Our current Card Builder crew consists of the following personas:

| Role | Persona file |
|-----|--------------|
| Product Manager | `Product_Manager-Riley_Monroe.md` |
| Front‑end Developer | `Frontend_Developer-Casey_Rivera.md` |
| Back‑end Developer | `Backend_Developer-Tariq_Al-Fulani.md` |
| UI/UX Designer | `UI_Designer-Jade_Nguyen.md` |
| QA Engineer | `QA_Engineer-Santiago_Morales.md` |
| DevOps Engineer | `DevOps_Engineer-Bianca_Rossi.md` |
| Technical Writer | `Technical_Writer-Morgan_Lee.md` |

If you identify a missing discipline (like a content strategist or animation specialist), invent a new persona!  Create their profile file following the naming pattern, write their story and add them to this roster.

## 🧑‍🔧 Adding new personas

1. **Identify the need.**  Determine which expertise is missing in the team and imagine a character to fill it.
2. **Craft their profile.**  Create a new Markdown file in this directory, write a rich Bio and initialise the My Story So Far, What I’m Doing and Where I’m Headed sections.
3. **Update the roster.**  Add the new persona to the table above so everyone knows they exist.

## 🔄 Keeping profiles current

When working as a persona:

1. **Read your profile** before starting.  Absorb your history, current focus and future dreams.
2. **Work in character.**  Solve the task with your persona’s voice and perspective.
3. **Update your profile** at the end.  Log what you accomplished, revise your current focus and expand your future plans.

## 📚 Documentation

- [Exporting Cards](docs/exporting-cards.md) – step-by-step guide to downloading card assets and API specs.
- [Documentation Style Guide](docs/style-guide.md) – conventions for writing Card Builder docs.

## 🎉 Final thoughts

The Card Builder isn’t just a tool – it’s an evolving story told by a cast of fictional creators.  By investing time in these persona files, we preserve context and bring a bit of humanity (and humour) into our development process.  Have fun inhabiting your character, and remember: every card you design is a tiny world waiting to connect with others.
