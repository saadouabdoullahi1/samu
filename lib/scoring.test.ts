import { describe, it, expect } from "vitest";
import { hashValue, newSalt } from "./hash";
import {
  aggregate,
  isCorrect,
  scoreClaim,
  type ScoredEntry,
  type Secret,
} from "./scoring";

const entry = (weight: number, match: number, kind: ScoredEntry["kind"] = "exact"): ScoredEntry => ({
  key: `k${weight}-${match}`,
  kind,
  weight,
  match,
  correct: isCorrect(kind, match),
});

describe("isCorrect", () => {
  it("requires an exact/choice match to be a full 1", () => {
    expect(isCorrect("exact", 1)).toBe(true);
    expect(isCorrect("choice", 0.99)).toBe(false);
  });
  it("lets a text answer clear a similarity floor", () => {
    expect(isCorrect("text", 0.72)).toBe(true);
    expect(isCorrect("text", 0.71)).toBe(false);
  });
});

describe("aggregate", () => {
  it("returns 0 / not verified with no answers", () => {
    const v = aggregate([]);
    expect(v.score).toBe(0);
    expect(v.verified).toBe(false);
  });

  it("verifies on a single correct weight-3 criterion", () => {
    const v = aggregate([entry(3, 1)]);
    expect(v.score).toBe(100);
    expect(v.hasDecisive).toBe(true);
    expect(v.verified).toBe(true);
  });

  it("refuses easy-only answers that clear the threshold but have no decisive criterion", () => {
    const v = aggregate([entry(1, 1), entry(1, 1), entry(2, 1)]);
    expect(v.score).toBe(100); // perfect on easy questions
    expect(v.hasDecisive).toBe(false); // but no weight-3
    expect(v.verified).toBe(false); // so still rejected
  });

  it("drops below threshold when a weighted answer is wrong", () => {
    // decisive correct (w3) but two wrong: 3 / (3+2+2) = 42.8 -> 43
    const v = aggregate([entry(3, 1), entry(2, 0), entry(2, 0)]);
    expect(v.score).toBe(43);
    expect(v.verified).toBe(false);
  });
});

describe("scoreClaim (end to end, offline similarity)", () => {
  const salt = newSalt();
  const secrets: Secret[] = [
    { key: "initiales", kind: "exact", weight: 3, salt, valueHash: hashValue("AK", salt) },
    { key: "marque", kind: "text", weight: 2, valueText: "un autocollant de dragon rouge" },
  ];

  it("verifies the true owner", async () => {
    const v = await scoreClaim(secrets, [
      { key: "initiales", value: "ak" }, // normalized match
      { key: "marque", value: "un autocollant de dragon rouge" },
    ]);
    expect(v.verified).toBe(true);
    expect(v.score).toBe(100);
  });

  it("rejects the impostor", async () => {
    const v = await scoreClaim(secrets, [
      { key: "initiales", value: "ZZ" },
      { key: "marque", value: "une photo de vacances au bord de la mer" },
    ]);
    expect(v.verified).toBe(false);
  });

  it("ignores unknown keys instead of leaking", async () => {
    const v = await scoreClaim(secrets, [{ key: "does_not_exist", value: "x" }]);
    expect(v.answered).toBe(0);
    expect(v.verified).toBe(false);
  });
});
