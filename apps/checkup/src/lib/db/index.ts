import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const dsn = process.env.CHECKUP_DATABASE_URL;
  if (!dsn) return null;
  // RDS tem rds.force_ssl=1 → conexão sem SSL é rejeitada (e o erro era engolido
  // pelo .catch da rota de eventos). "require" cifra sem exigir verificação da CA
  // (cert da Amazon RDS, dentro da VPC). Local sem SSL: detecta localhost.
  const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal)[:/]/.test(dsn);
  const client = postgres(dsn, { max: 5, ssl: isLocal ? false : "require" });
  _db = drizzle(client, { schema });
  return _db;
}
