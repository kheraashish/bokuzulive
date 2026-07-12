"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildView, type Agg, type ClientData, type DashboardView, type Platform } from "@/lib/demo/clients";

const RANGES = [7, 30, 90] as const;
const G_HEX = "#D98A5B"; // Google (warm)
const M_HEX = "#7FB4E0"; // Meta (blue)
const platformName = (p: Platform) => (p === "google" ? "Google Ads" : "Meta Ads");

// Cached number formatters — many values animate (odometer), so avoid rebuilding Intl formatters each frame.
const NF_CACHE = new Map<string, Intl.NumberFormat>();
function nf(key: string, opts: Intl.NumberFormatOptions) {
  let f = NF_CACHE.get(key);
  if (!f) { f = new Intl.NumberFormat("en-CA", opts); NF_CACHE.set(key, f); }
  return f;
}

export function PortalDashboard({ client, example = false }: { client: ClientData; example?: boolean }) {
  const router = useRouter();
  const [days, setDays] = useState<number>(30);
  const [adCopyOpen, setAdCopyOpen] = useState(false);
  const [embed, setEmbed] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  useEffect(() => {
    setEmbed(new URLSearchParams(window.location.search).get("embed") === "1");
  }, []);

  // When embedded as a decorative preview (?embed=1), the page auto-tours its OWN tagged sections and
  // runs the odometer animations — so it works even embedded cross-origin (e.g. on lautzu.com); the
  // host needs no script. The tour parks on the 2nd section, dwells, then rises into the first so its
  // totals count up from zero, holds it 4s, then cycles the rest at 2.5s and loops.
  //
  // START TIMING: it must not run while the host still shows something over it (bokuzu's intro video).
  // So it announces "ready" to a controlling host and waits for that host's "start"; if nobody acks
  // (a plain embed), it starts on its own shortly after.
  useEffect(() => {
    if (!embed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Hide the scrollbar AND, in this decorative preview, the dashboard's own top chrome (the sticky
    // header + the example ribbon) — the embedding card already has its own browser bar.
    const style = document.createElement("style");
    style.textContent =
      "::-webkit-scrollbar{width:0;height:0}html{scrollbar-width:none}header,[data-example-ribbon]{display:none!important}";
    document.head.appendChild(style);

    const HOLD = 2500;
    const HOLD_FIRST = 4000;
    const PARK = 2000; // dwell on the 2nd section before rising into the first
    let idx = 0;
    let tourTimer = 0;
    let fallback = 0;
    let started = false;

    const targetY = (el: HTMLElement) => {
      const header = document.querySelector("header");
      const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(max, Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerH - 16));
    };
    const go = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-tour]"));
      if (!els.length) {
        tourTimer = window.setTimeout(go, 800);
        return;
      }
      const i = idx % els.length;
      window.scrollTo({ top: targetY(els[i]), behavior: "smooth" });
      idx = i + 1;
      tourTimer = window.setTimeout(go, i === 0 ? HOLD_FIRST : HOLD);
    };
    const runTour = () => {
      if (started) return;
      started = true;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-tour]"));
      if (els.length >= 2) window.scrollTo({ top: targetY(els[1]), behavior: "auto" });
      idx = 0;
      tourTimer = window.setTimeout(go, PARK);
    };

    const onMsg = (e: MessageEvent) => {
      const d = e.data as { bokuzuTour?: string } | null;
      if (!d || typeof d !== "object") return;
      if (d.bokuzuTour === "ack") window.clearTimeout(fallback); // a host will drive our start
      else if (d.bokuzuTour === "start") runTour();
    };
    window.addEventListener("message", onMsg);
    try {
      window.parent.postMessage({ bokuzuTour: "ready" }, "*");
    } catch {
      /* ignore */
    }
    fallback = window.setTimeout(runTour, 1200); // no controlling host → start ourselves

    return () => {
      window.removeEventListener("message", onMsg);
      window.clearTimeout(fallback);
      window.clearTimeout(tourTimer);
      style.remove();
    };
  }, [embed]);
  const v = useMemo(() => buildView(client, days), [client, days]);

  const money = (n: number, max = 0) =>
    nf(`m${client.currency}${max}`, { style: "currency", currency: client.currency, maximumFractionDigits: max }).format(n);
  const compact = (n: number) => nf("c1", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const x = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}×`);
  const pct = (n: number) => `${(n * 100).toFixed(n * 100 < 10 ? 2 : 1)}%`;
  const int = (n: number) => String(Math.round(n));

  const roasOf = (a: Agg) => (a.spend > 0 ? a.conversionValue / a.spend : 0);
  const cpaOf = (a: Agg) => (a.conversions > 0 ? a.spend / a.conversions : 0);

  const dateLabel = (offsetDaysBack: number) => {
    if (!today) return "";
    const dt = new Date(today.getTime() - offsetDaysBack * 864e5);
    return dt.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  };
  const rangeStr = v.rangeLabel;

  const cur = v.totalsCur;
  const prior = v.totalsPrior;
  // Total revenue = the sum of each platform's reported conversion value. We sum the ROUNDED
  // per-platform figures (every money value is shown to whole dollars) so the displayed total is
  // exactly Google + Meta as shown on the cards, for every date range — no rounding drift.
  const revenueSum = (which: "cur" | "prior") =>
    v.accounts.reduce((s, a) => s + Math.round(a[which].conversionValue), 0);
  const totalRevenue = revenueSum("cur");
  const priorRevenue = revenueSum("prior");
  const split = platformSplit(v);
  const funnel = v.funnel;

  const leave = () => {
    if (example) return router.push("/");
    document.cookie = "bokuzu_portal=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      {example && (
        <div data-example-ribbon className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-lime px-4 py-2 text-center font-mono text-[11px] text-ink">
          <span className="font-semibold uppercase tracking-[0.12em]">Example dashboard</span>
          <span aria-hidden>·</span>
          <span>real performance data, client anonymized — a live preview</span>
          <Link href="/#waitlist" className="font-semibold underline underline-offset-2">Request access</Link>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-plum-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-shell flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              aria-label="Go to Bokuzu home"
              className="flex items-center gap-3 rounded-md transition-opacity duration-200 ease-out hover:opacity-80"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-lime">Bokuzu</span>
            </Link>
            <span className="text-plum-line" aria-hidden>|</span>
            <span className="text-[15px] font-semibold tracking-tight text-bone">{client.brand}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-plum-line bg-plum-raise/60 px-1 py-1">
              {RANGES.map((r) => (
                <button key={r} onClick={() => setDays(r)} className={`rounded-full px-3 py-1 font-mono text-xs transition-colors duration-150 ${days === r ? "bg-lime text-ink" : "text-ash hover:text-bone"}`}>{r}d</button>
              ))}
            </div>
            <button onClick={leave} className="rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone transition-colors duration-150 hover:border-ash hover:bg-plum-raise">{example ? "Back to site" : "Sign out"}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-shell px-5 py-8 sm:px-8">
        <h1 className="sr-only">
          {example
            ? "Bokuzu client dashboard example — Google and Meta ad spend, ROAS and CPA per platform, funnel breakdown, live ads and a full log of agency optimizations, synced with every platform refresh."
            : `${client.brand} — Bokuzu client dashboard: Google and Meta ad spend, ROAS and CPA per platform, synced with every platform refresh.`}
        </h1>

        {/* connections */}
        <div className="mb-9 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ash">Connections</span>
          {client.connections.map((c) => (
            <span key={c.platform} className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/[0.06] px-3 py-1.5 text-xs text-bone">
              <StatusLight tone="ok" /> {platformName(c.platform)}: synced {c.syncedAgo}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 rounded-full border border-bad/30 bg-bad/[0.06] px-3 py-1.5 text-xs text-bone">
            <StatusLight tone="bad" /> TikTok Ads: not connected
          </span>
        </div>

        {/* ── ZONE 1: AT A GLANCE ── */}
        <ZoneHead title="At a glance" meta={`${rangeStr} vs prior period`} tour />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Conversion-tracked accounts</span>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Ad accounts connected:</span>
            {v.accounts.map((a) => <PlatformChip key={a.platform} platform={a.platform} />)}
            <TikTokSlot />
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-12 gap-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <CountUp value={cur.spend} format={money} className="text-5xl font-semibold tracking-tight text-bad" />
            <span className="text-sm text-ash">total spend</span>
            <DeltaBadge diff={cur.spend - prior.spend} kind="money" goodUp={true} money={money} />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <CountUp value={totalRevenue} format={money} className="text-5xl font-semibold tracking-tight text-lime" />
            <span className="text-sm text-ash">total revenue</span>
            <DeltaBadge diff={totalRevenue - priorRevenue} kind="money" goodUp={true} money={money} />
          </div>
        </div>

        <div className="space-y-3">
          {v.accounts.map((a) => (
            <div key={a.platform} className="grid grid-cols-2 items-stretch gap-4 rounded-2xl border border-plum-line bg-plum-raise p-4 sm:grid-cols-[auto_1fr_1fr_1fr_1fr] sm:p-5">
              <div className="col-span-2 flex items-center sm:col-span-1"><PlatformChip platform={a.platform} /></div>
              <Cell label="Spend" value={<CountUp value={a.cur.spend} format={money} />} valueClassName="text-2xl text-bad">
                <DeltaBadge diff={a.cur.spend - a.prior.spend} kind="money" goodUp={true} money={money} />
              </Cell>
              <Cell label="Conv. value" value={<CountUp value={a.cur.conversionValue} format={money} />} valueClassName="text-2xl text-lime" />
              <Cell label="ROAS" value={<CountUp value={roasOf(a.cur)} format={x} />}>
                <DeltaBadge diff={roasOf(a.cur) - roasOf(a.prior)} kind="roasx" goodUp={true} money={money} />
              </Cell>
              <Cell label="CPA" value={<CountUp value={cpaOf(a.cur)} format={(n) => money(n, 2)} />}>
                <DeltaBadge diff={cpaOf(a.cur) - cpaOf(a.prior)} kind="money2" goodUp={false} money={money} />
              </Cell>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-3xl font-mono text-[11px] leading-relaxed text-ash">
          Total revenue is the sum of each platform&apos;s reported conversion value, each on its own attribution (Google last-click / DDA, Meta 7-day-click / 1-day-view). ROAS is shown per platform, not blended — a single cross-platform ROAS would require an incrementality or MMM model, which this dashboard does not fabricate.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ash">As reported by Google Ads · Meta Marketing API · {rangeStr} · attribution: in-platform (last click)</p>

        {/* ── ZONE 2: PERFORMANCE ── */}
        <ZoneHead title="Performance" meta={`${rangeStr} · daily grain`} className="mt-12" tour />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-plum-line bg-plum p-5 sm:p-6">
            <h3 className="text-xl font-semibold text-lime">Spend + ROAS trend</h3>
            <p className="mt-1 text-[12px] text-ash">Daily spend (bars) with ROAS per platform (lines), each on its own attribution.</p>
            <div className="mt-3 flex items-center gap-5 font-mono text-[11px] text-ash">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: G_HEX }} /> Google</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: M_HEX }} /> Meta</span>
              <span className="text-ash/70">bars spend · lines ROAS</span>
            </div>
            <TrendChart daily={v.daily} money={(n) => money(n)} dateLabel={dateLabel} days={v.days} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-plum-line bg-plum-raise p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-bone">Platform split</h3>
              <div className="space-y-5">
                {split.map((s) => (
                  <div key={s.platform}>
                    <div className="mb-2 flex items-center justify-between">
                      <PlatformChip platform={s.platform} />
                      <span className="font-mono text-[11px] text-ash"><CountUp value={s.shareSpend} format={pct} /> of spend</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniCell label="Spend" value={<CountUp value={s.spend} format={money} />} />
                      <MiniCell label="Revenue" value={<CountUp value={s.revenue} format={money} />} />
                      <MiniCell label="ROAS" value={<CountUp value={s.roas ?? 0} format={x} />} accent />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-plum-line bg-plum-raise p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-bone">Funnel breakdown</h3>
              <div className="space-y-3">
                {funnel.map((f) => (
                  <div key={f.stage} className="flex items-center gap-3">
                    <span className="w-9 font-mono text-[11px] text-ash">{f.stage}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded-md bg-plum-line/60">
                      <div className="flex h-full items-center rounded-md px-2 text-[10px] font-medium text-ink" style={{ width: `${Math.max(6, f.share * 100).toFixed(1)}%`, background: f.stage === "LOW" ? "#8FD66A" : f.stage === "MID" ? "#7FB4E0" : G_HEX }}>
                        <CountUp value={f.share} format={(n) => `${(n * 100).toFixed(1)}%`} />
                      </div>
                    </div>
                    <span className="w-20 text-right font-mono text-[11px] text-bone"><CountUp value={f.spend} format={money} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ZONE 3: AGENCY ACTIVITY LOGS (Google · Meta side by side) ── */}
        <ZoneHead title="Agency activity logs" meta="Optimization event log, done by agency" className="mt-12" tour />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EventFeed platform="google" title="Google Ads" total={v.googleEventTotal} events={v.googleEvents} />
          <EventFeed platform="meta" title="Meta Ads" total={v.metaEventTotal} events={v.metaEvents} />
        </section>

        {/* ── ZONE 4: OPTIMIZATIONS SUMMARY ── */}
        <ZoneHead title="Optimizations summary" meta={`${rangeStr} · by change type`} className="mt-12" tour />
        <div className="rounded-2xl border border-plum-line bg-plum-raise p-5 sm:p-6">
          <p className="text-5xl font-semibold tracking-tight text-lime"><CountUp value={v.activityWeek.total} format={int} /></p>
          <p className="mt-1 text-sm text-bone">Optimizations in this range</p>
          <p className="font-mono text-[16.5px] text-ash">Google <CountUp value={v.activityWeek.google} format={int} className="text-lime" /> · Meta <CountUp value={v.activityWeek.meta} format={int} className="text-lime" /></p>
          <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-1 border-t border-plum-line/60 pt-4 sm:grid-cols-2">
            {v.activityBreakdown.map((b) => (
              <div key={b.type} className="group -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[13px] transition-colors hover:bg-lime/[0.06]">
                <span className="truncate text-ash transition-colors group-hover:text-lime">{b.type}</span>
                <span className="font-mono text-bone transition-colors group-hover:text-lime"><CountUp value={b.count} format={int} /></span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ZONE 5: ADS RUNNING ── */}
        <ZoneHead title="Ads running" meta={`${v.adsLive} live · Google synced 2h ago · Meta synced 2h ago`} className="mt-12" />
        <div className="mb-2 flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Product feed</span>
          <CountUp value={v.productFeed.ads} format={int} className="font-mono text-sm text-lime" />
          <span className="text-[12px] text-ash">auto-generated product ads</span>
        </div>
        <div className="grid grid-cols-2 items-center gap-4 rounded-2xl border border-plum-line bg-plum-raise p-4 sm:grid-cols-[auto_1fr_1fr_1fr] sm:p-5">
          <div className="col-span-2 sm:col-span-1"><PlatformChip platform="google" /></div>
          <Cell label="Product ads" value={<CountUp value={v.productFeed.ads} format={int} />} />
          <Cell label="Spend" value={<CountUp value={v.productFeed.spend} format={money} />} />
          <Cell label="Impressions" value={<CountUp value={v.productFeed.impressions} format={compact} />} />
        </div>

        <div data-tour className="mb-2 mt-8 flex scroll-mt-24 items-baseline gap-2">
          <span className="font-mono text-base uppercase tracking-[0.12em] text-lime">Ad copy</span>
          <CountUp value={v.adCopyTotal} format={int} className="font-mono text-xl text-lime" />
          <span className="text-lg text-lime">the words running now, with performance</span>
        </div>
        <section className="overflow-hidden rounded-2xl border border-plum-line bg-plum">
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-plum-line font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                  <th className="px-5 py-3 font-medium">Headline</th>
                  <th className="px-3 py-3 font-medium">Destination</th>
                  <th className="px-3 py-3 font-medium">Platform</th>
                  <th className="px-3 py-3 text-right font-medium">Impr.</th>
                  <th className="px-3 py-3 text-right font-medium">CTR</th>
                  <th className="px-3 py-3 text-right font-medium">Spend</th>
                  <th className="px-5 py-3 text-right font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {(adCopyOpen ? v.adCopy : v.adCopy.slice(0, 12)).map((r, i) => (
                  <tr key={i} className="group border-b border-plum-line/60 transition-colors last:border-0 hover:bg-lime/[0.06]">
                    <td className="px-5 py-3 text-sm text-bone transition-colors group-hover:text-lime">{r.headline ?? <span className="text-ash transition-colors group-hover:text-lime">(no headline)</span>}</td>
                    <td className="max-w-[280px] truncate px-3 py-3 font-mono text-[12px] text-ash transition-colors group-hover:text-lime">{r.destination}</td>
                    <td className="px-3 py-3"><PlatformChip platform={r.platform} small /></td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-ash transition-colors group-hover:text-lime">{compact(r.impressions)}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-bone transition-colors group-hover:text-lime">{pct(r.ctr)}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-bone transition-colors group-hover:text-lime">{money(r.spend)}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-bone transition-colors group-hover:text-lime">{x(r.roas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {/* subtle right-edge fade cues horizontal swipe on narrow screens */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-plum to-transparent lg:hidden" aria-hidden />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-plum-line/60 px-5 py-3">
            <p className="font-mono text-[11px] text-ash">Showing {adCopyOpen ? v.adCopy.length : Math.min(12, v.adCopy.length)} of {v.adCopyTotal} text ads, by spend.</p>
            <button
              type="button"
              onClick={() => setAdCopyOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-plum-line bg-plum-raise px-3.5 py-1.5 font-mono text-[11px] text-ash transition-colors hover:border-lime/50 hover:text-lime"
            >
              {adCopyOpen ? "Show less" : `Show all ${v.adCopyTotal} copy ads, sorted by spend`}
              <span aria-hidden>{adCopyOpen ? "▴" : "▾"}</span>
            </button>
          </div>
        </section>
        {/* ── NOTES & DISCLAIMERS ── */}
        <ZoneHead title="Notes & disclaimers" meta="Methodology and anonymization" className="mt-12" tour />
        <div className="max-w-3xl space-y-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">At a glance</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">
              Total revenue is the sum of each platform&apos;s reported conversion value, each on its own attribution (Google last-click / DDA, Meta 7-day-click / 1-day-view). ROAS is shown per platform, not blended — a single cross-platform ROAS would require an incrementality or MMM model, which this dashboard does not fabricate. As reported by Google Ads · Meta Marketing API · attribution: in-platform (last click).
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">Ads running · product feed</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">Auto-generated from your product feed, not agency-authored creative.</p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">Ads running · ad copy</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">Shopping and Performance Max ads carry no editable headline — &ldquo;(no headline)&rdquo; is normal, not missing data.</p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">Agency activity logs · data source</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">{v.dataSourceNote.google}</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">{v.dataSourceNote.meta}</p>
          </div>
          {example && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">Data — what&apos;s real, what&apos;s anonymized</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">
                <span className="text-bone">Real:</span> every performance figure — total and per-platform spend, conversion value, ROAS, CPA, the funnel split and all vs-prior deltas, for each date range — is exact data from a live Lautzu client account.
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">
                <span className="text-bone">Anonymized:</span> everything that could identify the client is fabricated — the client name (shown as &ldquo;Anonymized Client&rdquo;), all destination URLs and domains, every ad-copy headline, all campaign names, and each change-log entry (its title, the person, and the timestamp). Individual ad and event rows are illustrative; the totals they roll up to are the real ones. Once connected to a real account, all of it — real names included — updates with every Google and Meta platform refresh.
              </p>
            </div>
          )}
        </div>

        <p className="mt-10 border-t border-plum-line/60 pt-6 font-mono text-[11px] text-ash">
          Bokuzu portal · {client.brand} · The numbers update with every Google and Meta platform refresh.
        </p>
      </main>
    </div>
  );
}

// ── parts ────────────────────────────────────────────────────────────────────
// Odometer count-up: animates 0 → `value` when the element scrolls into view, and again whenever
// `value` changes (e.g. a new date range). Each frame runs through `format`, so money, ×, % and
// plain counts all tick up correctly. Resets to 0 when scrolled out of view so it replays on return.
function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / 900);
      setDisplay(value * (1 - Math.pow(1 - p, 3))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, value]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}

function ZoneHead({ title, meta, className = "", tour = false }: { title: string; meta: string; className?: string; tour?: boolean }) {
  return (
    <div data-tour={tour ? "" : undefined} className={`mb-4 flex flex-col gap-1 border-b border-plum-line/60 pb-2 sm:flex-row sm:items-baseline sm:justify-between ${className}`}>
      <h2 className="font-mono text-xl font-semibold uppercase tracking-[0.14em] text-lime">{title}</h2>
      <span className="font-mono text-[11px] text-ash">{meta}</span>
    </div>
  );
}

function Cell({ label, value, children, valueClassName = "text-lg text-bone" }: { label: string; value: ReactNode; children?: ReactNode; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-plum-line/70 bg-plum px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ash">{label}</p>
      <p className={`mt-1 font-mono ${valueClassName}`}>{value}</p>
      {children}
    </div>
  );
}

function MiniCell({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-plum-line/70 bg-plum px-2.5 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ash">{label}</p>
      <p className={`mt-0.5 font-mono text-sm ${accent ? "text-lime" : "text-bone"}`}>{value}</p>
    </div>
  );
}

// Connection status light: green = connected/syncing, red = not connected. The glow sells it as a
// live indicator lamp rather than a flat dot.
function StatusLight({ tone }: { tone: "ok" | "bad" }) {
  const color = tone === "ok" ? "#8FD66A" : "#E07A6B";
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} aria-hidden />;
}

function PlatformChip({ platform, small }: { platform: Platform; small?: boolean }) {
  const connected = platform === "google" ? "Google ad account connected" : "Meta ad account connected";
  return (
    <span className="inline-flex items-center" title={connected}>
      <PlatformLogo
        platform={platform}
        label={connected}
        className={small ? "h-3.5 w-auto" : "h-[18px] w-auto"}
      />
    </span>
  );
}

// Official brand marks, inline so there are no external requests (matches the site's CSP). The
// Google four-colour "G" and the Meta infinity, sized by height with width auto to keep aspect.
function PlatformLogo({ platform, label, className }: { platform: Platform; label: string; className?: string }) {
  if (platform === "google") {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label={label} focusable="false">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={label} focusable="false">
      <path
        fill="#0081FB"
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.518-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687 1.16-1.464 1.878-1.812.343-.164.686-.246 1.023-.246z"
      />
    </svg>
  );
}

// The third ad platform we CAN connect, shown in full TikTok colour with a lime strike to signal
// it's available but not connected in this demo — reinforcing that only the 2 live platforms show
// data. TikTok's cyan/magenta split is rebuilt from one note path (three offset copies).
const TIKTOK_D =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";
function TikTokSlot() {
  return (
    <span
      className="relative inline-flex items-center"
      role="img"
      title="TikTok account not connected yet"
      aria-label="TikTok account not connected yet"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-auto" aria-hidden focusable="false">
        <path fill="#25F4EE" transform="translate(-1.2 0.9)" d={TIKTOK_D} />
        <path fill="#FE2C55" transform="translate(1.2 -0.9)" d={TIKTOK_D} />
        <path fill="#F2EEE6" d={TIKTOK_D} />
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[24px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-lime"
      />
    </span>
  );
}

function DeltaBadge({ diff, kind, goodUp, money }: { diff: number; kind: "money" | "money2" | "roasx"; goodUp: boolean | null; money: (n: number, m?: number) => string }) {
  const up = diff >= 0;
  const tone = goodUp === null ? "text-ash bg-plum-line/40" : up === goodUp ? "text-ok bg-ok/10" : "text-bad bg-bad/10";
  const fmt = kind === "money" ? (n: number) => money(n) : kind === "money2" ? (n: number) => money(n, 2) : (n: number) => n.toFixed(2);
  return (
    <span className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] ${tone}`}>
      {up ? "▲" : "▼"} <CountUp value={Math.abs(diff)} format={fmt} /> <span className="opacity-70">vs prior</span>
    </span>
  );
}

