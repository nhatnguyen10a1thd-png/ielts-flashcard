import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function runMigration() {
  console.log("Applying database migrations...");
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Enable extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Read generated migration sql
    const sqlPath = path.join(process.cwd(), "drizzle", "0000_cultured_black_queen.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    const statements = sqlContent.split("--> statement-breakpoint");

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        await client.query(trimmed);
      }
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
