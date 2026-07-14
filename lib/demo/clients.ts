// Bokuzu client-portal example data.
//
// THE PERFORMANCE NUMBERS ARE REAL — exact spend, conversion value, ROAS, CPA and deltas for a live
// Lautzu client, for the 7 / 30 / 90-day windows (see REAL below). EVERYTHING ELSE IS FABRICATED:
// the client name, all destination URLs, ad copy, campaign names, change-log entries and the people
// in them are deterministically generated placeholders so nothing identifies the real client. A
// disclosure note at the bottom of the dashboard states exactly what is real and what is not.
// Deterministic (no Math.random / no `new Date()` from "now"), so every render is identical.

export type Platform = "google" | "meta";

export interface Agg {
  spend: number;
  conversions: number;
  conversionValue: number;
  impressions: number;
  clicks: number;
}

export interface AccountView {
  platform: Platform;
  account: string;
  hasValue: boolean;
  cur: Agg;
  prior: Agg;
}

export interface DailyPoint {
  index: number;
  google: { spend: number; conversionValue: number };
  meta: { spend: number; conversionValue: number };
}

export interface AdCopyRow {
  headline: string | null;
  destination: string;
  platform: Platform;
  impressions: number;
  ctr: number;
  spend: number;
  roas: number | null;
}

export interface ProductFeed {
  platform: Platform;
  ads: number;
  spend: number;
  impressions: number;
  roas: number;
}

export interface ActivityEvent {
  platform: Platform;
  label: string;
  title: string;
  detail: string;
  when: string;
}

export interface ActivityTypeCount {
  type: string;
  count: number;
}

export interface FunnelRow {
  stage: "TOP" | "MID" | "LOW";
  spend: number;
  share: number;
}

export interface ClientData {
  slug: string;
  brand: string;
  domain: string;
  currency: string;
  connections: { platform: Platform; account: string; syncedAgo: string }[];
}

export interface DashboardView {
  brand: string;
  currency: string;
  days: number;
  rangeLabel: string;
  totalsCur: Agg;
  totalsPrior: Agg;
  accounts: AccountView[];
  daily: DailyPoint[];
  funnel: FunnelRow[];
  adsLive: number;
  adCopyTotal: number;
  adCopy: AdCopyRow[];
  productFeed: ProductFeed;
  activityWeek: { total: number; google: number; meta: number };
  googleEvents: ActivityEvent[];
  metaEvents: ActivityEvent[];
  googleEventTotal: number;
  metaEventTotal: number;
  activityBreakdown: ActivityTypeCount[];
  dataSourceNote: { google: string; meta: string };
}

// ── REAL figures (exact, per platform, per window) ───────────────────────────
// [ spend, spendDelta(cur−prior), conversionValue, cpa, cpaDelta, roas, roasDelta ]
type Raw = [number, number, number, number, number, number, number];
interface RealRange {
  days: number;
  label: string;
  google: Raw;
  meta: Raw;
}
const REAL: Record<number, RealRange> = {
  7: {
    days: 7,
    label: "Jul 6 – Jul 12, 2026",
    google: [48453, -8271, 333754, 19.48, 7.25, 6.89, -5.85],
    meta: [8368, -11274, 106467, 8.43, 4.15, 12.72, -16.22],
  },
  30: {
    days: 30,
    label: "Jun 13 – Jul 12, 2026",
    google: [233439, 3999, 2872836, 13.13, 2.09, 12.31, -5.18],
    meta: [63252, -63832, 1129911, 6.82, -10.38, 17.86, 10.73],
  },
  90: {
    days: 90,
    label: "Apr 14 – Jul 12, 2026",
    google: [714268, 91702, 11268259, 11.94, 2.74, 15.78, -4.11],
    meta: [270688, 40436, 2476237, 13.13, 3.88, 9.15, -3.82],
  },
};

// Real funnel spend per window (the funnel-classified campaigns — a subset of total spend). Shares
// are derived from these, so both the % and the $ are exact and differ by window.
const FUNNEL: Record<number, { TOP: number; MID: number; LOW: number }> = {
  7: { TOP: 29943, MID: 1452, LOW: 16905 },
  30: { TOP: 134867, MID: 9057, LOW: 99713 },
  90: { TOP: 406301, MID: 37843, LOW: 364528 },
};
// Product feed — real 90-day figures; scaled to the window by Google-spend share below.
const PRODUCT_FEED_90 = { ads: 3, spend: 65390, impressions: 9_400_000, roas: 2.95 };
const GOOGLE_SPEND_90 = 714268;
const SPEND_90 = 984956; // total 90-day spend, for scaling per-ad figures across windows

