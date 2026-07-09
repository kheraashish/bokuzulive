import type { Config } from "tailwindcss";

// Bokuzu marketing site. Ink Plum base + one Acid Lime accent, carried verbatim from the
// product's locked palette (DESIGN.md). Impeccable hard bans honored: NO #000 / #fff (every
// neutral is tinted to the plum hue), no gradient text, no glassmorphism default.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16121A", // base dark
        plum: {
          DEFAULT: "#211B27", // surface
          raise: "#2A2230", // card surface
          line: "#373042", // hairline border
          press: "#1B1620", // pressed / deep well
        },
        lime: {
          DEFAULT: "#C7F23B", // accent
          press: "#A6CE29", // accent deep
        },
        clay: "#D98A5B", // warm secondary
        bone: "#F2EEE6", // primary text
        ash: "#A39CAA", // muted text
        ok: "#8FD66A",
        warn: "#E8C45A",
        bad: "#E07A6B",
        info: "#7FB4E0",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      maxWidth: {
        prose: "68ch",
        shell: "1200px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(199,242,59,0.04), 0 8px 24px -12px rgba(0,0,0,0.55)",
        lift: "0 16px 48px -20px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(199,242,59,0.35), 0 12px 40px -16px rgba(199,242,59,0.22)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)", // ease-out-expo-ish
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.23,1,0.32,1) both",
        blink: "blink 1.1s steps(1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
