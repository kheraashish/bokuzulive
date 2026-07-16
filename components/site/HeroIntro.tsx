"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Intro sequence:
//   1. The video preloads hidden while "Loading Bokuzu Portal" pulses (looping).
//   2. Once the video is buffered enough to play through, "Click here to enter" is revealed. This
//      is what prevents the video from stalling mid-play on a live server.
//   3. Clicking it plays the intro WITH sound (the click is the user gesture browsers require for
//      unmuted playback), at 1.25x, then the video fades out to reveal the hero.
// No skip control; the click-to-enter is the only interaction and it guarantees audio every time.
const PLAYBACK_RATE = 1.25; // play the intro at 125% speed; pitch preserved by the browser

const DESKTOP = { src: "/herointro.mp4", poster: "/herointro-poster.jpg" };
const MOBILE = { src: "/bokuzuheromobile.mp4", poster: "/bokuzuheromobile-poster.jpg" };

// In-memory, module-scoped flag. It survives client-side navigation (e.g. going to /login and
// back), so the intro does NOT replay on soft navigation, but it resets on a real hard refresh
// (the JS module re-initializes), so the intro plays again then. Exactly the desired behavior.
let introSeen = false;

// One-shot skip, set by the 404 takeover film just before it hard-navigates here. That hard
// navigation re-initializes `introSeen` above, so without this the visitor would get 7.2s of film
// followed immediately by the whole intro. Consumed (deleted) on sight: this must never become a
// permanent skip, because refresh-replays-the-intro is deliberate behavior.
const SKIP_INTRO_ONCE = "bz_skip_intro_once";

function consumeSkipOnce(): boolean {
  try {
    if (sessionStorage.getItem(SKIP_INTRO_ONCE) !== "1") return false;
    sessionStorage.removeItem(SKIP_INTRO_ONCE);
    return true;
  } catch {
    return false; // private mode
  }
}

