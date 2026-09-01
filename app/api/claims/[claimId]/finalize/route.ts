import { NextResponse } from "next/server";
import {
  getClaim,
  getFullSecrets,
  insertAttempt,
  listAnswers,
  setClaimStatus,
} from "@/lib/db";
import { scoreClaim } from "@/lib/scoring";
import { claimExpired } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// finalize_claim — runs the verification engine server-side and returns a
// single boolean. The score is logged for the finder's dashboard but never
// sent back to the claimant.
export async function POST(_req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = await getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "open") {
    return NextResponse.json({ error: "claim_closed" }, { status: 409 });
  }
  if (claimExpired(claim.created_at)) {
    await setClaimStatus(claimId, "expired");
    return NextResponse.json({ error: "claim_expired" }, { status: 409 });
  }

  const secrets = await getFullSecrets(claim.item_id);
  const answers = await listAnswers(claimId);
  const verdict = await scoreClaim(secrets, answers);

  await setClaimStatus(claimId, verdict.verified ? "verified" : "rejected");
  await insertAttempt(claimId, claim.item_id, verdict.verified, verdict.score);

  if (verdict.verified) {
    return NextResponse.json({ verified: true, claim_id: claimId });
  }
  return NextResponse.json({ verified: false });
}
