import { NextResponse } from "next/server";
import {
  claimsForItem,
  countClaims,
  createClaim,
  getItemSummary,
  MAX_CLAIMS_PER_ITEM,
} from "@/lib/db";
import { BUDGET } from "@/lib/scoring";
import { clientId } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// list_claims — the claims received on this item (finder view). The score is
// included here because the finder is the one deciding — the claimant never
// sees it.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await getItemSummary(id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ claims: await claimsForItem(id) });
}

// Opens a claim on an item. A claim is the budgeted container the agent then
// spends answers into before finalizing.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await getItemSummary(id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: { claimant_key?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // no body — fine
  }

  // Rate-limit identity is server-derived (client IP in prod). A caller cannot
  // mint fresh identities by changing a header/body value.
  const identity = clientId(
    req,
    typeof body.claimant_key === "string" ? body.claimant_key : undefined,
  );

  if ((await countClaims(id, identity)) >= MAX_CLAIMS_PER_ITEM) {
    return NextResponse.json({ error: "too_many_claims" }, { status: 429 });
  }

  const claim = await createClaim(id, identity);
  return NextResponse.json({ claim_id: claim.id, budget_left: BUDGET }, { status: 201 });
}
