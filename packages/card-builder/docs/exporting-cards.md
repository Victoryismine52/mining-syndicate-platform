# Exporting Cards

The Card Builder lets you send your creation out into the world as a self‑contained module.
Follow these steps to grab everything you need.

## Using the Export Button
1. Click **Export** in the toolbar.
2. Pick what to download:
   - **Card JSON** – the layout and settings of the card.
   - **OpenAPI spec** – endpoints for the card’s generated API.
3. Your browser downloads the chosen files so you can drop them into any project.

## Recreating the Export Locally
Prefer a terminal?

```bash
npm run build
```

The build script writes `dist/card.json` and `dist/card.yaml`, matching what the in‑app export produces.

> Implementation details checked with Backend Developer Tariq Al‑Fulani and Frontend Developer Casey Rivera.
