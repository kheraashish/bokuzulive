"use client";

import { useEffect, useRef, useState } from "react";
import { Band, Chip, Dot } from "./ui";

// Hero showcase: shows the audit ledger for 5s (once the intro is done), then flips to a live
// preview of the dashboard example page (/example) and auto-scrolls it top -> bottom -> top, looping.
//
// The preview scrolls the iframe's OWN document (contentWindow.scrollTo), not a CSS transform on the
// iframe element. Transforming an iframe that sits inside a 3D-transformed (flip) container gets
// flattened by the browser and won't repaint; scrolling the inner document always repaints.
export function HeroShowcase() {
  const [flipped, setFlipped] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Start the 5s "ledger then flip" countdown only once the intro is done (hero actually visible).
  useEffect(() => {
    let flipTimer: number;
    const startCountdown = () => {
      flipTimer = window.setTimeout(() => setFlipped(true), 5000);
    };
    if ((window as unknown as { __bokuzuIntroDone?: boolean }).__bokuzuIntroDone) {
      startCountdown();
      return () => window.clearTimeout(flipTimer);
    }
    const onDone = () => startCountdown();
    window.addEventListener("bokuzu:intro-done", onDone, { once: true });
    return () => {
      window.removeEventListener("bokuzu:intro-done", onDone);
      window.clearTimeout(flipTimer);
    };
  }, []);

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

  // After the flip finishes, tour the preview section by section: pause on each dashboard zone,
  // then smooth-scroll to the next, and loop back to the top. Stops come from the page's own zone
  // headings, so it lands on a real section each time instead of racing to the bottom.
  useEffect(() => {
    if (!flipped) return;
    const HOLD = 2600; // pause on each section
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
        timer = window.setTimeout(go, 800); // page not measured yet, retry
        return;
      }
      win.scrollTo({ top: stops[idx], behavior: "smooth" });
      idx = (idx + 1) % stops.length; // loop back to the top after the last section
      timer = window.setTimeout(go, HOLD);
    };

    const startTimer = window.setTimeout(go, 950); // let the 900ms flip finish first
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(timer);
    };
  }, [flipped]);

  return (
    <div>
      <div className="[perspective:1400px]">
        <div
          className={`relative transition-transform duration-[900ms] ease-out [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* FRONT: audit ledger */}
          <div className="overflow-hidden rounded-2xl border border-plum-line bg-plum shadow-lift [backface-visibility:hidden]">
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
              <Band label="scroll-stop craft" band="STRONG" filled={4} confidence="high" />
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

          {/* BACK: live dashboard preview */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
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
                  title="Live dashboard preview"
                  tabIndex={-1}
                  onLoad={onFrameLoad}
                  className="pointer-events-none h-full w-full"
                  style={{ border: 0 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption is tied to the SAME `flipped` state as the card, so the two never desync. */}
      <p className="mt-3 px-1 font-mono text-xs leading-relaxed text-ash" aria-live="polite">
        <span className="uppercase tracking-[0.12em] text-lime">
          {flipped ? "The portal — " : "The engine behind our outreach — "}
        </span>
        {flipped
          ? "spend, revenue, ROAS, and every account change. Logged as it happens, synced with every platform refresh."
          : "prospect audits on public data. Empty sources are stored as data, never guessed."}
      </p>
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
