import { NextResponse } from "next/server";
import { getClaim, listAnswers, listQuestions, setClaimStatus } from "@/lib/db";
import { BUDGET } from "@/lib/scoring";
import { claimExpired } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// get_next_verification_question — the server drives the interview sequence.
// Returns the next unanswered question (public only), or done when the budget
// is spent or every question has been answered.
export async function GET(_req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await ctx.params;
  const claim = getClaim(claimId);
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (claim.status !== "open") return NextResponse.json({ done: true, reason: "closed" });
  if (claimExpired(claim.created_at)) {
    setClaimStatus(claimId, "expired");
    return NextResponse.json({ done: true, reason: "expired" });
  }

  const answers = listAnswers(claimId);
  if (answers.length >= BUDGET) {
    return NextResponse.json({ done: true, reason: "budget", answered: answers.length, budget: BUDGET });
  }

  const answered = new Set(answers.map((a) => a.key));
  const next = listQuestions(claim.item_id).find((q) => !answered.has(q.key));
  if (!next) {
    return NextResponse.json({ done: true, reason: "complete", answered: answers.length, budget: BUDGET });
  }

  return NextResponse.json({
    done: false,
    question: next, // { key, question, kind, choices? } — never a weight or answer
    answered: answers.length,
    budget: BUDGET,
    budget_left: BUDGET - answers.length,
  });
}
