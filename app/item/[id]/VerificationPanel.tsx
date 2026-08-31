"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Lock, MapPin, Send, X } from "lucide-react";
import type { ItemSummary, PublicQuestion } from "@/lib/db";
import { useWebmcpTools } from "@/app/hooks/useWebmcpTools";
import { createRuntime, type ToolContext, type ToolEvent } from "@/app/lib/toolRuntime";

const JSON_HEADERS = { "Content-Type": "application/json" };
const BUDGET = 5;

type Msg = { id: number; role: "samu" | "user" | "note"; text: string };

export default function VerificationPanel({
  summary,
  questions,
}: {
  summary: ItemSummary;
  questions: PublicQuestion[];
}) {
  const itemId = summary.item_id;

  const claimIdRef = useRef<string | null>(null);
  const budgetLeftRef = useRef(BUDGET);
  const qIndexRef = useRef(0);
  const answeredRef = useRef(0);
  const msgId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [current, setCurrent] = useState<PublicQuestion | null>(null);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<"verified" | "rejected" | null>(null);
  const [contact, setContact] = useState<"pending" | null>(null);

  const push = useCallback((role: Msg["role"], text: string) => {
    setMessages((m) => [...m, { id: msgId.current++, role, text }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // --- spec-driven WebMCP runtime (also what external agents drive) ---------

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
    return data.claim_id as string;
  }, [itemId]);

  const emit = useCallback((name: string, ev: ToolEvent) => {
    if (name === "answer_question" && ev.ok) {
      budgetLeftRef.current = (ev.data as { budget_left: number }).budget_left;
    }
  }, []);

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
  useWebmcpTools(() => runtime.tools, [runtime]);

  // --- conversation flow (human façade over the same tools) -----------------

  const askAt = (idx: number) => {
    const q = questions[idx];
    if (!q) return;
    setCurrent(q);
    push("samu", `Question ${answeredRef.current + 1} / ${BUDGET} — ${q.question}`);
  };

  const finalizeFlow = async () => {
    setCurrent(null);
    push("samu", "Merci. Je vérifie votre propriété…");
    setBusy(true);
    const res = (await runtime.run("finalize_claim")) as { verified?: boolean };
    setBusy(false);
    setVerdict(res?.verified ? "verified" : "rejected");
  };

  const proceed = async () => {
    qIndexRef.current += 1;
    if (answeredRef.current >= BUDGET || qIndexRef.current >= questions.length) {
      await finalizeFlow();
    } else {
      askAt(qIndexRef.current);
    }
  };

  const answer = async (text: string) => {
    if (!current || busy) return;
    const q = current;
    push("user", text);
    setInput("");
    setCurrent(null);
    setBusy(true);
    const res = (await runtime.run("answer_question", { key: q.key, value: text })) as {
      error?: string;
    };
    setBusy(false);
    if (res?.error) {
      push("note", "Cette réponse n'a pas pu être enregistrée.");
      return;
    }
    answeredRef.current += 1;
    push("note", "Réponse enregistrée");
    await proceed();
  };

  const skip = async () => {
    if (!current || busy) return;
    push("user", "Je préfère passer");
    setCurrent(null);
    await proceed();
  };

  const start = async () => {
    setStarted(true);
    setBusy(true);
    await ensureClaim();
    setBusy(false);
    qIndexRef.current = 0;
    answeredRef.current = 0;
    askAt(0);
  };

  // --- Result screens -------------------------------------------------------

  if (verdict === "verified") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-8 w-8" strokeWidth={3} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-emerald-800">Propriété vérifiée</h3>
          <p className="max-w-sm text-stone-600">
            Cet objet correspond aux informations que vous avez fournies.
          </p>
        </div>
        <div className="mt-2 w-full max-w-sm rounded-2xl bg-white p-4 text-left">
          <p className="flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-4 w-4" /> Point de restitution
          </p>
          <p className="font-medium">{summary.zone}</p>
        </div>
        {contact === "pending" ? (
          <p className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-700">
            Demande envoyée — en attente de la personne qui a trouvé l&apos;objet.
          </p>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await runtime.run("request_contact", {
                message: "Bonjour, je pense que cet objet est le mien.",
              });
              setContact("pending");
            }}
            className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Contacter le déposant
          </button>
        )}
        <p className="flex items-center gap-1.5 text-xs text-stone-400">
          <Lock className="h-3.5 w-3.5" /> Vérification privée
        </p>
      </div>
    );
  }

  if (verdict === "rejected") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white">
          <X className="h-8 w-8" strokeWidth={3} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-red-800">Vérification échouée</h3>
          <p className="max-w-sm text-stone-600">
            Les informations fournies ne permettent pas de confirmer la propriété de cet objet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 transition hover:border-stone-400"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // --- Intro ----------------------------------------------------------------

  if (!started) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark">
            S
          </div>
          <div>
            <p className="font-semibold">Samu</p>
            <p className="text-xs text-stone-400">Vérification de propriété</p>
          </div>
        </div>
        <p className="text-stone-700">
          Bonjour 👋 Je vais vous poser quelques questions pour vérifier que cet objet vous
          appartient. Certaines informations ne sont connues que du propriétaire.
        </p>
        <p className="flex items-center gap-1.5 text-sm text-stone-500">
          <Lock className="h-4 w-4" /> Vos réponses restent privées.
        </p>
        <button
          type="button"
          onClick={start}
          className="w-fit rounded-2xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Commencer
        </button>
      </div>
    );
  }

  // --- Chat -----------------------------------------------------------------

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">
          S
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Samu</p>
          <p className="flex items-center gap-1 text-xs text-stone-400">
            <Lock className="h-3 w-3" /> Vos réponses restent privées
          </p>
        </div>
      </div>

      <div className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto px-5 py-5">
        {messages.map((m) =>
          m.role === "note" ? (
            <div key={m.id} className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" /> {m.text}
            </div>
          ) : (
            <div key={m.id} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm " +
                  (m.role === "user"
                    ? "rounded-br-md bg-brand text-white"
                    : "rounded-bl-md bg-stone-100 text-stone-800")
                }
              >
                {m.text}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3">
              <Dot /> <Dot /> <Dot />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-stone-100 p-4">
        {current?.kind === "choice" && (
          <div className="mb-2 flex flex-wrap gap-2">
            {current.choices?.map((c) => (
              <button
                key={c}
                type="button"
                disabled={busy}
                onClick={() => answer(c)}
                className="rounded-full border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition hover:border-brand hover:bg-brand-soft disabled:opacity-40"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && current) answer(input.trim());
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!current || busy}
            placeholder={current ? "Votre réponse…" : "Vérification en cours…"}
            className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={!current || busy || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40"
            aria-label="Envoyer"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        {current && (
          <button
            type="button"
            onClick={skip}
            disabled={busy}
            className="mt-2 flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
          >
            Je ne sais pas <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />;
}
