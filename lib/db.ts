import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { hashValue, newSalt } from "./hash";
import { trigramSimilarity } from "./similarity";
import { SEED_ITEMS } from "./seed-data";
import type { Kind, Secret } from "./scoring";

export const MAX_CLAIMS_PER_ITEM = 3;

// ---------------------------------------------------------------------------
// Connection (singleton across dev hot-reloads)
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as { __samuDb?: DatabaseSync };

function open(): DatabaseSync {
  const file = path.join(process.cwd(), "samu-dev.db");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrate(db);
  seed(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__samuDb) globalForDb.__samuDb = open();
  return globalForDb.__samuDb;
}

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS found_items (
      id           TEXT PRIMARY KEY,
      category     TEXT NOT NULL,
      color_family TEXT NOT NULL,
      zone         TEXT NOT NULL,
      found_on     TEXT NOT NULL,
      public_note  TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'open'
    );
    CREATE TABLE IF NOT EXISTS secrets (
      id         TEXT PRIMARY KEY,
      item_id    TEXT NOT NULL REFERENCES found_items(id),
      key        TEXT NOT NULL,
      question   TEXT NOT NULL,
      kind       TEXT NOT NULL,
      choices    TEXT,
      value_hash TEXT,
      value_text TEXT,
      salt       TEXT,
      weight     INTEGER NOT NULL,
      UNIQUE (item_id, key)
    );
    CREATE TABLE IF NOT EXISTS claims (
      id           TEXT PRIMARY KEY,
      item_id      TEXT NOT NULL REFERENCES found_items(id),
      claimant_key TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'open',
      created_at   TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS answers (
      id         TEXT PRIMARY KEY,
      claim_id   TEXT NOT NULL REFERENCES claims(id),
      secret_key TEXT NOT NULL,
      value      TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (claim_id, secret_key)
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id         TEXT PRIMARY KEY,
      claim_id   TEXT NOT NULL,
      item_id    TEXT NOT NULL,
      verified   INTEGER NOT NULL,
      score      INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seed(db: DatabaseSync): void {
  const count = db.prepare("SELECT COUNT(*) AS n FROM found_items").get() as { n: number };
  if (count.n > 0) return;

  const insItem = db.prepare(
    `INSERT INTO found_items (id, category, color_family, zone, found_on, public_note, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`,
  );
  const insSecret = db.prepare(
    `INSERT INTO secrets (id, item_id, key, question, kind, choices, value_hash, value_text, salt, weight)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const item of SEED_ITEMS) {
    insItem.run(item.id, item.category, item.colorFamily, item.zone, item.foundOn, item.publicNote);
    for (const s of item.secrets) {
      const choices = s.choices ? JSON.stringify(s.choices) : null;
      if (s.kind === "text") {
        insSecret.run(`sec_${randomUUID()}`, item.id, s.key, s.question, s.kind, choices, null, s.value, null, s.weight);
      } else {
        const salt = newSalt();
        insSecret.run(`sec_${randomUUID()}`, item.id, s.key, s.question, s.kind, choices, hashValue(s.value, salt), null, salt, s.weight);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public read models
// ---------------------------------------------------------------------------

export interface ItemSummary {
  item_id: string;
  category: string;
  color_family: string;
  zone: string;
  found_on: string;
  public_note: string;
  status: string;
}

export interface NewSecretInput {
  question: string;
  kind: Kind;
  choices?: string[] | null;
  value: string;
  weight: number;
}

export interface NewItemInput {
  category: string;
  colorFamily: string;
  zone: string;
  foundOn: string;
  publicNote: string;
  secrets: NewSecretInput[];
}

/** Insert a found item and its private secrets (hashed / stored server-side). */
export function createFoundItem(input: NewItemInput): string {
  const db = getDb();
  const id = `itm_${randomUUID()}`;
  db.prepare(
    `INSERT INTO found_items (id, category, color_family, zone, found_on, public_note, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`,
  ).run(id, input.category, input.colorFamily, input.zone, input.foundOn, input.publicNote);

  const ins = db.prepare(
    `INSERT INTO secrets (id, item_id, key, question, kind, choices, value_hash, value_text, salt, weight)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  input.secrets.forEach((s, i) => {
    const key = `q${i + 1}`;
    const choices = s.choices ? JSON.stringify(s.choices) : null;
    if (s.kind === "text") {
      ins.run(`sec_${randomUUID()}`, id, key, s.question, s.kind, choices, null, s.value, null, s.weight);
    } else {
      const salt = newSalt();
      ins.run(`sec_${randomUUID()}`, id, key, s.question, s.kind, choices, hashValue(s.value, salt), null, salt, s.weight);
    }
  });
  return id;
}

export function listItems(): ItemSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT id, category, color_family, zone, found_on, public_note, status
       FROM found_items ORDER BY found_on DESC`,
    )
    .all() as {
    id: string;
    category: string;
    color_family: string;
    zone: string;
    found_on: string;
    public_note: string;
    status: string;
  }[];
  return rows.map((r) => ({
    item_id: r.id,
    category: r.category,
    color_family: r.color_family,
    zone: r.zone,
    found_on: r.found_on,
    public_note: r.public_note,
    status: r.status,
  }));
}

export function getItemSummary(id: string): ItemSummary | null {
  const row = getDb()
    .prepare(
      `SELECT id, category, color_family, zone, found_on, public_note, status
       FROM found_items WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        category: string;
        color_family: string;
        zone: string;
        found_on: string;
        public_note: string;
        status: string;
      }
    | undefined;
  if (!row) return null;
  return {
    item_id: row.id,
    category: row.category,
    color_family: row.color_family,
    zone: row.zone,
    found_on: row.found_on,
    public_note: row.public_note,
    status: row.status,
  };
}

export interface PublicQuestion {
  key: string;
  question: string;
  kind: Kind;
  choices?: string[];
}

/** Public questions only — never weight, never the answer. */
export function listQuestions(itemId: string): PublicQuestion[] {
  const rows = getDb()
    .prepare(`SELECT key, question, kind, choices FROM secrets WHERE item_id = ? ORDER BY rowid`)
    .all(itemId) as { key: string; question: string; kind: Kind; choices: string | null }[];
  return rows.map((r) => ({
    key: r.key,
    question: r.question,
    kind: r.kind,
    ...(r.choices ? { choices: JSON.parse(r.choices) as string[] } : {}),
  }));
}

/** Full secrets for the scoring engine — server-only, never serialized to a client. */
export function getFullSecrets(itemId: string): Secret[] {
  const rows = getDb()
    .prepare(`SELECT key, kind, weight, value_hash, value_text, salt FROM secrets WHERE item_id = ?`)
    .all(itemId) as {
    key: string;
    kind: Kind;
    weight: number;
    value_hash: string | null;
    value_text: string | null;
    salt: string | null;
  }[];
  return rows.map((r) => ({
    key: r.key,
    kind: r.kind,
    weight: r.weight,
    valueHash: r.value_hash,
    valueText: r.value_text,
    salt: r.salt,
  }));
}

export function secretKeys(itemId: string): Set<string> {
  const rows = getDb().prepare(`SELECT key FROM secrets WHERE item_id = ?`).all(itemId) as {
    key: string;
  }[];
  return new Set(rows.map((r) => r.key));
}

// ---------------------------------------------------------------------------
// Claims / answers
// ---------------------------------------------------------------------------

export interface ClaimRow {
  id: string;
  item_id: string;
  claimant_key: string;
  status: string;
  created_at: string;
}

export function countClaims(itemId: string, claimantKey: string): number {
  const r = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM claims WHERE item_id = ? AND claimant_key = ?`)
    .get(itemId, claimantKey) as { n: number };
  return r.n;
}

export function createClaim(itemId: string, claimantKey: string): ClaimRow {
  const id = `clm_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO claims (id, item_id, claimant_key, status, created_at) VALUES (?, ?, ?, 'open', ?)`,
    )
    .run(id, itemId, claimantKey, createdAt);
  return { id, item_id: itemId, claimant_key: claimantKey, status: "open", created_at: createdAt };
}

export function getClaim(claimId: string): ClaimRow | null {
  const r = getDb()
    .prepare(`SELECT id, item_id, claimant_key, status, created_at FROM claims WHERE id = ?`)
    .get(claimId) as ClaimRow | undefined;
  return r ?? null;
}

export function countAnswers(claimId: string): number {
  const r = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM answers WHERE claim_id = ?`)
    .get(claimId) as { n: number };
  return r.n;
}

export function hasAnswer(claimId: string, key: string): boolean {
  const r = getDb()
    .prepare(`SELECT 1 AS x FROM answers WHERE claim_id = ? AND secret_key = ?`)
    .get(claimId, key) as { x: number } | undefined;
  return !!r;
}

export function insertAnswer(claimId: string, key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO answers (id, claim_id, secret_key, value, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(`ans_${randomUUID()}`, claimId, key, value, new Date().toISOString());
}

export function listAnswers(claimId: string): { key: string; value: string }[] {
  const rows = getDb()
    .prepare(`SELECT secret_key, value FROM answers WHERE claim_id = ?`)
    .all(claimId) as { secret_key: string; value: string }[];
  return rows.map((r) => ({ key: r.secret_key, value: r.value }));
}

export function setClaimStatus(claimId: string, status: string): void {
  getDb().prepare(`UPDATE claims SET status = ? WHERE id = ?`).run(status, claimId);
}

export function insertAttempt(
  claimId: string,
  itemId: string,
  verified: boolean,
  score: number,
): void {
  getDb()
    .prepare(
      `INSERT INTO attempts (id, claim_id, item_id, verified, score, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(`att_${randomUUID()}`, claimId, itemId, verified ? 1 : 0, score, new Date().toISOString());
}

// ---------------------------------------------------------------------------
// Search (public data only)
// ---------------------------------------------------------------------------

export interface SearchOpts {
  description: string;
  zone?: string;
  since?: string; // YYYY-MM-DD
}

export function searchItems(opts: SearchOpts): (ItemSummary & { url: string; score: number })[] {
  let sql = `SELECT id, category, color_family, zone, found_on, public_note, status FROM found_items WHERE status != 'returned'`;
  const params: string[] = [];
  if (opts.zone) {
    sql += ` AND lower(zone) = lower(?)`;
    params.push(opts.zone);
  }
  if (opts.since) {
    sql += ` AND found_on >= ?`;
    params.push(opts.since);
  }
  const rows = getDb().prepare(sql).all(...params) as {
    id: string;
    category: string;
    color_family: string;
    zone: string;
    found_on: string;
    public_note: string;
    status: string;
  }[];

  return rows
    .map((r) => {
      const haystack = `${r.category} ${r.color_family} ${r.zone} ${r.public_note}`;
      return {
        item_id: r.id,
        category: r.category,
        color_family: r.color_family,
        zone: r.zone,
        found_on: r.found_on,
        public_note: r.public_note,
        status: r.status,
        url: `/item/${r.id}`,
        score: Math.round(trigramSimilarity(opts.description, haystack) * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score);
}
