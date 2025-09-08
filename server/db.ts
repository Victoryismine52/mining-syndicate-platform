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

const schemas = { ...schema, ...siteSchema };

let pool: NeonPool | PgPool | undefined;
let db:
  | ReturnType<typeof neonDrizzle>
  | ReturnType<typeof pgDrizzle>
  | any;

if (config.storageMode === 'memory') {
  // In memory mode, avoid initializing any database connections.
  // Export a proxy that throws on use to make accidental DB calls obvious.
  pool = undefined;
  db = new Proxy({}, {
    get() {
      throw new Error('Database is disabled in memory mode (STORAGE_MODE=memory)');
    },
  });
} else {
  const connectionString = config.databaseUrl as string;
  const url = new URL(connectionString);
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

  if (isLocal) {
    pool = new PgPool({ connectionString });
    db = pgDrizzle(pool, { schema: schemas });
  } else {
    pool = new NeonPool({ connectionString });
    db = neonDrizzle({ client: pool, schema: schemas });
  }
}

export { pool, db };
