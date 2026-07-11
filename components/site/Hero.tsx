import Link from "next/link";
import { Chip, Dot } from "./ui";
import { EngineCard, PortalCard } from "./HeroShowcase";

// Cinematic split-hero: both faces of Bokuzu on screen at once. The internal engine (left) and the
// client portal (right) flank a centered statement, with decorative connectors radiating from the
// H1 to each card. Entrance is a staggered fade/rise (statement → cards → connectors) driven purely
// by CSS animations, so the final state always renders even before hydration; prefers-reduced-motion
// collapses every animation to instant via globals.css.
export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-5 py-4 sm:px-8"
    >
      <div className="mx-auto flex w-full max-w-shell flex-col items-center text-center">
        {/* badge */}
        <div className="animate-rise" style={{ animationDelay: "40ms" }}>
          <Chip tone="lime">
            <Dot tone="lime" /> Honest by construction
          </Chip>
        </div>

        {/* center statement — the single H1 */}
        <h1 className="display-lg mt-5 max-w-4xl animate-rise text-bone" style={{ animationDelay: "120ms" }}>
          One system. Two faces. <span className="text-lime">Zero lies.</span>
        </h1>
        <p
          className="mt-4 max-w-2xl animate-rise text-lg leading-relaxed text-ash sm:text-xl"
          style={{ animationDelay: "200ms" }}
        >
          The engine that runs our agency — and the dashboard that proves it to you.
        </p>

        {/* decorative connectors from the statement to each card (desktop only), drawn in last */}
        <div className="mt-5 hidden w-full max-w-[760px] lg:block" aria-hidden>
          <svg viewBox="0 0 800 32" className="h-8 w-full" fill="none" preserveAspectRatio="xMidYMid meet">
            {[
              "M400 2 L196 29",
              "M400 2 L604 29",
              "M189 22 L196 30 L203 22",
              "M597 22 L604 30 L611 22",
            ].map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength={1}
                strokeDasharray={1}
                stroke="#373042"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="animate-draw"
                style={{ animationDelay: `${640 + i * 40}ms` }}
              />
            ))}
          </svg>
        </div>

        {/* the split: engine (left on desktop) + portal (right, ~10% larger). On mobile: portal first. */}
        <div className="mt-4 grid w-full grid-cols-1 gap-8 lg:mt-2 lg:grid-cols-[1fr_1.1fr] lg:items-stretch lg:gap-10">
          {/* ENGINE */}
          <figure className="order-2 flex animate-rise flex-col lg:order-1" style={{ animationDelay: "340ms" }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
              <span className="text-lime">The engine</span>
              <span className="text-ash"> — what runs our agency</span>
            </p>
            <div className="mt-3 h-[280px] lg:h-[clamp(200px,30vh,300px)]">
              <EngineCard />
            </div>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ash">
              Digs the data, reconciles every platform, recommends the next move. Our senior team
              reviews every call and makes every change by hand.
            </p>
          </figure>

          {/* PORTAL */}
          <figure className="order-1 flex animate-rise flex-col lg:order-2" style={{ animationDelay: "500ms" }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
              <span className="text-lime">The portal</span>
              <span className="text-ash"> — what you see</span>
            </p>
            <div className="mt-3 h-[280px] lg:h-[clamp(200px,30vh,300px)]">
              <PortalCard />
            </div>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ash">
              Every dollar in, every dollar back, ROAS trend on any date range — and every change we
              make, logged the moment it happens.
            </p>
          </figure>
        </div>

        {/* CTA row */}
        <div className="mt-6 flex animate-rise flex-wrap items-center justify-center gap-3" style={{ animationDelay: "600ms" }}>
          <a
            href="#waitlist"
            className="rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98]"
          >
            Request early access
          </a>
          <Link
            href="/example"
            className="group inline-flex items-center gap-2 rounded-full border border-plum-line px-5 py-3 text-sm font-medium text-bone transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink"
          >
            View the live demo
            <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ash transition-colors duration-200 ease-out hover:text-bone"
          >
            Login to your portal
            <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>

        {/* footnote */}
        <p className="mt-4 animate-rise font-mono text-xs leading-relaxed text-ash" style={{ animationDelay: "680ms" }}>
          Numbers only from your platforms, traced to source. If the signal is thin, it says so.
        </p>
      </div>
    </section>
  );
}
