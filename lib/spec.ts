// ---------------------------------------------------------------------------
// Samu — declarative source of truth for the WebMCP tool surface.
//
// The pages and their WebMCP tools are GENERATED from this file. Each tool
// declares its name, description, JSON input schema, and a transport that says
// how it reaches the server (or navigates). The runtime (app/lib/toolRuntime)
// turns each entry into a live `execute`, and lib/spec.test.ts validates it.
//
// The flow is server-driven and conversational: an agent (or Samu's own chat)
// starts a claim, then repeatedly asks for the next question and submits an
// answer, then completes the verification. Each tool carries its own
// item_id / claim_id, so it is self-contained.
//
// Client-safe: only imports plain constants, never Node modules.
// ---------------------------------------------------------------------------

export type PageId = "home" | "item" | "lost" | "my-items" | "found";

export type ToolInputSchema = {
  type: "object";
  properties?: Record<string, { type: string; description?: string }>;
  required?: string[];
};

export type Transport =
  // Calls a server endpoint (a Netlify Function in prod). Path placeholders
  // {itemId} and {claimId} are filled from the tool's input.
  | { kind: "fetch"; method: "GET" | "POST"; path: string; body?: string[] }
  // Client navigation (demonstrates visit-based tool discovery). {item_id}
  // comes from the input.
  | { kind: "navigate"; path: string };

export interface ToolSpec {
  name: string;
  page: PageId;
  description: string; // STATIC — never built from user input (tool-poisoning vector)
  inputSchema: ToolInputSchema;
  transport: Transport;
  dynamic?: boolean; // registered only past a certain state (documentation flag)
}

export interface PageSpec {
  id: PageId;
  path: string;
}

export const PAGES: PageSpec[] = [
  { id: "home", path: "/" },
  { id: "lost", path: "/lost" },
  { id: "item", path: "/item/[id]" },
];

export const TOOLS: ToolSpec[] = [
  {
    name: "search_found_items",
    page: "lost",
    description:
      "Search found items matching a lost object's description, optional category, location and approximate date. Returns public data only.",
    inputSchema: {
      type: "object",
      required: ["description"],
      properties: {
        description: { type: "string", description: "Free-text description of the lost item." },
        category: { type: "string", description: "Optional category, e.g. phone, wallet, bag." },
        location: { type: "string", description: "Optional neighborhood." },
        date: { type: "string", description: "Optional YYYY-MM-DD lower bound on the found date." },
      },
    },
    transport: { kind: "fetch", method: "POST", path: "/api/search", body: ["description", "category", "location", "date"] },
  },
  {
    name: "open_item",
    page: "lost",
    description:
      "Open a found item's page. The tools of this search page are replaced by that item's verification tools.",
    inputSchema: {
      type: "object",
      required: ["item_id"],
      properties: { item_id: { type: "string", description: "The item_id from search_found_items." } },
    },
    transport: { kind: "navigate", path: "/item/{item_id}" },
  },
  {
    name: "get_found_item",
    page: "item",
    description: "Return the public attributes of a found item.",
    inputSchema: {
      type: "object",
      required: ["item_id"],
      properties: { item_id: { type: "string" } },
    },
    transport: { kind: "fetch", method: "GET", path: "/api/items/{itemId}" },
  },
  {
    name: "start_claim",
    page: "item",
    description:
      "Begin an ownership verification for an item. Returns a claim_id used by the next tools.",
    inputSchema: {
      type: "object",
      required: ["item_id"],
      properties: { item_id: { type: "string" } },
    },
    transport: { kind: "fetch", method: "POST", path: "/api/items/{itemId}/claims" },
  },
  {
    name: "get_next_verification_question",
    page: "item",
    description:
      "Get the next verification question for a claim, plus progress. Returns done when finished. Weights are never exposed.",
    inputSchema: {
      type: "object",
      required: ["claim_id"],
      properties: { claim_id: { type: "string" } },
    },
    transport: { kind: "fetch", method: "GET", path: "/api/claims/{claimId}/next" },
  },
  {
    name: "submit_verification_answer",
    page: "item",
    description:
      "Submit the claimant's answer to the current question. Consumes budget. Never reveals whether the answer was correct.",
    inputSchema: {
      type: "object",
      required: ["claim_id", "answer"],
      properties: {
        claim_id: { type: "string" },
        answer: { type: "string", description: "The claimant's answer to the current question." },
      },
    },
    transport: { kind: "fetch", method: "POST", path: "/api/claims/{claimId}/answers", body: ["answer"] },
  },
  {
    name: "complete_verification",
    page: "item",
    description:
      "Finish the claim and get the verdict. Returns only a boolean — never the score.",
    inputSchema: {
      type: "object",
      required: ["claim_id"],
      properties: { claim_id: { type: "string" } },
    },
    transport: { kind: "fetch", method: "POST", path: "/api/claims/{claimId}/finalize" },
  },
  {
    name: "request_contact",
    page: "item",
    description:
      "Request the finder's contact. Only succeeds once the claim is verified (checked server-side).",
    inputSchema: {
      type: "object",
      required: ["claim_id", "message"],
      properties: {
        claim_id: { type: "string" },
        message: { type: "string", description: "A short message to the finder." },
      },
    },
    transport: { kind: "fetch", method: "POST", path: "/api/claims/{claimId}/contact", body: ["message"] },
    dynamic: true,
  },
];

export function toolsForPage(page: PageId): ToolSpec[] {
  return TOOLS.filter((t) => t.page === page);
}
