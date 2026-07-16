import { SectionShell } from "./ui";

export function Footer() {
  return (
    <footer className="py-14">
      <SectionShell>
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">
                b
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-bone">bokuzu</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ash">
              The honest layer over your ad accounts: a portal that logs every change, and outreach
              that never sends without you.
            </p>
          </div>

          <nav className="flex gap-16">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
                Product
              </span>
              <a href="#portal" className="text-sm text-bone/80 transition-colors hover:text-bone">
                Client portal
              </a>
              <a href="#how" className="text-sm text-bone/80 transition-colors hover:text-bone">
                How it works
              </a>
              <a
                href="#honesty"
                className="text-sm text-bone/80 transition-colors hover:text-bone"
              >
                The honesty rail
              </a>
              <a href="#gate" className="text-sm text-bone/80 transition-colors hover:text-bone">
                Human gate
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
                Access
              </span>
              <a
                href="#waitlist"
                className="text-sm text-bone/80 transition-colors hover:text-bone"
              >
                Request access
              </a>
            </div>
          </nav>
        </div>

        <div className="rule mt-12" />
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-ash">
            Scores are rubric-based craft assessments. Not measured performance metrics.
          </p>
          <p className="font-mono text-[11px] text-ash">
            <a
              href="https://lautzu.com"
              target="_blank"
              rel="noopener"
              className="text-bone transition-colors hover:text-lime"
            >
              our marketing agency Lautzu
            </a>
            <span className="mx-2.5 text-plum-line">·</span>© {new Date().getFullYear()} Bokuzu. Canadian data residency.
          </p>
        </div>
      </SectionShell>
    </footer>
  );
}
