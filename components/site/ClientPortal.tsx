import Link from "next/link";
import { SectionShell, Dot } from "./ui";

// "What clients see" — the second face of Bokuzu: the live client transparency portal. Prose is
// real semantic HTML (h2/p) so it carries keyword weight; the visual mirrors the dashboard's
// Agency Activity change-log. Everything here is illustrative and links out to the live /example.
const changes = [
  { label: "BUDGET", platform: "google" as const, when: "2h ago", title: "Shifted budget to Prospecting — Search", detail: "+$120/day, pulled from a fatiguing display line" },
  { label: "NEW AD", platform: "meta" as const, when: "5h ago", title: "Launched 3 new concept ads", detail: "original creative, original music — labeled as generated where used" },
  { label: "BID", platform: "google" as const, when: "yesterday", title: "Raised tCPA on Brand — Exact", detail: "headroom at target ROAS" },
  { label: "PAUSE", platform: "meta" as const, when: "yesterday", title: "Paused a fatiguing video ad", detail: "frequency past 3.4, CTR sliding" },
];

export function ClientPortal() {
  return (
    <div id="portal" className="border-t border-lime/40 py-14 sm:py-16 lg:py-20">
      <SectionShell className="grid grid-cols-1 gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* left: the claim */}
        <div className="self-center">
          <p className="kicker">The client portal</p>
          <h2 className="display-lg mt-4 text-bone">What you see.</h2>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ash">
            Spend, revenue, ROAS and CPA per platform — each on its own attribution, never blended
            into a number we&apos;d have to invent. Custom date ranges. A funnel breakdown. Every ad
            currently running with its performance. And a timestamped log of every change made in
            your accounts: budget moves, bid changes, new campaigns, pauses — logged the moment they
            happen. If something is touched in your account, you can see it. If a mistake is made,
            you&apos;ll see that too.
          </p>

          <div className="mt-9">
            <Link
              href="/example"
              className="group inline-flex items-center gap-2.5 rounded-full bg-lime px-6 py-3.5 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98]"
            >
              View the live demo
              <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>

          <p className="mt-6 max-w-prose font-mono text-xs leading-relaxed text-ash">
            Every change is logged the moment it happens. Every dollar is synced with every platform
            refresh. ROAS per platform on its own attribution — a single cross-platform figure would
            require an incrementality or MMM model, which this dashboard does not fabricate.
          </p>
        </div>

        {/* right: the change-log visual (mirrors the dashboard's Agency Activity zone) */}
        <div className="self-center">
          <div className="rounded-2xl border border-plum-line bg-plum shadow-lift">
            <div className="flex items-center justify-between border-b border-plum-line px-5 py-3.5">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
                <Dot tone="lime" /> agency activity
              </span>
              <span className="font-mono text-xs text-ash">127 this week · G 74 · M 53</span>
            </div>
            <ol className="divide-y divide-plum-line/60">
              {changes.map((c) => (
                <li key={c.title} className="flex gap-3 px-5 py-4">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.platform === "google" ? "bg-clay" : "bg-info"}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm border border-plum-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ash">{c.label}</span>
                      <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${c.platform === "google" ? "text-clay" : "text-info"}`}>{c.platform === "google" ? "Google" : "Meta"}</span>
                      <span className="font-mono text-[11px] text-ash">{c.when}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-bone">{c.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ash">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-3 px-1 font-mono text-[11px] text-ash">
            Illustrative log. See the live demo for the full record.
          </p>
        </div>
      </SectionShell>
    </div>
  );
}
