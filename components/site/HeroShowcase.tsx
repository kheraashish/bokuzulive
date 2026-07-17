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
      className="lz-shine h-full overflow-hidden rounded-2xl border border-plum-line bg-plum shadow-lift"
    >
      <div className="flex items-center justify-between border-b border-plum-line px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
          <Dot tone="ok" /> audit ledger
        </div>
        <span className="font-mono text-[11px] text-ash">prospect · arlo</span>
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

  // The preview tours + animates itself inside the iframe (?embed=1). It waits for our go-ahead so it
  // doesn't run behind the intro video: we ack its "ready", then tell it to start 1s after the intro
  // ends — so the visitor sees the totals count up from zero. (Cross-origin hosts that don't ack, like
  // lautzu, let the iframe start on its own.)
  useEffect(() => {
    let started = false;
    const send = (msg: unknown) => frameRef.current?.contentWindow?.postMessage(msg, "*");
    const begin = () => {
      if (started) return;
      started = true;
      send({ bokuzuTour: "start" });
    };
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      if ((e.data as { bokuzuTour?: string })?.bokuzuTour !== "ready") return;
      send({ bokuzuTour: "ack" });
      const w = window as unknown as { __bokuzuIntroDone?: boolean };
      if (w.__bokuzuIntroDone) begin();
      else window.addEventListener("bokuzu:intro-done", begin, { once: true });
    };
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("bokuzu:intro-done", begin);
    };
  }, []);

  return (
    <div className="lz-shine-ccw flex h-full flex-col overflow-hidden rounded-2xl border border-plum-line bg-ink shadow-lift">
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
          src="/example?embed=1"
          title="Client portal dashboard example: spend, revenue, ROAS and CPA per platform with a log of every account change"
          tabIndex={-1}
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
