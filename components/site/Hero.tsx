import Link from "next/link";
import { Chip, Dot } from "./ui";
import { HeroShowcase } from "./HeroShowcase";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-shell grid-cols-1 gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
        {/* left: the claim */}
        <div className="flex flex-col justify-center">
          <div className="animate-rise" style={{ animationDelay: "40ms" }}>
            <Chip tone="lime">
              <Dot tone="lime" /> Honest by construction
            </Chip>
          </div>

          <h1
            className="display-xl mt-6 animate-rise text-bone"
            style={{ animationDelay: "120ms" }}
          >
            The ad dashboard that
            <br />
            refuses to{" "}
            <span className="relative whitespace-nowrap text-lime">
              lie
              <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-lime/40" aria-hidden />
            </span>{" "}
            to you.
          </h1>

          <p
            className="mt-7 max-w-prose animate-rise text-lg leading-relaxed text-ash"
            style={{ animationDelay: "200ms" }}
          >
            Connect your Google and Meta ad accounts and see what actually matters: where every
            dollar went, what it made back, ROAS trend over any date range — and a log of every
            change inside your accounts, from bid moves to campaign launches to pauses. Every change
            is logged the moment it happens. Every dollar is synced with every platform refresh.
            Nothing is invented. Nothing is hidden.
          </p>

          <div
            className="mt-9 flex animate-rise flex-wrap items-center gap-3"
            style={{ animationDelay: "280ms" }}
          >
            <a
              href="#waitlist"
              className="rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98]"
            >
              Request early access
            </a>
            <a
              href="#how"
              className="rounded-full border border-plum-line px-5 py-3 text-sm font-medium text-bone transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink"
            >
              See how it works
            </a>
          </div>

          <p
            className="mt-8 animate-rise font-mono text-xs leading-relaxed text-ash"
            style={{ animationDelay: "340ms" }}
          >
            Numbers come only from your platforms, traced to source — never blended into a
            cross-platform figure we&apos;d have to invent. If the signal is thin, it says so.
          </p>
        </div>

        {/* right: portal login, then a live audit ledger below it */}
        <div
          className="animate-rise flex flex-col self-center"
          style={{ animationDelay: "240ms" }}
        >
          {/* portal login + dashboard example entry */}
          <div className="mb-9 flex flex-col items-center gap-3 pt-6 sm:pt-10">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2.5 rounded-full border border-plum-line px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-bone transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink active:scale-[0.98]"
            >
              Login to your portal
              <span
                aria-hidden
                className="transition-transform duration-200 ease-out group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
            <Link
              href="/example"
              className="group inline-flex items-center gap-2.5 rounded-full bg-lime px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98]"
            >
              Dashboard example
              <span
                aria-hidden
                className="transition-transform duration-200 ease-out group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
          </div>

          <HeroShowcase />
        </div>
      </div>
    </section>
  );
}
