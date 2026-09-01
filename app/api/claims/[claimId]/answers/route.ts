import { NextResponse } from "next/server";
import {
  countAnswers,
  getClaim,
  hasAnswer,
  insertAnswer,
  listAnswers,
  listQuestions,
  secretKeys,
  setClaimStatus,
} from "@/lib/db";
import { BUDGET } from "@/lib/scoring";
import { claimExpired } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// submit_verification_answer — records one answer against the claim's budget.
// Accepts either { answer } (answers the current next question, the
// conversational path) or { key, value } (answers a specific question).
// It never reveals whether the answer was correct.
export async function POST(req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "open") {
    return NextResponse.json({ error: "claim_closed" }, { status: 409 });
  }
  if (claimExpired(claim.created_at)) {
    setClaimStatus(claimId, "expired");
    return NextResponse.json({ error: "claim_expired" }, { status: 409 });
  }
  if (countAnswers(claimId) >= BUDGET) {
    return NextResponse.json({ error: "budget_exhausted", budget_left: 0 }, { status: 409 });
  }

  let body: { key?: unknown; value?: unknown; answer?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // handled below
  }

  let key: string;
  let value: string;
  if (typeof body.key === "string" && typeof body.value === "string") {
    key = body.key;
    value = body.value;
  } else if (typeof body.answer === "string") {
    value = body.answer;
    const answered = new Set(listAnswers(claimId).map((a) => a.key));
    const next = listQuestions(claim.item_id).find((q) => !answered.has(q.key));
    if (!next) return NextResponse.json({ error: "no_more_questions" }, { status: 409 });
    key = next.key;
  } else {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!secretKeys(claim.item_id).has(key)) {
    return NextResponse.json({ error: "unknown_question" }, { status: 400 });
  }
  if (hasAnswer(claimId, key)) {
    return NextResponse.json({ error: "already_answered" }, { status: 409 });
  }

  insertAnswer(claimId, key, value);
  const answered = countAnswers(claimId);
  return NextResponse.json({ budget_left: BUDGET - answered, answered });
}
