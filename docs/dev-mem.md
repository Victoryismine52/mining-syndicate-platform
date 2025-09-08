# In-Memory Development Mode

The `dev:mem` workflow runs the server using in-memory JSON storage instead of Postgres.

## Prerequisites
- Node.js and npm installed
- `npm install` completed

## Seeding
The memory store expects `server/data/seed.json`. Generate it with:

```bash
npm run seed:mem
```

The `dev:mem` script automatically runs this when the file is missing.

## Running
Start the server:

```bash
npm run dev:mem
```

Optional flags:

- `--monitor` – enable request logging via `pino-http`
- `--metrics` – expose Prometheus metrics at `/metrics`
- `--debug` – verbose logging for storage operations

The server listens on `http://localhost:5000` and bypasses authentication.
