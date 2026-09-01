import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { getItemSummary } from "@/lib/db";
import { categoryTint, statusMeta } from "@/lib/ui";
import CategoryIcon from "@/app/components/CategoryIcon";
import VerificationPanel from "./VerificationPanel";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = getItemSummary(id);
  if (!summary) notFound();
  const s = statusMeta(summary.status);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/lost" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> Objets trouvés
      </Link>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div
          className={`flex aspect-[16/7] items-center justify-center bg-gradient-to-br ${categoryTint(summary.category)}`}
        >
          <CategoryIcon
            category={summary.category}
            className="h-20 w-20 text-stone-500/70"
            strokeWidth={1.25}
          />
        </div>
        <div className="flex flex-col gap-3 p-6">
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
            {s.label}
          </span>
          <h1 className="text-3xl font-bold capitalize tracking-tight">
            {summary.category} {summary.color_family}
          </h1>
          <p className="text-stone-600">{summary.public_note}</p>
          <div className="flex flex-wrap gap-4 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {summary.zone}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Trouvé le {formatDate(summary.found_on)}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">C&apos;est votre objet ?</h2>
          <p className="text-stone-600">
            Répondez à quelques questions que seul le propriétaire devrait connaître. Vos réponses
            restent privées et ne sont jamais dévoilées.
          </p>
        </div>
        <VerificationPanel summary={summary} />
      </section>
    </main>
  );
}
