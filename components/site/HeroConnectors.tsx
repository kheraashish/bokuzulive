"use client";

import { useEffect, useState } from "react";

// The two lime connectors under the H1, pointing to the engine + portal cards. They draw from the
// centre outward when the visitor actually enters the site (the intro finishing), so the build is
// seen rather than playing behind the intro overlay. A fallback timer guarantees they appear even if
// no intro event fires, and prefers-reduced-motion collapses the draw to instant via globals.css.
//
// The draw uses the `draw` keyframe (animating stroke-dashoffset) rather than a CSS transition on the
// attribute — Chromium doesn't reliably transition SVG presentation-attribute changes, so a transition
// just snaps. Toggling the animation class when the visitor enters makes the build actually play.
const PATHS = [
  { d: "M576 3 L150 36", kind: "line" as const },
  { d: "M576 3 L1002 36", kind: "line" as const },
  { d: "M143 29 L150 37 L157 29", kind: "cap" as const },
  { d: "M995 29 L1002 37 L1009 29", kind: "cap" as const },
];

export function HeroConnectors() {
  const [go, setGo] = useState(false);

  useEffect(() => {
    const w = window as unknown as { __bokuzuIntroDone?: boolean };
    // If the intro is already gone (e.g. soft navigation back to home), draw shortly after mount.
    if (w.__bokuzuIntroDone) {
      const t = window.setTimeout(() => setGo(true), 250);
      return () => window.clearTimeout(t);
    }
    // Otherwise draw exactly when the intro overlay finishes and the hero becomes visible. No short
    // timer fallback — the intro locks scroll and lasts longer than any fixed delay, so a fallback
    // would draw the arrows behind the loading screen (the bug we're fixing).
    const on = () => setGo(true);
    window.addEventListener("bokuzu:intro-done", on, { once: true });
    return () => window.removeEventListener("bokuzu:intro-done", on);
  }, []);

  return (
    <div className="mt-6 hidden w-full max-w-6xl lg:block" aria-hidden>
      <svg viewBox="0 0 1152 40" className="h-9 w-full" fill="none" preserveAspectRatio="xMidYMid meet">
        {PATHS.map((c, i) => (
          <path
            key={i}
            d={c.d}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            strokeWidth={1.75}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={`text-lime [filter:drop-shadow(0_0_3px_theme(colors.lime.DEFAULT/45%))] ${go ? "animate-draw" : ""}`}
            style={{
              // both lines grow from the centre together; the arrow-heads snap in as the lines land
              animationDuration: c.kind === "line" ? "700ms" : "220ms",
              animationDelay: c.kind === "line" ? "0ms" : "700ms",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
