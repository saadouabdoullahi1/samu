import { NextResponse } from "next/server";
import { getItemSummary } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// get_item_summary — public attributes of a found item.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = getItemSummary(id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(item);
}
