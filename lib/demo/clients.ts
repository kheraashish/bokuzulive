// Demo client data for the Bokuzu portal. SAMPLE data so you can see the exact dashboard shape and
// flow before the real Google/Meta ingest is wired. Deterministic (no random), so it looks identical
// on every load. Mirrors the zones of the reference CRM dashboard: At a glance, Performance,
// Ads running, Agency activity. Replace `getClient` with a tenant-scoped BigQuery read to go live.

export type Platform = "google" | "meta";

export interface AccountParams {
  platform: Platform;
  account: string;
  base: number; // daily spend baseline
  amp: number; // seasonal amplitude 0..1
  trend: number; // growth across the window
  phase: number;
  cpa: number; // target cost per conversion
  aov: number; // average order value
  ctr: number;
  cpm: number;
  hasValue: boolean;
}

export interface Campaign {
  platform: Platform;
  name: string;
  funnel: "TOP" | "MID" | "LOW";
  share: number;
  cpa: number;
  roas: number | null;
  ctr: number;
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
  label: string; // chip label, e.g. "BUDGET CHANGE"
  title: string; // event title line
  detail: string; // secondary line (e.g. "By: ppc@…")
  when: string; // display timestamp
}

export interface ActivityTypeCount {
  type: string;
  count: number;
}

export interface ClientData {
  slug: string;
  brand: string;
  domain: string;
  currency: string;
  connections: { platform: Platform; account: string; syncedAgo: string }[];
  accounts: AccountParams[];
  campaigns: Campaign[];
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

// ── deterministic daily series ───────────────────────────────────────────────
export interface DayPoint {
  spend: number;
  conversions: number;
  conversionValue: number;
  impressions: number;
  clicks: number;
}

export function seriesFor(a: AccountParams, days: number): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const t = days > 1 ? i / (days - 1) : 1;
    const seasonal = 1 + a.amp * Math.sin((i / 7) * Math.PI * 2 + a.phase);
    const weekly = i % 7 === 5 || i % 7 === 6 ? 0.84 : 1;
    const spend = a.base * (1 + a.trend * t) * seasonal * weekly;
    const conversions = (spend / a.cpa) * (0.94 + 0.12 * ((seasonal - 1 + a.amp) / (2 * a.amp || 1)));
    const conversionValue = a.hasValue ? conversions * a.aov : 0;
    const impressions = (spend / a.cpm) * 1000;
    const clicks = impressions * a.ctr;
    out.push({ spend, conversions, conversionValue, impressions, clicks });
  }
  return out;
}

export interface Agg {
  spend: number;
  conversions: number;
  conversionValue: number;
  impressions: number;
  clicks: number;
}
const zero: Agg = { spend: 0, conversions: 0, conversionValue: 0, impressions: 0, clicks: 0 };

