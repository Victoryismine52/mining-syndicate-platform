# Exporting Cards

Use Card Builder to package your design along with a matching API description.

## Before you start
- Start Card Builder locally:
  ```bash
  npm run card-builder
  ```
- Design your card on the canvas.

## Export steps
1. Click **Export** in the toolbar.
2. Choose a component format:
   - **React** for React projects.
   - **Web Component** for any framework.
3. Decide which files to download:
   - **card.json** — snapshot of the card configuration for reloading or version control.
   - **openapi.yaml** — OpenAPI spec describing every generated endpoint, perfect for client or server scaffolding.
4. Save the files where your app can reach them.

## Next steps
- Import the component into your app and wire the endpoints described in `openapi.yaml`.
- File names or API shapes changed? Regenerate exports to stay in sync.
- Need writing tips? See the [Documentation Style Guide](./style-guide.md).
