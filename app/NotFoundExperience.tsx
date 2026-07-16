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
//   'pending' → blinking dots, film is buffering/playing, countdown is NOT mounted
//   'gone'    → no film; the plain countdown page takes it from here
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
        <div className="mt-7 flex items-center justify-center gap-2" role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-lime"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
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
