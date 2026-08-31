import { describe, it, expect } from "vitest";
import { CLAIM_TTL_MS, claimExpired, clientId } from "./security";

const reqWith = (headers: Record<string, string>) =>
  new Request("http://localhost/api", { headers });

describe("clientId", () => {
  it("uses the Netlify client IP when present (not forgeable by the caller)", () => {
    const req = reqWith({
      "x-nf-client-connection-ip": "41.203.0.9",
      "x-claimant-key": "attacker-tries-to-override",
    });
    expect(clientId(req, "also-ignored")).toBe("ip:41.203.0.9");
  });

  it("falls back to a caller key only when no proxy IP header exists (dev)", () => {
    expect(clientId(reqWith({}), "owner-1")).toBe("dev:owner-1");
    expect(clientId(reqWith({ "x-claimant-key": "k2" }))).toBe("dev:k2");
    expect(clientId(reqWith({}))).toBe("dev:local");
  });

  it("gives two forged claimant keys the SAME identity behind a real IP", () => {
    const a = clientId(reqWith({ "x-nf-client-connection-ip": "1.2.3.4" }), "id-a");
    const b = clientId(reqWith({ "x-nf-client-connection-ip": "1.2.3.4" }), "id-b");
    expect(a).toBe(b); // can't mint fresh identities by changing the body/header
  });
});

describe("claimExpired", () => {
  const now = Date.now();
  it("is false for a fresh claim", () => {
    expect(claimExpired(new Date(now).toISOString(), now)).toBe(false);
  });
  it("is true once past the TTL", () => {
    expect(claimExpired(new Date(now - CLAIM_TTL_MS - 1000).toISOString(), now)).toBe(true);
  });
  it("is false for an unparseable date", () => {
    expect(claimExpired("not-a-date", now)).toBe(false);
  });
});
