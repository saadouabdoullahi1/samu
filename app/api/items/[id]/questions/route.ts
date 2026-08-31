import { NextResponse } from "next/server";
import { getItemSummary, listQuestions } from "@/lib/db";
import { BUDGET } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// list_verification_questions — the public questions plus the budget.
// Weights are never exposed.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!getItemSummary(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    questions: listQuestions(id),
    budget: BUDGET,
    budget_left: BUDGET,
  });
}
