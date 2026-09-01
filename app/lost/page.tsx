import { Search } from "lucide-react";
import SearchPanel from "./SearchPanel";

export const dynamic = "force-dynamic";

export default function LostPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Search className="h-7 w-7" strokeWidth={2} />
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">Let&apos;s find your item</h1>
        <p className="max-w-xl text-lg text-stone-600">
          Just describe what you lost. Samu will search the found items that could match.
        </p>
      </header>

      <div className="mt-8">
        <SearchPanel />
      </div>
    </main>
  );
}
