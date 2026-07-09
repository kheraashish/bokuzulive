import Link from "next/link";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#honesty", label: "The honesty rail" },
  { href: "#gate", label: "Human gate" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-plum-line/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-5 sm:px-8">
        <Link href="#top" className="flex items-center gap-2" aria-label="Bokuzu, home">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">
            b
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-bone">bokuzu</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
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

        <div className="flex items-center gap-2.5">
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
      </div>
    </header>
  );
}
