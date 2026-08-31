// Client-safe presentation helpers (no Node imports).

export interface StatusMeta {
  label: string;
  dot: string;
  text: string;
  bg: string;
}

/** Map an item's stored status to a friendly, consumer-facing badge. */
export function statusMeta(status: string): StatusMeta {
  switch (status) {
    case "verified":
      return { label: "Propriétaire vérifié", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "returned":
      return { label: "Restitué", dot: "bg-stone-400", text: "text-stone-500", bg: "bg-stone-100" };
    default: // "open"
      return { label: "En attente", dot: "bg-brand", text: "text-brand-dark", bg: "bg-brand-soft" };
  }
}

const CATEGORY_EMOJI: Record<string, string> = {
  téléphone: "📱",
  telephone: "📱",
  portefeuille: "👛",
  "sac à dos": "🎒",
  sac: "🎒",
  clés: "🔑",
  cles: "🔑",
  documents: "📄",
};

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "📦";
}

/** A soft tint for the photo-placeholder tile, keyed by category. */
export function categoryTint(category: string): string {
  const map: Record<string, string> = {
    téléphone: "from-sky-100 to-sky-50",
    telephone: "from-sky-100 to-sky-50",
    portefeuille: "from-amber-100 to-amber-50",
    "sac à dos": "from-violet-100 to-violet-50",
    sac: "from-violet-100 to-violet-50",
  };
  return map[category.toLowerCase()] ?? "from-stone-100 to-stone-50";
}
