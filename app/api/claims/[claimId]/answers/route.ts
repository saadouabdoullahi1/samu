import { NextResponse } from "next/server";
import {
  countAnswers,
  getClaim,
  hasAnswer,
  insertAnswer,
  secretKeys,
} from "@/lib/db";
import { BUDGET } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// answer_question — records one answer against the claim's budget.
// Crucially, it never reveals whether the answer was correct.
export async function POST(req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "open") {
    return NextResponse.json({ error: "claim_closed" }, { status: 409 });
  }

  let body: { key?: unknown; value?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // handled below
  }
  if (typeof body.key !== "string" || typeof body.value !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!secretKeys(claim.item_id).has(body.key)) {
    return NextResponse.json({ error: "unknown_question" }, { status: 400 });
  }
  if (hasAnswer(claimId, body.key)) {
    return NextResponse.json({ error: "already_answered" }, { status: 409 });
  }
  if (countAnswers(claimId) >= BUDGET) {
    return NextResponse.json({ error: "budget_exhausted", budget_left: 0 }, { status: 409 });
  }

  insertAnswer(claimId, body.key, body.value);
  const answered = countAnswers(claimId);
  // No correctness signal — only budget accounting.
  return NextResponse.json({ budget_left: BUDGET - answered, answered });
}
