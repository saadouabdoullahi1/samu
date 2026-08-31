import type { Kind } from "./scoring";

export interface SeedSecret {
  key: string;
  question: string; // public
  kind: Kind;
  choices?: string[];
  value: string; // server-only; hashed (exact/choice) or stored as text
  weight: number; // 1..3
}

export interface SeedItem {
  id: string;
  category: string;
  colorFamily: string;
  zone: string;
  foundOn: string; // YYYY-MM-DD
  publicNote: string;
  secrets: SeedSecret[];
}

export const SEED_ITEMS: SeedItem[] = [
  {
    id: "itm_wallet_gm",
    category: "portefeuille",
    colorFamily: "marron",
    zone: "Grand Marché",
    foundOn: "2026-08-26",
    publicNote: "Portefeuille en cuir marron trouvé près de l'entrée est du Grand Marché.",
    secrets: [
      { key: "couleur_interieur", question: "Quelle est la couleur exacte de l'intérieur ?", kind: "text", weight: 2, value: "rouge bordeaux" },
      { key: "nombre_cartes", question: "Combien de cartes s'y trouvaient ?", kind: "exact", weight: 2, value: "3" },
      { key: "marque_distinctive", question: "Y a-t-il une marque distinctive à l'intérieur ?", kind: "text", weight: 3, value: "un autocollant de dragon rouge collé à l'intérieur" },
      { key: "poche_zippee", question: "Que contenait la poche zippée ?", kind: "text", weight: 2, value: "un vieux ticket de bus jauni" },
      { key: "matiere", question: "En quelle matière est-il ?", kind: "choice", choices: ["cuir", "tissu", "synthétique"], weight: 1, value: "cuir" },
      { key: "initiales", question: "Quelles initiales sont gravées dessus ?", kind: "exact", weight: 2, value: "AK" },
      { key: "etat", question: "Dans quel état est-il ?", kind: "choice", choices: ["neuf", "usé", "déchiré"], weight: 1, value: "usé" },
      { key: "photo", question: "Y a-t-il une photo glissée à l'intérieur ? Laquelle ?", kind: "text", weight: 1, value: "une photo d'un enfant en tenue d'école" },
    ],
  },
  {
    id: "itm_phone_pm",
    category: "téléphone",
    colorFamily: "noir",
    zone: "Petit Marché",
    foundOn: "2026-08-24",
    publicNote: "Téléphone Android noir trouvé sur un banc au Petit Marché.",
    secrets: [
      { key: "fond_ecran", question: "Quel est le fond d'écran ?", kind: "text", weight: 3, value: "une photo de deux chèvres devant une maison bleue" },
      { key: "coque", question: "A-t-il une coque ?", kind: "choice", choices: ["avec coque", "sans coque"], weight: 1, value: "avec coque" },
      { key: "couleur_coque", question: "Couleur ou motif de la coque ?", kind: "text", weight: 2, value: "coque transparente avec des étoiles" },
      { key: "fissure", question: "Y a-t-il une fissure ? Où ?", kind: "text", weight: 2, value: "une fissure en bas à droite de l'écran" },
      { key: "longueur_code", question: "Combien de chiffres compte le code de déverrouillage ?", kind: "exact", weight: 1, value: "4" },
      { key: "marque", question: "Quelle est la marque ?", kind: "choice", choices: ["Samsung", "Tecno", "Infinix", "iPhone"], weight: 1, value: "Tecno" },
      { key: "autocollant", question: "Un autocollant au dos ? Lequel ?", kind: "text", weight: 2, value: "un autocollant du drapeau du Niger" },
      { key: "sonnerie", question: "Quelle sonnerie ou chanson est réglée ?", kind: "text", weight: 1, value: "une sonnerie de récitation du coran" },
    ],
  },
  {
    id: "itm_bag_yantala",
    category: "sac à dos",
    colorFamily: "bleu",
    zone: "Yantala",
    foundOn: "2026-08-27",
    publicNote: "Sac à dos bleu trouvé près de l'école à Yantala.",
    secrets: [
      { key: "contenu_principal", question: "Quel objet important s'y trouvait ?", kind: "text", weight: 3, value: "un carnet de notes avec une couverture en tissu wax orange" },
      { key: "marque", question: "Quelle est la marque du sac ?", kind: "choice", choices: ["Nike", "Adidas", "sans marque"], weight: 1, value: "sans marque" },
      { key: "nb_poches", question: "Combien de poches extérieures ?", kind: "exact", weight: 1, value: "2" },
      { key: "porte_cle", question: "Un porte-clés accroché ? Lequel ?", kind: "text", weight: 2, value: "un porte-clés en forme de ballon de foot" },
      { key: "cahiers", question: "Quelle matière couvraient les cahiers ?", kind: "text", weight: 2, value: "des cours de mathématiques de troisième" },
      { key: "couleur_interieur", question: "De quelle couleur est la doublure intérieure ?", kind: "choice", choices: ["gris", "noir", "bleu"], weight: 1, value: "gris" },
      { key: "bouteille", question: "Y avait-il une bouteille ? Décris-la.", kind: "text", weight: 1, value: "une gourde verte cabossée" },
      { key: "nom_ecrit", question: "Quel nom est écrit à l'intérieur ?", kind: "exact", weight: 2, value: "Halima" },
    ],
  },
];
