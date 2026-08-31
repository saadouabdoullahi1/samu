import { BUDGET } from "@/lib/constants";
import { toolsForPage, type PageId, type ToolSpec } from "@/lib/spec";
import type { ToolDef } from "@/app/hooks/useWebmcpTools";

const JSON_HEADERS = { "Content-Type": "application/json" };

export interface ToolEvent {
  input: Record<string, unknown>;
  ok: boolean;
  status: number;
  data: unknown;
}

/**
 * Everything a spec tool needs from the mounting page. Getters read live refs
 * so a single ctx object stays correct across renders.
 */
export interface ToolContext {
  params: Record<string, string>;
  data: { summary?: unknown; questions?: unknown };
  budgetLeft: () => number;
  currentClaim: () => string | null;
  ensureClaim: () => Promise<string>;
  navigate: (path: string) => void;
  /** Called after every tool run so the page can reflect it in the UI. */
  emit: (toolName: string, event: ToolEvent) => void;
}

async function executeTool(
  spec: ToolSpec,
  ctx: ToolContext,
  input: Record<string, unknown>,
): Promise<unknown> {
  const t = spec.transport;

  if (t.kind === "local") {
    const data =
      t.produces === "summary"
        ? ctx.data.summary
        : { questions: ctx.data.questions, budget: BUDGET, budget_left: ctx.budgetLeft() };
    ctx.emit(spec.name, { input, ok: true, status: 0, data });
    return data;
  }

  if (t.kind === "navigate") {
    const path = t.path.replace("{item_id}", String(input.item_id ?? ""));
    ctx.navigate(path);
    const data = { navigated_to: path };
    ctx.emit(spec.name, { input, ok: true, status: 0, data });
    return data;
  }

  // fetch
  let claimId = ctx.currentClaim();
  if (t.claim === "ensure") claimId = await ctx.ensureClaim();

  const path = t.path
    .replace("{itemId}", ctx.params.id ?? "")
    .replace("{claimId}", claimId ?? "");

  const body = t.body
    ? Object.fromEntries(t.body.filter((k) => input[k] !== undefined).map((k) => [k, input[k]]))
    : undefined;

  const res = await fetch(path, {
    method: t.method,
    headers: JSON_HEADERS,
    ...(t.method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON / empty response
  }
  ctx.emit(spec.name, { input, ok: res.ok, status: res.status, data });
  return data;
}

export interface ToolRuntime {
  tools: ToolDef[];
  run: (name: string, input?: Record<string, unknown>) => Promise<unknown>;
}

/** Build the live WebMCP tools + a manual `run` for a page, from the spec. */
export function createRuntime(page: PageId, ctx: ToolContext): ToolRuntime {
  const specs = toolsForPage(page);
  const tools: ToolDef[] = specs.map((spec) => ({
    name: spec.name,
    description: spec.description,
    inputSchema: spec.inputSchema,
    execute: (input: Record<string, unknown>) => executeTool(spec, ctx, input ?? {}),
  }));
  const run = (name: string, input: Record<string, unknown> = {}) => {
    const spec = specs.find((s) => s.name === name);
    if (!spec) return Promise.reject(new Error(`unknown tool ${name} for page ${page}`));
    return executeTool(spec, ctx, input);
  };
  return { tools, run };
}
