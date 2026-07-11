"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Me {
  email: string; name: string | null; phone: string | null; smsCodes: boolean;
  brand: string | null; slug: string | null; logoUrl: string | null; linked: boolean; live: boolean;
}
interface Device { id: string; label: string | null; lastSeen: string; current: boolean }
type Tab = "home" | "settings" | "support";

export function PortalHome({ me, devices }: { me: Me; devices: Device[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [menu, setMenu] = useState(false);
  const needsSetup = !me.linked;

  const signOut = async (forgetDevice: boolean) => {
    await fetch("/api/portal/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ forgetDevice }) });
    router.push("/login"); router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-plum-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-shell items-center justify-between px-5 py-3.5 sm:px-8">
          <Brand brand={me.brand} logoUrl={me.logoUrl} />
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone hover:border-ash hover:bg-plum-raise">{me.email}</button>
            {menu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-plum-line bg-plum p-3 shadow-lift">
                <button onClick={() => signOut(false)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-bone hover:bg-plum-raise">Sign out (keep this device)</button>
                <button onClick={() => signOut(true)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-bad hover:bg-plum-raise">Sign out &amp; forget this device</button>
              </div>
            )}
          </div>
        </div>
        {!needsSetup && (
          <nav className="mx-auto flex max-w-shell gap-1 px-5 sm:px-8">
            {(["home", "settings", "support"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-2.5 text-sm capitalize transition-colors ${tab === t ? "border-lime text-bone" : "border-transparent text-ash hover:text-bone"}`}>{t}</button>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-shell px-5 py-10 sm:px-8">
        {needsSetup ? (
          <AccountSetup onDone={() => router.refresh()} />
        ) : (
          <>
            {tab === "home" && <Home me={me} />}
            {tab === "settings" && <Settings me={me} devices={devices} onChange={() => router.refresh()} />}
            {tab === "support" && <Support />}
          </>
        )}
      </main>
    </div>
  );
}

const COUNTRIES = ["Canada", "United States", "United Kingdom", "Australia", "India", "Germany", "France", "Netherlands", "Ireland", "New Zealand", "United Arab Emirates", "Singapore"];

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
        <Setup label="Company name" value={companyName} onChange={setCompanyName} placeholder="Acme Supplements" required />
        <Setup label="Company website" value={website} onChange={setWebsite} placeholder="acme.com" />
        <div>
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Country</span>
          <input list="bk-countries" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Canada" required className={setupInput} />
          <datalist id="bk-countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <Setup label="Mobile number (optional)" value={phone} onChange={setPhone} placeholder="+1 555 000 1234" />
        {err && <p className="font-mono text-[11px] text-bad">{err}</p>}
        <button type="submit" disabled={busy || !companyName.trim() || !country.trim()} className="w-full rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98] disabled:opacity-40">
          {busy ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

const setupInput = "w-full rounded-xl border border-plum-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-ash/60 focus:border-lime";
function Setup({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={setupInput} />
    </label>
  );
}

function Brand({ brand, logoUrl }: { brand: string | null; logoUrl: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <Image src={logoUrl} alt={brand || "Client"} width={112} height={28} className="h-7 w-auto object-contain" unoptimized />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
      )}
      <div className="flex items-center gap-2.5">
        {!logoUrl && <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-lime">Bokuzu</span>}
        {brand && <><span className="text-plum-line" aria-hidden>|</span><span className="text-[15px] font-semibold tracking-tight text-bone">{brand}</span></>}
      </div>
    </div>
  );
}

function Home({ me }: { me: Me }) {
  const [showWait, setShowWait] = useState(false);
  const first = me.name?.split(" ")[0];
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-lime">Welcome to Bokuzu</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-bone sm:text-4xl">
        Welcome{first ? `, ${first}` : ""}.
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ash">
        All of your Google and Meta ad account data will be shown here, in one place, updated every 24 hours.
      </p>

      <div className="mt-8">
        {me.live && me.slug ? (
          <Link href={`/${me.slug}`} className="inline-flex items-center gap-2 rounded-full bg-lime px-8 py-4 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98]">
            Your dashboard <span aria-hidden>&rarr;</span>
          </Link>
        ) : (
          <button onClick={() => setShowWait(true)} className="inline-flex items-center gap-2 rounded-full bg-lime px-8 py-4 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98]">
            Your dashboard <span aria-hidden>&rarr;</span>
          </button>
        )}
      </div>

      {showWait && (
        <p className="mx-auto mt-6 max-w-lg rounded-2xl border border-warn/40 bg-plum px-5 py-4 text-sm leading-relaxed text-ash">
          Your portal is being set up. You will receive an email confirmation once your ad accounts have been connected to Bokuzu and your dashboard is live. Thanks for your patience.
        </p>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-plum-line bg-ink px-4 py-2.5 text-sm text-bone placeholder:text-ash/60 focus:border-lime";
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-plum-line bg-plum-raise p-6"><h2 className="mb-4 text-sm font-semibold text-bone">{title}</h2>{children}</section>;
}

function Settings({ me, devices, onChange }: { me: Me; devices: Device[]; onChange: () => void }) {
  const [phone, setPhone] = useState(me.phone || "");
  const [sms, setSms] = useState(me.smsCodes);
  const [msg, setMsg] = useState("");

  const post = (action: string, body: object) => fetch("/api/portal/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...body }) });
  const savePhone = async () => { const r = await post("phone", { phone }); setMsg(r.ok ? "Mobile number saved." : (await r.json()).error || "Failed."); if (r.ok) onChange(); };
  const toggleSms = async () => { const nv = !sms; setSms(nv); const r = await post("smsCodes", { smsCodes: nv }); if (!r.ok) { setSms(!nv); setMsg((await r.json()).error || "Failed."); } };
  const removeDevice = async (id: string) => { await fetch("/api/portal/devices", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); onChange(); };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-bone">Settings</h1>

      <Card title="Sign-in">
        <p className="text-sm text-ash">You sign in with <span className="text-bone">{me.email}</span> using an emailed code. No password to remember. To change your email, contact support.</p>
      </Card>

      <Card title="Login codes">
        <div>
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Mobile number (for SMS codes)</span>
          <div className="flex gap-2">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 1234" className={inputCls} />
            <button onClick={savePhone} className="shrink-0 rounded-full border border-plum-line px-4 text-sm text-bone hover:border-lime hover:bg-lime hover:text-ink">Save</button>
          </div>
        </div>
        <button onClick={toggleSms} disabled={!me.phone} className="mt-4 flex w-full items-center justify-between rounded-xl border border-plum-line bg-plum px-4 py-3 text-left disabled:opacity-50">
          <span><span className="block text-sm text-bone">Also text my code to my mobile</span><span className="block font-mono text-[11px] text-ash">{me.phone ? "A code is texted alongside email." : "Add a mobile number first."}</span></span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${sms ? "bg-lime" : "bg-plum-line"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${sms ? "translate-x-4" : "translate-x-0.5"}`} /></span>
        </button>
        {msg && <p className="mt-3 font-mono text-[11px] text-ok">{msg}</p>}
      </Card>

      <Card title="Devices signed in">
        {devices.length === 0 ? <p className="font-mono text-[11px] text-ash">No remembered devices.</p> : (
          <ul className="divide-y divide-plum-line/70">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3">
                <div><p className="text-sm text-bone">{d.label || "Device"} {d.current && <span className="font-mono text-[10px] text-lime">· this device</span>}</p><p className="font-mono text-[11px] text-ash">last active {new Date(d.lastSeen).toLocaleDateString()}</p></div>
                <button onClick={() => removeDevice(d.id)} className="rounded-full border border-plum-line px-3 py-1.5 font-mono text-[11px] text-bad hover:border-bad">Remove</button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-[11px] text-ash">Remembered devices skip the code for up to 30 days, then a code is required again.</p>
      </Card>
    </div>
  );
}

function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/portal/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, message }) });
    setBusy(false);
    if (r.ok) setDone(true); else setErr((await r.json()).error || "Could not send.");
  };
  return (
    <div className="mx-auto max-w-2xl">
      <Card title="Raise a support ticket">
        {done ? (
          <>
            <p className="text-sm text-bone">Thanks. Your ticket reached our team and we&apos;ll reply by email shortly.</p>
            <button onClick={() => { setDone(false); setSubject(""); setMessage(""); }} className="mt-4 rounded-full border border-plum-line px-4 py-2 text-sm text-bone hover:border-lime">Raise another</button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-ash">Questions about your numbers, access, or anything else. This reaches us at info@lautzu.com.</p>
            <form onSubmit={send} className="space-y-3">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inputCls} />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={5} className={`${inputCls} resize-y`} />
              {err && <p className="font-mono text-[11px] text-bad">{err}</p>}
              <button type="submit" disabled={busy || !subject.trim() || !message.trim()} className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink hover:bg-lime-press disabled:opacity-40">{busy ? "Sending…" : "Send ticket"}</button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
