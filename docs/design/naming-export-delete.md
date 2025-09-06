# Toolbar Naming, Export, and Gallery Delete Wireframes

These sketches map the flow for naming cards, exporting them, and deleting saved cards in the gallery.

## Toolbar: Name field & Export button
```
+--------------------------------------------------------------------+
| Name: [ Untitled Card________ ]                        [ Export ]  |
+--------------------------------------------------------------------+
```
- Name field auto-trims spaces and falls back to **Untitled Card**.
- Export button opens a modal confirming assets and API bundle.
- Export button is disabled until a non-empty name is provided.
- Disabled state uses muted foreground/background tokens from Code Explorer's style system.

## Gallery: delete affordance
```
+----------------------------------------------+
| [thumbnail]  Card Title                [🗑]   |
+----------------------------------------------+
```
- Trash icon appears on hover; clicking prompts a confirm dialog before removal.
- Successful deletion fades the card out and cleans up localStorage.
- Hover and fade timings follow Code Explorer's motion curve (`ease-out`, 150 ms).

## Interaction Notes

### Casey Rivera
- Casey Rivera: Read AGENT.md
- Casey Rivera: Ensure keyboard focus order flows from name field to export button.
- Casey Rivera: Style disabled Export state when name field is empty.
- Casey Rivera: Wire delete animation and confirmation dialog in the gallery.
- Casey Rivera: Apply Code Explorer spacing (`gap-2`, `p-2`) and typography tokens for visual consistency.

### Tariq Al-Fulani
- Tariq Al-Fulani: Read AGENT.md
- Tariq Al-Fulani: Confirm export API accepts trimmed names and returns asset bundle details.
- Tariq Al-Fulani: Provide endpoint or hook for gallery deletions to sync server state.
- Tariq Al-Fulani: Surface style config if backend needs to broadcast theme updates.