export function HeroIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Pick the portrait mobile cut on small screens, the landscape cut otherwise. Resolved on mount
  // so we never preload the wrong (large) file; playback only starts after the click, so there is
  // plenty of time for the correct source to load.
  const [media, setMedia] = useState(DESKTOP);
  const [srcReady, setSrcReady] = useState(false);
  useEffect(() => {
    setMedia(window.matchMedia("(max-width: 767px)").matches ? MOBILE : DESKTOP);
    setSrcReady(true);
  }, []);
  const [phase, setPhase] = useState<"loading" | "ready" | "playing" | "fading" | "gone">(() =>
    introSeen ? "gone" : "loading"
  );

  // Arriving straight off the 404 film: skip the intro this once. Checked on mount rather than in
  // the initializer above so the server and the first client render still agree.
  useEffect(() => {
    if (consumeSkipOnce()) {
      introSeen = true;
      setPhase("gone");
    }
  }, []);

  // Idle-cursor: hidden while the video plays, reappears on mouse move, hides again after a pause.
  const [cursorHidden, setCursorHidden] = useState(false);

  // Buffering gate: the video preloads hidden while the loader pulses. We only reveal the
  // "click to enter" button once the browser reports it can play through without stalling, so the
  // video never gets stuck mid-play on a live server. A minimum on-screen time avoids a flash on
  // fast/cached loads, and a hard cap reveals the button anyway so a slow line never traps anyone.
  const [videoReady, setVideoReady] = useState(false);
  const [minShown, setMinShown] = useState(false);

  const finish = useCallback(() => {
    introSeen = true;
    setPhase((p) => (p === "gone" ? p : "fading"));
  }, []);

  const showButton = useCallback(() => {
    setPhase((p) => (p === "loading" ? "ready" : p));
  }, []);

  // Signal the rest of the hero (e.g. HeroShowcase's flip timer) once the intro is gone, so those
  // animations only begin when the hero is actually visible. Sets a window flag too, to cover the
  // case where the intro was skipped (already-seen) before a listener could attach.
  useEffect(() => {
    if (phase !== "gone") return;
    (window as unknown as { __bokuzuIntroDone?: boolean }).__bokuzuIntroDone = true;
    window.dispatchEvent(new Event("bokuzu:intro-done"));
  }, [phase]);

  // Lock page scroll while the intro is on screen.
  useEffect(() => {
    if (phase === "gone") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  // Minimum loader display so it does not flash by on a fast connection.
  useEffect(() => {
    const t = window.setTimeout(() => setMinShown(true), 1600);
    return () => window.clearTimeout(t);
  }, []);

  // Reveal the button once the video is buffered enough AND the loader has shown briefly.
  useEffect(() => {
    if (phase === "loading" && videoReady && minShown) showButton();
  }, [phase, videoReady, minShown, showButton]);

  // Hard cap: never leave a visitor on the loader forever if buffering never signals ready.
  useEffect(() => {
    if (phase !== "loading") return;
    const t = window.setTimeout(showButton, 20000);
    return () => window.clearTimeout(t);
  }, [phase, showButton]);

  // While playing: hide the cursor immediately, reveal it on movement, hide again after 2s idle.
  useEffect(() => {
    if (phase !== "playing") {
      setCursorHidden(false);
      return;
    }
    setCursorHidden(true);
    let idle: number;
    const onMove = () => {
      setCursorHidden(false);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setCursorHidden(true), 2000);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.clearTimeout(idle);
    };
  }, [phase]);

  // Safety net once the video is playing, in case `ended` never fires.
  useEffect(() => {
    if (phase !== "playing") return;
    const cap = window.setTimeout(finish, 40000);
    return () => window.clearTimeout(cap);
  }, [phase, finish]);

  // Called directly from the button click, so the browser grants unmuted playback.
  const enter = () => {
    const v = videoRef.current;
    introSeen = true;
    setPhase("playing");
    if (!v) return;
    v.muted = false;
    v.playbackRate = PLAYBACK_RATE;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => finish());
    });
  };

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-ink transition-opacity duration-700 ease-out ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ cursor: cursorHidden ? "none" : "auto" }}
      onTransitionEnd={() => phase === "fading" && setPhase("gone")}
      aria-hidden={phase === "fading"}
    >
      <video
        ref={videoRef}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          phase === "playing" || phase === "fading" ? "opacity-100" : "opacity-0"
        }`}
        src={srcReady ? media.src : undefined}
        poster={media.poster}
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = PLAYBACK_RATE;
        }}
        onCanPlayThrough={() => setVideoReady(true)}
        onProgress={(e) => {
          // Treat "fully buffered to the end" as ready too, in case canplaythrough is slow to fire.
          const v = e.currentTarget;
          const buffered = v.buffered;
          if (v.duration && buffered.length && buffered.end(buffered.length - 1) >= v.duration - 0.5) {
            setVideoReady(true);
          }
        }}
        onEnded={finish}
        onError={finish}
      />

      {phase === "loading" && (
        <div
          className="absolute inset-0 grid place-items-center px-6"
          role="status"
          aria-label="Loading Bokuzu Portal"
        >
          <p
            className="intro-loader text-balance text-center font-mono font-medium tracking-wide text-lime"
            style={{ animation: "introPulse 2.4s ease-in-out infinite" }}
          >
            Loading Bokuzu Portal
          </p>
        </div>
      )}

      {phase === "ready" && (
        // The whole screen is the enter trigger — tap/click anywhere (desktop or mobile). No box;
        // just the shining label as a cue. The click is the user gesture browsers need for audio.
        <button
          type="button"
          onClick={enter}
          autoFocus
          aria-label="Click to Enter"
          className="absolute inset-0 grid cursor-pointer place-items-center px-6 focus:outline-none focus-visible:outline-none"
        >
          {/* Lautzu-style entrance: the outlined lime pill bursts outward past the edges while
              the label grows into place, then the shine sweeps across it forever. */}
          <span className="intro-enter">
            <span className="intro-pillbox">
              <span aria-hidden className="intro-burst" />
              <span className="intro-grow">
                <span className="intro-shine font-mono text-2xl font-semibold uppercase tracking-[0.25em] sm:text-3xl">
                  Click to Enter
                </span>
              </span>
            </span>
          </span>
        </button>
      )}

      {phase === "playing" && (
        <button
          type="button"
          onClick={finish}
          style={{ cursor: "pointer" }}
          className="absolute bottom-6 right-6 z-10 rounded-full border border-plum-line/80 bg-ink/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-bone backdrop-blur-sm transition-colors duration-200 ease-out hover:border-lime hover:text-lime"
        >
          Skip
        </button>
      )}
    </div>
  );
}
