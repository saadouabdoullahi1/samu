"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

const LINKS = [
  { href: "/#objets", label: "Objets trouvés" },
  { href: "/#how", label: "Comment ça marche" },
  { href: "/#securite", label: "Sécurité" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Sa<span className="text-brand">mu</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-stone-600 hover:text-stone-900">
              {l.label}
            </a>
          ))}
          <Link
            href="/lost"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Search className="h-4 w-4" /> Rechercher
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-stone-700 md:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-stone-200 px-5 py-3 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/lost"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-xl bg-brand px-4 py-2 text-center text-sm font-semibold text-white"
          >
            Rechercher
          </Link>
        </div>
      )}
    </header>
  );
}
