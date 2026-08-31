import { NextResponse } from "next/server";
import { searchItems } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// search_matches — free-text description in, public candidate items out.
// No secret ever transits here, not even partially.
export async function POST(req: Request) {
  let body: { description?: unknown; zone?: unknown; since?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // handled below
  }
  if (typeof body.description !== "string" || body.description.trim() === "") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const matches = searchItems({
    description: body.description,
    zone: typeof body.zone === "string" ? body.zone : undefined,
    since: typeof body.since === "string" ? body.since : undefined,
  }).map((m) => ({
    item_id: m.item_id,
    category: m.category,
    color_family: m.color_family,
    zone: m.zone,
    found_on: m.found_on,
    public_note: m.public_note,
    url: m.url,
  }));

  return NextResponse.json({ matches });
}
