"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Shown at /portal until a user has a company and has answered the agency question. Two short steps:
//   1. Set up your account (company name, website, country, mobile)
//   2. Have you onboarded with the Lautzu agency? (yes/no)
// After both, /portal redirects to the client's hub at /<slug>.
export function SetupFlow({ needsCompany }: { needsCompany: boolean }) {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-shell px-5 py-10 sm:px-8">
      {needsCompany ? <AccountSetup onDone={() => router.refresh()} /> : <AgencyQuestion onDone={() => router.refresh()} />}
    </main>
  );
}

const COUNTRIES = ["Canada", "United States", "United Kingdom", "Australia", "India", "Germany", "France", "Netherlands", "Ireland", "New Zealand", "United Arab Emirates", "Singapore"];
const setupInput = "w-full rounded-xl border border-plum-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-ash/60 focus:border-lime";

function AccountSetup({ onDone }: { onDone: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/portal/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ companyName, website, country, phone }) });
    setBusy(false);
    if (r.ok) onDone(); else setErr((await r.json()).error || "Could not save.");
  };

  return (
    <div className="mx-auto max-w-lg py-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-lime">Set up your account</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Tell us about your company</h1>
      <p className="mt-2 text-sm leading-relaxed text-ash">Just a few details so we can set up your portal and connect your ad accounts.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label="Company name" value={companyName} onChange={setCompanyName} placeholder="Acme Supplements" required />
        <Field label="Company website" value={website} onChange={setWebsite} placeholder="acme.com" />
        <div>
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Country</span>
          <input list="bk-countries" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Canada" required className={setupInput} />
          <datalist id="bk-countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <Field label="Mobile number (optional)" value={phone} onChange={setPhone} placeholder="+1 555 000 1234" />
        {err && <p className="font-mono text-[11px] text-bad">{err}</p>}
        <button type="submit" disabled={busy || !companyName.trim() || !country.trim()} className="w-full rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98] disabled:opacity-40">{busy ? "Saving…" : "Continue"}</button>
      </form>
    </div>
  );
}

function AgencyQuestion({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const answer = async (onboarded: "yes" | "no") => {
    setBusy(true);
    await fetch("/api/portal/agency", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ onboarded }) });
    onDone();
  };
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-lime">One quick question</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-bone sm:text-3xl">Have you onboarded with the Lautzu agency?</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">This helps us connect your ad accounts and set up your portal correctly.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button onClick={() => answer("yes")} disabled={busy} className="rounded-full bg-lime px-10 py-3.5 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98] disabled:opacity-40">Yes</button>
        <button onClick={() => answer("no")} disabled={busy} className="rounded-full border border-plum-line px-10 py-3.5 text-sm font-semibold text-bone transition-colors hover:border-lime hover:bg-lime hover:text-ink active:scale-[0.98] disabled:opacity-40">No</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={setupInput} />
    </label>
  );
}
