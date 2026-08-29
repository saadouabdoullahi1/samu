import { NextResponse } from "next/server";

// Server endpoint behind the `ping` WebMCP tool.
// On Netlify this runs as a serverless function — the same place the real
// verification engine will live, so secrets never reach the browser.
export async function POST(request: Request) {
  let message = "ping";
  try {
    const body = await request.json();
    if (typeof body?.message === "string") message = body.message;
  } catch {
    // empty or invalid body — keep the default
  }

  return NextResponse.json({
    ok: true,
    echo: message,
    at: new Date().toISOString(),
    from: "samu server",
  });
}
