# Developer Guide

## Running tests

Run the unit tests with:

```bash
npm test
```

For browser checks use:

```bash
npm run test:playwright
```

## Generating API artifacts

Create the OpenAPI spec and card JSON by running:

```bash
npm run build
```

The command writes both files to `dist/` for you to inspect or publish.
