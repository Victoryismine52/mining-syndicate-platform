# Export Guide

The Card Builder lets you export a designed card along with its API description.

Use the **Export** button in the toolbar to download:

- **Card JSON** – a snapshot of the card's layout and settings.
- **OpenAPI spec** – a machine-readable description of the endpoints generated for the card.

Choose a format from the export menu. The browser downloads the selected files so you can drop them into your project or share them with a teammate.

## Generating the API locally

To rebuild the API spec from source, run:

```bash
npm run build
```

The build script writes `dist/card.json` and `dist/card.yaml`. These files mirror what you get from the in-app export.

> _Implementation details are verified with Backend Developer Tariq Al‑Fulani and Frontend Developer Casey Rivera so the export flow stays true to the codebase._
