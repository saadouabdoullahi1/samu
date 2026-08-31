// Lightweight, client-side criteria extraction from a free-text description.
// This powers the "Samu a compris" panel — the perceived intelligence — with
// no server call and no exposure of how search actually works.

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Téléphone", ["téléphone", "telephone", "phone", "samsung", "iphone", "tecno", "infinix", "android", "portable", "smartphone"]],
  ["Portefeuille", ["portefeuille", "wallet", "porte-monnaie", "porte monnaie"]],
  ["Sac", ["sac", "backpack", "cartable", "sacoche", "sac à dos"]],
  ["Clés", ["clés", "cles", "clé", "clef", "trousseau"]],
  ["Documents", ["documents", "papiers", "carte d", "cni", "passeport", "permis"]],
];

const COLORS = [
  "noir", "blanc", "marron", "bleu", "rouge", "vert", "gris", "jaune", "orange",
  "rose", "violet", "beige", "argenté", "doré",
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
