# Samu

**Samu** (Hausa for "to find") is a lost-and-found platform where an AI agent
runs the ownership-verification interview **without ever learning the answers**.
The page holds the proof; the agent only receives a verdict.

Built for the **OpenAI WebMCP Challenge**.

> Prove it without revealing it.

## The problem WebMCP lets us solve

If you publish the details that identify a found item, anyone can copy the
listing and claim it. If you don't, no one can prove they own it. Lost items
stay stuck in WhatsApp groups with no real verification.

Samu splits what is **searchable** from what is **provable**. The finder types
distinctive details by hand; those secrets are never published, never returned
by a tool, never seen by the agent. Only the **questions** are public. An agent
interviews the claimant, submits answers, and gets back a single boolean —
`verified: true` or `verified: false`. The score is computed on the server and
never leaves it.

## Why this is a strong fit for WebMCP

- **Tools belong to the page.** WebMCP registers tools on `document.modelContext`,
  so the agent must *be* on the page to use them. Samu turns that into the core
  UX: as the agent moves from search to a specific item, its available tools
  change under its feet.
- **A better experience for humans and agents together.** A claimant's agent can
  do something impossible before: prove knowledge of private data to a stranger's
  listing without either side leaking that data. Security never rests on the
  agent — the verification engine runs server-side, so a manipulated or curious
  agent still can't extract the proof.

## How WebMCP is implemented

Each page registers its own tools in a client component and tears them down on
unmount (tools die with the page). Every tool's `execute` calls a server
endpoint — a Netlify Function — that owns the logic and the secrets.

```ts
document.modelContext.registerTool({
  name: "ping",
  description: "Health check for Samu's WebMCP tools.",
  inputSchema: {
    type: "object",
    properties: { message: { type: "string" } },
  },
  execute: async ({ message }) => {
    const res = await fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return await res.json(); // data. never instructions.
  },
});
```

See [`app/components/PingTool.tsx`](app/components/PingTool.tsx) for the mounted
version and [`app/api/ping/route.ts`](app/api/ping/route.ts) for the server side.

## Stack

- **Next.js (App Router)** + **TypeScript**, deployed on **Netlify**
- **Netlify Functions** (Next.js route handlers) for the verification engine —
  scoring, salted hashes, and embeddings all run server-side
- **Postgres** via **Neon** (planned)
- Live finder dashboard via **SSE** (planned)

## Running WebMCP locally

WebMCP is a draft browser API. To exercise the tools you need one of:

- the **ChatGPT desktop app** in-app browser (WebMCP on by default), or
- **Google Chrome 149+** with `chrome://flags/#enable-webmcp-testing` enabled,
  then restart the browser.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (what Netlify runs)
```

## License

[MIT](LICENSE).
