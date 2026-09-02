"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { ClaimSummary, ItemSummary } from "@/lib/db";
import { claimStatusMeta } from "@/lib/ui";
import { useWebmcpTools } from "@/app/hooks/useWebmcpTools";
import { createRuntime, type ToolContext } from "@/app/lib/toolRuntime";
import CategoryIcon from "@/app/components/CategoryIcon";

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard({ items }: { items: ItemSummary[] }) {
  const router = useRouter();
  const [claims, setClaims] = useState<Record<string, ClaimSummary[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const ctx = useMemo<ToolContext>(
    () => ({
      params: {},
      currentClaim: () => null,
      navigate: (path) => router.push(path),
      emit: () => {},
    }),
    [router],
  );
  const runtime = useMemo(() => createRuntime("my-items", ctx), [ctx]);
  useWebmcpTools(() => runtime.tools, [runtime]);

  const loadItem = useCallback(
    async (itemId: string) => {
      const res = (await runtime.run("list_claims", { item_id: itemId })) as { claims?: ClaimSummary[] };
      setClaims((c) => ({ ...c, [itemId]: res?.claims ?? [] }));
    },
    [runtime],
  );

  useEffect(() => {
    items.forEach((it) => void loadItem(it.item_id));
  }, [items, loadItem]);

  const approve = async (claimId: string, itemId: string) => {
    setBusy(claimId);
    await runtime.run("approve_contact", { claim_id: claimId });
    await loadItem(itemId);
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {items.map((it) => {
        const list = claims[it.item_id] ?? [];
        return (
          <div key={it.item_id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                <CategoryIcon category={it.category} className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <p className="font-semibold capitalize">
                  {it.category} {it.color_family}
                </p>
                <p className="text-xs text-stone-400">{it.zone}</p>
              </div>
              <span className="font-mono text-xs text-stone-400">
                {list.length} claim{list.length === 1 ? "" : "s"}
              </span>
            </div>

            {list.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-500">No claims yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {list.map((c) => {
                  const s = claimStatusMeta(c.status);
                  return (
                    <li key={c.claim_id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
                        {s.label}
                      </span>
                      <span className="font-mono text-xs text-stone-400">{when(c.created_at)}</span>
                      {c.score !== null && (
                        <span className="font-mono text-xs text-stone-500">score {c.score}/100</span>
                      )}
                      {c.status === "contact_requested" && (
                        <button
                          type="button"
                          disabled={busy === c.claim_id}
                          onClick={() => approve(c.claim_id, it.item_id)}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
                        >
                          <Check className="h-4 w-4" /> Approve contact
                        </button>
                      )}
                      {c.status === "contact_shared" && (
                        <span className="ml-auto text-sm font-medium text-emerald-700">Contact shared ✓</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
