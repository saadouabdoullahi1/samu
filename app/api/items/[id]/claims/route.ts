import { NextResponse } from "next/server";
import { countClaims, createClaim, getItemSummary, MAX_CLAIMS_PER_ITEM } from "@/lib/db";
import { BUDGET } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Opens a claim on an item. A claim is the budgeted container the agent then
// spends answers into before finalizing.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!getItemSummary(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: { claimant_key?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // no body — fine
  }
  const claimantKey =
    (typeof body.claimant_key === "string" && body.claimant_key) ||
    req.headers.get("x-claimant-key") ||
    "anon";

  if (countClaims(id, claimantKey) >= MAX_CLAIMS_PER_ITEM) {
    return NextResponse.json({ error: "too_many_claims" }, { status: 429 });
  }

  const claim = createClaim(id, claimantKey);
  return NextResponse.json({ claim_id: claim.id, budget_left: BUDGET }, { status: 201 });
}
