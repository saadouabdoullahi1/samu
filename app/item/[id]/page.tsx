import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemSummary, listQuestions } from "@/lib/db";
import VerificationPanel from "./VerificationPanel";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = getItemSummary(id);
  if (!summary) notFound();
  const questions = listQuestions(id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-6 py-12">
      <div>
        <Link href="/" className="font-mono text-sm text-neutral-500 hover:underline">
          ← Samu
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Objet trouvé · {summary.status}
        </span>
        <h1 className="text-3xl font-bold capitalize tracking-tight">
          {summary.category} {summary.color_family}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">{summary.public_note}</p>
        <div className="flex flex-wrap gap-4 font-mono text-xs text-neutral-500">
          <span>zone : {summary.zone}</span>
          <span>trouvé le : {summary.found_on}</span>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Entretien de vérification</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Répondez aux questions pour prouver que l&apos;objet est le vôtre. Vous disposez de{" "}
          <strong>5 réponses</strong> — le serveur calcule le verdict et ne renvoie qu&apos;un
          booléen. Un agent peut piloter cet entretien avec les outils WebMCP de la page.
        </p>
        <VerificationPanel summary={summary} questions={questions} />
      </section>
    </main>
  );
}
