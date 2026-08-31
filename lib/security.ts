// Server-side security helpers. Pure (no DB), so they are easy to unit-test.

/** How long an open claim stays answerable before it is treated as expired. */
export const CLAIM_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * A rate-limit identity the client CANNOT forge in production.
 *
 * On Netlify the client IP arrives in `x-nf-client-connection-ip`, set by the
 * platform. We prefer that, then other proxy IP headers. Only when no proxy
 * header is present (local dev) do we fall back to a caller-supplied key — that
 * fallback never applies on Netlify, where the platform header is always set.
 */
export function clientId(req: Request, devFallback?: string): string {
  const nf = req.headers.get("x-nf-client-connection-ip");
  if (nf) return `ip:${nf.trim()}`;
  const real = req.headers.get("x-real-ip");
  if (real) return `ip:${real.trim()}`;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return `ip:${xff.split(",")[0].trim()}`;
  const hdr = req.headers.get("x-claimant-key");
  return `dev:${devFallback || hdr || "local"}`;
}

/** True once an open claim is older than the TTL. */
export function claimExpired(createdAt: string, now: number = Date.now()): boolean {
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && now - t > CLAIM_TTL_MS;
}
