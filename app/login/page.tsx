"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Passwordless sign-in: enter email -> we email a 6-digit code (valid 30 minutes) -> verify.
// A new email creates an account automatically. Trusted devices skip the code for up to 30 days.
export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "totp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const post = (url: string, body: unknown) =>
    fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  const done = () => { router.push("/portal"); router.refresh(); };

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await post("/api/portal/start", { email });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (j.status === "ok") return done();               // trusted device, no code needed
    if (j.status === "otp") { setDevCode(j.devCode); setStep("otp"); return; }
    if (j.status === "totp") { setStep("totp"); return; } // uses their authenticator app
    setError(j.error || "Something went wrong.");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await post("/api/portal/verify", { email, code, remember });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (j.status === "ok") return done();
    setError(j.error || "Wrong code.");
  };

  const resend = async () => { const r = await post("/api/portal/start", { email }); setDevCode((await r.json()).devCode); };

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

            {step === "totp" ? (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Enter your app code</h1>
                <p className="mt-2 text-sm leading-relaxed text-ash">Open your authenticator app and enter the current 6-digit code for Bokuzu.</p>
                <form className="mt-6 space-y-4" onSubmit={verify}>
                  <Field id="tcode" label="6-digit code" value={code} onChange={setCode} placeholder="123456" mono inputMode="numeric" />
                  <label className="flex items-center gap-2 text-sm text-ash">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-lime" />
                    Remember me on this device (30 days)
                  </label>
                  {error && <p className="font-mono text-[11px] text-bad">{error}</p>}
                  <button type="submit" disabled={busy || code.length < 6} className={btn}>{busy ? "Verifying…" : "Verify & sign in"}</button>
                </form>
                <button onClick={() => { setStep("email"); setError(""); setCode(""); }} className="mt-4 font-mono text-[11px] text-ash underline-offset-4 hover:text-bone hover:underline">Use a different email</button>
              </>
            ) : step === "email" ? (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Sign in with your email</h1>
                <p className="mt-2 text-sm leading-relaxed text-ash">No password needed. We email you a 6-digit code to sign in.</p>
                <form className="mt-7 space-y-4" onSubmit={start}>
                  <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                  {error && <p className="font-mono text-[11px] text-bad">{error}</p>}
                  <button type="submit" disabled={busy || !email} className={btn}>{busy ? "Sending code…" : "Email me a code"}</button>
                </form>
              </>
            ) : (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">Enter your code</h1>
                <p className="mt-2 text-sm leading-relaxed text-ash">We emailed a 6-digit code to <span className="text-bone">{email}</span>. It is valid for 30 minutes.</p>
                {devCode && (
                  <p className="mt-4 rounded-xl border border-warn/40 bg-plum-press px-4 py-2 font-mono text-[11px] text-warn">
                    Dev mode (no email server yet): your code is <span className="text-bone">{devCode}</span>
                  </p>
                )}
                <form className="mt-6 space-y-4" onSubmit={verify}>
                  <Field id="code" label="6-digit code" value={code} onChange={setCode} placeholder="123456" mono inputMode="numeric" />
                  <label className="flex items-center gap-2 text-sm text-ash">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-lime" />
                    Remember me on this device (30 days)
                  </label>
                  {error && <p className="font-mono text-[11px] text-bad">{error}</p>}
                  <button type="submit" disabled={busy || code.length < 6} className={btn}>{busy ? "Verifying…" : "Verify & sign in"}</button>
                </form>
                <div className="mt-4 flex items-center gap-4">
                  <button onClick={resend} className="font-mono text-[11px] text-ash underline-offset-4 hover:text-bone hover:underline">Resend code</button>
                  <button onClick={() => { setStep("email"); setError(""); setCode(""); }} className="font-mono text-[11px] text-ash underline-offset-4 hover:text-bone hover:underline">Use a different email</button>
                </div>
              </>
            )}

            <div className="rule mt-7" />
            <p className="mt-5 text-sm text-ash">
              New here? Just enter your email above, we&apos;ll create your account.
            </p>
          </div>
          <p className="mt-5 px-1 text-center font-mono text-[11px] text-ash">Passwordless and secure. Canadian data residency.</p>
        </div>
      </div>
    </main>
  );
}

const btn = "w-full rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

function Field({ id, label, value, onChange, placeholder, type = "text", autoComplete, mono, inputMode }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; autoComplete?: string; mono?: boolean; inputMode?: "numeric" | "text";
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{label}</span>
      <input id={id} type={type} autoComplete={autoComplete} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full rounded-xl border border-plum-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-ash/60 focus:border-lime ${mono ? "font-mono" : ""}`} />
    </label>
  );
}
