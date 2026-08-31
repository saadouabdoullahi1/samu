"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays, Circle, Lock, MapPin, MoreHorizontal, Search } from "lucide-react";
import { useWebmcpTools } from "@/app/hooks/useWebmcpTools";
import { createRuntime, type ToolContext, type ToolEvent } from "@/app/lib/toolRuntime";
import ObjectCard, { type ObjectCardData } from "@/app/components/ObjectCard";
import CategoryIcon from "@/app/components/CategoryIcon";
import { extractCriteria } from "@/lib/parse";

const CATEGORIES = ["Téléphone", "Portefeuille", "Sac", "Documents", "Clés", "Autre"];
const DATE_OPTS: [string, string][] = [
  ["unknown", "Je ne sais pas"],
  ["today", "Aujourd'hui"],
  ["yesterday", "Hier"],
  ["week", "Cette semaine"],
  ["month", "Ce mois-ci"],
];

function sinceFor(opt: string): string | undefined {
  if (opt === "unknown") return undefined;
  const d = new Date();
  if (opt === "yesterday") d.setDate(d.getDate() - 1);
  else if (opt === "week") d.setDate(d.getDate() - 7);
  else if (opt === "month") d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function SearchPanel() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  // undefined = untouched (use the auto-detected one); null = explicitly cleared;
  // string = explicitly chosen. This lets the user toggle even the auto-detected
  // category off, instead of it being stuck highlighted.
  const [manualCategory, setManualCategory] = useState<string | null | undefined>(undefined);
  const [zone, setZone] = useState("");
  const [dateOpt, setDateOpt] = useState("unknown");
  const [matches, setMatches] = useState<ObjectCardData[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [alerted, setAlerted] = useState(false);

  const criteria = useMemo(() => extractCriteria(description), [description]);
  const selectedCategory = manualCategory !== undefined ? manualCategory : criteria.category ?? null;

  const emit = useCallback((name: string, ev: ToolEvent) => {
    if (name === "search_matches") {
      const d = ev.data as { matches?: ObjectCardData[] };
      setMatches(ev.ok && d?.matches ? d.matches : []);
    }
  }, []);

  const ctx = useMemo<ToolContext>(
    () => ({
      params: {},
      data: {},
      budgetLeft: () => 0,
      currentClaim: () => null,
      ensureClaim: async () => "",
      navigate: (path) => router.push(path),
      emit,
    }),
    [router, emit],
  );

  const runtime = useMemo(() => createRuntime("lost", ctx), [ctx]);
  useWebmcpTools(() => runtime.tools, [runtime]);

  const search = async () => {
    const cat = selectedCategory && selectedCategory !== "Autre" ? selectedCategory : "";
    const query = [cat, description].filter(Boolean).join(" ").trim();
    if (!query) return;
    const zoneEff = zone.trim() || criteria.zone || "";
    const since = sinceFor(dateOpt);
    setSearching(true);
    setAlerted(false);
    await runtime.run("search_matches", {
      description: query,
      ...(zoneEff ? { zone: zoneEff } : {}),
      ...(since ? { since } : {}),
    });
    setSearching(false);
  };

  const hasUnderstanding = Boolean(criteria.category || criteria.color || criteria.zone || dateOpt !== "unknown");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        {/* Natural-language description */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-stone-400" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) search();
              }}
              placeholder="Décrivez votre objet… ex. téléphone Samsung noir avec une coque bleue, perdu près de Yantala"
              rows={3}
              className="w-full rounded-2xl border border-stone-300 bg-white py-3 pl-12 pr-4 text-base focus:border-brand focus:outline-none"
            />
          </div>

          {hasUnderstanding && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-soft/60 px-4 py-3">
              <span className="text-sm font-medium text-brand-dark">Samu a compris :</span>
              {criteria.category && (
                <Chip>
                  <CategoryIcon category={criteria.category.toLowerCase()} className="h-3.5 w-3.5" />
                  {criteria.category}
                </Chip>
              )}
              {criteria.color && (
                <Chip>
                  <Circle className="h-3 w-3 fill-current" /> {criteria.color}
                </Chip>
              )}
              {criteria.zone && (
                <Chip>
                  <MapPin className="h-3.5 w-3.5" /> {criteria.zone}
                </Chip>
              )}
              {dateOpt !== "unknown" && (
                <Chip>
                  <CalendarDays className="h-3.5 w-3.5" /> {DATE_OPTS.find(([v]) => v === dateOpt)?.[1]}
                </Chip>
              )}
            </div>
          )}
        </div>

        {/* Category cards */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-700">Catégorie</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setManualCategory((prev) => {
                      const cur = prev !== undefined ? prev : criteria.category ?? null;
                      return cur === c ? null : c;
                    })
                  }
                  aria-pressed={active}
                  className={
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium transition " +
                    (active
                      ? "border-brand bg-brand text-white shadow-sm scale-[1.03]"
                      : "border-stone-200 text-stone-600 hover:border-brand/40 hover:bg-brand-soft/40")
                  }
                >
                  {c === "Autre" ? (
                    <MoreHorizontal className="h-6 w-6" />
                  ) : (
                    <CategoryIcon category={c.toLowerCase()} className="h-6 w-6" strokeWidth={1.5} />
                  )}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location + date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
              <MapPin className="h-4 w-4" /> Où l&apos;avez-vous perdu ?
            </span>
            <input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder={criteria.zone ? criteria.zone : "Ex. Yantala"}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
              <CalendarDays className="h-4 w-4" /> Quand ?
            </span>
            <select
              value={dateOpt}
              onChange={(e) => setDateOpt(e.target.value)}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base focus:border-brand focus:outline-none"
            >
              {DATE_OPTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={search}
          disabled={searching || !(selectedCategory || description.trim())}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
        >
          <Search className="h-5 w-5" /> {searching ? "Recherche…" : "Rechercher"}
        </button>
      </div>

      {/* Confidentiality */}
      <div className="flex items-start gap-3 rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong className="text-stone-800">Recherche confidentielle.</strong> Les informations
          utilisées pour vérifier que vous êtes le propriétaire ne sont jamais affichées dans les
          résultats publics.
        </p>
      </div>

      {/* Results */}
      {matches !== null && matches.length > 0 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold">
            {matches.length} objet{matches.length > 1 ? "s" : ""} pourrai
            {matches.length > 1 ? "ent" : "t"} correspondre
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <ObjectCard key={m.item_id} item={m} />
            ))}
          </div>
        </div>
      )}

      {matches !== null && matches.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-stone-200 bg-white px-6 py-14 text-center">
          <Search className="h-10 w-10 text-stone-400" strokeWidth={1.5} />
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">Aucun objet trouvé</h2>
            <p className="max-w-sm text-stone-600">
              Nous n&apos;avons pas encore d&apos;objet correspondant. Il peut être déclaré plus tard.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setAlerted(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
            >
              <Bell className="h-4 w-4" /> Créer une alerte
            </button>
            <button
              type="button"
              onClick={() => setMatches(null)}
              className="rounded-2xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 transition hover:border-stone-400"
            >
              Modifier ma recherche
            </button>
          </div>
          {alerted && (
            <p className="flex items-center gap-1.5 text-sm text-brand-dark">
              <Bell className="h-4 w-4" /> Bientôt : Samu vous préviendra dès qu&apos;un objet
              correspondant sera déclaré.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
      {children}
    </span>
  );
}
