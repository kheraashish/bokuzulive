import Link from "next/link";
import { SectionShell } from "./ui";

// "What clients see" — the second face of Bokuzu: the live client transparency portal. Left-aligned
// and wide (mirrors the "Why Lautzu runs on Bokuzu" section), prose in real semantic HTML so it
// carries keyword weight, linking out to the live /example.
export function ClientPortal() {
  return (
    <div id="portal" className="py-10 sm:py-12 lg:py-12">
      <SectionShell className="max-w-3xl">
        <p className="kicker">The client portal</p>
        <h2 className="display-lg mt-4 text-bone">
          What you <span className="text-lime">see</span>.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-ash">
          Spend, revenue, ROAS and CPA per platform, each on its own attribution, never blended into
          a number we&apos;d have to invent. Custom date ranges. A funnel breakdown. Every ad currently
          running with its performance. And a timestamped log of every change made in your accounts:
          budget moves, bid changes, new campaigns, pauses, logged the moment they happen. If
          something is touched in your account, you can see it. If a mistake is made, you&apos;ll see
          that too.
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

        <p className="mt-6 font-mono text-xs leading-relaxed text-ash">
          Every change is logged the moment it happens. Every dollar is synced with every platform
          refresh. ROAS per platform on its own attribution: a single cross-platform figure would
          require an incrementality or MMM model, which this dashboard does not fabricate.
        </p>
      </SectionShell>
    </div>
  );
}
