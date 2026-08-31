import Link from "next/link";
import { listItems } from "@/lib/db";
import WebmcpBadge from "./components/WebmcpBadge";

export const dynamic = "force-dynamic";

export default function Home() {
  const items = listItems();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-14 px-6 py-16">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Sa<span className="text-emerald-600 dark:text-emerald-400">mu</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            &laquo; trouver &raquo; en haoussa &middot; WebMCP Challenge
          </p>
        </div>
        <p className="max-w-2xl text-xl leading-relaxed text-neutral-700 dark:text-neutral-300">
          <strong className="text-neutral-900 dark:text-neutral-100">
            Prove it without revealing it.
          </strong>{" "}
          An agent runs the ownership-verification interview without ever learning
          the answers — the page holds the proof and returns only a verdict.
        </p>
        <WebmcpBadge />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1", "Le déposant saisit les détails secrets à la main.", "L'agent ne les voit jamais."],
          ["2", "Le réclamant répond, l'agent dépense un budget de 5 questions.", "Aucun indice en retour."],
          ["3", "Le serveur calcule et renvoie un booléen.", "Vérifié, ou non. Jamais le score."],
        ].map(([n, title, sub]) => (
          <div key={n} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="mb-2 font-mono text-xs text-emerald-600 dark:text-emerald-400">
              étape {n}
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-sm text-neutral-500">{sub}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Objets trouvés</h2>
          <Link
            href="/lost"
            className="font-mono text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            J&apos;ai perdu quelque chose →
          </Link>
        </div>
        <ul className="flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {items.map((it) => (
            <li key={it.item_id}>
              <Link
                href={`/item/${it.item_id}`}
                className="flex flex-col gap-1 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium capitalize">
                    {it.category} {it.color_family}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">{it.found_on}</span>
                </div>
                <span className="text-sm text-neutral-500">
                  {it.zone} · {it.public_note}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto border-t border-neutral-200 pt-6 font-mono text-xs text-neutral-500 dark:border-neutral-800">
        Samu · un motif réutilisable : prouver quelque chose sur des données privées sans jamais recevoir ces données.
      </footer>
    </main>
  );
}
