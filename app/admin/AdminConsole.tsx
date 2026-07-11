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
  connections: { platform: string; status: string }[];
}

export function AdminConsole({
  initialClients,
  dbOn,
  googleReady,
  metaReady,
}: {
  initialClients: ClientView[];
  dbOn: boolean;
  googleReady: boolean;
  metaReady: boolean;
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
          Database not configured (DB_HOST/DB_NAME/DB_USER/DB_PASSWORD). Set them to enable onboarding.
        </div>
      )}

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
              <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-plum-line bg-plum p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-bone">{c.brand}</span>
                    <Link href={`/${c.slug}`} className="font-mono text-[11px] text-lime hover:underline">bokuzu.com/{c.slug}</Link>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-ash">{c.loginEmail || "no login email set"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ConnectButton clientId={c.id} platform="google" label="Google Ads" ready={googleReady} status={statusOf(c, "google")} />
                  <ConnectButton clientId={c.id} platform="meta" label="Meta" ready={metaReady} status={statusOf(c, "meta")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function statusOf(c: ClientView, platform: string): string {
  return c.connections.find((x) => x.platform === platform)?.status || "not connected";
}

function ConnectButton({ clientId, platform, label, ready, status }: { clientId: string; platform: string; label: string; ready: boolean; status: string }) {
  const connected = status === "connected";
  if (connected) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 px-3 py-1.5 font-mono text-[11px] text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> {label} connected</span>;
  }
  if (!ready) {
    return <span className="rounded-full border border-plum-line px-3 py-1.5 font-mono text-[11px] text-ash" title={`Set up the ${label} app first`}>{label}: app not set up</span>;
  }
  return (
    <a href={`/api/connect/${platform}/start?client=${clientId}`} className="rounded-full bg-lime px-3.5 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-lime-press active:scale-[0.98]">
      Connect {label}
    </a>
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
