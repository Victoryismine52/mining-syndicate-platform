import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";
import * as siteSchema from "@shared/site-schema";

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const url = new URL(connectionString);
const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

const schemas = { ...schema, ...siteSchema };

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
