"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildView, type Agg, type ClientData, type DashboardView, type Platform } from "@/lib/demo/clients";

const RANGES = [7, 30, 90] as const;
const G_HEX = "#D98A5B"; // Google (warm)
const M_HEX = "#7FB4E0"; // Meta (blue)
const platformName = (p: Platform) => (p === "google" ? "Google Ads" : "Meta Ads");

export function PortalDashboard({ client, example = false }: { client: ClientData; example?: boolean }) {
  const router = useRouter();
  const [days, setDays] = useState<number>(30);
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const v = useMemo(() => buildView(client, days), [client, days]);

  const money = (n: number, max = 0) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: client.currency, maximumFractionDigits: max }).format(n);
  const compact = (n: number) => new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const x = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}×`);
  const pct = (n: number) => `${(n * 100).toFixed(n * 100 < 10 ? 2 : 1)}%`;

  const roasOf = (a: Agg) => (a.spend > 0 ? a.conversionValue / a.spend : 0);
  const cpaOf = (a: Agg) => (a.conversions > 0 ? a.spend / a.conversions : 0);

  const dateLabel = (offsetDaysBack: number) => {
    if (!today) return "";
    const dt = new Date(today.getTime() - offsetDaysBack * 864e5);
    return dt.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  };
  const rangeStr = `${dateLabel(v.days - 1)} to ${dateLabel(0)}`;

  const cur = v.totalsCur;
  const prior = v.totalsPrior;
  const split = platformSplit(v);
  const funnel = funnelRollup(v);

  const leave = () => {
    if (example) return router.push("/");
    document.cookie = "bokuzu_portal=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      {example && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-lime px-4 py-2 text-center font-mono text-[11px] text-ink">
          <span className="font-semibold uppercase tracking-[0.12em]">Example dashboard</span>
          <span aria-hidden>·</span>
          <span>sample Demo Client data — this is a preview</span>
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
              <PlatformDot platform={c.platform} /> {platformName(c.platform)}: synced {c.syncedAgo}
            </span>
          ))}
        </div>

        {/* ── ZONE 1: AT A GLANCE ── */}
        <ZoneHead title="At a glance" meta={`${rangeStr} vs prior period`} />
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Conversion-tracked accounts</span>
          <div className="flex items-center gap-2">{v.accounts.map((a) => <PlatformChip key={a.platform} platform={a.platform} />)}</div>
        </div>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-4xl font-semibold tracking-tight text-bone">{money(cur.spend)}</span>
          <span className="text-sm text-ash">total spend</span>
          <DeltaBadge diff={cur.spend - prior.spend} kind="money" goodUp={true} money={money} />
        </div>

        <div className="space-y-3">
          {v.accounts.map((a) => (
            <div key={a.platform} className="grid grid-cols-2 items-center gap-4 rounded-2xl border border-plum-line bg-plum-raise p-4 sm:grid-cols-[auto_1fr_1fr_1fr_1fr] sm:p-5">
              <div className="col-span-2 sm:col-span-1"><PlatformChip platform={a.platform} /></div>
              <Cell label="Spend" value={money(a.cur.spend)}>
                <DeltaBadge diff={a.cur.spend - a.prior.spend} kind="money" goodUp={true} money={money} />
              </Cell>
              <Cell label="Conv. value" value={money(a.cur.conversionValue)} />
              <Cell label="ROAS" value={x(roasOf(a.cur))}>
                <DeltaBadge diff={roasOf(a.cur) - roasOf(a.prior)} kind="roasx" goodUp={true} money={money} />
              </Cell>
              <Cell label="CPA" value={money(cpaOf(a.cur), 2)}>
                <DeltaBadge diff={cpaOf(a.cur) - cpaOf(a.prior)} kind="money2" goodUp={false} money={money} />
              </Cell>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-3xl font-mono text-[11px] leading-relaxed text-ash">
          ROAS is per platform, on each platform&apos;s own attribution (Google last-click / DDA, Meta 7-day-click / 1-day-view), not additive. A single cross-platform figure would require an incrementality or MMM model, which this dashboard does not fabricate.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ash">As reported by Google Ads · Meta Marketing API · {rangeStr} · attribution: in-platform (last click)</p>

        {/* ── ZONE 2: PERFORMANCE ── */}
        <ZoneHead title="Performance" meta={`${rangeStr} · daily grain`} className="mt-12" />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-plum-line bg-plum p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-bone">Spend + ROAS trend</h3>
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
                      <span className="font-mono text-[11px] text-ash">{pct(s.shareSpend)} of spend</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniCell label="Spend" value={money(s.spend)} />
                      <MiniCell label="Revenue" value={money(s.revenue)} />
                      <MiniCell label="ROAS" value={x(s.roas)} accent />
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
                        {(f.share * 100).toFixed(1)}%
                      </div>
                    </div>
                    <span className="w-20 text-right font-mono text-[11px] text-bone">{money(f.spend)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ZONE 3: ADS RUNNING ── */}
        <ZoneHead title="Ads running" meta={`${v.adsLive} live · Google synced 8h ago · Meta synced 8h ago`} className="mt-12" />
        <div className="mb-2 flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Product feed</span>
          <span className="font-mono text-sm text-lime">{v.productFeed.ads}</span>
          <span className="text-[12px] text-ash">auto-generated product ads</span>
        </div>
        <div className="grid grid-cols-2 items-center gap-4 rounded-2xl border border-plum-line bg-plum-raise p-4 sm:grid-cols-[auto_1fr_1fr_1fr] sm:p-5">
          <div className="col-span-2 sm:col-span-1"><PlatformChip platform="google" /></div>
          <Cell label="Product ads" value={String(v.productFeed.ads)} />
          <Cell label="Spend" value={money(v.productFeed.spend)} />
          <Cell label="Impressions" value={compact(v.productFeed.impressions)} />
        </div>
        <p className="mt-2 font-mono text-[11px] text-ash">Auto-generated from your product feed, not agency-authored creative.</p>

        <div className="mb-2 mt-8 flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Ad copy</span>
          <span className="font-mono text-sm text-lime">{v.adCopyTotal}</span>
          <span className="text-[12px] text-ash">the words running now, with performance</span>
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
                {v.adCopy.map((r, i) => (
                  <tr key={i} className="border-b border-plum-line/60 last:border-0">
                    <td className="px-5 py-3 text-sm text-bone">{r.headline ?? <span className="text-ash">(no headline)</span>}</td>
                    <td className="max-w-[280px] truncate px-3 py-3 font-mono text-[12px] text-ash">{r.destination}</td>
                    <td className="px-3 py-3"><PlatformChip platform={r.platform} small /></td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-ash">{compact(r.impressions)}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-bone">{pct(r.ctr)}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-bone">{money(r.spend)}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-bone">{x(r.roas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {/* subtle right-edge fade cues horizontal swipe on narrow screens */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-plum to-transparent lg:hidden" aria-hidden />
          </div>
          <p className="border-t border-plum-line/60 px-5 py-3 font-mono text-[11px] text-ash">Showing {v.adCopy.length} of {v.adCopyTotal} live text ads, by spend.</p>
        </section>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-ash">
          Shopping and Performance Max ads carry no editable headline — &ldquo;(no headline)&rdquo; is normal, not missing data.
        </p>

        {/* ── ZONE 4: AGENCY ACTIVITY ── */}
        <ZoneHead title="Agency activity" meta="Optimization events, by platform" className="mt-12" />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <EventFeed platform="google" title="Google Ads" total={v.googleEventTotal} events={v.googleEvents} />
            <EventFeed platform="meta" title="Meta Ads" total={v.metaEventTotal} events={v.metaEvents} />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-plum-line bg-plum-raise p-5 sm:p-6">
              <p className="text-4xl font-semibold tracking-tight text-lime">{v.activityWeek.total}</p>
              <p className="mt-1 text-sm text-bone">Optimizations this week</p>
              <p className="font-mono text-[11px] text-ash">Google {v.activityWeek.google} · Meta {v.activityWeek.meta}</p>
              <div className="mt-4 space-y-1.5">
                {v.activityBreakdown.map((b) => (
                  <div key={b.type} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate text-ash">{b.type}</span>
                    <span className="font-mono text-bone">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-plum-line bg-plum p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Data source note</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ash">{v.dataSourceNote.google}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ash">{v.dataSourceNote.meta}</p>
            </div>
          </aside>
        </section>

        <p className="mt-12 border-t border-plum-line/60 pt-6 font-mono text-[11px] text-ash">
          Bokuzu portal · {client.brand} · Figures shown are sample data for this demo. Once live, numbers update with every Google and Meta platform refresh.
        </p>
      </main>
    </div>
  );
}

// ── parts ────────────────────────────────────────────────────────────────────
function ZoneHead({ title, meta, className = "" }: { title: string; meta: string; className?: string }) {
  return (
    <div className={`mb-4 flex flex-col gap-1 border-b border-plum-line/60 pb-2 sm:flex-row sm:items-baseline sm:justify-between ${className}`}>
      <h2 className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-bone">{title}</h2>
      <span className="font-mono text-[11px] text-ash">{meta}</span>
    </div>
  );
}

function Cell({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-plum-line/70 bg-plum px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ash">{label}</p>
      <p className="mt-1 font-mono text-lg text-bone">{value}</p>
      {children}
    </div>
  );
}

function MiniCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-plum-line/70 bg-plum px-2.5 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ash">{label}</p>
      <p className={`mt-0.5 font-mono text-sm ${accent ? "text-lime" : "text-bone"}`}>{value}</p>
    </div>
  );
}

function PlatformDot({ platform }: { platform: Platform }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: platform === "google" ? G_HEX : M_HEX }} aria-hidden />;
}

function PlatformChip({ platform, small }: { platform: Platform; small?: boolean }) {
  const isG = platform === "google";
  const hex = isG ? G_HEX : M_HEX;
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.08em] ${small ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"}`}
      style={{ color: hex, background: `${hex}1a`, borderColor: `${hex}44` }}
    >
      {isG ? "Google" : "Meta"}
    </span>
  );
}

