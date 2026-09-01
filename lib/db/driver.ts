import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";

export type Dialect = "sqlite" | "postgres";

export interface Driver {
  dialect: Dialect;
  all(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  get(sql: string, params?: unknown[]): Promise<Record<string, unknown> | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
  exec(sql: string): Promise<void>;
}

// SQL is written once with Postgres-style `$1, $2` placeholders; for SQLite we
// translate them to `?` (positional — every placeholder is used once, in order).
function toQuestionMarks(sql: string): string {
  return sql.replace(/\$\d+/g, "?");
}

// --- SQLite (dev only) -----------------------------------------------------
// node:sqlite is a Node >= 22.5 builtin, so it is imported LAZILY — the
// Postgres/Netlify path never touches it (and never needs that Node version).
const g = globalThis as unknown as { __samuSqlite?: DatabaseSync };

async function sqliteDb(): Promise<DatabaseSync> {
  if (!g.__samuSqlite) {
    const { DatabaseSync: DB } = await import("node:sqlite");
    const db = new DB(path.join(process.cwd(), "samu-dev.db"));
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    g.__samuSqlite = db;
  }
  return g.__samuSqlite;
}

function sqliteDriver(): Driver {
  return {
    dialect: "sqlite",
    async all(sql, params = []) {
      const db = await sqliteDb();
      return db.prepare(toQuestionMarks(sql)).all(...params) as Record<string, unknown>[];
    },
    async get(sql, params = []) {
      const db = await sqliteDb();
      return db.prepare(toQuestionMarks(sql)).get(...params) as Record<string, unknown> | undefined;
    },
    async run(sql, params = []) {
      const db = await sqliteDb();
      db.prepare(toQuestionMarks(sql)).run(...params);
    },
    async exec(sql) {
      const db = await sqliteDb();
      db.exec(sql);
    },
  };
}

// --- Postgres (Neon, production) -------------------------------------------

function postgresDriver(): Driver {
  const sql = neon(process.env.DATABASE_URL as string);
  return {
    dialect: "postgres",
    async all(query, params = []) {
      return (await sql.query(query, params)) as Record<string, unknown>[];
    },
    async get(query, params = []) {
      const rows = (await sql.query(query, params)) as Record<string, unknown>[];
      return rows[0];
    },
    async run(query, params = []) {
      await sql.query(query, params);
    },
    async exec(query) {
      // The Neon HTTP driver runs one statement per call.
      for (const stmt of query.split(";").map((s) => s.trim()).filter(Boolean)) {
        await sql.query(stmt);
      }
    },
  };
}

let cached: Driver | null = null;

export function getDriver(): Driver {
  if (!cached) cached = process.env.DATABASE_URL ? postgresDriver() : sqliteDriver();
  return cached;
}
