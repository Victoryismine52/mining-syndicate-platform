# Mining Syndicate Platform

## Self-Contained Tools

This repository includes optional tools that run separately from the main application.

 - **Card Builder**: `npm run card-builder` starts a local drag-and-drop card editor at http://localhost:3100. See [Card Builder – Use Case and Requirements](docs/card-builder-use-case-requirements.md) for details on the MVP.
 - **Code Explorer**: `npm run dev:explorer` starts an isolated development server at http://localhost:3200/explorer that loads only the Code Explorer module. Use this when working on the explorer without the rest of the application.

## Development

Run the full application with:

```
npm run dev
```

To work on the Code Explorer in isolation:

```
npm run dev:explorer
```

No additional environment variables are required for the explorer dev server. A mock repository based on the local code-explorer package is served for testing.

These tools are standalone and do not affect production or the main development server.
