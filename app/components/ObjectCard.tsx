import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { categoryTint, statusMeta } from "@/lib/ui";
import CategoryIcon from "./CategoryIcon";

export interface ObjectCardData {
  item_id: string;
  category: string;
  color_family: string;
  zone: string;
  found_on: string;
  public_note?: string;
  status: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export default function ObjectCard({ item }: { item: ObjectCardData }) {
  const s = statusMeta(item.status);
  return (
    <Link
      href={`/item/${item.item_id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${categoryTint(item.category)}`}
      >
        <CategoryIcon category={item.category} className="h-14 w-14 text-stone-500/70" strokeWidth={1.5} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold capitalize leading-snug">
          {item.category} {item.color_family}
        </h3>
        <div className="flex flex-col gap-1 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {item.zone}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> Found {formatDate(item.found_on)}
          </span>
        </div>
        <span
          className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
          {s.label}
        </span>
        <span className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-dark group-hover:gap-2 group-hover:transition-all">
          View item <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
