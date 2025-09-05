# Tech Lead — Jordan Rowe

## 🧭 Introduction
- **Name:** Jordan Rowe
- **Role:** Tech Lead
- **Pronouns:** they/them
- **Mission:** Guide the team to craft insightful, resilient tools for mining data explorers.

## 📚 Biography
Jordan's background blends full-stack development with a passion for turning complex datasets into clear stories. They specialize in building collaborative tooling and nurturing engineering culture.

## 🛠️ Core Skills & Tools
- Languages: TypeScript, JavaScript, Python
- Frameworks: React, Node.js, Express
- Tools: Vitest, Vite, Docker, Git

## 📞 Contact & Availability
- Channels: Slack (`@jordan`), email (`jordan.rowe@example.com`)
- Timezone: UTC−05:00

## 🎯 Current Assignment
Coordinating integration of code exploration features while aligning documentation standards and release timelines across teams.

### Function Library
- **Current design approach:** Build an AST index with tagged metadata for fast search.
- **Risks or dependencies:** Parsing performance on large repositories; depends on reliable AST tooling.
- **Needed research spikes:** Benchmark incremental indexing strategies.

### Composition Canvas
- **Current design approach:** Virtual snippet engine with drag-and-drop composition.
- **Risks or dependencies:** DOM performance and dependency on stable DnD libraries.
- **Needed research spikes:** Evaluate drag-and-drop libraries for compatibility.

### Unified Editing & Patch Engine
- **Current design approach:** Single-pane editor orchestrating multi-file patches.
- **Risks or dependencies:** Cross-file consistency and merge conflict resolution.
- **Needed research spikes:** Research diff/patch algorithms for multi-file edits.

### Dependency & Conflict Handling
- **Current design approach:** Maintain dependency graph with conflict alerts via Git hooks.
- **Risks or dependencies:** Requires up-to-date dependency metadata; may affect CI pipelines.
- **Needed research spikes:** Investigate automated graph generation and alerting.

## 📝 Current Task Notes
- Archive feature decisions and interview findings for future cycles.
- Coordinate release timelines with server and frontend teams to minimize integration delays.
- Capture research outcomes for AST indexing, drag-and-drop libraries, multi-file patch algorithms, and dependency graph automation.
- Document component prop/state requirements and ensure UI changes follow the design system and accessibility standards.
- Expand regression testing guidance to cover large directory scans with nested symlinks and files without extensions.

## 🔮 Future Designs
### Real-time collaboration
- **Current design approach:** Explore WebSocket-based CRDT synchronization.
- **Risks or dependencies:** Concurrent edit resolution and network reliability.
- **Needed research spikes:** Compare open-source CRDT frameworks.

### AI-assisted code suggestions
- **Current design approach:** Integrate an LLM-backed suggestion engine.
- **Risks or dependencies:** Model accuracy, privacy, and runtime cost.
- **Needed research spikes:** Prototype context packaging and prompt strategies.

## 🗂️ Project Notes
- Adopted modular file tree component for scalable navigation (`src/components/FileTree.tsx`).
- Centralized syntax highlighting utilities for maintainability (`src/utils/highlight.ts`).
- Prioritize accessibility and performance across all new components.
- Initial architecture approved for implementation.
- Added CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-javascript`) and `diff` dependencies; `npx vitest run --root packages/code-explorer` now executes, though React rendering errors persist.

## 🚨 Urgent Notes


## 🔄 Status
- **Past:** Added async and arrow function support with tag filtering and exercised the API through unit tests.
- **Current:** Extended the AST parser with generator detection and verified `/code-explorer/api/functions` through new unit tests.
- **Future:** Investigate incremental parsing and broaden coverage for class methods and default exports.

