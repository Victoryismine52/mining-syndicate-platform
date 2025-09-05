# Exporting Cards

Turn a Card Builder creation into a reusable module that ships with its own API contract.

## Before you start
- Start the Card Builder locally:
  ```bash
  npm run card-builder
  ```
- Design your card on the canvas.

## Export
1. Click **Export** in the toolbar.
2. Pick a component format:
   - **React** for React projects.
   - **Web Component** for any framework.
3. Choose your downloads:
   - **card.json** – captures the card’s configuration so you can reload or version it.
   - **openapi.yaml** – documents the generated endpoints with an OpenAPI spec for client or server generation.
4. Save the files to your project.

## Next steps
- Import the component into your application.
- Wire the documented endpoints to your backend.
- Need writing tips? See the [Documentation Style Guide](./style-guide.md).
