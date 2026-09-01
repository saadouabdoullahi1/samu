// Lightweight, client-side criteria extraction from a free-text description.
// This powers the "Samu a compris" panel — the perceived intelligence — with
// no server call and no exposure of how search actually works.

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Phone", ["phone", "téléphone", "telephone", "samsung", "iphone", "tecno", "infinix", "android", "smartphone", "portable"]],
  ["Wallet", ["wallet", "portefeuille", "purse", "porte-monnaie", "porte monnaie"]],
  ["Bag", ["bag", "backpack", "sac", "cartable", "sacoche"]],
  ["Keys", ["keys", "key", "clés", "cles", "clé", "clef", "trousseau"]],
  ["Documents", ["documents", "papers", "papiers", "passport", "passeport", "id card", "carte d"]],
];

const COLORS = [
  "black", "white", "brown", "blue", "red", "green", "gray", "grey", "yellow",
  "orange", "pink", "purple", "beige", "silver", "gold",
  "noir", "blanc", "marron", "bleu", "rouge", "vert", "gris", "jaune", "rose", "violet",
];

const ZONES = [
  "Yantala", "Grand Marché", "Petit Marché", "Plateau", "Lazaret", "Gamkallé",
  "Kouara Kano", "Terminus", "Wadata", "Recasement", "Banifandou", "Koira Tegui", "Niamey",
];

export interface Criteria {
  category?: string;
  color?: string;
  zone?: string;
}

export function extractCriteria(text: string): Criteria {
  const t = " " + text.toLowerCase() + " ";
  let category: string | undefined;
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => t.includes(k))) {
      category = cat;
      break;
    }
  }
  const color = COLORS.find((c) => t.includes(c));
  const zone = ZONES.find((z) => t.includes(z.toLowerCase()));
  return { category, color, zone };
}
