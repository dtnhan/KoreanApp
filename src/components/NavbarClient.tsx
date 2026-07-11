"use client";

import Link from "next/link";
import { useState } from "react";
import { labels } from "@/lib/labels";
import { logout } from "@/actions/auth";

type NavUser = { name: string; role: "USER" | "ADMIN" } | null;

const links = [
  { href: "/", label: labels.nav.home },
  { href: "/khoa-hoc", label: labels.nav.courses },
  { href: "/on-tap", label: labels.nav.review },
  { href: "/tien-do", label: labels.nav.progress },
];

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        {labels.nav.logout}
      </button>
    </form>
  );
}

export function NavbarClient({
  user,
  dueCount = 0,
}: {
  user: NavUser;
  dueCount?: number;
}) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    ...links,
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: labels.nav.admin }] : []),
  ];

  const badge =
    user && dueCount > 0 ? (
      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
        {dueCount > 99 ? "99+" : dueCount}
      </span>
    ) : null;

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
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {l.label}
              {l.href === "/on-tap" && badge}
            </Link>
          ))}

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="max-w-40 truncate rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                {user.name}
              </span>
              <LogoutButton className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" />
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/dang-nhap"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {labels.nav.login}
              </Link>
              <Link
                href="/dang-ky"
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {labels.nav.register}
              </Link>
            </div>
          )}
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
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50"
              >
                {l.label}
                {l.href === "/on-tap" && badge}
              </Link>
            ))}

            {user ? (
              <>
                <span className="mt-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                  {user.name}
                </span>
                <LogoutButton className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100" />
              </>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50"
                >
                  {labels.nav.login}
                </Link>
                <Link
                  href="/dang-ky"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  {labels.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
