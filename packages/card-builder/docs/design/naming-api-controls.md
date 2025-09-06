# Naming and API Controls

This document outlines placement and interaction behavior for the card-name field and the API export button within the Card Builder editor toolbar.

## Wireframes

Toolbar layout showing the card name field on the left and API export button on the right:

```
+--------------------------------------------------------------+
| [Card Name: Untitled Card__________]          [Export API ▼] |
+--------------------------------------------------------------+
|                                                              |
|                      Editor Canvas                           |
|                                                              |
+--------------------------------------------------------------+
```

Dropdown options revealed after pressing **Export API**:

```
+--------------------------------------------------------------+
| [Card Name: Sales Summary__________]          [Export API ▲] |
+--------------------------------------------------------------+
                               | REST      |
                               | GraphQL   |
```

## Interaction Notes

- **Card Name Field**
  - Editable text input anchored to the left side of the toolbar.
  - Placeholder text "Untitled Card" when no name is provided.
  - Saving occurs on blur or when the user presses <kbd>Enter</kbd>.
  - Casey: ensure accessible label and responsive width using Tailwind utilities.

- **API Export Button**
  - Primary action button anchored to the right side of the toolbar.
  - Opens a dropdown with export formats; default options are REST and GraphQL.
  - Disabled until the card schema passes validation.
  - Tariq: wire button actions to the API generator endpoint and surface errors.

## Implementation Coordination

The wireframes were reviewed with:

- **Casey Rivera** (Front-end) – confirmed layout fits existing toolbar components.
- **Tariq Al-Fulani** (Back-end) – validated that export selections map cleanly to generator APIs.

These visuals are intended to guide implementation and ensure a smooth handoff between design, front-end, and back-end workstreams.

