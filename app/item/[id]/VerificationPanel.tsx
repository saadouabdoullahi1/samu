"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Lock, MapPin, Send, X } from "lucide-react";
import type { ItemSummary, PublicQuestion } from "@/lib/db";
import { useWebmcpTools } from "@/app/hooks/useWebmcpTools";
import { createRuntime, type ToolContext } from "@/app/lib/toolRuntime";

type Msg = { id: number; role: "samu" | "user" | "note"; text: string };

export default function VerificationPanel({ summary }: { summary: ItemSummary }) {
  const itemId = summary.item_id;

  const claimIdRef = useRef<string | null>(null);
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

  // spec-driven WebMCP runtime — the same tools an external agent drives
  const ctx = useMemo<ToolContext>(
    () => ({
      params: { id: itemId },
      currentClaim: () => claimIdRef.current,
      navigate: () => {},
      emit: () => {},
    }),
    [itemId],
  );
  const runtime = useMemo(() => createRuntime("item", ctx), [ctx]);
  useWebmcpTools(() => runtime.tools, [runtime]);

  const claim = () => claimIdRef.current ?? "";

  const finalizeFlow = useCallback(async () => {
    setCurrent(null);
    push("samu", "Thanks. Verifying your ownership…");
    setBusy(true);
    const res = (await runtime.run("complete_verification", { claim_id: claim() })) as {
      verified?: boolean;
    };
    setBusy(false);
    setVerdict(res?.verified ? "verified" : "rejected");
  }, [push, runtime]);

  const loadNext = useCallback(async () => {
    setBusy(true);
    const res = (await runtime.run("get_next_verification_question", { claim_id: claim() })) as {
      done?: boolean;
      question?: PublicQuestion;
      answered?: number;
      budget?: number;
    };
    setBusy(false);
    if (res?.done || !res?.question) {
      await finalizeFlow();
      return;
    }
    setCurrent(res.question);
    push("samu", `Question ${(res.answered ?? 0) + 1} of ${res.budget ?? 5} — ${res.question.question}`);
  }, [finalizeFlow, push, runtime]);

  const answer = async (text: string) => {
    if (!current || busy) return;
    push("user", text);
    setInput("");
    setCurrent(null);
    setBusy(true);
    const res = (await runtime.run("submit_verification_answer", {
      claim_id: claim(),
      answer: text,
    })) as { error?: string };
    setBusy(false);
    if (res?.error) {
      push("note", "That answer couldn't be recorded.");
      return;
    }
    push("note", "Answer recorded");
    await loadNext();
  };

  const start = async () => {
    setStarted(true);
    setBusy(true);
    const res = (await runtime.run("start_claim", { item_id: itemId })) as { claim_id?: string };
    claimIdRef.current = res?.claim_id ?? null;
    setBusy(false);
    if (!claimIdRef.current) {
      push("samu", "Sorry, too many recent attempts. Please try again later.");
      return;
    }
    await loadNext();
  };

  // --- Result screens -------------------------------------------------------

  if (verdict === "verified") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-8 w-8" strokeWidth={3} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-emerald-800">Ownership verified</h3>
          <p className="max-w-sm text-stone-600">
            This item matches the information you provided.
          </p>
        </div>
        <div className="mt-2 w-full max-w-sm rounded-2xl bg-white p-4 text-left">
          <p className="flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-4 w-4" /> Return point
          </p>
          <p className="font-medium">{summary.zone}</p>
        </div>
        {contact === "pending" ? (
          <p className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-700">
            Request sent — waiting for the person who found the item.
          </p>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await runtime.run("request_contact", {
                claim_id: claim(),
                message: "Hello, I believe this item is mine.",
              });
              setContact("pending");
            }}
            className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Contact the finder
          </button>
        )}
        <p className="flex items-center gap-1.5 text-xs text-stone-400">
          <Lock className="h-3.5 w-3.5" /> Private verification
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
          <h3 className="text-2xl font-bold text-red-800">Verification failed</h3>
          <p className="max-w-sm text-stone-600">
            The information provided doesn&apos;t confirm ownership of this item.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 transition hover:border-stone-400"
        >
          Try again
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
            <p className="text-xs text-stone-400">Ownership verification</p>
          </div>
        </div>
        <p className="text-stone-700">
          Hi 👋 I&apos;ll ask you a few questions to verify that this item belongs to you. Some
          details are known only to the owner.
        </p>
        <p className="flex items-center gap-1.5 text-sm text-stone-500">
          <Lock className="h-4 w-4" /> Your answers stay private.
        </p>
        <button
          type="button"
          onClick={start}
          className="w-fit rounded-2xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Start
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
            <Lock className="h-3 w-3" /> Your answers stay private
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
            placeholder={current ? "Your answer…" : "Verifying…"}
            className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={!current || busy || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />;
}