function DeltaBadge({ diff, kind, goodUp, money }: { diff: number; kind: "money" | "money2" | "roasx"; goodUp: boolean | null; money: (n: number, m?: number) => string }) {
  const up = diff >= 0;
  const tone = goodUp === null ? "text-ash bg-plum-line/40" : up === goodUp ? "text-ok bg-ok/10" : "text-bad bg-bad/10";
  const val = kind === "money" ? money(Math.abs(diff)) : kind === "money2" ? money(Math.abs(diff), 2) : Math.abs(diff).toFixed(2);
  return (
    <span className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] ${tone}`}>
      {up ? "▲" : "▼"} {val} <span className="opacity-70">vs prior</span>
    </span>
  );
}

function EventFeed({ platform, title, total, events }: { platform: Platform; title: string; total: number; events: { label: string; title: string; detail: string; when: string }[] }) {
  return (
    <div className="rounded-2xl border border-plum-line bg-plum-raise p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <PlatformChip platform={platform} />
        <span className="font-mono text-[11px] text-ash">{total} events</span>
      </div>
      <ol className="space-y-4">
        {events.map((e, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: platform === "google" ? G_HEX : M_HEX }} aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-plum-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ash">{e.label}</span>
                <span className="font-mono text-[11px] text-ash">{e.when}</span>
              </div>
              <p className="mt-1 text-sm leading-snug text-bone">{e.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ash">{e.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-plum-line bg-plum px-4 py-2.5 font-mono text-[11px] text-ash transition-colors hover:text-bone" type="button">
        Show all {total} {title} events
        <span aria-hidden>▾</span>
      </button>
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

interface FunnelRow { stage: "TOP" | "MID" | "LOW"; spend: number; share: number }
function funnelRollup(v: DashboardView): FunnelRow[] {
  const rows = v.campaigns.map((c) => {
    const platSpend = v.accounts.find((a) => a.platform === c.platform)?.cur.spend ?? 0;
    return { funnel: c.funnel, spend: platSpend * c.share };
  });
  const total = rows.reduce((s, c) => s + c.spend, 0) || 1;
  return (["TOP", "MID", "LOW"] as const).map((stage) => {
    const spend = rows.filter((c) => c.funnel === stage).reduce((s, c) => s + c.spend, 0);
    return { stage, spend, share: spend / total };
  });
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
