# Toolbar Naming & Export

## Wireframe

```plaintext
+--------------------------------------------------------------+
| Card Name: [ Untitled Card ____________________________ ]   |
|                                                    [Export] |
+--------------------------------------------------------------+
```

## Interaction Notes
- **Name Field**
  - Inline text input anchored to the left.
  - Placeholder “Untitled Card” appears until the user types.
  - Hitting `Enter` commits the name and blurs the field.
  - Invalid characters trigger a subtle shake and inline error.
- **Export Button**
  - Right‑aligned primary button with download icon.
  - Click opens export modal; `Shift+E` serves as keyboard shortcut.
  - Button enters loading state during export and shows success toast when done.
- **Toolbar Layout**
  - Name field grows with available space; export button maintains fixed width.
  - On narrow screens the export button collapses into an icon‑only variant.
