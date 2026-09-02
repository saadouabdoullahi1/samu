import { NextResponse } from "next/server";
import { getClaim, setClaimStatus } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// request_contact — only available once the claim is verified. The check is
// server-side: a manipulated agent that calls this early is refused. It records
// the request so the finder can approve it from their dashboard.
export async function POST(req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = await getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "verified" && claim.status !== "contact_requested") {
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

  if (claim.status === "verified") await setClaimStatus(claimId, "contact_requested");
  return NextResponse.json({ status: "pending_finder_approval" });
}
