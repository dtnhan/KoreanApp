"use client";

import Link from "next/link";
import { useState } from "react";
import { labels } from "@/lib/labels";

const links = [
  { href: "/", label: labels.nav.home },
  { href: "/khoa-hoc", label: labels.nav.courses },
  { href: "/on-tap", label: labels.nav.review },
  { href: "/tien-do", label: labels.nav.progress },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-600">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            한
          </span>
          <span>{labels.siteName}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {l.label}
            </Link>
          ))}
          <span
            className="ml-2 cursor-not-allowed rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white opacity-90"
            title={labels.lesson.comingSoon}
          >
            {labels.nav.login}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-slate-600 md:hidden"
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50"
              >
                {l.label}
              </Link>
            ))}
            <span className="mt-1 cursor-not-allowed rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white">
              {labels.nav.login}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
