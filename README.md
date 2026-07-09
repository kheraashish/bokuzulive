# Bokuzu marketing site

Standalone Next.js 14 + TypeScript + Tailwind marketing site for **Bokuzu**, the honest-by-construction
client-acquisition CRM. Self-contained under `site/`; it does not touch the `agency-crm` app at the repo root.

## Brand
Carries the product's locked identity verbatim (see root `DESIGN.md`): Ink Plum base + one Acid Lime
accent + Bone text, dark, Geist / Geist Mono, "senior calm, machine velocity". Impeccable hard bans
honored (no `#000`/`#fff`, no gradient text, no side-stripe borders, no glassmorphism default, no
hero-metric template, no identical card grids, no em dashes).

## Structure
- `app/` — layout (fonts, metadata, viewport) + the single long-scroll landing page.
- `components/site/` — sections: `Nav`, `Hero`, `ConsumesStrip`, `Pov`, `HowItWorks`,
  `HonestyRail`, `HumanGate`, `Waitlist`, `Footer`, plus shared `ui.tsx` primitives (`Band`, `Chip`, `Dot`).
- `tailwind.config.ts` / `app/globals.css` — ported tokens, fluid display scale, motion.

## Dev
```
cd site
npm install
npm run dev        # http://localhost:3002
npm run typecheck  # tsc --noEmit
npm run build      # next build (static export of /)
```

## Before launch (open items)
- Wire the waitlist form (`components/site/Waitlist.tsx`) to a real inbox / route handler. It is
  presentation-only today and does not persist requests.
- Add a real OG/share image and favicon under `public/`.
- Consider bumping `next` off `14.2.15` (flagged security advisory) once the root app does too.