const ADS_LIVE = 494; // currently-live ad count (not window-scoped)
// Row-level counts scale with the window (illustrative — see the on-dashboard disclosure). The
// 90-day figures are the real ones from the source; shorter windows are proportioned down.
const COUNTS: Record<number, { adCopy: number; gEvents: number; mEvents: number }> = {
  7: { adCopy: 156, gEvents: 38, mEvents: 214 },
  30: { adCopy: 289, gEvents: 96, mEvents: 612 },
  90: { adCopy: 407, gEvents: 193, mEvents: 1401 },
};

// ── deterministic pseudo-random (index → 0..1), so no Math.random ────────────
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const pick = <T,>(arr: T[], i: number, salt: number) => arr[Math.floor(rnd(i, salt) * arr.length) % arr.length];

function aggFrom(raw: Raw): { cur: Agg; prior: Agg } {
  const [spend, dSpend, cv, cpa, dCpa, roas, dRoas] = raw;
  const conversions = spend / cpa;
  const pSpend = spend - dSpend;
  const pCpa = cpa - dCpa;
  const pRoas = roas - dRoas;
  const cur: Agg = { spend, conversions, conversionValue: cv, impressions: 0, clicks: 0 };
  const prior: Agg = {
    spend: pSpend,
    conversions: pSpend / pCpa,
    conversionValue: pRoas * pSpend,
    impressions: 0,
    clicks: 0,
  };
  return { cur, prior };
}

// Representative daily shape that sums EXACTLY to the real window totals (chart only).
function buildDaily(days: number, g: Agg, m: Agg): DailyPoint[] {
  const shape = (n: number, salt: number) => {
    const raw: number[] = [];
    for (let i = 0; i < n; i++) {
      const seasonal = 1 + 0.18 * Math.sin((i / 6.3) * Math.PI * 2 + salt);
      const weekend = i % 7 === 5 || i % 7 === 6 ? 0.82 : 1;
      const jitter = 0.85 + 0.3 * rnd(i, salt + 5);
      raw.push(Math.max(0.05, seasonal * weekend * jitter));
    }
    const sum = raw.reduce((s, v) => s + v, 0) || 1;
    return raw.map((v) => v / sum); // normalized weights
  };
  const gS = shape(days, 1.1), gV = shape(days, 2.3), mS = shape(days, 3.7), mV = shape(days, 4.9);
  const out: DailyPoint[] = [];
  for (let i = 0; i < days; i++) {
    out.push({
      index: i,
      google: { spend: g.spend * gS[i], conversionValue: g.conversionValue * gV[i] },
      meta: { spend: m.spend * mS[i], conversionValue: m.conversionValue * mV[i] },
    });
  }
  return out;
}

// ── fabricated content pools (generic retail; nothing client-specific) ───────
const HEADLINES: (string | null)[] = [
  null, null, null, null, null, // most Shopping/PMax ads carry no editable headline
  "Free shipping over $50",
  "New arrivals, in stock now",
  "Best sellers, restocked",
  "Members save 15% today",
  "Summer sale — ends soon",
  "Top-rated, back in stock",
  "Bundle & save this week",
  "Your essentials, delivered",
  "Shop the weekly deals",
  "Trending now",
];
const DEST_PATHS = [
  "/collections/best-sellers",
  "/collections/new-arrivals",
  "/products/daily-essentials",
  "/collections/on-sale",
  "/search?q=deals",
  "/collections/top-rated",
  "/products/starter-bundle",
  "/collections/weekly-picks",
  "/pages/free-shipping",
  "/collections/gifts",
];
const DEST_HOST = "https://www.anonymized-store.example";

