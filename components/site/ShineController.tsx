'use client';
import { useEffect } from 'react';
export default function ShineController() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shineIo: IntersectionObserver | null = null; const shineSeen = new WeakSet<Element>();
    if (!reduce) {
      shineIo = new IntersectionObserver((es) => {
        for (const e of es) e.target.classList.toggle('lz-shine-off', !e.isIntersecting);
      }, { rootMargin: '120px' });
    }
    const scanShine = () => { if (!shineIo) return;
      document.querySelectorAll('.lz-shine, .lz-shine-ccw').forEach((el) => {
        if (shineSeen.has(el)) return; shineSeen.add(el);
        el.classList.add('lz-shine-off'); shineIo!.observe(el);
      }); };
    const EYEBROW = '[class~="sm:group-hover/sec:scale-150"]';
    const ebIo = new IntersectionObserver((es) => {
      for (const e of es) { const eb = e.target.querySelector(EYEBROW);
        if (eb) eb.classList.toggle('lz-eyebrow-active', e.isIntersecting); }
    }, { rootMargin: '-35% 0px -35% 0px' });
    const ebSeen = new WeakSet<Element>();
    const scanEb = () => { document.querySelectorAll(EYEBROW).forEach((eb) => {
      const sec = eb.closest('section'); if (!sec || ebSeen.has(sec)) return;
      ebSeen.add(sec); ebIo.observe(sec); }); };
    scanShine(); scanEb();
    const mo = new MutationObserver(() => { scanShine(); scanEb(); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { shineIo && shineIo.disconnect(); ebIo.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
