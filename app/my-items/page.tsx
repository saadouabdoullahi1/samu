import { listItems } from "@/lib/db";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function MyItemsPage() {
  const items = await listItems();
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-dark">
          Finder dashboard
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">Items you reported</h1>
        <p className="max-w-xl text-lg text-stone-600">
          See the ownership claims received on your found items, and approve contact once a claimant
          is verified.
        </p>
      </header>

      <div className="mt-8">
        <Dashboard items={items} />
      </div>
    </main>
  );
}
