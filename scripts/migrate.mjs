import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const migrationAttempts = Number.parseInt(process.env.DB_MIGRATION_ATTEMPTS ?? "20", 10);
const retryDelayMs = Number.parseInt(process.env.DB_MIGRATION_RETRY_MS ?? "3000", 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (process.env.SKIP_DB_MIGRATIONS === "true") {
  console.log("Skipping database migrations.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set; skipping database migrations.");
  process.exit(0);
}

for (let attempt = 1; attempt <= migrationAttempts; attempt += 1) {
  const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(client);

  try {
    console.log(`Running database migrations (${attempt}/${migrationAttempts})...`);
    await migrate(db, { migrationsFolder: "./db/migrations" });
    await client.end();
    console.log("Database migrations complete.");
    process.exit(0);
  } catch (error) {
    await client.end().catch(() => {});

    if (attempt === migrationAttempts) {
      console.error("Database migrations failed.");
      console.error(error);
      process.exit(1);
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Database migration attempt ${attempt} failed: ${message}`);
    await sleep(retryDelayMs);
  }
}
