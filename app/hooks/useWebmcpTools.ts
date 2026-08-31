"use client";

import { useEffect, useState } from "react";

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
  execute: (input: any) => Promise<unknown> | unknown;
}

/**
 * Registers a set of WebMCP tools for the lifetime of the mounting component,
 * and tears them all down via a single AbortController (WebMCP has no
 * unregisterTool — aborting the signal is the removal mechanism). This is what
 * makes a page's tools appear when you arrive and vanish when you leave.
 *
 * `deps` controls when tools are re-registered (e.g. [itemId]). Returns whether
 * the WebMCP API is available in this browser (null until known).
 */
export function useWebmcpTools(factory: () => ToolDef[], deps: unknown[]): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const mc = document.modelContext;
    if (!mc) {
      setAvailable(false);
      return;
    }
    setAvailable(true);

    const controller = new AbortController();
    for (const tool of factory()) {
      Promise.resolve(mc.registerTool(tool, { signal: controller.signal })).catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error(`[Samu] Failed to register WebMCP tool \`${tool.name}\`:`, err);
      });
    }

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return available;
}