// `factor` scales per-ad spend/impressions to the window; the day-seed varies every field so the
// table genuinely differs per date range (not just the row count).
function buildAdCopy(total: number, factor: number, days: number): AdCopyRow[] {
  const rows: AdCopyRow[] = [];
  const seed = days * 131;
  for (let i = 0; i < total; i++) {
    const k = i + seed;
    const spend = Math.max(3, Math.round(11400 * factor * Math.exp(-i / 46) * (0.55 + 0.9 * rnd(k, 1))));
    const impressions = Math.round(spend * (18 + 60 * rnd(k, 2)));
    const ctr = 0.006 + 0.12 * rnd(k, 3);
    const roas = Math.round((0.3 + 18.5 * rnd(k, 4)) * 100) / 100;
    const platform: Platform = rnd(k, 5) < 0.83 ? "google" : "meta";
    const headline = pick(HEADLINES, k, 6);
    const destination = headline == null ? `${DEST_HOST}${pick(DEST_PATHS, k, 7)}` : DEST_HOST + "/";
    rows.push({ headline, destination, platform, impressions, ctr, spend, roas });
  }
  return rows.sort((a, b) => b.spend - a.spend);
}

// Deterministic timestamps counting back from a fixed anchor (not "now" → stable render).
const ANCHOR = Date.UTC(2026, 6, 12, 17, 0, 0); // Jul 12 2026, 5:00 p.m.
function whenAt(offsetMinutes: number): string {
  const d = new Date(ANCHOR - offsetMinutes * 60000);
  const date = d.toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
  let h = d.getUTCHours();
  const ampm = h >= 12 ? "p.m." : "a.m.";
  h = h % 12 || 12;
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${date}, ${h}:${min} ${ampm}`;
}

const EVENT_TYPES = [
  { label: "BUDGET CHANGE", titles: ["Prospecting budget +12% ($420 → $470/day)", "Retargeting budget trimmed 8%", "Top campaign budget +$150/day", "Daily cap raised to $260"] },
  { label: "BID CHANGE", titles: ["Target CPA lowered to $11.80", "tROAS raised to 450%", "Manual CPC +6% on core terms"] },
  { label: "CAMPAIGN UPDATE", titles: ["Rotated in 4 new headlines", "Location targeting tightened", "Schedule shifted to peak hours"] },
  { label: "ASSET CREATE", titles: ["Added 3 image assets to the asset group", "New sitelink set published", "Callout extensions refreshed"] },
  { label: "AUDIENCE EDIT", titles: ["Retargeting window widened 14d → 30d", "Excluded recent purchasers", "Added lookalike seed segment"] },
  { label: "KEYWORD EDIT", titles: ["Added 12 exact-match terms", "Negative list updated (+18)", "Paused 5 low-quality terms"] },
  { label: "AD CREATED", titles: ["Launched new static into prospecting", "New responsive search ad live", "Added carousel variant"] },
  { label: "FIRST DELIVERY", titles: ["Started delivery on new ad set", "First impressions served", "Delivery ramped to target"] },
  { label: "PAUSE", titles: ["Paused ad below CTR floor", "Paused underperforming ad set", "Stopped fatigued creative"] },
  { label: "AD RUN STATUS", titles: ["Ad set re-enabled after review", "Status: learning → active", "Update required → active"] },
];

function buildEvents(platform: Platform, total: number): ActivityEvent[] {
  const actor = platform === "google" ? "ppc@lautzu.agency" : "Automated · Meta";
  const out: ActivityEvent[] = [];
  let minute = 0;
  for (let i = 0; i < total; i++) {
    const t = pick(EVENT_TYPES, i, platform === "google" ? 11 : 21);
    const title = pick(t.titles, i, platform === "google" ? 12 : 22);
    minute += 40 + Math.floor(rnd(i, 30) * 240); // step back in time, varied
    out.push({
      platform,
      label: t.label,
      title,
      detail: `By: ${rnd(i, 31) < 0.75 ? actor : platform === "google" ? "Automated · Google" : "ppc@lautzu.agency"}`,
      when: whenAt(minute),
    });
  }
  return out;
}

// Illustrative optimisation mix (fabricated — see disclosure), as weights scaled to the window's
// total event count so the breakdown moves with the date range.
const ACTIVITY_WEIGHTS: { type: string; weight: number }[] = [
  { type: "Update Ad Run Status", weight: 0.489 },
  { type: "Create Ad", weight: 0.204 },
  { type: "Budget Change", weight: 0.092 },
  { type: "First Delivery Event", weight: 0.068 },
  { type: "Campaign Update", weight: 0.042 },
  { type: "Audience Edit", weight: 0.031 },
  { type: "Asset Create", weight: 0.026 },
  { type: "Bid Change", weight: 0.02 },
  { type: "Keyword Edit", weight: 0.017 },
  { type: "Pause", weight: 0.011 },
];

// ── assemble the view for a given window ─────────────────────────────────────
const WINDOWS = [7, 30, 90];

export function buildView(client: ClientData, days: number): DashboardView {
  const key = WINDOWS.includes(days) ? days : 30;
  const real = REAL[key];
  const g = aggFrom(real.google);
  const m = aggFrom(real.meta);

  const sum = (sel: (a: Agg) => number, which: "cur" | "prior") => sel(g[which]) + sel(m[which]);
  const totalsCur: Agg = {
    spend: sum((a) => a.spend, "cur"),
    conversions: sum((a) => a.conversions, "cur"),
    conversionValue: sum((a) => a.conversionValue, "cur"),
    impressions: 0,
    clicks: 0,
  };
  const totalsPrior: Agg = {
    spend: sum((a) => a.spend, "prior"),
    conversions: sum((a) => a.conversions, "prior"),
    conversionValue: sum((a) => a.conversionValue, "prior"),
    impressions: 0,
    clicks: 0,
  };

  const fd = FUNNEL[key];
  const funnelTotal = fd.TOP + fd.MID + fd.LOW || 1;
  const funnel: FunnelRow[] = (["TOP", "MID", "LOW"] as const).map((stage) => ({
    stage,
    spend: fd[stage],
    share: fd[stage] / funnelTotal,
  }));

  const c = COUNTS[key];
  const eventTotal = c.gEvents + c.mEvents;
  const pfScale = g.cur.spend / GOOGLE_SPEND_90;
  const productFeed: ProductFeed = {
    platform: "google",
    ads: PRODUCT_FEED_90.ads,
    spend: Math.round(PRODUCT_FEED_90.spend * pfScale),
    impressions: Math.round(PRODUCT_FEED_90.impressions * pfScale),
    roas: PRODUCT_FEED_90.roas,
  };
  const activityBreakdown: ActivityTypeCount[] = ACTIVITY_WEIGHTS.map((w) => ({
    type: w.type,
    count: Math.max(1, Math.round(eventTotal * w.weight)),
  }));

  return {
    brand: client.brand,
    currency: client.currency,
    days: real.days,
    rangeLabel: real.label,
    totalsCur,
    totalsPrior,
    accounts: [
      { platform: "google", account: "Anonymized Client — Google Ads", hasValue: true, cur: g.cur, prior: g.prior },
      { platform: "meta", account: "Anonymized Client — Meta Ads", hasValue: true, cur: m.cur, prior: m.prior },
    ],
    daily: buildDaily(real.days, g.cur, m.cur),
    funnel,
    adsLive: ADS_LIVE,
    adCopyTotal: c.adCopy,
    adCopy: buildAdCopy(c.adCopy, totalsCur.spend / SPEND_90, real.days),
    productFeed,
    activityWeek: { total: eventTotal, google: c.gEvents, meta: c.mEvents },
    googleEvents: buildEvents("google", c.gEvents),
    metaEvents: buildEvents("meta", c.mEvents),
    googleEventTotal: c.gEvents,
    metaEventTotal: c.mEvents,
    activityBreakdown,
    dataSourceNote: {
      google: "Google: change events via the Change History API (30-day retention, full backfill on first connect, daily incremental).",
      meta: "Meta: reflects changes Meta's API reports; some Ads Manager actions are not exposed, and actor attribution may be absent for automated changes.",
    },
  };
}

// ── registry ─────────────────────────────────────────────────────────────────
const CLIENTS: Record<string, ClientData> = {
  healthyplanet: {
    slug: "healthyplanet",
    brand: "Anonymized Client",
    domain: "anonymized-store.example",
    currency: "CAD",
    connections: [
      { platform: "meta", account: "Anonymized Client — Meta Ads", syncedAgo: "2h ago" },
      { platform: "google", account: "Anonymized Client — Google Ads", syncedAgo: "2h ago" },
    ],
  },
};

export function getClient(slug: string): ClientData | null {
  return CLIENTS[slug.toLowerCase()] ?? null;
}

export const DEMO_SLUG = "healthyplanet";
