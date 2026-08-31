import { Backpack, FileText, KeyRound, Package, Smartphone, Wallet, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

const MAP: Record<string, ComponentType<LucideProps>> = {
  téléphone: Smartphone,
  telephone: Smartphone,
  portefeuille: Wallet,
  "sac à dos": Backpack,
  sac: Backpack,
  documents: FileText,
  clés: KeyRound,
  cles: KeyRound,
};

export default function CategoryIcon({
  category,
  ...props
}: { category: string } & LucideProps) {
  const Icon = MAP[category.toLowerCase()] ?? Package;
  return <Icon {...props} />;
}
