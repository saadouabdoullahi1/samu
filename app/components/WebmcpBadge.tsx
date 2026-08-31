"use client";

import { useEffect, useState } from "react";

/** Small indicator of whether the WebMCP API is present in this browser. */
export default function WebmcpBadge() {
  const [state, setState] = useState<"unknown" | "on" | "off">("unknown");

  useEffect(() => {
    setState(typeof document.modelContext !== "undefined" ? "on" : "off");
  }, []);

  if (state === "unknown") return null;

  const on = state === "on";
  return (
    <span
      role="status"
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs " +
        (on
          ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
          : "border-neutral-300 text-neutral-500 dark:border-neutral-700")
      }
    >
      <span
        className={"h-2 w-2 rounded-full " + (on ? "bg-emerald-500" : "bg-neutral-400")}
        aria-hidden
      />
      {on ? "WebMCP actif sur cette page" : "WebMCP inactif — ouvre dans ChatGPT desktop / Chrome 149+"}
    </span>
  );
}
