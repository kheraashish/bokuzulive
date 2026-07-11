import Link from "next/link";
import { Chip, Dot } from "./ui";
import { EngineCard, PortalCard } from "./HeroShowcase";

// Cinematic split-hero: both faces of Bokuzu on screen at once. A centered statement sits above a
// dominant, near-full-width band — the internal engine (far left) and the client portal (far right,
// ~10% larger) separated by a large gap, with lime connectors radiating from the H1 to each card.
// Entrance is a staggered CSS fade/rise (statement → cards → connectors draw in), collapsed to
// instant by prefers-reduced-motion via globals.css. Content is top-aligned so the H1 and the top
// halves of both cards stay visible without scrolling on shorter viewports.
export function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-5 pb-10 pt-10 sm:px-8 sm:pb-16 lg:pt-12"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center text-center">
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
        {/* subline: one line at >=1024px (never wraps "you."), natural wrap below */}
        <p
          className="mt-4 max-w-2xl animate-rise text-lg leading-relaxed text-ash sm:text-xl lg:max-w-none lg:whitespace-nowrap"
          style={{ animationDelay: "200ms" }}
        >
          The engine that runs our agency — and the dashboard that proves it to you.
        </p>

        {/* decorative lime connectors from the statement to each card (desktop only), drawn in last */}
        <div className="mt-6 hidden w-full max-w-6xl lg:block" aria-hidden>
          <svg viewBox="0 0 1152 40" className="h-9 w-full" fill="none" preserveAspectRatio="xMidYMid meet">
            {[
              { d: "M576 3 L150 36", kind: "line" },
              { d: "M576 3 L1002 36", kind: "line" },
              { d: "M143 29 L150 37 L157 29", kind: "cap" },
              { d: "M995 29 L1002 37 L1009 29", kind: "cap" },
            ].map((c, i) => (
              <path
                key={i}
                d={c.d}
                pathLength={1}
                strokeDasharray={1}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="animate-draw stroke-lime [filter:drop-shadow(0_0_3px_theme(colors.lime.DEFAULT/45%))]"
                style={{
                  // Both lines grow from the centre outward together; the two arrow-heads snap in
                  // right as the lines reach the cards.
                  animationDelay: c.kind === "line" ? "500ms" : "1150ms",
                  animationDuration: c.kind === "line" ? "650ms" : "220ms",
                }}
              />
            ))}
          </svg>
        </div>

        {/* the split: engine (far left) + portal (far right, ~10% larger), large center gap. Mobile: portal first. */}
        <div className="mt-6 grid w-full grid-cols-1 gap-8 lg:mt-4 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-40">
          {/* ENGINE */}
          <figure className="order-2 flex animate-rise flex-col lg:order-1" style={{ animationDelay: "340ms" }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
              <span className="text-lime">The engine</span>
              <span className="text-ash"> — what runs our agency</span>
            </p>
            <div className="mt-3 h-[280px] lg:h-[clamp(300px,48vh,440px)]">
              <EngineCard />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ash">
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
            <div className="mt-3 h-[280px] lg:h-[clamp(300px,48vh,440px)]">
              <PortalCard />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ash">
              Every dollar in, every dollar back, ROAS trend on any date range — and every change we
              make, logged the moment it happens.
            </p>
          </figure>
        </div>

        {/* CTA row — exactly two buttons */}
        <div className="mt-10 flex w-full animate-rise flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "600ms" }}>
          <Link
            href="/example"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98] sm:w-auto"
          >
            View the live demo
            <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/login"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-plum-line px-6 py-3 text-sm font-medium text-bone transition-colors duration-200 ease-out hover:border-lime hover:bg-lime hover:text-ink sm:w-auto"
          >
            Login to your portal
            <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>

        {/* footnote */}
        <p className="mt-5 animate-rise font-mono text-xs leading-relaxed text-ash" style={{ animationDelay: "680ms" }}>
          Numbers only from your platforms, traced to source. If the signal is thin, it says so.
        </p>
      </div>
    </section>
  );
}
