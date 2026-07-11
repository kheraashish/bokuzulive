"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ClientView {
  id: string;
  slug: string;
  brand: string;
  currency: string;
  loginEmail: string | null;
  status: string;
  connections: { platform: string; status: string; accountId: string | null }[];
}

interface Agency {
  googleAppReady: boolean; // Google OAuth app credentials present in env
  metaAppReady: boolean; // Meta app credentials present in env
  googleConnected: boolean; // agency MCC refresh token stored
  metaConnected: boolean; // agency Meta system-user token stored
}

export function AdminConsole({
  initialClients,
  dbOn,
  agency,
}: {
  initialClients: ClientView[];
  dbOn: boolean;
  agency: Agency;
}) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const autoSlug = (b: string) =>
    b.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand, slug: slug || autoSlug(brand), currency, loginEmail: email }),
    });
    setBusy(false);
    if (res.ok) {
      setBrand(""); setSlug(""); setEmail(""); setCurrency("CAD");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not create client.");
    }
  };

  const signOut = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-shell px-5 py-8 sm:px-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-lime">Operator console</p>
            <p className="font-mono text-[11px] text-ash">{initialClients.length} client{initialClients.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <button onClick={signOut} className="rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone hover:border-ash hover:bg-plum-raise">Sign out</button>
      </header>

      {!dbOn && (
        <div className="mb-6 rounded-xl border border-warn/40 bg-plum px-4 py-3 font-mono text-[11px] text-warn">
          Database not configured. Set DB_HOST/DB_NAME/DB_USER/DB_PASSWORD to enable onboarding.
        </div>
      )}

      {/* Agency setup (one time) */}
      <AgencySetup agency={agency} />

      {/* Add client */}
      <section className="mb-10 rounded-2xl border border-plum-line bg-plum-raise p-6">
        <h2 className="mb-4 text-sm font-semibold text-bone">Add a client</h2>
        <form onSubmit={create} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Brand name" value={brand} onChange={(v) => { setBrand(v); if (!slug) setSlug(autoSlug(v)); }} placeholder="Acme Supplements" />
          <Field label="Portal slug (bokuzu.com/…)" value={slug} onChange={(v) => setSlug(autoSlug(v))} placeholder="acme" mono />
          <Field label="Client login email" value={email} onChange={setEmail} placeholder="owner@acme.com" type="email" />
          <Field label="Currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase())} placeholder="CAD" mono />
          <div className="sm:col-span-2 flex items-center justify-between gap-4">
            {error ? <p className="font-mono text-[11px] text-bad">{error}</p> : <span className="font-mono text-[11px] text-ash">Portal will live at bokuzu.com/{slug || autoSlug(brand) || "…"}</span>}
            <button type="submit" disabled={busy || !dbOn || !brand} className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink shadow-glow hover:bg-lime-press active:scale-[0.98] disabled:opacity-40">
              {busy ? "Adding…" : "Add client"}
            </button>
          </div>
        </form>
      </section>

      {/* Clients */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-bone">Clients</h2>
        {initialClients.length === 0 ? (
          <p className="rounded-xl border border-plum-line bg-plum px-4 py-6 text-center font-mono text-[11px] text-ash">No clients yet. Add your first one above.</p>
        ) : (
          <div className="space-y-3">
            {initialClients.map((c) => (
              <div key={c.id} className="rounded-2xl border border-plum-line bg-plum p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-bone">{c.brand}</span>
                    <Link href={`/${c.slug}`} className="font-mono text-[11px] text-lime hover:underline">bokuzu.com/{c.slug}</Link>
                  </div>
                  <span className="font-mono text-[11px] text-ash">{c.loginEmail || "no login email"}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AccountField clientId={c.id} platform="google" label="Google Customer ID" placeholder="123-456-7890" current={accountOf(c, "google")} onSaved={() => router.refresh()} />
                  <AccountField clientId={c.id} platform="meta" label="Meta Ad Account ID" placeholder="act_1234567890" current={accountOf(c, "meta")} onSaved={() => router.refresh()} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function accountOf(c: ClientView, platform: string): string {
  return c.connections.find((x) => x.platform === platform)?.accountId || "";
}

function AgencySetup({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [metaToken, setMetaToken] = useState("");
  const [busy, setBusy] = useState(false);

  const saveMeta = async () => {
    setBusy(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "meta_system_token", value: metaToken }),
    });
    setBusy(false);
    setMetaToken("");
    router.refresh();
  };

  return (
    <section className="mb-8 rounded-2xl border border-plum-line bg-plum p-6">
      <h2 className="mb-1 text-sm font-semibold text-bone">Agency setup (one time)</h2>
      <p className="mb-4 font-mono text-[11px] text-ash">Your manager credentials that read every client&apos;s data. Done once.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Google MCC */}
        <div className="rounded-xl border border-plum-line bg-plum-raise p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-bone">Google Ads (MCC)</span>
            <StatusPill ok={agency.googleConnected} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-ash">Authorize your Google Manager account once.</p>
          {agency.googleAppReady ? (
            <a href="/api/connect/google/start?agency=1" className="mt-3 inline-block rounded-full bg-lime px-4 py-2 font-mono text-[11px] font-semibold text-ink hover:bg-lime-press">
              {agency.googleConnected ? "Re-connect Google" : "Connect Google MCC"}
            </a>
          ) : (
            <p className="mt-3 font-mono text-[11px] text-warn">Add GOOGLE_OAUTH_CLIENT_ID + secret + dev token to enable.</p>
          )}
        </div>

        {/* Meta system user */}
        <div className="rounded-xl border border-plum-line bg-plum-raise p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-bone">Meta (System user)</span>
            <StatusPill ok={agency.metaConnected} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-ash">Paste the long-lived system-user token from your Business Manager.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={metaToken}
              onChange={(e) => setMetaToken(e.target.value)}
              placeholder={agency.metaConnected ? "•••••• (stored) — paste to replace" : "EAAB… system-user token"}
              className="min-w-0 flex-1 rounded-lg border border-plum-line bg-ink px-3 py-2 font-mono text-[11px] text-bone placeholder:text-ash/60 focus:border-lime"
            />
            <button onClick={saveMeta} disabled={busy || !metaToken} className="shrink-0 rounded-full bg-lime px-4 py-2 font-mono text-[11px] font-semibold text-ink hover:bg-lime-press disabled:opacity-40">
              {busy ? "…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> connected</span>
  ) : (
    <span className="rounded-full border border-plum-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ash">not set</span>
  );
}

function AccountField({
  clientId,
  platform,
  label,
  placeholder,
  current,
  onSaved,
}: {
  clientId: string;
  platform: "google" | "meta";
  label: string;
  placeholder: string;
  current: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const dirty = value.trim() !== current;

  const save = async () => {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, platform, accountId: value }),
    });
    setBusy(false);
    if (res.ok) onSaved();
    else setErr((await res.json().catch(() => ({}))).error || "failed");
  };

  return (
    <div className="rounded-xl border border-plum-line bg-plum-raise p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ash">{label}</span>
        {current ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ok">linked</span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ash">not linked</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-plum-line bg-ink px-3 py-2 font-mono text-[11px] text-bone placeholder:text-ash/60 focus:border-lime"
        />
        <button onClick={save} disabled={busy || !dirty} className="shrink-0 rounded-full border border-plum-line px-3 py-2 font-mono text-[11px] text-bone hover:border-lime hover:bg-lime hover:text-ink disabled:opacity-40">
          {busy ? "…" : "Save"}
        </button>
      </div>
      {err && <p className="mt-1 font-mono text-[10px] text-bad">{err}</p>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-plum-line bg-ink px-4 py-2.5 text-sm text-bone placeholder:text-ash/60 focus:border-lime ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
