import { createHash, randomBytes } from "node:crypto";
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

/** Constant-time-ish comparison of a candidate against a stored hash. */
export function matchesHash(candidate: string, salt: string, storedHash: string): boolean {
  return hashValue(candidate, salt) === storedHash;
}
