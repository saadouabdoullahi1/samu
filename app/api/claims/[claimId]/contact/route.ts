import { NextResponse } from "next/server";
import { getClaim } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// request_contact — only available once the claim is verified. The check is
// server-side: a manipulated agent that calls this early is refused.
export async function POST(req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "verified") {
    return NextResponse.json({ error: "not_verified" }, { status: 403 });
  }

  let body: { message?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // message optional
  }
  if (body.message !== undefined && typeof body.message !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  return NextResponse.json({ status: "pending_finder_approval" });
}
