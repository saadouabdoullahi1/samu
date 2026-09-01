import { NextResponse } from "next/server";
import { searchItems } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// search_matches — free-text description in, public candidate items out.
// No secret ever transits here, not even partially.
export async function POST(req: Request) {
  let body: {
    description?: unknown;
    category?: unknown;
    location?: unknown;
    zone?: unknown;
    date?: unknown;
    since?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    // handled below
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const description = str(body.description);
  const category = str(body.category);
  if (!description && !category) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const matches = searchItems({
    // category (when present) boosts the free-text relevance match
    description: [category, description].filter(Boolean).join(" "),
    zone: str(body.location) || str(body.zone) || undefined,
    since: str(body.date) || str(body.since) || undefined,
  }).map((m) => ({
    item_id: m.item_id,
    category: m.category,
    color_family: m.color_family,
    zone: m.zone,
    found_on: m.found_on,
    public_note: m.public_note,
    status: m.status,
    url: m.url,
  }));

  return NextResponse.json({ matches });
}
