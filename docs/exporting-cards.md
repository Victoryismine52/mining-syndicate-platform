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
2. Choose your preferred format (React component or Web Component).
3. Download the bundle. It includes:
   - the component source;
   - an OpenAPI spec describing generated endpoints.

## Next steps
- Import the component into your application.
- Wire the documented endpoints to your backend.
- Need writing tips? See the [Documentation Style Guide](./style-guide.md).
