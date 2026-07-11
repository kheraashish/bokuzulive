"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "password" | "otp" | "setpw";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("");

  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get("next") || "");
  }, []);

  const go = (slug: string) => {
    router.push(`/${slug || next || ""}`.replace(/\/$/, "") || "/");
    router.refresh();
  };

  const post = (url: string, body: unknown) =>
    fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await post("/api/portal/login", { email, password });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (j.status === "ok") return go(j.slug);
    if (j.status === "2fa") { setMethod(j.method); setDevCode(j.devCode); setStep("otp"); return; }
    if (j.status === "setup") { await sendCode(); setStep("setpw"); return; }
    setError(j.error || "Sign in failed.");
  };

  const sendCode = async () => {
    const res = await post("/api/portal/otp", { email });
    const j = await res.json().catch(() => ({}));
    setDevCode(j.devCode);
  };

  const doVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await post("/api/portal/verify", { code, remember });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (j.status === "ok") return go(j.slug);
    setError(j.error || "Wrong code.");
  };

  const doSetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await post("/api/portal/set-password", { email, code, password: newPw });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (j.status === "ok") return go(j.slug);
    setError(j.error || "Could not set password.");
  };

  const startForgot = async () => {
    setError("");
    if (!email) { setError("Enter your email first."); return; }
    await sendCode();
    setStep("setpw");
  };

  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-shell items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="group inline-flex items-center gap-2 text-sm text-ash transition-colors hover:text-bone">
          <span aria-hidden className="transition-transform group-hover:-translate-x-1">&larr;</span> Back to site
        </Link>
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
          <span className="text-[17px] font-semibold tracking-tight text-bone">bokuzu</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24 pt-6">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-plum-line bg-plum p-7 shadow-lift sm:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">Client portal</p>

            {step === "password" && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Sign in to your portal</h1>
                <p className="mt-2 text-sm leading-relaxed text-ash">Your Google and Meta ad performance, one place, updated daily.</p>
                <form className="mt-7 space-y-4" onSubmit={doLogin}>
                  <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                  <Field id="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} placeholder="••••••••" />
                  {error && <p className="font-mono text-[11px] text-bad">{error}</p>}
                  <button type="submit" disabled={busy || !email || !password} className={btnPrimary}>{busy ? "Signing in…" : "Sign in"}</button>
                </form>
                <button onClick={startForgot} className="mt-4 font-mono text-[11px] text-ash underline-offset-4 hover:text-bone hover:underline">
                  First time here, or forgot password?
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Enter your code</h1>
                <p className="mt-2 text-sm leading-relaxed text-ash">
                  We sent a 6-digit code to your {method === "sms" ? "phone" : "email"}. Enter it to finish signing in.
                </p>
                {devCode && <DevHint code={devCode} />}
                <form className="mt-6 space-y-4" onSubmit={doVerify}>
                  <Field id="code" label="6-digit code" value={code} onChange={setCode} placeholder="123456" mono inputMode="numeric" />
                  <label className="flex items-center gap-2 text-sm text-ash">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-lime" />
                    Remember this device (skip codes here next time)
                  </label>
                  {error && <p className="font-mono text-[11px] text-bad">{error}</p>}
                  <button type="submit" disabled={busy || code.length < 6} className={btnPrimary}>{busy ? "Verifying…" : "Verify & sign in"}</button>
                </form>
                <button onClick={sendCode} className="mt-4 font-mono text-[11px] text-ash underline-offset-4 hover:text-bone hover:underline">Resend code</button>
              </>
            )}

            {step === "setpw" && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Set your password</h1>
                <p className="mt-2 text-sm leading-relaxed text-ash">We emailed a 6-digit code to <span className="text-bone">{email}</span>. Enter it and choose a password.</p>
                {devCode && <DevHint code={devCode} />}
                <form className="mt-6 space-y-4" onSubmit={doSetPw}>
                  <Field id="code2" label="6-digit code" value={code} onChange={setCode} placeholder="123456" mono inputMode="numeric" />
                  <Field id="newpw" label="New password" type="password" autoComplete="new-password" value={newPw} onChange={setNewPw} placeholder="At least 8 chars, upper, lower, number" />
                  {error && <p className="font-mono text-[11px] text-bad">{error}</p>}
                  <button type="submit" disabled={busy || code.length < 6 || newPw.length < 8} className={btnPrimary}>{busy ? "Saving…" : "Set password & sign in"}</button>
                </form>
                <button onClick={() => { setStep("password"); setError(""); }} className="mt-4 font-mono text-[11px] text-ash underline-offset-4 hover:text-bone hover:underline">Back to sign in</button>
              </>
            )}

            <div className="rule mt-7" />
            <p className="mt-5 text-sm text-ash">
              Not a client yet? <Link href="/#waitlist" className="text-lime underline-offset-4 hover:underline">Request access</Link>
            </p>
          </div>
          <p className="mt-5 px-1 text-center font-mono text-[11px] text-ash">Your own credentials. Canadian data residency.</p>
        </div>
      </div>
    </main>
  );
}

const btnPrimary =
  "w-full rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

function DevHint({ code }: { code: string }) {
  return (
    <p className="mt-4 rounded-xl border border-warn/40 bg-plum-press px-4 py-2 font-mono text-[11px] text-warn">
      Dev mode (no email server yet): your code is <span className="text-bone">{code}</span>
    </p>
  );
}

function Field({ id, label, value, onChange, placeholder, type = "text", autoComplete, mono, inputMode }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; autoComplete?: string; mono?: boolean; inputMode?: "numeric" | "text";
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-plum-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-ash/60 focus:border-lime ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