function EventFeed({ platform, title, total, events }: { platform: Platform; title: string; total: number; events: { label: string; title: string; detail: string; when: string }[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? events : events.slice(0, 6);
  return (
    <div className="rounded-2xl border border-plum-line bg-plum-raise p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <PlatformChip platform={platform} />
        <span className="font-mono text-base text-lime"><CountUp value={total} format={(n) => String(Math.round(n))} /> events</span>
      </div>
      <ol className="space-y-4">
        {shown.map((e, i) => (
          <li key={i} className="group -mx-2 flex gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-lime/[0.06]">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: platform === "google" ? G_HEX : M_HEX }} aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-plum-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ash transition-colors group-hover:border-lime/40 group-hover:text-lime">{e.label}</span>
                <span className="font-mono text-[11px] text-ash transition-colors group-hover:text-lime">{e.when}</span>
              </div>
              <p className="mt-1 text-sm leading-snug text-bone transition-colors group-hover:text-lime">{e.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ash transition-colors group-hover:text-lime">{e.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-plum-line bg-plum px-3.5 py-1.5 font-mono text-[11px] text-ash transition-colors hover:border-lime/50 hover:text-lime"
          type="button"
        >
          {open ? "Show less" : `Show all ${total} ${title} events`}
          <span aria-hidden>{open ? "▴" : "▾"}</span>
        </button>
      </div>
    </div>
  );
}

// ── derived rollups ────────────────────────────────────────────────────────
interface SplitRow { platform: Platform; spend: number; revenue: number; roas: number | null; shareSpend: number }
function platformSplit(v: DashboardView): SplitRow[] {
  const totalSpend = v.accounts.reduce((s, a) => s + a.cur.spend, 0) || 1;
  return v.accounts
    .map((a) => ({ platform: a.platform, spend: a.cur.spend, revenue: a.cur.conversionValue, roas: a.cur.spend > 0 ? a.cur.conversionValue / a.cur.spend : null, shareSpend: a.cur.spend / totalSpend }))
    .sort((a, b) => b.spend - a.spend);
}

// Dual-axis chart: stacked daily spend (Google + Meta) as bars, ROAS per platform as lines.
function TrendChart({ daily, money, dateLabel, days }: { daily: DashboardView["daily"]; money: (n: number) => string; dateLabel: (o: number) => string; days: number }) {
  const W = 720, H = 250, padL = 8, padR = 8, padT = 16, padB = 26;
  const innerH = H - padT - padB;
  const innerW = W - padL - padR;
  const n = daily.length || 1;
  const totalSpend = daily.map((d) => d.google.spend + d.meta.spend);
  const maxSpend = Math.max(...totalSpend, 1);
  const roasG = daily.map((d) => (d.google.spend > 0 ? d.google.conversionValue / d.google.spend : 0));
  const roasM = daily.map((d) => (d.meta.spend > 0 ? d.meta.conversionValue / d.meta.spend : 0));
  const maxRoas = Math.max(...roasG, ...roasM, 1) * 1.1;
  const slot = innerW / n;
  const barW = Math.max(1.5, slot * 0.62);
  const yS = (val: number) => padT + innerH - (val / maxSpend) * innerH;
  const yR = (val: number) => padT + innerH - (val / maxRoas) * innerH;
  const cx = (i: number) => padL + i * slot + slot / 2;
  const line = (arr: number[]) => arr.map((val, i) => `${cx(i).toFixed(1)},${yR(val).toFixed(1)}`).join(" ");

  return (
    <div className="mt-4 w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[230px] w-full" preserveAspectRatio="none" role="img" aria-label="Daily spend and ROAS by platform">
        <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke="#373042" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {daily.map((d, i) => {
          const gH = (d.google.spend / maxSpend) * innerH;
          const mH = (d.meta.spend / maxSpend) * innerH;
          const xPos = padL + i * slot + (slot - barW) / 2;
          const gY = padT + innerH - gH;
          const mY = gY - mH;
          return (
            <g key={i}>
              <rect x={xPos} y={gY} width={barW} height={gH} fill={G_HEX} opacity={0.7} />
              <rect x={xPos} y={mY} width={barW} height={mH} fill={M_HEX} opacity={0.7} />
            </g>
          );
        })}
        <polyline points={line(roasG)} fill="none" stroke={G_HEX} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <polyline points={line(roasM)} fill="none" stroke={M_HEX} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-ash">
        <span>{dateLabel(days - 1)}</span>
        <span>peak spend {money(maxSpend)}/day · ROAS to {maxRoas.toFixed(1)}×</span>
        <span>{dateLabel(0)}</span>
      </div>
    </div>
  );
}
