import "./env";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import { LOCAL_DB_DIR } from "../src/db/local";

const migrationsFolder = "./drizzle";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url, max: 1 });
    await migratePg(drizzlePg(pool), { migrationsFolder });
    await pool.end();
    console.log("✓ Đã migrate database Postgres (DATABASE_URL)");
  } else {
    const client = new PGlite(LOCAL_DB_DIR);
    await migratePglite(drizzlePglite(client), { migrationsFolder });
    await client.close();
    console.log(`✓ Đã migrate database local (${LOCAL_DB_DIR})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
