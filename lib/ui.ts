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
      return { label: "Owner verified", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "returned":
      return { label: "Returned", dot: "bg-stone-400", text: "text-stone-500", bg: "bg-stone-100" };
    default: // "open"
      return { label: "Pending", dot: "bg-brand", text: "text-brand-dark", bg: "bg-brand-soft" };
  }
}

/** Badge for a claim's status on the finder dashboard. */
export function claimStatusMeta(status: string): StatusMeta {
  switch (status) {
    case "verified":
      return { label: "Verified", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "contact_requested":
      return { label: "Contact requested", dot: "bg-brand", text: "text-brand-dark", bg: "bg-brand-soft" };
    case "contact_shared":
      return { label: "Contact shared", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "rejected":
      return { label: "Rejected", dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
    case "expired":
      return { label: "Expired", dot: "bg-stone-400", text: "text-stone-500", bg: "bg-stone-100" };
    default: // "open"
      return { label: "In progress", dot: "bg-stone-400", text: "text-stone-500", bg: "bg-stone-100" };
  }
}

const CATEGORY_EMOJI: Record<string, string> = {
  // French (seeded demo data) + English (new items) keys
  téléphone: "📱",
  telephone: "📱",
  phone: "📱",
  portefeuille: "👛",
  wallet: "👛",
  "sac à dos": "🎒",
  sac: "🎒",
  bag: "🎒",
  backpack: "🎒",
  clés: "🔑",
  cles: "🔑",
  keys: "🔑",
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
    phone: "from-sky-100 to-sky-50",
    portefeuille: "from-amber-100 to-amber-50",
    wallet: "from-amber-100 to-amber-50",
    "sac à dos": "from-violet-100 to-violet-50",
    sac: "from-violet-100 to-violet-50",
    bag: "from-violet-100 to-violet-50",
    backpack: "from-violet-100 to-violet-50",
  };
  return map[category.toLowerCase()] ?? "from-stone-100 to-stone-50";
}