function sumSlice(series: DayPoint[], from: number, to: number): Agg {
  return series.slice(from, to).reduce<Agg>(
    (acc, dp) => ({
      spend: acc.spend + dp.spend,
      conversions: acc.conversions + dp.conversions,
      conversionValue: acc.conversionValue + dp.conversionValue,
      impressions: acc.impressions + dp.impressions,
      clicks: acc.clicks + dp.clicks,
    }),
    { ...zero }
  );
}
function addAgg(a: Agg, b: Agg): Agg {
  return {
    spend: a.spend + b.spend,
    conversions: a.conversions + b.conversions,
    conversionValue: a.conversionValue + b.conversionValue,
    impressions: a.impressions + b.impressions,
    clicks: a.clicks + b.clicks,
  };
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

export interface DashboardView {
  brand: string;
  currency: string;
  days: number;
  totalsCur: Agg;
  totalsPrior: Agg;
  accounts: AccountView[];
  daily: DailyPoint[];
  campaigns: Campaign[];
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

const WINDOW = 90;

export function buildView(client: ClientData, days: number): DashboardView {
  const n = Math.min(days, WINDOW);
  const factor = n / 30; // scale range-dependent tallies (ad copy, product feed) with the window
  const perAccount = client.accounts.map((a) => {
    const s = seriesFor(a, WINDOW);
    return { a, s, cur: sumSlice(s, WINDOW - n, WINDOW), prior: sumSlice(s, Math.max(0, WINDOW - 2 * n), WINDOW - n) };
  });

  const totalsCur = perAccount.reduce<Agg>((acc, p) => addAgg(acc, p.cur), { ...zero });
  const totalsPrior = perAccount.reduce<Agg>((acc, p) => addAgg(acc, p.prior), { ...zero });

  const g = perAccount.find((p) => p.a.platform === "google");
  const m = perAccount.find((p) => p.a.platform === "meta");
  const daily: DailyPoint[] = [];
  for (let i = WINDOW - n; i < WINDOW; i++) {
    daily.push({
      index: i - (WINDOW - n),
      google: { spend: g?.s[i].spend ?? 0, conversionValue: g?.s[i].conversionValue ?? 0 },
      meta: { spend: m?.s[i].spend ?? 0, conversionValue: m?.s[i].conversionValue ?? 0 },
    });
  }

  return {
    brand: client.brand,
    currency: client.currency,
    days: n,
    totalsCur,
    totalsPrior,
    accounts: perAccount.map((p) => ({ platform: p.a.platform, account: p.a.account, hasValue: p.a.hasValue, cur: p.cur, prior: p.prior })),
    daily,
    campaigns: client.campaigns,
    adsLive: Math.round(client.adsLive * Math.max(0.5, factor)),
    adCopyTotal: Math.round(client.adCopyTotal * Math.max(0.5, factor)),
    adCopy: client.adCopy.map((r) => ({ ...r, spend: r.spend * factor, impressions: r.impressions * factor })),
    productFeed: {
      ...client.productFeed,
      spend: client.productFeed.spend * factor,
      impressions: client.productFeed.impressions * factor,
      ads: client.productFeed.ads,
    },
    activityWeek: client.activityWeek,
    googleEvents: client.googleEvents,
    metaEvents: client.metaEvents,
    googleEventTotal: client.googleEventTotal,
    metaEventTotal: client.metaEventTotal,
    activityBreakdown: client.activityBreakdown,
    dataSourceNote: client.dataSourceNote,
  };
}

// ── registry ─────────────────────────────────────────────────────────────────
const CLIENTS: Record<string, ClientData> = {
  healthyplanet: {
    slug: "healthyplanet",
    brand: "Demo Client",
    domain: "democlient.example",
    currency: "CAD",
    connections: [
      { platform: "meta", account: "Demo Client - Meta Ads", syncedAgo: "8h ago" },
      { platform: "google", account: "Demo Client - Google Ads", syncedAgo: "8h ago" },
    ],
    accounts: [
      { platform: "google", account: "Demo Client - Google Ads", base: 7400, amp: 0.16, trend: 0.14, phase: 0.4, cpa: 12.97, aov: 132, ctr: 0.041, cpm: 9.2, hasValue: true },
      { platform: "meta", account: "Demo Client - Meta Ads", base: 2050, amp: 0.24, trend: 0.34, phase: 1.7, cpa: 7.0, aov: 122, ctr: 0.019, cpm: 7.4, hasValue: true },
    ],
    campaigns: [
      { platform: "google", name: "Search · Brand", funnel: "LOW", share: 0.22, cpa: 9.1, roas: 6.8, ctr: 0.112 },
      { platform: "google", name: "PMax · Supplements", funnel: "MID", share: 0.31, cpa: 17.4, roas: 4.2, ctr: 0.038 },
      { platform: "google", name: "Shopping · Top Sellers", funnel: "LOW", share: 0.24, cpa: 11.8, roas: 5.6, ctr: 0.026 },
      { platform: "google", name: "Demand Gen · Awareness", funnel: "TOP", share: 0.23, cpa: 41.2, roas: 1.7, ctr: 0.021 },
      { platform: "meta", name: "Prospecting · Advantage+", funnel: "TOP", share: 0.38, cpa: 28.9, roas: 2.4, ctr: 0.016 },
      { platform: "meta", name: "Retargeting · DPA", funnel: "LOW", share: 0.27, cpa: 12.6, roas: 5.9, ctr: 0.031 },
      { platform: "meta", name: "Consideration · Video", funnel: "MID", share: 0.2, cpa: 24.1, roas: 2.9, ctr: 0.014 },
      { platform: "meta", name: "Broad · Interest", funnel: "TOP", share: 0.15, cpa: 33.7, roas: 1.9, ctr: 0.012 },
    ],
    adsLive: 494,
    adCopyTotal: 407,
    adCopy: [
      { headline: null, destination: "democlient.example/store/index.php?cName=PROTEIN", platform: "google", impressions: 148400, ctr: 0.0386, spend: 11402, roas: 0.33 },
      { headline: "Web Relevant Ad", destination: "democlient.example/", platform: "google", impressions: 658900, ctr: 0.0491, spend: 10764, roas: 10.39 },
      { headline: null, destination: "democlient.example/store/index.php?cName=VITAMINS+%26+MINERALS", platform: "google", impressions: 134600, ctr: 0.0375, spend: 8813, roas: 1.49 },
      { headline: null, destination: "democlient.example/catalogsearch/result/?q=dr.+bronner", platform: "google", impressions: 329300, ctr: 0.0151, spend: 6405, roas: 1.65 },
      { headline: null, destination: "democlient.example/products/natural-factors", platform: "google", impressions: 121200, ctr: 0.1262, spend: 5115, roas: 18.45 },
      { headline: null, destination: "democlient.example/store/index.php?cName=PROTEIN", platform: "google", impressions: 65100, ctr: 0.0384, spend: 4726, roas: 0.63 },
      { headline: "Immunity, restocked", destination: "democlient.example/products/immunity", platform: "meta", impressions: 104800, ctr: 0.0574, spend: 3708, roas: 4.41 },
      { headline: null, destination: "democlient.example/products/aor.html", platform: "google", impressions: 38500, ctr: 0.0836, spend: 2917, roas: 17.07 },
      { headline: "Founders on why it works", destination: "democlient.example/story", platform: "meta", impressions: 51700, ctr: 0.0321, spend: 2898, roas: 1.03 },
      { headline: null, destination: "democlient.example/products/aor.html", platform: "google", impressions: 33500, ctr: 0.1011, spend: 2691, roas: 18.04 },
      { headline: "Protein, 20% off this week", destination: "democlient.example/sale", platform: "meta", impressions: 100000, ctr: 0.0278, spend: 2294, roas: 5.73 },
      { headline: null, destination: "democlient.example/products/lorna-vanderhaeghe.html", platform: "google", impressions: 53900, ctr: 0.056, spend: 2216, roas: 9.26 },
    ],
    productFeed: { platform: "google", ads: 3, spend: 66712, impressions: 9_700_000, roas: 2.98 },
    activityWeek: { total: 837, google: 192, meta: 645 },
    googleEvents: [
      { platform: "google", label: "BUDGET CHANGE", title: "PMax · Supplements budget +18% ($420 to $495/day)", detail: "By: ppc@bokuzu.agency", when: "Jul 4, 12:12 p.m." },
      { platform: "google", label: "BID CHANGE", title: "Shopping · Top Sellers tCPA lowered to $11.80", detail: "By: ppc@bokuzu.agency", when: "Jul 4, 11:58 a.m." },
      { platform: "google", label: "ASSET CREATE", title: "Added 4 headlines to Search · Brand RSA v4", detail: "By: ppc@bokuzu.agency", when: "Jul 4, 11:40 a.m." },
      { platform: "google", label: "CAMPAIGN UPDATE", title: "Demand Gen · Awareness daily cap set to $260", detail: "By: ppc@bokuzu.agency", when: "Jul 3, 4:05 p.m." },
      { platform: "google", label: "KEYWORD EDIT", title: "Added 12 exact-match terms to Search · Brand", detail: "By: ppc@bokuzu.agency", when: "Jul 3, 2:22 p.m." },
      { platform: "google", label: "BUDGET CHANGE", title: "Shopping · Top Sellers budget +$120/day", detail: "By: ppc@bokuzu.agency", when: "Jul 2, 9:31 a.m." },
    ],
    metaEvents: [
      { platform: "meta", label: "AD CREATED", title: "Launched Spring Immunity · UGC 02 into Prospecting", detail: "By: Meta", when: "Jul 2, 8:38 a.m." },
      { platform: "meta", label: "FIRST DELIVERY", title: "Started delivery: Instore Biweekly · English Video", detail: "By: Meta", when: "Jul 2, 8:28 a.m." },
      { platform: "meta", label: "PAUSE", title: "Paused Sale · Static 03 (CTR below 1.2% floor)", detail: "By: Meta", when: "Jul 2, 8:27 a.m." },
      { platform: "meta", label: "AUDIENCE EDIT", title: "Retargeting · DPA window widened 14d to 30d", detail: "By: Meta", when: "Jul 1, 3:14 p.m." },
      { platform: "meta", label: "BUDGET CHANGE", title: "Prospecting · Advantage+ budget +$300/day", detail: "By: Meta", when: "Jul 1, 10:02 a.m." },
      { platform: "meta", label: "AD SET UPDATE", title: "Consideration · Video optimization goal to purchases", detail: "By: Meta", when: "Jun 30, 5:47 p.m." },
    ],
    googleEventTotal: 192,
    metaEventTotal: 645,
    activityBreakdown: [
      { type: "Update Ad Run Status", count: 530 },
      { type: "Budget Change", count: 95 },
      { type: "Campaign Update", count: 42 },
      { type: "First Delivery Event", count: 32 },
      { type: "Update Ad Set Run Status", count: 19 },
      { type: "Audience Edit", count: 15 },
      { type: "Campaign Asset Create", count: 13 },
      { type: "Campaign Create", count: 12 },
      { type: "Create Ad", count: 10 },
      { type: "Update Campaign Run Status", count: 9 },
      { type: "Update Ad Creative", count: 7 },
      { type: "Update Ad Set Target Spec", count: 7 },
      { type: "Update Ad Set Budget", count: 6 },
      { type: "Ad Account Billing Charge", count: 4 },
      { type: "Bid Change", count: 2 },
      { type: "Keyword Edit", count: 2 },
    ],
    dataSourceNote: {
      google: "Google: change events via the Change History API (30-day retention, full backfill on first connect, daily incremental).",
      meta: "Meta: reflects changes Meta's API reports; some Ads Manager actions are not exposed, and actor attribution may be absent for automated changes.",
    },
  },
};

export function getClient(slug: string): ClientData | null {
  return CLIENTS[slug.toLowerCase()] ?? null;
}

export const DEMO_SLUG = "healthyplanet";
