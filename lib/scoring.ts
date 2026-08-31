import { matchesHash } from "./hash";
import { similarity } from "./similarity";
import { SCORE_THRESHOLD, TEXT_MATCH_THRESHOLD } from "./constants";

export { BUDGET, SCORE_THRESHOLD, TEXT_MATCH_THRESHOLD } from "./constants";

export type Kind = "exact" | "choice" | "text";

/** A stored secret, as needed by the engine (never leaves the server). */
export interface Secret {
  key: string;
  kind: Kind;
  weight: number; // 1..3
  valueHash?: string | null; // exact | choice
  salt?: string | null;
  valueText?: string | null; // text
}

/** A claimant answer to a single question. */
export interface Answer {
  key: string;
  value: string;
}

export interface ScoredEntry {
  key: string;
  kind: Kind;
  weight: number;
  match: number; // [0,1]
  correct: boolean;
}

/** True when a match clears the bar for its kind. */
export function isCorrect(kind: Kind, match: number): boolean {
  return kind === "text" ? match >= TEXT_MATCH_THRESHOLD : match >= 1;
}

/** Compute the raw match for one answered secret. */
export async function scoreOne(secret: Secret, value: string): Promise<ScoredEntry> {
  let match = 0;
  if (secret.kind === "text") {
    match = secret.valueText ? await similarity(value, secret.valueText) : 0;
  } else if (secret.valueHash && secret.salt) {
    match = matchesHash(value, secret.salt, secret.valueHash) ? 1 : 0;
  }
  return {
    key: secret.key,
    kind: secret.kind,
    weight: secret.weight,
    match,
    correct: isCorrect(secret.kind, match),
  };
}

export interface Verdict {
  verified: boolean;
  score: number; // internal only — never returned to the claimant
  hasDecisive: boolean;
  answered: number;
  entries: ScoredEntry[];
}

/**
 * Pure aggregation of already-scored entries.
 *
 *   score = Σ(weight × match) / Σ(weight over answered) × 100
 *
 * Verified requires the score to clear the threshold AND at least one correct
 * weight-3 ("decisive") criterion, so guessing several easy details is not
 * enough.
 */
export function aggregate(entries: ScoredEntry[]): Verdict {
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  const weighted = entries.reduce((s, e) => s + e.weight * (e.correct ? e.match : 0), 0);
  const score = totalWeight === 0 ? 0 : Math.round((weighted / totalWeight) * 100);
  const hasDecisive = entries.some((e) => e.weight === 3 && e.correct);
  return {
    verified: score >= SCORE_THRESHOLD && hasDecisive,
    score,
    hasDecisive,
    answered: entries.length,
    entries,
  };
}

/** Score a full claim: match every answer against its secret, then aggregate. */
export async function scoreClaim(secrets: Secret[], answers: Answer[]): Promise<Verdict> {
  const byKey = new Map(secrets.map((s) => [s.key, s]));
  const entries: ScoredEntry[] = [];
  for (const a of answers) {
    const secret = byKey.get(a.key);
    if (!secret) continue; // unknown key — ignored, never leaks
    entries.push(await scoreOne(secret, a.value));
  }
  return aggregate(entries);
}
