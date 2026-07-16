"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The 404 takeover film. A wrong URL recreates the bokuzu 404 page in-film, dissolves it into matrix
// code, rolls it away and ends black — then the visitor is dropped on the homepage.
//
// This component owns the film and NOTHING else. It reports failure upward exactly once via
// onUnavailable() and, from that moment, never touches navigation again — the parent takes over and
// falls back to the plain countdown page. Only one thing may ever decide where the visitor goes.
const SRC_LANDSCAPE = "/404/404-169.mp4";
const SRC_PORTRAIT = "/404/404-916.mp4";
const POSTER_LANDSCAPE = "/404/404-169.jpg";
const POSTER_PORTRAIT = "/404/404-916.jpg";

const BARS_GO_BLACK_AT_S = 1.2; // the film opens on the page's ink, then the matrix takes it black
const BARS_FADE_MS = 1800;
const BUFFER_TIMEOUT_MS = 8000; // 4.77MB needs a longer ceiling than a lighter film would
const HARD_STOP_MS = 9500; // film is 7.2s; 'ended' can silently never fire on a stall/throttled tab

// The letterbox backdrop cannot be one colour: the film opens on #141118 and is black by ~3s, so a
// static backdrop shows visible bars through one half or the other. These are sampled from the
// film's own edge pixels, and the swap is driven by the film's own clock (see onTimeUpdate).
const BARS_OPEN = "#141118";
const BARS_BLACK = "#030303";

// One-shot handoff to HeroIntro: we leave via a HARD navigation, which re-initialises the intro's
// module-scoped "seen" flag and would otherwise replay the full intro right after the film.
const SKIP_INTRO_ONCE = "bz_skip_intro_once";

export function NotFound404Video({
  onUnavailable,
  onPlaying,
  destination = "/",
}: {
  onUnavailable: () => void;
  /** Fires once the film is actually rolling, so the parent can disarm its "did this die?" net. */
  onPlaying?: () => void;
  destination?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const deadRef = useRef(false); // onUnavailable has fired — hands off navigation forever
  const leftRef = useRef(false); // navigation has fired — exactly once
  const [media, setMedia] = useState<{ src: string; poster: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [bars, setBars] = useState(BARS_OPEN);

  const giveUp = useCallback(() => {
    if (deadRef.current || leftRef.current) return;
    deadRef.current = true;
    onUnavailable();
  }, [onUnavailable]);

  const leave = useCallback(() => {
    if (deadRef.current || leftRef.current) return;
    leftRef.current = true;
    try {
      sessionStorage.setItem(SKIP_INTRO_ONCE, "1");
    } catch {
      /* private mode — worst case the intro plays, which is survivable */
    }
    // Hard navigation, not router.push: client-side hash scrolling on a cross-route push is not
    // reliable enough to bet the landing on.
    window.location.assign(destination);
  }, [destination]);

  // Mount: reduced motion opts out entirely (no video element is ever created). Otherwise pick the
  // cut by orientation, so a portrait phone gets the 9:16 baked layout instead of an unreadable
  // letterboxed 16:9.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      giveUp();
      return;
    }
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    setMedia(
      portrait
        ? { src: SRC_PORTRAIT, poster: POSTER_PORTRAIT }
        : { src: SRC_LANDSCAPE, poster: POSTER_LANDSCAPE }
    );
  }, [giveUp]);

  // Buffer ceiling: a slow line must not strand anyone staring at dots.
  useEffect(() => {
    if (!media || ready) return;
    const t = window.setTimeout(giveUp, BUFFER_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [media, ready, giveUp]);

  // Buffered enough to play through: try sound first, fall back to muted, and only then give up.
  useEffect(() => {
    if (!ready) return;
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;
    (async () => {
      try {
        v.muted = false;
        await v.play();
        if (!cancelled) onPlaying?.();
      } catch {
        // Browsers block autoplay-with-audio on a cold load. This is policy, not a bug to defeat —
        // muted is the path most visitors take, with a pill offering the sound back.
        try {
          v.muted = true;
          await v.play();
          if (cancelled) return;
          setNeedsTap(true);
          onPlaying?.();
        } catch {
          giveUp();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, giveUp, onPlaying]);

  // Backstop for 'ended' never arriving. Armed when playback begins; 9.5s against a 7.2s film.
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(leave, HARD_STOP_MS);
    return () => window.clearTimeout(t);
  }, [ready, leave]);

  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setNeedsTap(false);
  };

  if (!media) return null;

  return (
    // Nothing is shown until the film can play through: until then this sits transparent over the
    // branded 404 page and its blinking dots.
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        ready ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ backgroundColor: bars, transition: `background-color ${BARS_FADE_MS}ms linear` }}
      onClick={unmute}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={media.src}
        poster={media.poster}
        preload="auto"
        playsInline
        onCanPlayThrough={() => setReady(true)}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime >= BARS_GO_BLACK_AT_S) setBars(BARS_BLACK);
        }}
        onEnded={leave}
        onError={giveUp}
      />

      {ready && needsTap && (
        <button
          type="button"
          onClick={unmute}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-plum-line/80 bg-ink/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-bone backdrop-blur-sm transition-colors duration-200 ease-out hover:border-lime hover:text-lime"
        >
          Tap for sound
        </button>
      )}
    </div>
  );
}
