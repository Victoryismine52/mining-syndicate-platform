# Toolbar Naming, Export, and Gallery Delete Wireframes

These sketches map the latest flow for naming cards, exporting them, and managing deletions in the gallery.

## Toolbar: name field & export button
```
+------------------------------------------------------------------+
| [card name____________________]                [ Export ]        |
+------------------------------------------------------------------+
```
- Name field auto-trims spaces and defaults to **Untitled Card**.
- Export button opens a modal confirming assets and API bundle.

## Gallery: delete affordance
```
+------------------------------+
| [thumbnail]  Card Title      |
|              [🗑 Delete]     |
+------------------------------+
```
- Trash icon reveals a confirm dialog before removal.
- Successful deletion animates the card fading out.

## Interaction Notes

### Casey Rivera
- Casey Rivera: Read AGENT.md
- Casey Rivera: Ensure keyboard focus order flows from name field to export button.
- Casey Rivera: Wire delete animation and confirmation dialog in the gallery.

### Tariq Al-Fulani
- Tariq Al-Fulani: Read AGENT.md
- Tariq Al-Fulani: Confirm export API accepts trimmed names and returns asset bundle details.
- Tariq Al-Fulani: Provide endpoint or hook for gallery deletions to sync server state.
