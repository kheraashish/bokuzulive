import { SectionShell } from "./ui";

// The agency-connection + SEO content section. Deliberately real prose in semantic HTML (h2/h3/p)
// so it carries keyword weight for "Lautzu", "performance marketing agency", and the Bokuzu↔Lautzu
// association. Freshness language is the approved "the moment Google and Meta refresh" phrasing.
export function WhyLautzu() {
  return (
    <div id="why-lautzu" className="bg-plum/30 py-10 sm:py-12 lg:py-12">
      <SectionShell className="max-w-3xl">
        <p className="kicker">Built for our own agency first</p>
        <h2 className="display-lg mt-4 text-lime">Why Lautzu runs on Bokuzu.</h2>

        <p className="mt-7 text-lg leading-relaxed text-ash">
          Bokuzu was built inside Lautzu, our performance marketing agency, to kill the manual labor
          that eats an agency&apos;s week: pulling reports, cross-checking platforms, hunting for
          what changed and why. The same dashboard our clients get is the one we work from.
        </p>

        <h3 className="display-md mt-12 text-bone">Bokuzu does the digging.</h3>
        <p className="mt-5 text-lg leading-relaxed text-ash">
          The moment Google Ads and Meta refresh their reporting, the analysis is already done:
          every budget, bid, keyword and creative change tracked, reconciled, and turned into a clear
          read on what to act on next: which campaign needs budget, which creative is fatiguing,
          which change moved the number. The team reviews and decides; Bokuzu never acts alone.
        </p>

        <h3 className="display-md mt-12 text-bone">The people make the ads.</h3>
        <p className="mt-5 text-lg leading-relaxed text-ash">
          That frees the Lautzu team for the work that actually sells: the ads themselves. In the age
          of social, reels and short video, people judge a product by its ad. So ours are original
          concepts with original music, built to entertain and convert, not another product shot with
          a promise on top. The machine handles the monitoring. The people make the ads. That&apos;s
          what compounds for a brand in the long run.
        </p>

        <p className="mt-8 text-lg leading-relaxed text-bone/90">
          Every Lautzu engagement includes Bokuzu: the same portal, the same change log, the same
          honesty rail.
        </p>

        <p className="mt-5 text-lg leading-relaxed text-ash">
          Inside and out, the same rule: the machine proposes, a human decides.
        </p>

        <p className="mt-8">
          <a
            href="https://lautzu.com"
            target="_blank"
            rel="noopener"
            className="group inline-flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-lime transition-colors hover:text-bone"
          >
            See the agency
            <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">&rarr;</span>
            <span className="text-ash group-hover:text-bone">lautzu.com</span>
          </a>
        </p>
      </SectionShell>
    </div>
  );
}
