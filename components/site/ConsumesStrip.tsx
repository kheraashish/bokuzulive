import { SectionShell } from "./ui";

const sources = ["Meta Ad Library", "TikTok", "Google Transparency", "SERP", "GMB", "Apollo"];

export function ConsumesStrip() {
  return (
    <div className="border-y border-lime/40 bg-plum/40 py-5">
      <SectionShell className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-lime">
          Reads only public data, from
        </p>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {sources.map((s) => (
            <li key={s} className="font-mono text-sm text-bone/80">
              {s}
            </li>
          ))}
        </ul>
      </SectionShell>
    </div>
  );
}
