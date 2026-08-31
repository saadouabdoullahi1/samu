"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ItemSummary, PublicQuestion } from "@/lib/db";
import { useWebmcpTools } from "@/app/hooks/useWebmcpTools";
import { createRuntime, type ToolContext, type ToolEvent } from "@/app/lib/toolRuntime";

const JSON_HEADERS = { "Content-Type": "application/json" };

export default function VerificationPanel({
  summary,
  questions,
}: {
  summary: ItemSummary;
  questions: PublicQuestion[];
}) {
  const itemId = summary.item_id;

  const claimIdRef = useRef<string | null>(null);
  const budgetLeftRef = useRef(5);

  const [claimId, setClaimId] = useState<string | null>(null);
  const [budgetLeft, setBudgetLeft] = useState(5);
  const [answered, setAnswered] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<"verified" | "rejected" | null>(null);
  const [contact, setContact] = useState<"pending" | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [log, setLog] = useState<string[]>([]);

  const append = useCallback((msg: string) => {
    const t = new Date().toLocaleTimeString("fr-FR");
    setLog((l) => [...l, `${t} · ${msg}`]);
  }, []);

  const ensureClaim = useCallback(async (): Promise<string> => {
    if (claimIdRef.current) return claimIdRef.current;
    const res = await fetch(`/api/items/${itemId}/claims`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: "{}",
    });
    const data = await res.json();
    claimIdRef.current = data.claim_id;
    budgetLeftRef.current = data.budget_left;
    setClaimId(data.claim_id);
    setBudgetLeft(data.budget_left);
    append("Réclamation ouverte");
    return data.claim_id as string;
  }, [itemId, append]);

  // Single place the UI reacts to any tool run — whether triggered by a button
  // or by the agent, since both go through the same spec runtime.
  const emit = useCallback(
    (name: string, ev: ToolEvent) => {
      if (name === "answer_question") {
        if (ev.ok) {
          const d = ev.data as { budget_left: number };
          budgetLeftRef.current = d.budget_left;
          setBudgetLeft(d.budget_left);
          const key = String(ev.input.key ?? "");
          setAnswered((a) => (a.includes(key) ? a : [...a, key]));
          append(`Réponse « ${key} » enregistrée — budget ${d.budget_left}`);
        } else {
          append(`Réponse refusée (${(ev.data as { error?: string })?.error ?? ev.status})`);
        }
      } else if (name === "finalize_claim") {
        const d = ev.data as { verified: boolean };
        setVerdict(d.verified ? "verified" : "rejected");
        append(`Verdict : ${d.verified ? "VÉRIFIÉ" : "REFUSÉ"} (aucun score renvoyé)`);
      } else if (name === "request_contact") {
        if (ev.ok) {
          setContact("pending");
          append("Contact demandé — en attente de l'approbation du déposant");
        } else {
          append(`Contact refusé (${(ev.data as { error?: string })?.error})`);
        }
      }
    },
    [append],
  );

  const ctx = useMemo<ToolContext>(
    () => ({
      params: { id: itemId },
      data: { summary, questions },
      budgetLeft: () => budgetLeftRef.current,
      currentClaim: () => claimIdRef.current,
      ensureClaim,
      navigate: () => {},
      emit,
    }),
    [itemId, summary, questions, ensureClaim, emit],
  );

  const runtime = useMemo(() => createRuntime("item", ctx), [ctx]);
  const available = useWebmcpTools(() => runtime.tools, [runtime]);

  const reset = () => {
    claimIdRef.current = null;
    budgetLeftRef.current = 5;
    setClaimId(null);
    setBudgetLeft(5);
    setAnswered([]);
    setVerdict(null);
    setContact(null);
    setInputs({});
    append("Nouvelle réclamation");
  };

  const locked = verdict !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
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
              ? "Outils WebMCP actifs sur cette page"
              : "WebMCP inactif — ChatGPT desktop / Chrome 149+"}
        </span>
        <span className="font-mono text-xs text-neutral-500">
          budget : {budgetLeft} / 5 {claimId ? "· réclamation active" : ""}
        </span>
      </div>

      {!locked && (
        <div className="flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {questions.map((q) => {
            const done = answered.includes(q.key);
            const disabled = done || budgetLeft <= 0;
            return (
              <div key={q.key} className="flex flex-col gap-2 p-4">
                <label className="text-sm font-medium" htmlFor={`q-${q.key}`}>
                  {q.question}
                </label>
                <div className="flex flex-wrap gap-2">
                  {q.kind === "choice" ? (
                    <select
                      id={`q-${q.key}`}
                      value={inputs[q.key] ?? ""}
                      onChange={(e) => setInputs((s) => ({ ...s, [q.key]: e.target.value }))}
                      className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                    >
                      <option value="">—</option>
                      {q.choices?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`q-${q.key}`}
                      value={inputs[q.key] ?? ""}
                      onChange={(e) => setInputs((s) => ({ ...s, [q.key]: e.target.value }))}
                      placeholder="votre réponse"
                      className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => runtime.run("answer_question", { key: q.key, value: inputs[q.key] ?? "" })}
                    disabled={disabled || !(inputs[q.key] ?? "").trim()}
                    className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
                  >
                    Répondre
                  </button>
                </div>
                {done && (
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ enregistrée
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!locked && (
        <button
          type="button"
          onClick={() => runtime.run("finalize_claim")}
          disabled={answered.length === 0}
          className="self-start rounded-full bg-emerald-600 px-5 py-2 font-medium text-white disabled:opacity-40"
        >
          Finaliser la réclamation
        </button>
      )}

      {verdict === "verified" && (
        <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">Vérifié ✓</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Le serveur a renvoyé <code>verified: true</code>. Aucun score n&apos;a été divulgué.
          </p>
          {contact === "pending" ? (
            <p className="mt-3 font-mono text-sm text-emerald-700 dark:text-emerald-400">
              Contact demandé — en attente d&apos;approbation du déposant.
            </p>
          ) : (
            <button
              type="button"
              onClick={() =>
                runtime.run("request_contact", { message: "Bonjour, je pense que cet objet est le mien." })
              }
              className="mt-3 rounded-full border border-emerald-600 px-4 py-1.5 text-sm text-emerald-700 dark:text-emerald-400"
            >
              Demander le contact du déposant
            </button>
          )}
        </div>
      )}

      {verdict === "rejected" && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-300">Refusé</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Le serveur a renvoyé <code>verified: false</code> — sans score ni détail sur les
            critères. Rien à sonder.
          </p>
        </div>
      )}

      {locked && (
        <button
          type="button"
          onClick={reset}
          className="self-start font-mono text-sm text-neutral-500 hover:underline"
        >
          ↻ nouvelle réclamation
        </button>
      )}

      {log.length > 0 && (
        <details className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-neutral-500">
            Journal ({log.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-xs text-neutral-500">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
