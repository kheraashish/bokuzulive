import { SectionShell, Chip, Dot } from "./ui";

const queue = [
  {
    title: "Intro email to Priya Nair",
    meta: "sample concept attached · CASL footer present",
    tone: "warn" as const,
    state: "awaiting you",
  },
  {
    title: "Calendar invite, 20 min intro",
    meta: "Tue 10:40 · your Google Workspace",
    tone: "warn" as const,
    state: "awaiting you",
  },
  {
    title: "Follow-up to Devon Cole",
    meta: "approved by you 2h ago",
    tone: "ok" as const,
    state: "sent",
  },
];

export function HumanGate() {
  return (
    <div id="gate" className="border-t border-plum-line/70 bg-plum/30 py-14 sm:py-20 lg:py-32">
      <SectionShell className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="self-center">
          <p className="kicker">Human in the loop</p>
          <h2 className="display-lg mt-4 text-bone">
            The worker proposes. You approve. It never acts alone.
          </h2>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ash">
            Reads, drafts, staging, assessment, and generation all run freely. The moment an action
            leaves your world, an email sent, an invite booked, it stops and waits for you. Approval
            is a line item you clear, not a modal that ambushes you.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 max-w-md">
            <Fact k="Runs free" v="reads, drafts, scoring, concepts" />
            <Fact k="Gated" v="every outward send and invite" />
            <Fact k="Credentials" v="your own keys, from Secret Manager" />
            <Fact k="Compliance" v="CASL and CAN-SPAM footers checked" />
          </dl>
        </div>

        <div className="self-center">
          <div className="rounded-2xl border border-plum-line bg-plum shadow-lift">
            <div className="flex items-center justify-between border-b border-plum-line px-5 py-3.5">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
                <Dot tone="warn" /> approvals
              </span>
              <span className="font-mono text-[11px] text-ash">2 awaiting</span>
            </div>
            <ul className="divide-y divide-plum-line">
              {queue.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-bone">{item.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-ash">{item.meta}</p>
                  </div>
                  {item.state === "sent" ? (
                    <Chip tone="ok">sent</Chip>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-plum-line px-3 py-1.5 text-xs text-ash">
                        Hold
                      </span>
                      <span className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-ink">
                        Approve
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 px-1 font-mono text-[11px] text-ash">
            Illustrative queue. Actions never fire on their own.
          </p>
        </div>
      </SectionShell>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">{k}</dt>
      <dd className="mt-1 text-sm text-bone/90">{v}</dd>
    </div>
  );
}
