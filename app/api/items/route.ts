import { NextResponse } from "next/server";
import { createFoundItem, type NewSecretInput } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a found item. This is a plain server endpoint, NOT a WebMCP tool:
// by design no agent can write (or read) the private secrets — the finder
// enters them by hand.
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // handled below
  }

  const category = str(body.category);
  const colorFamily = str(body.color_family);
  const zone = str(body.zone);
  const foundOn = str(body.found_on);
  const publicNote = str(body.public_note);

  if (!category || !colorFamily || !zone || !foundOn || !publicNote) {
    return NextResponse.json({ error: "missing_public_fields" }, { status: 400 });
  }

  const rawSecrets = Array.isArray(body.secrets) ? body.secrets : [];
  const secrets: NewSecretInput[] = [];
  rawSecrets.forEach((s, i) => {
    const question = str((s as Record<string, unknown>)?.question);
    const value = str((s as Record<string, unknown>)?.value);
    if (question && value) {
      // First private detail is the decisive one (weight 3); the rest weight 2.
      secrets.push({ question, value, kind: "text", weight: i === 0 ? 3 : 2 });
    }
  });

  if (secrets.length === 0) {
    return NextResponse.json({ error: "need_private_detail" }, { status: 400 });
  }

  const id = await createFoundItem({ category, colorFamily, zone, foundOn, publicNote, secrets });
  return NextResponse.json({ item_id: id, url: `/item/${id}` }, { status: 201 });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
