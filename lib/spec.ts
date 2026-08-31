// ---------------------------------------------------------------------------
// Samu — declarative source of truth.
//
// The pages and their WebMCP tools are GENERATED from this file. Each tool
// declares its name, description, JSON input schema, and a transport that says
// how it reaches the server (or navigates). The runtime (app/lib/toolRuntime)
// turns each entry into a live `execute`, and lib/spec.test.ts validates the
// whole thing. Change the spec → change the UI and the tool surface.
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
  // Answered purely from client-side page data (never hits the network).
  | { kind: "local"; produces: "summary" | "questions" }
  // Calls a server endpoint (a Netlify Function in prod).
  | {
      kind: "fetch";
      method: "GET" | "POST";
      // Path template. Placeholders: {itemId} (route param), {claimId}.
      path: string;
      // Whether the tool needs a claim: "ensure" creates one if absent,
      // "require" uses the current one (fails server-side if none/closed).
      claim?: "ensure" | "require";
      // Input keys forwarded as the JSON body.
      body?: string[];
    }
  // Client navigation (demonstrates visit-based tool discovery).
  | { kind: "navigate"; path: string }; // placeholder {item_id} from input

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
  eyebrow: string;
  title: string;
  intro: string;
}

export const PAGES: PageSpec[] = [
  { id: "home", path: "/", eyebrow: "WebMCP Challenge", title: "Samu", intro: "Prove it without revealing it." },
  {
    id: "lost",
    path: "/lost",
    eyebrow: "J'ai perdu quelque chose",
    title: "Décrivez votre perte",
    intro:
      "Un agent structure votre description, cherche les objets candidats et ouvre la bonne page — où son outillage change pour l'entretien de vérification.",
  },
  {
    id: "item",
    path: "/item/[id]",
    eyebrow: "Objet trouvé",
    title: "Entretien de vérification",
    intro:
      "Répondez aux questions pour prouver que l'objet est le vôtre. 5 réponses maximum — le serveur calcule le verdict et ne renvoie qu'un booléen.",
  },
];

export const TOOLS: ToolSpec[] = [
  {
    name: "get_item_summary",
    page: "item",
    description: "Return the public attributes of this found item.",
    inputSchema: { type: "object", properties: {} },
    transport: { kind: "local", produces: "summary" },
  },
  {
    name: "list_verification_questions",
    page: "item",
    description:
      "List the public verification questions for this item and the remaining answer budget. Weights are never exposed.",
    inputSchema: { type: "object", properties: {} },
    transport: { kind: "local", produces: "questions" },
  },
  {
    name: "answer_question",
    page: "item",
    description:
      "Record the claimant's answer to one question. Consumes budget. Never reveals whether the answer was correct.",
    inputSchema: {
      type: "object",
      required: ["key", "value"],
      properties: {
        key: { type: "string", description: "The question key from list_verification_questions." },
        value: { type: "string", description: "The claimant's answer." },
      },
    },
    transport: {
      kind: "fetch",
      method: "POST",
      path: "/api/claims/{claimId}/answers",
      claim: "ensure",
      body: ["key", "value"],
    },
  },
  {
    name: "finalize_claim",
    page: "item",
    description:
      "Submit the claim for verification. Returns only a boolean verdict — never the score.",
    inputSchema: { type: "object", properties: {} },
    transport: { kind: "fetch", method: "POST", path: "/api/claims/{claimId}/finalize", claim: "require" },
  },
  {
    name: "request_contact",
    page: "item",
    description:
      "Request the finder's contact. Only succeeds once the claim is verified (checked server-side).",
    inputSchema: {
      type: "object",
      required: ["message"],
      properties: { message: { type: "string", description: "A short message to the finder." } },
    },
    transport: {
      kind: "fetch",
      method: "POST",
      path: "/api/claims/{claimId}/contact",
      claim: "require",
      body: ["message"],
    },
    dynamic: true,
  },
  {
    name: "search_matches",
    page: "lost",
    description:
      "Search found items by a free-text description, optionally filtered by zone or a since date. Returns public data only.",
    inputSchema: {
      type: "object",
      required: ["description"],
      properties: {
        description: { type: "string", description: "Free-text description of the lost item." },
        zone: { type: "string", description: "Optional neighborhood filter." },
        since: { type: "string", description: "Optional YYYY-MM-DD lower bound on found date." },
      },
    },
    transport: { kind: "fetch", method: "POST", path: "/api/search", body: ["description", "zone", "since"] },
  },
  {
    name: "open_item",
    page: "lost",
    description:
      "Navigate to a found item's page. The tools of this search page are replaced by that item's verification tools.",
    inputSchema: {
      type: "object",
      required: ["item_id"],
      properties: { item_id: { type: "string", description: "The item_id from search_matches." } },
    },
    transport: { kind: "navigate", path: "/item/{item_id}" },
  },
];

export function toolsForPage(page: PageId): ToolSpec[] {
  return TOOLS.filter((t) => t.page === page);
}
