import Link from "next/link";
import { ArrowRight, Check, Lock, Package, Search, ShieldCheck } from "lucide-react";
import { listItems } from "@/lib/db";
import ObjectCard from "./components/ObjectCard";

export const dynamic = "force-dynamic";

export default function Home() {
  const items = listItems().slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-16 sm:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-dark">
            Retrouver. Vérifier. Restituer.
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Vous avez perdu
            <br />
            quelque chose ?
          </h1>
          <p className="max-w-xl text-lg text-stone-600">
            Samu vous aide à retrouver les objets perdus et vérifie que vous êtes bien leur
            propriétaire — sans jamais révéler les informations secrètes.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lost"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Search className="h-5 w-5" /> J&apos;ai perdu quelque chose
            </Link>
            <Link
              href="/found"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-6 py-3.5 text-center font-semibold text-stone-800 transition hover:border-stone-400"
            >
              <Package className="h-5 w-5" /> J&apos;ai trouvé un objet
            </Link>
          </div>
        </div>
      </section>

      {/* Two big action cards */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-5 sm:grid-cols-2">
          <Link
            href="/lost"
            className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Search className="h-9 w-9 text-brand" strokeWidth={1.75} />
            <h2 className="text-2xl font-bold">J&apos;ai perdu quelque chose</h2>
            <p className="text-stone-600">Rechercher un objet parmi ceux qui ont été retrouvés.</p>
            <span className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-dark group-hover:gap-2 group-hover:transition-all">
              Rechercher <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/found"
            className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Package className="h-9 w-9 text-brand" strokeWidth={1.75} />
            <h2 className="text-2xl font-bold">J&apos;ai trouvé un objet</h2>
            <p className="text-stone-600">Déclarer un objet trouvé pour aider son propriétaire.</p>
            <span className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-dark group-hover:gap-2 group-hover:transition-all">
              Déclarer <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <h2 className="text-3xl font-bold tracking-tight">Comment fonctionne Samu ?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["01", "Déclarer", "Une personne trouve un objet et renseigne ses informations."],
            ["02", "Vérifier", "Le propriétaire répond à des questions que seul lui devrait connaître."],
            ["03", "Restituer", "Une fois la propriété vérifiée, l'objet peut être restitué."],
          ].map(([n, title, desc]) => (
            <div key={n} className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-7">
              <span className="text-sm font-bold text-brand">{n}</span>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="text-stone-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently found objects */}
      <section id="objets" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Objets récemment trouvés</h2>
          <Link
            href="/lost"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:gap-2 hover:transition-all"
          >
            Tout voir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <ObjectCard key={it.item_id} item={it} />
          ))}
        </div>
      </section>

      {/* Private verification */}
      <section id="verification" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="grid items-center gap-10 rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Vérification privée</h2>
            <p className="text-lg text-stone-600">
              Prouvez que c&apos;est à vous, sans révéler les secrets qui le prouvent. Samu vérifie
              vos réponses sans jamais dévoiler les informations enregistrées par la personne qui a
              trouvé l&apos;objet.
            </p>
            <p className="text-stone-500">
              Le résultat communiqué reste simple : <strong className="text-stone-800">vérifié</strong>{" "}
              ou <strong className="text-stone-800">non vérifié</strong>. Jamais de détail, jamais de
              secret.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-6">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Lock className="h-4 w-4" /> Question de vérification
            </div>
            <p className="text-lg font-medium">Quel objet important se trouvait dans le sac ?</p>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-400">
              votre réponse…
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="font-semibold text-emerald-700">Propriété vérifiée</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security / trust */}
      <section id="securite" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-10">
        <h2 className="text-3xl font-bold tracking-tight">Conçu pour la confiance</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { Icon: Lock, title: "Vos réponses restent privées", desc: "Les informations secrètes ne quittent jamais nos serveurs et ne s'affichent nulle part." },
            { Icon: ShieldCheck, title: "Résistant à la fraude", desc: "Nombre d'essais limité et détails décisifs requis : impossible de deviner au hasard." },
            { Icon: Check, title: "Verdict clair", desc: "Vérifié ou non vérifié. Aucun score, aucune information indirecte divulguée." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-7">
              <Icon className="h-8 w-8 text-brand" strokeWidth={1.75} />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-stone-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-stone-900 px-6 py-16 text-center text-white">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Un objet perdu ou trouvé ?
          </h2>
          <p className="max-w-xl text-stone-300">
            Retrouvez ce qui compte, et rendez à chacun ce qui lui appartient.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lost"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-dark"
            >
              <Search className="h-5 w-5" /> J&apos;ai perdu quelque chose
            </Link>
            <Link
              href="/found"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <Package className="h-5 w-5" /> J&apos;ai trouvé un objet
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
