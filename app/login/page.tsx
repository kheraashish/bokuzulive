"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_SLUG, getClient } from "@/lib/demo/clients";

// Client portal sign-in. DEMO auth: on submit we set a plain `bokuzu_portal` cookie and route to
// the client's vanity dashboard (/<company>). In production this becomes email + OTP setting an
// httpOnly, HMAC-signed session; the slug is only a label, access is the signed session.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [next, setNext] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 1;

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next") || "";
    setNext(n);
  }, []);

  const signIn = () => {
    // Route to the requested company if it exists, otherwise the demo client.
    const slug = getClient(next) ? next : DEMO_SLUG;
    document.cookie = `bokuzu_portal=${slug}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    router.push(`/${slug}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-shell items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-ash transition-colors hover:text-bone"
        >
          <span
            aria-hidden
            className="transition-transform duration-200 ease-out group-hover:-translate-x-1"
          >
            &larr;
          </span>
          Back to site
        </Link>
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">
            b
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-bone">bokuzu</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24 pt-6">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-plum-line bg-plum p-7 shadow-lift sm:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
              Client portal
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-bone">
              Sign in to your portal
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Your Google and Meta ad performance, one place, updated daily.
            </p>

            <form
              className="mt-7 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) signIn();
              }}
            >
              <Field
                id="email"
                label="Work email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                value={email}
                onChange={setEmail}
              />
              <Field
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
              />

              <button
                type="submit"
                disabled={!valid}
                className="w-full rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Enter portal
              </button>
            </form>

            <p className="mt-4 rounded-xl border border-plum-line bg-plum-press px-4 py-3 font-mono text-[11px] leading-relaxed text-ash">
              Demo: any email and password open the Demo Client sample portal.
            </p>

            <div className="rule mt-7" />
            <p className="mt-5 text-sm text-ash">
              Not a client yet?{" "}
              <Link
                href="/#waitlist"
                className="text-lime underline-offset-4 transition-colors hover:underline"
              >
                Request access
              </Link>
            </p>
          </div>

          <p className="mt-5 px-1 text-center font-mono text-[11px] text-ash">
            Your own credentials. Canadian data residency.
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ash"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-plum-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-ash/60 transition-colors duration-200 ease-out focus:border-lime"
      />
    </div>
  );
}
