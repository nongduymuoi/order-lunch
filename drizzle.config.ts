import "./scripts/env";
import { defineConfig } from "drizzle-kit";
import { LOCAL_DB_DIR } from "./src/db/local";

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(url
    ? { dbCredentials: { url } }
    : { driver: "pglite", dbCredentials: { url: LOCAL_DB_DIR } }),
});
