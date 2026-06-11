import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const dsn = process.env.CHECKUP_DATABASE_URL;
  if (!dsn) return null;
  const client = postgres(dsn, { max: 5 });
  _db = drizzle(client, { schema });
  return _db;
}
