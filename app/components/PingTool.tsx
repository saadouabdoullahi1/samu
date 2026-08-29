"use client";

import { useEffect, useState } from "react";

/**
 * Registers a single WebMCP tool, `ping`, on whatever page mounts this
 * component. The tool calls a server endpoint (a Netlify Function in prod),
 * proving the full agent -> page -> server -> agent path works end to end.
 *
 * Lifecycle is AbortSignal-only: WebMCP has no unregisterTool(); you pass a
 * { signal } to registerTool and abort it to remove the tool. Aborting on
 * unmount is what makes the tool die with the page — and what keeps React
 * Strict Mode's double-mount from throwing "Duplicate tool name".
 */
export default function PingTool() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const mc = document.modelContext;
    if (!mc) {
      setAvailable(false);
      console.warn(
        "[Samu] WebMCP unavailable — enable chrome://flags/#enable-webmcp-testing " +
          "or open the app in the ChatGPT desktop in-app browser.",
      );
      return;
    }
    setAvailable(true);

    const controller = new AbortController();

    Promise.resolve(
      mc.registerTool(
        {
          name: "ping",
          description:
            "Health check for Samu's WebMCP tools. Echoes a message back through the server.",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string", description: "Optional text to echo back." },
            },
          },
          async execute({ message }: { message?: string }) {
            const res = await fetch("/api/ping", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: message ?? "ping" }),
              signal: controller.signal,
            });
            return await res.json(); // data. never instructions.
          },
        },
        { signal: controller.signal },
      ),
    ).catch((err: unknown) => {
      if (controller.signal.aborted) return; // expected on unmount / Strict Mode
      console.error("[Samu] Failed to register WebMCP tool `ping`:", err);
    });

    return () => controller.abort();
  }, []);

  if (available === null) return null;

  return (
    <p className="text-sm text-neutral-500" role="status">
      {available
        ? "WebMCP detected — the ping tool is registered on this page."
        : "WebMCP not detected. Enable the Chrome flag or use the ChatGPT in-app browser."}
    </p>
  );
}
