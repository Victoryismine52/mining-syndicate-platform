import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import pkg from "pg";
const { Pool: PgPool } = pkg;
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";
import * as siteSchema from "@shared/site-schema";
import { config } from "./config";

neonConfig.webSocketConstructor = ws;

const connectionString = config.databaseUrl;

const url = new URL(connectionString);
const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

// Exclude old sites table from schema to prevent collision with siteSchema.sites
const { sites: _oldSites, ...baseSchema } = schema as any;
const schemas = { ...baseSchema, ...siteSchema };

let pool: NeonPool | PgPool;
let db:
  | ReturnType<typeof neonDrizzle>
  | ReturnType<typeof pgDrizzle>;

if (isLocal) {
  pool = new PgPool({ connectionString });
  db = pgDrizzle(pool, { schema: schemas });
} else {
  pool = new NeonPool({ connectionString });
  db = neonDrizzle({ client: pool, schema: schemas });
}

export { pool, db };
