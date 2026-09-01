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
    category: "wallet",
    colorFamily: "brown",
    zone: "Grand Marché",
    foundOn: "2026-08-26",
    publicNote: "Brown leather wallet found near the east entrance of the Grand Marché.",
    secrets: [
      { key: "inside_color", question: "What is the exact color of the inside?", kind: "text", weight: 2, value: "burgundy red" },
      { key: "card_count", question: "How many cards were inside?", kind: "exact", weight: 2, value: "3" },
      { key: "distinctive_mark", question: "Is there a distinctive mark inside?", kind: "text", weight: 3, value: "a red dragon sticker stuck inside" },
      { key: "zipped_pocket", question: "What was in the zipped pocket?", kind: "text", weight: 2, value: "an old yellowed bus ticket" },
      { key: "material", question: "What is it made of?", kind: "choice", choices: ["leather", "fabric", "synthetic"], weight: 1, value: "leather" },
      { key: "initials", question: "What initials are engraved on it?", kind: "exact", weight: 2, value: "AK" },
      { key: "condition", question: "What condition is it in?", kind: "choice", choices: ["new", "worn", "torn"], weight: 1, value: "worn" },
      { key: "photo", question: "Is there a photo tucked inside? Which one?", kind: "text", weight: 1, value: "a photo of a child in a school uniform" },
    ],
  },
  {
    id: "itm_phone_pm",
    category: "phone",
    colorFamily: "black",
    zone: "Petit Marché",
    foundOn: "2026-08-24",
    publicNote: "Black Android phone found on a bench at the Petit Marché.",
    secrets: [
      { key: "wallpaper", question: "What is the wallpaper?", kind: "text", weight: 3, value: "a photo of two goats in front of a blue house" },
      { key: "case", question: "Does it have a case?", kind: "choice", choices: ["with case", "no case"], weight: 1, value: "with case" },
      { key: "case_color", question: "What is the color or pattern of the case?", kind: "text", weight: 2, value: "a clear case with stars" },
      { key: "crack", question: "Is there a crack? Where?", kind: "text", weight: 2, value: "a crack at the bottom right of the screen" },
      { key: "code_length", question: "How many digits is the unlock code?", kind: "exact", weight: 1, value: "4" },
      { key: "brand", question: "What is the brand?", kind: "choice", choices: ["Samsung", "Tecno", "Infinix", "iPhone"], weight: 1, value: "Tecno" },
      { key: "sticker", question: "Is there a sticker on the back? Which one?", kind: "text", weight: 2, value: "a Niger flag sticker" },
      { key: "ringtone", question: "What ringtone or song is set?", kind: "text", weight: 1, value: "a Quran recitation ringtone" },
    ],
  },
  {
    id: "itm_bag_yantala",
    category: "backpack",
    colorFamily: "blue",
    zone: "Yantala",
    foundOn: "2026-08-27",
    publicNote: "Blue backpack found near the school in Yantala.",
    secrets: [
      { key: "main_item", question: "What important item was inside?", kind: "text", weight: 3, value: "a notebook with an orange wax-print fabric cover" },
      { key: "brand", question: "What is the bag's brand?", kind: "choice", choices: ["Nike", "Adidas", "no brand"], weight: 1, value: "no brand" },
      { key: "outer_pockets", question: "How many outer pockets does it have?", kind: "exact", weight: 1, value: "2" },
      { key: "keychain", question: "Is there a keychain attached? Which one?", kind: "text", weight: 2, value: "a soccer-ball keychain" },
      { key: "notebooks", question: "What subject did the notebooks cover?", kind: "text", weight: 2, value: "ninth-grade math lessons" },
      { key: "lining_color", question: "What color is the inner lining?", kind: "choice", choices: ["gray", "black", "blue"], weight: 1, value: "gray" },
      { key: "bottle", question: "Was there a bottle? Describe it.", kind: "text", weight: 1, value: "a dented green water bottle" },
      { key: "name_written", question: "What name is written inside?", kind: "exact", weight: 2, value: "Halima" },
    ],
  },
];
