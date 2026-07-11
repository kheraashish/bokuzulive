"use client";

import { useEffect, useRef } from "react";
import { Band, Chip, Dot } from "./ui";

// The two hero card visuals, always visible side by side (no flip). EngineCard is the internal
// audit/analysis ledger; PortalCard is a live, auto-scrolling preview of the /example dashboard.
// Both are decorative previews (pointer-events off, not focusable) with descriptive aria-labels.

// ── LEFT: the internal engine ─────────────────────────────────────────────────
export function EngineCard() {
  return (
    <div
      role="img"
      aria-label="Internal analysis engine example: audit ledger with source coverage, a rubric-based craft band, a withheld low-signal assessment, and a drafted intro email awaiting approval"
      className="h-full overflow-hidden rounded-2xl border border-plum-line bg-plum shadow-lift"
    >
      <div className="flex items-center justify-between border-b border-plum-line px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
          <Dot tone="ok" /> audit ledger
        </div>
        <span className="font-mono text-[11px] text-ash">prospect · endy</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <SourceRow source="meta ads" status="ok" note="20 public ads" />
          <SourceRow source="tiktok" status="ok" note="20 public ads" />
          <SourceRow source="serp" status="empty" note="no result" />
          <SourceRow source="gmb" status="empty" note="unlisted" />
        </div>
        <div className="animate-bandpulse rounded-xl [animation-delay:1100ms]">
          <Band label="scroll-stop craft" band="STRONG" filled={4} confidence="high" />
        </div>
        <div className="rounded-xl border border-dashed border-plum-line bg-plum-press/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">copy discipline</span>
            <span className="font-mono text-[11px] text-warn">insufficient signal</span>
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-ash">Withheld. Not enough on-brand samples to assess.</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-plum-line bg-plum-raise px-4 py-3">
          <div>
            <p className="text-sm font-medium text-bone">Intro email drafted</p>
            <p className="font-mono text-[11px] text-ash">1 sample concept attached</p>
          </div>
          <Chip tone="warn">proposed · awaiting you</Chip>
        </div>
      </div>
    </div>
  );
}

// ── RIGHT: the client portal ──────────────────────────────────────────────────
export function PortalCard() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Hide the preview's scrollbar for a clean look (same-origin, so we can inject a style).
  const onFrameLoad = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    try {
      const style = doc.createElement("style");
      style.textContent = "::-webkit-scrollbar{width:0;height:0}html{scrollbar-width:none}";
      doc.head.appendChild(style);
    } catch {
      /* cross-origin / blocked */
    }
  };

  // Gently tour the preview section by section and loop. Stops come from the page's own zone
  // headings, so it lands on a real section each time instead of racing to the bottom.
  useEffect(() => {
    const HOLD = 2600;
    let stops: number[] = [];
    let idx = 0;
    let timer: number;

    const computeStops = (): number[] => {
      const win = frameRef.current?.contentWindow;
      const doc = frameRef.current?.contentDocument;
      if (!win || !doc) return [];
      const max = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
      const heads = Array.from(doc.querySelectorAll("h2")) as HTMLElement[];
      const ys = heads.map((h) => Math.min(max, Math.max(0, h.getBoundingClientRect().top + win.scrollY - 16)));
      return [0, ...ys, max].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    };

    const go = () => {
      const win = frameRef.current?.contentWindow;
      if (!win) {
        timer = window.setTimeout(go, 500);
        return;
      }
      if (!stops.length) stops = computeStops();
      if (stops.length < 2) {
        timer = window.setTimeout(go, 800);
        return;
      }
      win.scrollTo({ top: stops[idx], behavior: "smooth" });
      idx = (idx + 1) % stops.length;
      timer = window.setTimeout(go, HOLD);
    };

    const startTimer = window.setTimeout(go, 1200);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-plum-line bg-ink shadow-lift">
      <div className="flex items-center gap-2 border-b border-plum-line px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-plum-line" />
          <span className="h-2 w-2 rounded-full bg-plum-line" />
          <span className="h-2 w-2 rounded-full bg-lime/70" />
        </span>
        <span className="font-mono text-[10px] text-ash">bokuzu.com/demo</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <iframe
          ref={frameRef}
          src="/example"
          title="Client portal dashboard example: spend, revenue, ROAS and CPA per platform with a log of every account change"
          tabIndex={-1}
          onLoad={onFrameLoad}
          className="pointer-events-none h-full w-full"
          style={{ border: 0 }}
        />
      </div>
    </div>
  );
}

function SourceRow({ source, status, note }: { source: string; status: "ok" | "empty"; note: string }) {
  const ok = status === "ok";
  return (
    <div className="flex items-center justify-between rounded-lg border border-plum-line bg-plum-raise/60 px-2.5 py-2">
      <span className="flex items-center gap-1.5 text-bone">
        <Dot tone={ok ? "ok" : "ash"} />
        {source}
      </span>
      <span className={ok ? "text-ok" : "text-ash"}>{note}</span>
    </div>
  );
}
