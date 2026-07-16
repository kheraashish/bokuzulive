"use client";

import { useEffect, useState } from "react";

// Counts down and then sends the visitor to the homepage. Used by the not-found page so a wrong
// URL doesn't dead-end: it gently returns them to bokuzu.com.
//
// This is the fallback path, shown only once the takeover film has reported itself unavailable.
// It must never be mounted alongside a live film — the countdown would win the race and cut it off.
export function RedirectHome({ seconds = 2, destination = "/" }: { seconds?: number; destination?: string }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const tick = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    const go = setTimeout(() => {
      window.location.href = destination;
    }, seconds * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [seconds, destination]);

  return (
    <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-ash" aria-live="polite">
      redirecting to bokuzu.com in {left}s
    </p>
  );
}
