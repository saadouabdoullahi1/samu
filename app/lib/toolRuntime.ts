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
 * What a spec tool needs from the mounting page. Tools carry their own
 * item_id / claim_id in their input, so `currentClaim` is only a convenience
 * fallback for Samu's own chat.
 */
export interface ToolContext {
  params: Record<string, string>;
  currentClaim: () => string | null;
  navigate: (path: string) => void;
  emit: (toolName: string, event: ToolEvent) => void;
}

async function executeTool(
  spec: ToolSpec,
  ctx: ToolContext,
  input: Record<string, unknown>,
): Promise<unknown> {
  const t = spec.transport;

  if (t.kind === "navigate") {
    const path = t.path.replace("{item_id}", encodeURIComponent(String(input.item_id ?? "")));
    ctx.navigate(path);
    const data = { navigated_to: path };
    ctx.emit(spec.name, { input, ok: true, status: 0, data });
    return data;
  }

  const path = t.path
    .replace("{itemId}", encodeURIComponent(String(input.item_id ?? ctx.params.id ?? "")))
    .replace("{claimId}", encodeURIComponent(String(input.claim_id ?? ctx.currentClaim() ?? "")));

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
