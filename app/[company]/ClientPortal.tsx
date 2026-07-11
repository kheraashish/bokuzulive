"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  brand: string;
  slug: string;
  email: string | null;
  phone: string | null;
  twofaEmail: boolean;
  twofaSms: boolean;
}
interface Device { id: string; label: string | null; userAgent: string | null; lastSeen: string; current: boolean }
interface Conn { platform: string; status: string; accountId: string | null }

type Tab = "overview" | "settings" | "support";

export function ClientPortal({ profile, devices, connections }: { profile: Profile; devices: Device[]; connections: Conn[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [signOutOpen, setSignOutOpen] = useState(false);

  const signOut = async (forgetDevice: boolean) => {
    await fetch("/api/portal/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ forgetDevice }) });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-plum-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-shell items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-lime">Bokuzu</span>
              <span className="text-plum-line" aria-hidden>|</span>
              <span className="text-[15px] font-semibold tracking-tight text-bone">{profile.brand}</span>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setSignOutOpen((v) => !v)} className="rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone hover:border-ash hover:bg-plum-raise">Sign out</button>
            {signOutOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-plum-line bg-plum p-3 shadow-lift">
                <button onClick={() => signOut(false)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-bone hover:bg-plum-raise">Sign out (keep this device trusted)</button>
                <button onClick={() => signOut(true)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-bad hover:bg-plum-raise">Sign out & forget this device</button>
                <p className="mt-2 px-3 font-mono text-[10px] text-ash">Keeping the device trusted skips the code next time here.</p>
              </div>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-shell gap-1 px-5 sm:px-8">
          {(["overview", "settings", "support"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-2.5 text-sm capitalize transition-colors ${tab === t ? "border-lime text-bone" : "border-transparent text-ash hover:text-bone"}`}>{t}</button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-shell px-5 py-8 sm:px-8">
        {tab === "overview" && <Overview brand={profile.brand} connections={connections} />}
        {tab === "settings" && <Settings profile={profile} devices={devices} onChange={() => router.refresh()} />}
        {tab === "support" && <Support brand={profile.brand} />}
      </main>
    </div>
  );
}

function Overview({ brand, connections }: { brand: string; connections: Conn[] }) {
  const linked = connections.filter((c) => c.accountId);
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-bone">Welcome, {brand}</h1>
      <div className="mt-6 rounded-2xl border border-plum-line bg-plum-raise p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-lime">Setup in progress</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">
          Your dashboard turns on once your ad accounts are connected and the first daily sync runs.
          Your numbers will appear here automatically, updated every 24 hours.
        </p>
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2">
          {["google", "meta"].map((p) => {
            const c = connections.find((x) => x.platform === p);
            const ok = Boolean(c?.accountId);
            return (
              <div key={p} className="flex items-center justify-between rounded-xl border border-plum-line bg-plum px-4 py-3 text-sm">
                <span className="text-bone">{p === "google" ? "Google Ads" : "Meta Ads"}</span>
                <span className={`font-mono text-[11px] ${ok ? "text-ok" : "text-ash"}`}>{ok ? "linked" : "pending"}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-6 font-mono text-[11px] text-ash">{linked.length} of 2 ad platforms linked.</p>
      </div>
    </div>
  );
}

function Settings({ profile, devices, onChange }: { profile: Profile; devices: Device[]; onChange: () => void }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-bone">Settings</h1>
      <Account profile={profile} onChange={onChange} />
      <Security profile={profile} onChange={onChange} />
      <Devices devices={devices} onChange={onChange} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-plum-line bg-plum-raise p-6">
      <h2 className="mb-4 text-sm font-semibold text-bone">{title}</h2>
      {children}
    </section>
  );
}

function post(action: string, body: object) {
  return fetch("/api/portal/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...body }) });
}

function Account({ profile, onChange }: { profile: Profile; onChange: () => void }) {
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [msg, setMsg] = useState("");

  const saveEmail = async () => {
    const r = await post("email", { email });
    setMsg(r.ok ? "Email updated." : (await r.json()).error || "Failed."); if (r.ok) onChange();
  };
  const savePhone = async () => {
    const r = await post("phone", { phone });
    setMsg(r.ok ? "Phone updated." : (await r.json()).error || "Failed."); if (r.ok) onChange();
  };

  return (
    <Card title="Account">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Inline label="Login email" value={email} onChange={setEmail} onSave={saveEmail} placeholder="you@company.com" />
        <Inline label="Mobile number (for SMS codes)" value={phone} onChange={setPhone} onSave={savePhone} placeholder="+1 555 000 1234" />
      </div>
      {msg && <p className="mt-3 font-mono text-[11px] text-ok">{msg}</p>}
    </Card>
  );
}

function Security({ profile, onChange }: { profile: Profile; onChange: () => void }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [twoEmail, setTwoEmail] = useState(profile.twofaEmail);
  const [twoSms, setTwoSms] = useState(profile.twofaSms);

  const changePw = async () => {
    const r = await post("password", { currentPassword: cur, newPassword: nw });
    setPwMsg(r.ok ? "Password changed." : (await r.json()).error || "Failed.");
    if (r.ok) { setCur(""); setNw(""); }
  };
  const toggle = async (email: boolean, sms: boolean) => {
    setTwoEmail(email); setTwoSms(sms);
    await post("twofa", { twofaEmail: email, twofaSms: sms });
    onChange();
  };

  return (
    <Card title="Security">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Two-factor authentication</p>
      <div className="space-y-2">
        <Toggle label="Email one-time codes" desc="A code is emailed on new devices." on={twoEmail} onClick={() => toggle(!twoEmail, twoSms)} />
        <Toggle label="Mobile (SMS) one-time codes" desc={profile.phone ? "A code is texted to your mobile." : "Add a mobile number above first."} on={twoSms} onClick={() => toggle(twoEmail, !twoSms)} disabled={!profile.phone} />
      </div>

      <div className="rule my-6" />
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">Change password</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" className={inputCls} />
        <input type="password" value={nw} onChange={(e) => setNw(e.target.value)} placeholder="New password" className={inputCls} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={changePw} disabled={!cur || nw.length < 8} className="rounded-full bg-lime px-5 py-2 text-sm font-semibold text-ink hover:bg-lime-press disabled:opacity-40">Change password</button>
        {pwMsg && <span className="font-mono text-[11px] text-ash">{pwMsg}</span>}
      </div>
    </Card>
  );
}

function Devices({ devices, onChange }: { devices: Device[]; onChange: () => void }) {
  const remove = async (id: string) => {
    await fetch("/api/portal/devices", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    onChange();
  };
  return (
    <Card title="Devices signed in">
      {devices.length === 0 ? (
        <p className="font-mono text-[11px] text-ash">No remembered devices.</p>
      ) : (
        <ul className="divide-y divide-plum-line/70">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-bone">{d.label || "Device"} {d.current && <span className="font-mono text-[10px] text-lime">· this device</span>}</p>
                <p className="font-mono text-[11px] text-ash">last active {new Date(d.lastSeen).toLocaleDateString()}</p>
              </div>
              <button onClick={() => remove(d.id)} className="rounded-full border border-plum-line px-3 py-1.5 font-mono text-[11px] text-bad hover:border-bad">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Support({ brand }: { brand: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/portal/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, message }) });
    setBusy(false);
    if (r.ok) setDone(true); else setErr((await r.json()).error || "Could not send.");
  };

  if (done) return (
    <Card title="Support">
      <p className="text-sm text-bone">Thanks, {brand}. Your ticket reached our team and we&apos;ll reply by email shortly.</p>
      <button onClick={() => { setDone(false); setSubject(""); setMessage(""); }} className="mt-4 rounded-full border border-plum-line px-4 py-2 text-sm text-bone hover:border-lime">Raise another</button>
    </Card>
  );

  return (
    <Card title="Raise a support ticket">
      <p className="mb-4 text-sm text-ash">Questions about your numbers, access, or anything else. This reaches us at info@lautzu.com.</p>
      <form onSubmit={send} className="space-y-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inputCls} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={5} className={`${inputCls} resize-y`} />
        {err && <p className="font-mono text-[11px] text-bad">{err}</p>}
        <button type="submit" disabled={busy || !subject.trim() || !message.trim()} className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink hover:bg-lime-press disabled:opacity-40">{busy ? "Sending…" : "Send ticket"}</button>
      </form>
    </Card>
  );
}

const inputCls = "w-full rounded-xl border border-plum-line bg-ink px-4 py-2.5 text-sm text-bone placeholder:text-ash/60 focus:border-lime";

function Inline({ label, value, onChange, onSave, placeholder }: { label: string; value: string; onChange: (v: string) => void; onSave: () => void; placeholder?: string }) {
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
        <button onClick={onSave} className="shrink-0 rounded-full border border-plum-line px-4 text-sm text-bone hover:border-lime hover:bg-lime hover:text-ink">Save</button>
      </div>
    </div>
  );
}

function Toggle({ label, desc, on, onClick, disabled }: { label: string; desc: string; on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex w-full items-center justify-between rounded-xl border border-plum-line bg-plum px-4 py-3 text-left disabled:opacity-50">
      <span>
        <span className="block text-sm text-bone">{label}</span>
        <span className="block font-mono text-[11px] text-ash">{desc}</span>
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-lime" : "bg-plum-line"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
