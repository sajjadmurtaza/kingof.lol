import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle({ connection: url, schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

// For pages that can gracefully handle no DB (during build)
export function tryGetDb() {
  try {
    return getDb();
  } catch {
    return null;
  }
}
