#!/usr/bin/env tsx

import { db, pool } from "../server/db";
import * as schema from "../shared/schema";
import * as siteSchema from "../shared/site-schema";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDir = path.resolve(__dirname, "../server/seeds");

async function seed() {
  const tables: Record<string, any> = { ...schema, ...siteSchema };
  const entries = await fs.readdir(seedsDir);

  for (const file of entries) {
    if (!file.endsWith(".json")) continue;
    const tableName = path.basename(file, ".json");
    const table = tables[tableName];

    if (!table) {
      console.warn(`No schema found for ${tableName}, skipping.`);
      continue;
    }

    const filePath = path.join(seedsDir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const records = JSON.parse(raw);

    if (!Array.isArray(records) || records.length === 0) {
      console.warn(`No records found in ${file}.`);
      continue;
    }

    console.log(`Seeding ${records.length} record(s) into ${tableName}...`);
    await db.insert(table).values(records).onConflictDoNothing();
  }
}

seed()
  .then(() => {
    console.log("Database seeding complete.");
  })
  .catch((err) => {
    console.error("Error seeding database:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
