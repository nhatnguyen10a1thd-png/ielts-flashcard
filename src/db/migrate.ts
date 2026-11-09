import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function runMigration() {
  console.log("Applying database migrations...");
  const useSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com");

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Enable extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Track applied migrations in a table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__app_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Check if initial schema was already created before migration tracker was added
    const initialCheck = await client.query(`SELECT to_regclass('public.users') as exists;`);
    if (initialCheck.rows[0]?.exists) {
      await client.query(`
        INSERT INTO "__app_migrations" ("name")
        VALUES ('0000_cultured_black_queen.sql')
        ON CONFLICT ("name") DO NOTHING;
      `);
    }

    const appliedRes = await client.query(`SELECT "name" FROM "__app_migrations";`);
    const appliedSet = new Set(appliedRes.rows.map((r: { name: string }) => r.name));

    // Read all generated migration sql files in order
    const drizzleDir = path.join(process.cwd(), "drizzle");
    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const sqlFile of sqlFiles) {
      if (appliedSet.has(sqlFile)) {
        console.log(`- Skipping already applied migration: ${sqlFile}`);
        continue;
      }

      console.log(`Executing migration file: ${sqlFile}`);
      const sqlContent = fs.readFileSync(path.join(drizzleDir, sqlFile), "utf-8");
      const statements = sqlContent.split("--> statement-breakpoint");

      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          await client.query(trimmed);
        }
      }

      await client.query(
        `INSERT INTO "__app_migrations" ("name") VALUES ($1) ON CONFLICT DO NOTHING;`,
        [sqlFile]
      );
      console.log(`✓ Applied ${sqlFile}`);
    }

    // Add GIN trigram indexes for sub-millisecond search across millions of words
    await client.query(
      `CREATE INDEX IF NOT EXISTS words_word_trgm_idx ON words USING gin (word_normalized gin_trgm_ops);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS words_meaning_trgm_idx ON words USING gin (meaning gin_trgm_ops);`
    );

    await client.query("COMMIT");
    console.log("✓ All migrations and indexes applied successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
