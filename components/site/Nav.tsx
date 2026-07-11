"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#honesty", label: "The honesty rail" },
  { href: "#gate", label: "Human gate" },
  { href: "#portal", label: "Client portal" },
];

// Sticky nav. Above ~900px the four section links + lautzu.com + Sign in + Request access all sit
// inline. Below 900px they collapse into a hamburger menu; lautzu.com stays visible inside it.
export function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-plum-line/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-5 sm:px-8">
        <Link href="#top" onClick={close} className="flex items-center gap-2" aria-label="Bokuzu, home">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">
            b
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-bone">bokuzu</span>
        </Link>

        {/* desktop section links */}
        <nav className="hidden items-center gap-7 min-[900px]:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ash transition-colors duration-200 ease-out hover:text-bone"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* desktop actions */}
        <div className="hidden items-center gap-2.5 min-[900px]:flex">
          <a
            href="https://lautzu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-full border border-plum-line px-4 py-2 text-sm font-medium text-ash transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink active:scale-[0.98]"
          >
            lautzu.com
            <span aria-hidden className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              &#8599;
            </span>
          </a>
          <Link
            href="/login"
            className="rounded-full border border-plum-line px-4 py-2 text-sm font-medium text-bone transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink active:scale-[0.98]"
          >
            Sign in
          </Link>
          <a
            href="#waitlist"
            className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98]"
          >
            Request access
          </a>
        </div>

        {/* mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-plum-line text-bone transition-colors hover:border-lime min-[900px]:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            {open ? (
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <nav id="mobile-menu" className="border-t border-plum-line/70 bg-ink min-[900px]:hidden">
          <div className="mx-auto flex max-w-shell flex-col px-5 py-3 sm:px-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="flex min-h-[44px] items-center border-b border-plum-line/50 text-[15px] text-bone/90 transition-colors hover:text-bone"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://lautzu.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex min-h-[44px] items-center gap-1.5 border-b border-plum-line/50 text-[15px] text-ash transition-colors hover:text-bone"
            >
              lautzu.com
              <span aria-hidden>&#8599;</span>
            </a>
            <div className="mt-3 flex gap-2.5">
              <Link
                href="/login"
                onClick={close}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-plum-line px-4 text-sm font-medium text-bone transition-colors hover:border-lime hover:bg-lime hover:text-ink"
              >
                Sign in
              </Link>
              <a
                href="#waitlist"
                onClick={close}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-lime px-4 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98]"
              >
                Request access
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
