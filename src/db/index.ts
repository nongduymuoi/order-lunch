import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { LOCAL_DB_DIR } from "./local";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url, max: 5 });
    return drizzlePg(pool, { schema });
  }
  // Không có DATABASE_URL: dùng Postgres nhúng (PGlite) lưu ở thư mục local để chạy thử.
  return drizzlePglite(new PGlite(LOCAL_DB_DIR), { schema }) as unknown as Db;
}

const globalForDb = globalThis as unknown as { __datcomDb?: Db };

function getDb(): Db {
  return (globalForDb.__datcomDb ??= createDb());
}

// Khởi tạo kết nối ở truy vấn đầu tiên, không phải lúc import (tránh mở DB khi build).
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
