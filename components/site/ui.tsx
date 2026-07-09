import type { ReactNode } from "react";

// Shared surface primitives for the marketing site. These deliberately mirror the product's
// own honesty vocabulary (bands, status chips, the withheld state) so the site shows the real
// thing rather than describing it. No side-stripe borders, no glassmorphism, tinted neutrals only.

type Tone = "lime" | "clay" | "ash" | "ok" | "warn" | "info";

const toneRing: Record<Tone, string> = {
  lime: "border-lime/40 text-lime",
  clay: "border-clay/40 text-clay",
  ash: "border-plum-line text-ash",
  ok: "border-ok/40 text-ok",
  warn: "border-warn/40 text-warn",
  info: "border-info/40 text-info",
};

export function Chip({
  children,
  tone = "ash",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${toneRing[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "lime" }: { tone?: Tone }) {
  const bg: Record<Tone, string> = {
    lime: "bg-lime",
    clay: "bg-clay",
    ash: "bg-ash",
    ok: "bg-ok",
    warn: "bg-warn",
    info: "bg-info",
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${bg[tone]}`} aria-hidden />;
}

// A hook-assessment band. Rubric-grounded craft score rendered as a filled scale, never a bare
// number, and it always carries the caption. This is the product's load-bearing honesty element.
export function Band({
  label,
  band,
  filled,
  confidence,
}: {
  label: string;
  band: string;
  filled: number; // 0..5 segments lit
  confidence: string;
}) {
  return (
    <div className="rounded-xl border border-plum-line bg-plum-raise/70 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
        <span className="font-mono text-xs text-bone">{band}</span>
      </div>
      <div className="mt-3 flex gap-1.5" role="img" aria-label={`${band}, ${filled} of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${i < filled ? "bg-lime" : "bg-plum-line"}`}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ash">
        Hook assessment, rubric-based craft score. Not a measured performance metric.{" "}
        <span className="text-bone/80">confidence: {confidence}</span>
      </p>
    </div>
  );
}

export function SectionShell({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-shell px-5 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}
