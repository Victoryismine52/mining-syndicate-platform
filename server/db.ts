import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import pkg from "pg";
const { Pool: PgPool } = pkg;
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";
import * as siteSchema from "@shared/site-schema";
import { config } from "./config";

let pool: NeonPool | PgPool | { end: () => Promise<void> } | undefined;
let db: any;

if (config.storageMode === "memory") {
  // Stub database for non-production in-memory mode
  const noop = async () => {};
  pool = { end: noop } as any;
  db = {
    execute: noop,
    transaction: async (fn: (tx: any) => Promise<any>) => fn({}),
  };
} else {
  neonConfig.webSocketConstructor = ws;

  const connectionString = config.databaseUrl!;

  const url = new URL(connectionString);
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

  const schemas = { ...schema, ...siteSchema };

  if (isLocal) {
    pool = new PgPool({ connectionString });
    db = pgDrizzle(pool, { schema: schemas });
  } else {
    pool = new NeonPool({ connectionString });
    db = neonDrizzle({ client: pool, schema: schemas });
  }
}

export { pool, db };
