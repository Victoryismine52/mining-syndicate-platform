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
Leading the integration of code exploration features into the platform.

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
- Initial architecture drafted and under review.

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

## 🚨 Urgent Notes

