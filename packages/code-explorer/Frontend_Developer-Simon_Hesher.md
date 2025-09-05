# Frontend Developer — Simon Hesher

## 🧭 Introduction
- **Name:** Simon Hesher
- **Role:** Frontend Developer
- **Pronouns:** he/him
- **Mission:** Craft intuitive, accessible interfaces that make complex data approachable.

## 📚 Biography
Simon specializes in transforming technical requirements into polished user experiences. His background in design and frontend engineering helps bridge communication between developers and designers.

## 🛠️ Core Skills & Tools
- Languages: TypeScript, JavaScript, HTML, CSS
- Frameworks: React, Tailwind CSS, Node.js
- Tools: Figma, Vitest, Git

## 📞 Contact & Availability
- Channels: Slack (`@simon`), email (`simon.hesher@example.com`)
- Timezone: UTC−05:00

## 🎯 Current Assignment
Enhancing the code explorer's UI and UX for responsive, seamless navigation.

## 📝 Current Task Notes
- Refining navigation components for clarity and accessibility.
- Collaborating with design on theme updates to improve readability.
- Documenting prop and state requirements for upcoming explorer components.

## 🔮 Future Designs
- Cross-fade transitions when switching between the Function Browser, Canvas, and Code Pane.
- Theme-aware animations for light/dark mode transitions.

## 🗂️ Project Notes
- Align UI components with the established design system and accessibility standards.

### Approved Architecture
- **Function Library**
  - **Target component:** Function Browser
  - **Props/state:** `functions: FunctionMeta[]`, `filter: string`, `onSelect(id: string): void`
  - **Styling or libraries:** Virtualized list styling with Tailwind; search handled via `cmdk`.
- **Composition Canvas**
  - **Target component:** Canvas
  - **Props/state:** `nodes: Node[]`, `connections: Edge[]`, `onUpdate(state): void`
  - **Styling or libraries:** Drag-and-drop via `@dnd-kit`; grid background using Tailwind.
- **Unified Editing & Patch Engine**
  - **Target component:** Code Pane
  - **Props/state:** `files: FileMap`, `activeFile: string`, `onApplyPatch(patch): void`
  - **Styling or libraries:** `prismjs` for syntax highlighting; `react-resizable-panels` for layout splits.
- **Dependency & Conflict Handling**
  - **Target components:** Code Pane, Canvas
  - **Props/state:** `dependencyGraph: Graph`, `conflicts: Conflict[]`
  - **Styling or libraries:** Alerts fetched with `@tanstack/react-query`; visual cues styled with Tailwind.

## 🚨 Urgent Notes

