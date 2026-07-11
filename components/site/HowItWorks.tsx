import { SectionShell, Chip } from "./ui";

const steps = [
  {
    n: "01",
    title: "Curate",
    body: "Load 200 to 300 prospects that fit your ICP. No scraping of private data, ever.",
    artifact: "crm_core",
  },
  {
    n: "02",
    title: "Audit on public data",
    body: "Pull each prospect's live public ads and listings. A source that is empty or times out is stored with its status, not filled in.",
    artifact: "crm_audit",
  },
  {
    n: "03",
    title: "Assess against the rubric",
    body: "Six craft dimensions, scored as bands with a confidence tag. Thin signal returns INSUFFICIENT SIGNAL rather than a flattering number.",
    artifact: "crm_assess",
  },
  {
    n: "04",
    title: "Draft sample concepts",
    body: "On-brand sample ads generated from public signal, each labeled a sample concept, never passed off as the prospect's own asset.",
    artifact: "gen · sample",
  },
  {
    n: "05",
    title: "Render the report",
    body: "One branded report, data-bound per prospect. The honesty caption is hard-coded; the rubric sits in the appendix. This is your outreach hook.",
    artifact: "report · pdf",
  },
  {
    n: "06",
    title: "Propose the outreach",
    body: "Contacts pulled from Apollo only after the report exists. Every email and calendar invite is drafted and queued for your approval.",
    artifact: "proposed",
  },
];

export function HowItWorks() {
  return (
    <div id="how" className="border-y border-lime/40 bg-plum/30 py-14 sm:py-16 lg:py-20">
      <SectionShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="kicker">The pipeline</p>
            <h2 className="display-lg mt-4 text-bone">Six steps. Curate to proposed.</h2>
          </div>
          <p className="max-w-sm text-ash">
            The whole path runs on public signal and stops one step short of acting. That last step
            is always yours.
          </p>
        </div>

        <ol className="mt-14 divide-y divide-plum-line/70 border-t border-plum-line/70">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-2 py-7 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-8"
            >
              <span className="font-mono text-sm text-lime">{s.n}</span>
              <div className="max-w-prose">
                <h3 className="text-xl font-semibold text-bone">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ash">{s.body}</p>
              </div>
              <div className="col-start-2 sm:col-start-3 sm:pt-1">
                <Chip tone={i === steps.length - 1 ? "warn" : "ash"}>{s.artifact}</Chip>
              </div>
            </li>
          ))}
        </ol>
      </SectionShell>
    </div>
  );
}
