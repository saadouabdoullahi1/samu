import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { normalize } from "./normalize";

/** A per-secret random salt, hex-encoded. */
export function newSalt(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Salted SHA-256 of a normalized value. Used for `exact` and `choice`
 * secrets so the plaintext never has to be stored or returned.
 */
export function hashValue(value: string, salt: string): string {
  return createHash("sha256")
    .update(salt + ":" + normalize(value))
    .digest("hex");
}

/** Constant-time comparison of a candidate against a stored hash. */
export function matchesHash(candidate: string, salt: string, storedHash: string): boolean {
  const a = Buffer.from(hashValue(candidate, salt), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
