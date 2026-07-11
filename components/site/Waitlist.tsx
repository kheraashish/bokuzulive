"use client";

import { useState } from "react";
import { SectionShell, Dot } from "./ui";

// NOTE: this form is presentation-only. Wire the submit handler to a route handler / CRM inbox
// before launch so requests are actually persisted. It intentionally does not claim to store
// anything it cannot; the confirmation copy stays honest about that.
export function Waitlist() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <SectionShell id="waitlist" className="py-24 lg:py-32">
      <div className="relative overflow-hidden rounded-2xl border border-plum-line bg-plum-raise p-8 sm:p-12 lg:p-16">
        <div className="relative max-w-2xl">
          <p className="kicker">Early access</p>
          <h2 className="display-lg mt-4 text-bone">
            Run one honest pipeline before you trust it with a real prospect.
          </h2>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ash">
            Bokuzu is in a single-operator pilot. Request access and we will reach out when a seat
            opens. One email about your invite, nothing else.
          </p>

          <p className="mt-6 max-w-prose rounded-xl border border-plum-line bg-plum px-4 py-3 text-sm leading-relaxed text-bone/90">
            The client portal is live today for every Lautzu engagement. The outreach engine is in a
            single-operator pilot — request a seat below.
          </p>

          {done ? (
            <div className="mt-9 flex items-center gap-3 rounded-xl border border-ok/40 bg-plum px-5 py-4">
              <Dot tone="ok" />
              <p className="text-sm text-bone">
                Request noted for{" "}
                <span className="font-mono text-lime">{email}</span>. We will be in touch.
              </p>
            </div>
          ) : (
            <form
              className="mt-9 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) setDone(true);
              }}
            >
              <label htmlFor="wl-email" className="sr-only">
                Work email
              </label>
              <input
                id="wl-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full flex-1 rounded-full border border-plum-line bg-ink px-5 py-3 text-sm text-bone placeholder:text-ash/70 transition-colors duration-200 ease-out focus:border-lime"
              />
              <button
                type="submit"
                disabled={!valid}
                className="rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Request access
              </button>
            </form>
          )}

          <p className="mt-4 font-mono text-[11px] text-ash">
            Public-data audits only. Your own credentials. Canadian data residency.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
