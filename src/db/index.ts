import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const isProduction = process.env.NODE_ENV === "production";
const useSsl =
  connectionString.includes("sslmode=require") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("supabase.co");

const pool =
  global.__dbPool ||
  new Pool({
    connectionString,
    max: isProduction ? 10 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global.__dbPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
