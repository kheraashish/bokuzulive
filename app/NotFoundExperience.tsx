"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NotFound404Video } from "@/components/site/NotFound404Video";
import { returnDestination } from "@/lib/notFoundReturn";
import { RedirectHome } from "./RedirectHome";

// Owns the single decision about where a wrong-URL visitor goes, so that two things can never race
// to navigate. Either the film plays and the film navigates, or the film reports itself unavailable
// and only THEN is the countdown allowed to start and take over. The countdown is 2s and the film is
// 7.2s: start them together and the countdown wins every time, yanking the visitor out mid-matrix.
//
//   'pending' → the film's frame-0 poster covers the static 404 while the film buffers/plays
//   'gone'    → no film, no cover; the plain countdown page takes it from here
const SAFETY_MS = 10000; // if the film component dies during hydration, nobody gets stranded

export function NotFoundExperience() {
  const [film, setFilm] = useState<"pending" | "gone">("pending");
  const settled = useRef(false); // 'gone' is final; the film may report only once
  const alive = useRef(false); // the film is actually rolling — disarm the safety net

  // Resolved once, here, so the film and the countdown fallback can never disagree about where the
  // visitor belongs. Not rendered as text, so there is nothing for hydration to mismatch on.
  const [destination] = useState(() =>
    typeof window === "undefined" ? "/" : returnDestination(window.location.pathname)
  );

  const giveUp = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    setFilm("gone");
  }, []);

  // The film reports failure itself (buffer ceiling, error, blocked playback, reduced motion). This
  // net only covers the case where it never got far enough to report anything at all.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!alive.current) giveUp();
    }, SAFETY_MS);
    return () => window.clearTimeout(t);
  }, [giveUp]);

  return (
    <>
      {film === "pending" ? (
        // The film's own frame 0, painted as an opaque cover over the static 404 from the very first
        // paint (this client component is server-rendered, so the img is in the initial HTML — never
        // mounted later by JS, which would flash the markup first). The buffering view IS the film's
        // opening image, so when the video snaps in on top there is no seam. bg is the film's own
        // frame-0 edge colour so the letterbox bars match the poster exactly. Off for reduced-motion
        // (plain countdown, no film) and gone once the film gives up. No dots: the poster already
        // reads as the 404, so they would be redundant and clash with it.
        <div aria-hidden className="fixed inset-0 z-[60] bg-[#141118] motion-reduce:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/404/404-169.jpg" alt="" className="hidden h-full w-full object-contain landscape:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/404/404-916.jpg" alt="" className="hidden h-full w-full object-contain portrait:block" />
        </div>
      ) : (
        <RedirectHome seconds={2} destination={destination} />
      )}

      {film === "pending" && (
        <NotFound404Video
          onUnavailable={giveUp}
          onPlaying={() => {
            alive.current = true;
          }}
          destination={destination}
        />
      )}
    </>
  );
}
