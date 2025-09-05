# Preview Pipeline

This pipeline runs on every pull request to provide a live preview of card artifacts.

1. **Build**
   - `npm run build` compiles the application and triggers `scripts/build-openapi.ts`.
   - The script writes `card.json` and `card.yaml` to the `dist/` directory.
2. **Deploy Preview**
   - Netlify uses `netlify.toml` to build and publish the `dist/` folder for PRs.
   - The preview URL exposes the generated artifacts at `/card.json` and `/card.yaml`.

These steps ensure every pull request has a preview environment serving both the card configuration and its corresponding OpenAPI specification.
