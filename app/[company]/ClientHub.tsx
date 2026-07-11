"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Me {
  email: string; name: string | null; phone: string | null; smsCodes: boolean; authenticator: boolean;
  brand: string; slug: string; logoUrl: string | null; live: boolean; agencyOnboarded: string | null;
}
interface Device { id: string; label: string | null; lastSeen: string; current: boolean }
type Tab = "dashboard" | "support" | "settings";

export function ClientHub({ me, devices, smsAvailable }: { me: Me; devices: Device[]; smsAvailable: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [menu, setMenu] = useState(false);

  const signOut = async (forgetDevice: boolean) => {
    await fetch("/api/portal/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ forgetDevice }) });
    router.push("/login"); router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-plum-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-shell items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            {me.logoUrl ? (
              <Image src={me.logoUrl} alt={me.brand} width={112} height={28} className="h-7 w-auto object-contain" unoptimized />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
            )}
            <div className="flex items-center gap-2.5">
              {!me.logoUrl && <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-lime">Bokuzu</span>}
              <span className="text-plum-line" aria-hidden>|</span>
              <span className="text-[15px] font-semibold tracking-tight text-bone">{me.brand}</span>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="max-w-[45vw] truncate rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone hover:border-ash hover:bg-plum-raise sm:max-w-[240px]">{me.email}</button>
            {menu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-plum-line bg-plum p-3 shadow-lift">
                <button onClick={() => signOut(false)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-bone hover:bg-plum-raise">Sign out (keep this device)</button>
                <button onClick={() => signOut(true)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-bad hover:bg-plum-raise">Sign out &amp; forget this device</button>
              </div>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-shell gap-1 px-5 sm:px-8">
          {(["dashboard", "support", "settings"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-2.5 text-sm capitalize transition-colors ${tab === t ? "border-lime text-bone" : "border-transparent text-ash hover:text-bone"}`}>{t}</button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-shell px-5 py-8 sm:px-8">
        {tab === "dashboard" && <Dashboard me={me} />}
        {tab === "support" && <Support />}
        {tab === "settings" && <Settings me={me} devices={devices} smsAvailable={smsAvailable} onChange={() => router.refresh()} />}
      </main>
    </div>
  );
}

function Dashboard({ me }: { me: Me }) {
  if (me.agencyOnboarded === "no") {
    return (
      <div className="mx-auto max-w-2xl py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-lime">Almost there</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-bone">Let&apos;s get you started</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ash">To turn on your dashboard, our team first connects your Google and Meta ad accounts. Book a quick call and we&apos;ll get you set up.</p>
        <a href="https://lautzu.com/contact" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-8 py-4 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98]">Book a call <span aria-hidden>&rarr;</span></a>
        <p className="mt-4 font-mono text-[11px] text-ash">lautzu.com/contact</p>
      </div>
    );
  }
  if (!me.live) {
    return (
      <div className="mx-auto max-w-2xl py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-lime">Welcome to Bokuzu</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-bone">Your dashboard is being set up</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ash">You will receive an email confirmation once your ad accounts have been connected and your dashboard is live. Your Google and Meta data will then appear here, updated every 24 hours.</p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-bone">{me.brand} dashboard</h1>
      <div className="mt-6 rounded-2xl border border-plum-line bg-plum-raise p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ok">Connected</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">Your ad accounts are connected. Your Google and Meta performance appears here, updated every 24 hours. The first numbers land after the next daily sync.</p>
      </div>
    </div>
  );
}

// ── Support ───────────────────────────────────────────────────────────────────
function Support() {
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/portal/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
    setBusy(false);
    const j = await r.json().catch(() => ({}));
    if (r.ok) setTicket(j.ticketNo); else setErr(j.error || "Could not send.");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card title="Support">
        {ticket ? (
          <>
            <p className="text-sm text-bone">Thanks. Your ticket <span className="font-mono text-lime">{ticket}</span> has been created and we&apos;ve emailed you a copy. Our team will reply shortly.</p>
            <button onClick={() => { setTicket(null); setMessage(""); }} className="mt-4 rounded-full border border-plum-line px-4 py-2 text-sm text-bone hover:border-lime">Raise another</button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-ash">Tell us exactly what you need help with. This reaches our team, and you&apos;ll get an email with your ticket number.</p>
            <form onSubmit={send} className="space-y-3">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What can we help you with?" rows={6} className={`${input} resize-y`} />
              {err && <p className="font-mono text-[11px] text-bad">{err}</p>}
              <button type="submit" disabled={busy || !message.trim()} className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink hover:bg-lime-press disabled:opacity-40">{busy ? "Sending…" : "Submit"}</button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
const input = "w-full rounded-xl border border-plum-line bg-ink px-4 py-2.5 text-sm text-bone placeholder:text-ash/60 focus:border-lime";
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-plum-line bg-plum-raise p-6"><h2 className="mb-4 text-sm font-semibold text-bone">{title}</h2>{children}</section>;
}

function Settings({ me, devices, smsAvailable, onChange }: { me: Me; devices: Device[]; smsAvailable: boolean; onChange: () => void }) {
  const [phone, setPhone] = useState(me.phone || "");
  const [sms, setSms] = useState(me.smsCodes);
  const [msg, setMsg] = useState("");

  const acct = (action: string, body: object) => fetch("/api/portal/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...body }) });
  const savePhone = async () => { const r = await acct("phone", { phone }); setMsg(r.ok ? "Mobile number saved." : (await r.json()).error || "Failed."); if (r.ok) onChange(); };
  const toggleSms = async () => { const nv = !sms; setSms(nv); const r = await acct("smsCodes", { smsCodes: nv }); if (!r.ok) { setSms(!nv); setMsg((await r.json()).error || "Failed."); } };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-bone">Settings</h1>

      <Card title="Sign-in">
        <p className="text-sm text-ash">You sign in with <span className="text-bone">{me.email}</span> using a one-time code. No password to remember. To change your email, contact support.</p>
      </Card>

      <Authenticator enabled={me.authenticator} onChange={onChange} />

      {smsAvailable && (
        <Card title="Login codes">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Mobile number (for SMS codes)</span>
          <div className="flex gap-2">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 1234" className={input} />
            <button onClick={savePhone} className="shrink-0 rounded-full border border-plum-line px-4 text-sm text-bone hover:border-lime hover:bg-lime hover:text-ink">Save</button>
          </div>
          <button onClick={toggleSms} disabled={!me.phone} className="mt-4 flex w-full items-center justify-between rounded-xl border border-plum-line bg-plum px-4 py-3 text-left disabled:opacity-50">
            <span><span className="block text-sm text-bone">Text my code to my mobile</span><span className="block font-mono text-[11px] text-ash">{me.phone ? "A code is texted alongside email." : "Add a mobile number first."}</span></span>
            <Switch on={sms} />
          </button>
          {msg && <p className="mt-3 font-mono text-[11px] text-ok">{msg}</p>}
        </Card>
      )}

      <Card title="Devices signed in">
        {devices.length === 0 ? <p className="font-mono text-[11px] text-ash">No remembered devices.</p> : (
          <ul className="divide-y divide-plum-line/70">
            {devices.map((d) => <DeviceRow key={d.id} d={d} onChange={onChange} />)}
          </ul>
        )}
        <p className="mt-3 font-mono text-[11px] text-ash">Name a device (e.g. My home laptop) so you recognise it. Remembered devices skip the code for up to 30 days.</p>
      </Card>
    </div>
  );
}

function Authenticator({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const begin = async () => {
    setErr("");
    const r = await fetch("/api/portal/totp");
    setSetup(await r.json());
  };
  const confirm = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/portal/totp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: setup?.secret, code }) });
    setBusy(false);
    if (r.ok) { setSetup(null); setCode(""); onChange(); } else setErr((await r.json()).error || "Failed.");
  };
  const disable = async () => {
    const c = window.prompt("Enter a current code from your authenticator app to turn it off:");
    if (!c) return;
    const r = await fetch("/api/portal/totp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "disable", code: c }) });
    if (r.ok) onChange();
  };

  return (
    <Card title="Authenticator app (Google Authenticator)">
      {enabled ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ash"><span className="text-ok">Enabled.</span> You sign in with a code from your authenticator app instead of email.</p>
          <button onClick={disable} className="shrink-0 rounded-full border border-plum-line px-3.5 py-1.5 font-mono text-[11px] text-bad hover:border-bad">Turn off</button>
        </div>
      ) : setup ? (
        <div>
          <p className="text-sm text-ash">Scan this with Google Authenticator (or Authy), then enter the 6-digit code it shows.</p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="Authenticator QR code" className="h-40 w-40 rounded-lg border border-plum-line" />
            <div className="flex-1">
              <p className="font-mono text-[11px] text-ash">Or enter this key manually:</p>
              <p className="mt-1 break-all font-mono text-[11px] text-bone">{setup.secret}</p>
              <div className="mt-4 flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" inputMode="numeric" className={`${input} font-mono`} />
                <button onClick={confirm} disabled={busy || code.length < 6} className="shrink-0 rounded-full bg-lime px-4 text-sm font-semibold text-ink hover:bg-lime-press disabled:opacity-40">Enable</button>
              </div>
              {err && <p className="mt-2 font-mono text-[11px] text-bad">{err}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ash">Free. Use an authenticator app for your login codes instead of waiting for email.</p>
          <button onClick={begin} className="shrink-0 rounded-full border border-plum-line px-3.5 py-1.5 text-sm text-bone hover:border-lime hover:bg-lime hover:text-ink">Set up</button>
        </div>
      )}
    </Card>
  );
}

function DeviceRow({ d, onChange }: { d: Device; onChange: () => void }) {
  const [label, setLabel] = useState(d.label || "");
  const [busy, setBusy] = useState(false);
  const dirty = label.trim() !== (d.label || "");

  const save = async () => {
    setBusy(true);
    await fetch("/api/portal/devices", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: d.id, label }) });
    setBusy(false);
    onChange();
  };
  const remove = async () => {
    await fetch("/api/portal/devices", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: d.id }) });
    onChange();
  };

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name this device" className={`${input} min-w-0`} />
          <button onClick={save} disabled={busy || !dirty} className="shrink-0 rounded-full border border-plum-line px-3 text-sm text-bone hover:border-lime hover:bg-lime hover:text-ink disabled:opacity-40">Save</button>
        </div>
        <p className="mt-1 font-mono text-[11px] text-ash">{d.current && <span className="text-lime">this device · </span>}last active {new Date(d.lastSeen).toLocaleDateString()}</p>
      </div>
      <button onClick={remove} className="shrink-0 self-start rounded-full border border-plum-line px-3 py-1.5 font-mono text-[11px] text-bad hover:border-bad sm:self-auto">Remove</button>
    </li>
  );
}

function Switch({ on }: { on: boolean }) {
  return <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-lime" : "bg-plum-line"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} /></span>;
}
