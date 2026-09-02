import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-stone-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            Sa<span className="text-brand">mu</span>
          </span>
          <p className="max-w-xs text-sm text-stone-500">
            Find it. Verify it. Return it. Prove it&apos;s yours, without revealing the secrets that
            prove it.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-stone-800">Product</span>
            <Link href="/lost" className="text-stone-500 hover:text-stone-800">
              I lost something
            </Link>
            <Link href="/found" className="text-stone-500 hover:text-stone-800">
              I found something
            </Link>
            <Link href="/my-items" className="text-stone-500 hover:text-stone-800">
              Finder dashboard
            </Link>
            <a href="/#how" className="text-stone-500 hover:text-stone-800">
              How it works
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-stone-800">Trust</span>
            <a href="/#securite" className="text-stone-500 hover:text-stone-800">
              Security
            </a>
            <a href="/#verification" className="text-stone-500 hover:text-stone-800">
              Private verification
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-stone-200 py-5 text-center text-xs text-stone-400">
        © 2026 Samu · Niamey
      </div>
    </footer>
  );
}
