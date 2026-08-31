"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWebmcpTools } from "@/app/hooks/useWebmcpTools";
import { createRuntime, type ToolContext, type ToolEvent } from "@/app/lib/toolRuntime";

interface Match {
  item_id: string;
  category: string;
  color_family: string;
  zone: string;
  found_on: string;
  public_note: string;
  url: string;
}

export default function SearchPanel() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);

  const emit = useCallback((name: string, ev: ToolEvent) => {
    if (name === "search_matches") {
      const d = ev.data as { matches?: Match[] };
      setMatches(ev.ok && d?.matches ? d.matches : []);
      // reflect the agent's query terms in the form
      if (typeof ev.input.description === "string") setDescription(ev.input.description);
      if (typeof ev.input.zone === "string") setZone(ev.input.zone);
    }
  }, []);

  const ctx = useMemo<ToolContext>(
    () => ({
      params: {},
      data: {},
      budgetLeft: () => 0,
      currentClaim: () => null,
      ensureClaim: async () => "",
      navigate: (path) => router.push(path),
      emit,
    }),
    [router, emit],
  );

  const runtime = useMemo(() => createRuntime("lost", ctx), [ctx]);
  const available = useWebmcpTools(() => runtime.tools, [runtime]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs " +
            (available
              ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
              : "border-neutral-300 text-neutral-500 dark:border-neutral-700")
          }
        >
          <span
            className={"h-2 w-2 rounded-full " + (available ? "bg-emerald-500" : "bg-neutral-400")}
            aria-hidden
          />
          {available === null
            ? ""
            : available
              ? "Outils WebMCP actifs (search_matches, open_item)"
              : "WebMCP inactif — ChatGPT desktop / Chrome 149+"}
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (description.trim())
            runtime.run("search_matches", {
              description,
              ...(zone.trim() ? { zone: zone.trim() } : {}),
            });
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez ce que vous avez perdu — ex. « un portefeuille en cuir marron perdu au Grand Marché »"
          rows={3}
          className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
        <div className="flex flex-wrap gap-2">
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="zone (optionnel)"
            className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={!description.trim()}
            className="rounded-full bg-emerald-600 px-5 py-2 font-medium text-white disabled:opacity-40"
          >
            Chercher
          </button>
        </div>
      </form>

      {matches !== null && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            {matches.length} objet(s) candidat(s)
          </p>
          <ul className="flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {matches.map((m) => (
              <li key={m.item_id}>
                <Link
                  href={m.url}
                  className="flex flex-col gap-1 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium capitalize">
                      {m.category} {m.color_family}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">{m.found_on}</span>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {m.zone} · {m.public_note}
                  </span>
                </Link>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="p-4 text-sm text-neutral-500">
                Aucun objet ne correspond pour l&apos;instant.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
