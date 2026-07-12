import { SectionShell, Band, Chip, Dot } from "./ui";

export function HonestyRail() {
  return (
    <SectionShell id="honesty" className="py-10 sm:py-12 lg:py-12">
      <div className="max-w-prose">
        <p className="kicker">The honesty rail</p>
        <h2 className="display-lg mt-4 text-bone">
          Four things Bokuzu will not do, enforced in code.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-ash">
          These are not brand values on a wall. They are constraints in the codebase, checked at
          review. The product physically cannot present a guess as a measurement.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 1 — bands not numbers (wide, leads with the real element) */}
        <article className="rounded-2xl border border-plum-line bg-plum-raise p-6 lg:col-span-7">
          <div className="flex items-center gap-2">
            <Dot tone="lime" />
            <h3 className="font-semibold text-bone">A score is a band, never a bare number</h3>
          </div>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-ash">
            Craft is rubric-grounded and rendered as a filled band with a confidence tag. Every one
            carries the same caption, so no one downstream can mistake it for spend or reach.
          </p>
          <div className="mt-5">
            <Band label="scroll-stop craft" band="STRONG" filled={4} confidence="high" />
          </div>
        </article>

        {/* 2 — withheld (tall, the loudest single word) */}
        <article className="flex flex-col justify-between rounded-2xl border border-plum-line bg-plum-press p-6 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Dot tone="warn" />
            <h3 className="font-semibold text-bone">Thin signal is withheld, not inflated</h3>
          </div>
          <div className="my-6">
            <p className="font-mono text-2xl font-semibold tracking-tight text-warn">
              INSUFFICIENT
              <br />
              SIGNAL
            </p>
          </div>
          <p className="text-sm leading-relaxed text-ash">
            When there is not enough to judge, the assessment says exactly that, and stops.
          </p>
        </article>

        {/* 3 — sample concept label (medium) */}
        <article className="rounded-2xl border border-plum-line bg-plum-raise p-6 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Dot tone="clay" />
            <h3 className="font-semibold text-bone">A concept is labeled a concept</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ash">
            Generated creative is always tagged. It is never dressed up as the prospect{"'"}s real
            asset.
          </p>
          <div className="mt-5 overflow-hidden rounded-xl border border-plum-line bg-ink">
            <div className="grid h-24 place-items-center bg-gradient-to-b from-plum-raise to-plum text-ash">
              <span className="font-mono text-[11px]">ad frame preview</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-bone">Spring concept, variant A</span>
              <Chip tone="clay">sample concept</Chip>
            </div>
          </div>
        </article>

        {/* 4 — one data-unavailable branch (wide, ledger of statuses) */}
        <article className="rounded-2xl border border-plum-line bg-plum-raise p-6 lg:col-span-7">
          <div className="flex items-center gap-2">
            <Dot tone="info" />
            <h3 className="font-semibold text-bone">
              Missing data goes through one honest branch
            </h3>
          </div>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-ash">
            Every source that is not OK renders through a single data-unavailable path with its
            real status. There is no silent gap, and nothing is quietly invented to fill it.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-2 font-mono text-[11px] sm:grid-cols-3">
            {[
              ["meta ads", "ok"],
              ["tiktok", "ok"],
              ["serp", "empty"],
              ["gmb", "unlisted"],
              ["google", "timeout"],
              ["site", "blocked"],
            ].map(([src, st]) => (
              <li
                key={src}
                className="flex items-center justify-between rounded-lg border border-plum-line bg-plum px-2.5 py-2"
              >
                <span className="text-bone">{src}</span>
                <span className={st === "ok" ? "text-ok" : "text-ash"}>{st}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </SectionShell>
  );
}
