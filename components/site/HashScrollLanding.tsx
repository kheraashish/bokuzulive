"use client";

import { useEffect } from "react";

// Landing on /#wrong-letter drifts. The browser jumps to the anchor the moment the element exists,
// but the hero above is still settling, so the page grows underneath and the visitor comes to rest a
// few hundred px short. Nothing is broken: the scroll was correct for a page height that no longer
// exists by the time it finished.
//
// So re-assert the landing for a couple of seconds, and get out of the way the instant the visitor
// touches the scroll themselves — a fixer that fights the reader is worse than the drift.
const RE_ASSERT_EVERY_MS = 200;
const GIVE_UP_AFTER_MS = 2600;
const TOLERANCE_PX = 2;

export function HashScrollLanding() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length < 2) return;

    let el: HTMLElement | null = null;
    try {
      el = document.querySelector<HTMLElement>(hash);
    } catch {
      return; // not a usable selector
    }
    if (!el) return;
    const target = el;

    let timer = 0;
    const cleanup = () => {
      window.clearInterval(timer);
      window.removeEventListener("wheel", cleanup);
      window.removeEventListener("touchstart", cleanup);
      window.removeEventListener("keydown", cleanup);
    };

    window.addEventListener("wheel", cleanup, { passive: true });
    window.addEventListener("touchstart", cleanup, { passive: true });
    window.addEventListener("keydown", cleanup);

    const started = Date.now();
    timer = window.setInterval(() => {
      if (Date.now() - started > GIVE_UP_AFTER_MS) {
        cleanup();
        return;
      }
      // Rest position is the element's own scroll-margin-top, not zero — that is where the anchor is
      // meant to come to rest under the sticky nav.
      const rest = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      if (Math.abs(target.getBoundingClientRect().top - rest) > TOLERANCE_PX) {
        // Instant, not smooth: these are corrective snaps holding the anchor in place while the page
        // settles. Animating each one would visibly creep (and html has scroll-behavior: smooth).
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
    }, RE_ASSERT_EVERY_MS);

    return cleanup;
  }, []);

  return null;
}
