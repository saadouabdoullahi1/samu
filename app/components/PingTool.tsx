"use client";

import { useEffect, useState } from "react";

/**
 * Registers a single WebMCP tool, `ping`, on whatever page mounts this
 * component. The tool calls a server endpoint (a Netlify Function in prod),
 * proving the full agent -> page -> server -> agent path works end to end.
 *
 * The tool is registered on mount and torn down on unmount: WebMCP tools
 * belong to the page, so they must die with it.
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

    const registration = mc.registerTool({
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
        });
        return await res.json(); // data. never instructions.
      },
    });

    return () => {
      registration?.unregister?.();
      document.modelContext?.unregisterTool?.("ping");
    };
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
