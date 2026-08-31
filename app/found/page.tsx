"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Lock, Package, Plus } from "lucide-react";
import CategoryIcon from "@/app/components/CategoryIcon";

const CATEGORIES = ["Téléphone", "Portefeuille", "Sac", "Documents", "Clés", "Autre"];
const JSON_HEADERS = { "Content-Type": "application/json" };

interface Secret {
  question: string;
  value: string;
}

export default function FoundPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [zone, setZone] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [secrets, setSecrets] = useState<Secret[]>([{ question: "", value: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filledSecrets = secrets.filter((s) => s.question.trim() && s.value.trim());
  const canSubmit =
    category && color.trim() && zone.trim() && note.trim() && filledSecrets.length > 0;

  const setSecret = (i: number, patch: Partial<Secret>) =>
    setSecrets((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          category: category.toLowerCase(),
          color_family: color.trim(),
          zone: zone.trim(),
          found_on: date,
          public_note: note.trim(),
          secrets: filledSecrets,
        }),
      });
      const data = await res.json();
      if (res.ok) router.push(data.url);
      else {
        setError("Vérifiez les champs : catégorie, couleur, zone, description et au moins un détail privé.");
        setSubmitting(false);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-dark">
          <Package className="h-4 w-4" /> J&apos;ai trouvé un objet
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">Déclarer un objet trouvé</h1>
        <p className="max-w-xl text-lg text-stone-600">
          Renseignez ce que tout le monde peut voir, puis quelques détails que{" "}
          <strong>seul le vrai propriétaire</strong> devrait connaître.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        {/* PUBLIC */}
        <section className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
            <Eye className="h-4 w-4" /> Informations publiques
            <span className="font-normal text-stone-400">· visibles par tous</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-700">Catégorie</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition " +
                    (category === c
                      ? "border-brand bg-brand text-white shadow-sm"
                      : "border-stone-300 text-stone-600 hover:border-brand/40 hover:bg-brand-soft/40")
                  }
                >
                  <CategoryIcon category={c.toLowerCase()} className="h-4 w-4" /> {c}
                </button>
              ))}
            </div>
          </div>

          <Field label="Couleur">
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ex. marron"
              className={inputCls}
            />
          </Field>
          <Field label="Zone où l'objet a été trouvé">
            <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex. Grand Marché" className={inputCls} />
          </Field>
          <Field label="Date de découverte">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Description publique">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ex. Portefeuille en cuir trouvé près de l'entrée est."
              className={inputCls}
            />
          </Field>
        </section>

        {/* PRIVATE */}
        <section className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
            <Lock className="h-4 w-4" /> Informations privées
            <span className="font-normal text-stone-400">· jamais affichées, servent à vérifier</span>
          </div>
          <p className="text-sm text-stone-500">
            Ajoutez des détails que seul le propriétaire connaît (un détail caché, une inscription,
            le contenu d&apos;une poche…). Le premier est le plus décisif.
          </p>

          {secrets.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl bg-stone-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">
                  Détail {i + 1}
                  {i === 0 ? " · décisif" : ""}
                </span>
                {secrets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSecrets((arr) => arr.filter((_, j) => j !== i))}
                    className="text-xs text-stone-400 hover:text-red-600"
                  >
                    Retirer
                  </button>
                )}
              </div>
              <input
                value={s.question}
                onChange={(e) => setSecret(i, { question: e.target.value })}
                placeholder="Question — ex. Que contenait la poche zippée ?"
                className={inputCls}
              />
              <input
                value={s.value}
                onChange={(e) => setSecret(i, { value: e.target.value })}
                placeholder="Réponse secrète — ex. un ticket de bus jauni"
                className={inputCls}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setSecrets((arr) => [...arr, { question: "", value: "" }])}
            className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:border-stone-400"
          >
            <Plus className="h-4 w-4" /> Ajouter un détail
          </button>
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || submitting}
          className="rounded-2xl bg-brand px-6 py-3.5 text-center font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
        >
          {submitting ? "Publication…" : "Publier l'objet trouvé"}
        </button>
      </div>
    </main>
  );
}

const inputCls =
  "rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base focus:border-brand focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </div>
  );
}
