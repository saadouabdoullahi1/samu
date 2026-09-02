import { NextResponse } from "next/server";
import { getClaim, setClaimStatus } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// approve_contact — the finder shares their contact with a verified claimant
// who requested it. Only a verified / contact-requested claim can be approved.
export async function POST(_req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = await getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "contact_requested" && claim.status !== "verified") {
    return NextResponse.json({ error: "not_approvable" }, { status: 409 });
  }
  await setClaimStatus(claimId, "contact_shared");
  return NextResponse.json({ status: "contact_shared" });
}
