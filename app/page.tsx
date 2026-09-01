import Link from "next/link";
import { ArrowRight, Check, Lock, Package, Search, ShieldCheck } from "lucide-react";
import { listItems } from "@/lib/db";
import ObjectCard from "./components/ObjectCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = (await listItems()).slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-16 sm:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-dark">
            Find it. Verify it. Return it.
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Lost
            <br />
            something?
          </h1>
          <p className="max-w-xl text-lg text-stone-600">
            Samu helps you find lost items and verifies that you are their owner — without ever
            revealing the secret details.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lost"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Search className="h-5 w-5" /> I lost something
            </Link>
            <Link
              href="/found"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-6 py-3.5 text-center font-semibold text-stone-800 transition hover:border-stone-400"
            >
              <Package className="h-5 w-5" /> I found something
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
            <h2 className="text-2xl font-bold">I lost something</h2>
            <p className="text-stone-600">Search among the items that have been found.</p>
            <span className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-dark group-hover:gap-2 group-hover:transition-all">
              Search <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/found"
            className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Package className="h-9 w-9 text-brand" strokeWidth={1.75} />
            <h2 className="text-2xl font-bold">I found something</h2>
            <p className="text-stone-600">Report a found item to help its owner.</p>
            <span className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-dark group-hover:gap-2 group-hover:transition-all">
              Report <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <h2 className="text-3xl font-bold tracking-tight">How Samu works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["01", "Report", "Someone finds an item and enters its details."],
            ["02", "Verify", "The owner answers questions only they should know."],
            ["03", "Return", "Once ownership is verified, the item can be returned."],
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
          <h2 className="text-3xl font-bold tracking-tight">Recently found items</h2>
          <Link
            href="/lost"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:gap-2 hover:transition-all"
          >
            See all <ArrowRight className="h-4 w-4" />
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
            <h2 className="text-3xl font-bold tracking-tight">Private verification</h2>
            <p className="text-lg text-stone-600">
              Prove it&apos;s yours, without revealing the secrets that prove it. Samu checks your
              answers without ever disclosing the details recorded by whoever found the item.
            </p>
            <p className="text-stone-500">
              The result stays simple: <strong className="text-stone-800">verified</strong> or{" "}
              <strong className="text-stone-800">not verified</strong>. No details, no secrets.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-6">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Lock className="h-4 w-4" /> Verification question
            </div>
            <p className="text-lg font-medium">What important item was inside the bag?</p>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-400">
              your answer…
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="font-semibold text-emerald-700">Ownership verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security / trust */}
      <section id="securite" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-10">
        <h2 className="text-3xl font-bold tracking-tight">Built for trust</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { Icon: Lock, title: "Your answers stay private", desc: "The secret details never leave our servers and are shown nowhere." },
            { Icon: ShieldCheck, title: "Fraud-resistant", desc: "Limited attempts and a decisive detail required: guessing at random can't pass." },
            { Icon: Check, title: "A clear verdict", desc: "Verified or not verified. No score, no indirect information disclosed." },
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
            Lost or found an item?
          </h2>
          <p className="max-w-xl text-stone-300">
            Recover what matters, and give everyone back what belongs to them.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lost"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-dark"
            >
              <Search className="h-5 w-5" /> I lost something
            </Link>
            <Link
              href="/found"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <Package className="h-5 w-5" /> I found something
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
