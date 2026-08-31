import Link from "next/link";
import SearchPanel from "./SearchPanel";

export const dynamic = "force-dynamic";

export default function PerduPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div>
        <Link href="/" className="font-mono text-sm text-neutral-500 hover:underline">
          ← Samu
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          J&apos;ai perdu quelque chose
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Décrivez votre perte</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Un agent peut structurer votre description, chercher les objets candidats et ouvrir la
          bonne page — où son outillage change pour l&apos;entretien de vérification.
        </p>
      </header>

      <SearchPanel />
    </main>
  );
}
