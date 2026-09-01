import { randomUUID } from "node:crypto";
import { hashValue, newSalt } from "./hash";
import { trigramSimilarity } from "./similarity";
import { SEED_ITEMS } from "./seed-data";
import type { Kind, Secret } from "./scoring";
import { getDriver } from "./db/driver";

export const MAX_CLAIMS_PER_ITEM = 3;

// ---------------------------------------------------------------------------
// Schema + seed (runs once per instance, idempotent for both dialects)
// ---------------------------------------------------------------------------

const DDL = `
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
    position   INTEGER NOT NULL DEFAULT 0,
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
`;

let readyPromise: Promise<void> | null = null;

function ready(): Promise<void> {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

async function init(): Promise<void> {
  const db = getDriver();
  await db.exec(DDL);
  const count = await db.get(`SELECT COUNT(*) AS n FROM found_items`);
  if (Number(count?.n ?? 0) > 0) return;

  for (const item of SEED_ITEMS) {
    await db.run(
      `INSERT INTO found_items (id, category, color_family, zone, found_on, public_note, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open') ON CONFLICT (id) DO NOTHING`,
      [item.id, item.category, item.colorFamily, item.zone, item.foundOn, item.publicNote],
    );
    let position = 0;
    for (const s of item.secrets) {
      const choices = s.choices ? JSON.stringify(s.choices) : null;
      if (s.kind === "text") {
        await insertSecret(item.id, s.key, s.question, s.kind, choices, null, s.value, null, s.weight, position++);
      } else {
        const salt = newSalt();
        await insertSecret(item.id, s.key, s.question, s.kind, choices, hashValue(s.value, salt), null, salt, s.weight, position++);
      }
    }
  }
}

async function insertSecret(
  itemId: string,
  key: string,
  question: string,
  kind: string,
  choices: string | null,
  valueHash: string | null,
  valueText: string | null,
  salt: string | null,
  weight: number,
  position: number,
): Promise<void> {
  await getDriver().run(
    `INSERT INTO secrets (id, item_id, key, question, kind, choices, value_hash, value_text, salt, weight, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (item_id, key) DO NOTHING`,
    [`sec_${randomUUID()}`, itemId, key, question, kind, choices, valueHash, valueText, salt, weight, position],
  );
}

// ---------------------------------------------------------------------------
// Found items
// ---------------------------------------------------------------------------

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

export async function createFoundItem(input: NewItemInput): Promise<string> {
  await ready();
  const id = `itm_${randomUUID()}`;
  await getDriver().run(
    `INSERT INTO found_items (id, category, color_family, zone, found_on, public_note, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'open')`,
    [id, input.category, input.colorFamily, input.zone, input.foundOn, input.publicNote],
  );
  let position = 0;
  for (const s of input.secrets) {
    const choices = s.choices ? JSON.stringify(s.choices) : null;
    if (s.kind === "text") {
      await insertSecret(id, `q${position + 1}`, s.question, s.kind, choices, null, s.value, null, s.weight, position);
    } else {
      const salt = newSalt();
      await insertSecret(id, `q${position + 1}`, s.question, s.kind, choices, hashValue(s.value, salt), null, salt, s.weight, position);
    }
    position++;
  }
  return id;
}

export interface ItemSummary {
  item_id: string;
  category: string;
  color_family: string;
  zone: string;
  found_on: string;
  public_note: string;
  status: string;
}

function toSummary(r: Record<string, unknown>): ItemSummary {
  return {
    item_id: String(r.id),
    category: String(r.category),
    color_family: String(r.color_family),
    zone: String(r.zone),
    found_on: String(r.found_on),
    public_note: String(r.public_note),
    status: String(r.status),
  };
}

export async function listItems(): Promise<ItemSummary[]> {
  await ready();
  const rows = await getDriver().all(
    `SELECT id, category, color_family, zone, found_on, public_note, status
     FROM found_items ORDER BY found_on DESC`,
  );
  return rows.map(toSummary);
}

export async function getItemSummary(id: string): Promise<ItemSummary | null> {
  await ready();
  const row = await getDriver().get(
    `SELECT id, category, color_family, zone, found_on, public_note, status
     FROM found_items WHERE id = $1`,
    [id],
  );
  return row ? toSummary(row) : null;
}

export interface PublicQuestion {
  key: string;
  question: string;
  kind: Kind;
  choices?: string[];
}

/** Public questions only — never weight, never the answer — in stable order. */
export async function listQuestions(itemId: string): Promise<PublicQuestion[]> {
  await ready();
  const rows = await getDriver().all(
    `SELECT key, question, kind, choices FROM secrets WHERE item_id = $1 ORDER BY position`,
    [itemId],
  );
  return rows.map((r) => ({
    key: String(r.key),
    question: String(r.question),
    kind: String(r.kind) as Kind,
    ...(r.choices ? { choices: JSON.parse(String(r.choices)) as string[] } : {}),
  }));
}

/** Full secrets for the scoring engine — server-only, never serialized. */
export async function getFullSecrets(itemId: string): Promise<Secret[]> {
  await ready();
  const rows = await getDriver().all(
    `SELECT key, kind, weight, value_hash, value_text, salt FROM secrets WHERE item_id = $1`,
    [itemId],
  );
  return rows.map((r) => ({
    key: String(r.key),
    kind: String(r.kind) as Kind,
    weight: Number(r.weight),
    valueHash: r.value_hash === null || r.value_hash === undefined ? null : String(r.value_hash),
    valueText: r.value_text === null || r.value_text === undefined ? null : String(r.value_text),
    salt: r.salt === null || r.salt === undefined ? null : String(r.salt),
  }));
}

export async function secretKeys(itemId: string): Promise<Set<string>> {
  await ready();
  const rows = await getDriver().all(`SELECT key FROM secrets WHERE item_id = $1`, [itemId]);
  return new Set(rows.map((r) => String(r.key)));
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

function toClaim(r: Record<string, unknown>): ClaimRow {
  return {
    id: String(r.id),
    item_id: String(r.item_id),
    claimant_key: String(r.claimant_key),
    status: String(r.status),
    created_at: String(r.created_at),
  };
}

export async function countClaims(itemId: string, claimantKey: string): Promise<number> {
  await ready();
  const r = await getDriver().get(
    `SELECT COUNT(*) AS n FROM claims WHERE item_id = $1 AND claimant_key = $2`,
    [itemId, claimantKey],
  );
  return Number(r?.n ?? 0);
}

export async function createClaim(itemId: string, claimantKey: string): Promise<ClaimRow> {
  await ready();
  const id = `clm_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  await getDriver().run(
    `INSERT INTO claims (id, item_id, claimant_key, status, created_at) VALUES ($1, $2, $3, 'open', $4)`,
    [id, itemId, claimantKey, createdAt],
  );
  return { id, item_id: itemId, claimant_key: claimantKey, status: "open", created_at: createdAt };
}

export async function getClaim(claimId: string): Promise<ClaimRow | null> {
  await ready();
  const r = await getDriver().get(
    `SELECT id, item_id, claimant_key, status, created_at FROM claims WHERE id = $1`,
    [claimId],
  );
  return r ? toClaim(r) : null;
}

export async function countAnswers(claimId: string): Promise<number> {
  await ready();
  const r = await getDriver().get(`SELECT COUNT(*) AS n FROM answers WHERE claim_id = $1`, [claimId]);
  return Number(r?.n ?? 0);
}

export async function hasAnswer(claimId: string, key: string): Promise<boolean> {
  await ready();
  const r = await getDriver().get(
    `SELECT 1 AS x FROM answers WHERE claim_id = $1 AND secret_key = $2`,
    [claimId, key],
  );
  return !!r;
}

export async function insertAnswer(claimId: string, key: string, value: string): Promise<void> {
  await ready();
  await getDriver().run(
    `INSERT INTO answers (id, claim_id, secret_key, value, created_at) VALUES ($1, $2, $3, $4, $5)`,
    [`ans_${randomUUID()}`, claimId, key, value, new Date().toISOString()],
  );
}

export async function listAnswers(claimId: string): Promise<{ key: string; value: string }[]> {
  await ready();
  const rows = await getDriver().all(
    `SELECT secret_key, value FROM answers WHERE claim_id = $1`,
    [claimId],
  );
  return rows.map((r) => ({ key: String(r.secret_key), value: String(r.value) }));
}

export async function setClaimStatus(claimId: string, status: string): Promise<void> {
  await ready();
  await getDriver().run(`UPDATE claims SET status = $1 WHERE id = $2`, [status, claimId]);
}

export async function insertAttempt(
  claimId: string,
  itemId: string,
  verified: boolean,
  score: number,
): Promise<void> {
  await ready();
  await getDriver().run(
    `INSERT INTO attempts (id, claim_id, item_id, verified, score, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [`att_${randomUUID()}`, claimId, itemId, verified ? 1 : 0, score, new Date().toISOString()],
  );
}

// ---------------------------------------------------------------------------
// Search (public data only)
// ---------------------------------------------------------------------------

export interface SearchOpts {
  description: string;
  zone?: string;
  since?: string;
}

export async function searchItems(
  opts: SearchOpts,
): Promise<(ItemSummary & { url: string; score: number })[]> {
  await ready();
  let sql = `SELECT id, category, color_family, zone, found_on, public_note, status
             FROM found_items WHERE status != 'returned'`;
  const params: string[] = [];
  if (opts.zone) {
    params.push(opts.zone);
    sql += ` AND lower(zone) = lower($${params.length})`;
  }
  if (opts.since) {
    params.push(opts.since);
    sql += ` AND found_on >= $${params.length}`;
  }
  const rows = await getDriver().all(sql, params);

  return rows
    .map((r) => {
      const item = toSummary(r);
      const haystack = `${item.category} ${item.color_family} ${item.zone} ${item.public_note}`;
      return {
        ...item,
        url: `/item/${item.item_id}`,
        score: Math.round(trigramSimilarity(opts.description, haystack) * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score);
}
