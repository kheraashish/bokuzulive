"use client";

import { useEffect, useState } from "react";
import { SectionShell, Dot } from "./ui";

// Early-access request. Step 1: enter email + click Request access. Step 2: a modal asks for the
// company website (Confirm stays disabled until it's filled). On confirm we POST to
// /api/portal/waitlist, which emails the request to support@bokuzu.com. Nothing is claimed as
// "noted" unless the send actually succeeds.
export function Waitlist() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const websiteValid = website.trim().length > 0;

  // Escape closes the modal.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, submitting]);

  const openModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return;
    setError(null);
    setModalOpen(true);
  };

  const confirm = async () => {
    if (!websiteValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not submit right now. Please try again.");
        return;
      }
      setModalOpen(false);
      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-t border-lime/40">
      <SectionShell id="waitlist" className="py-10 sm:py-12 lg:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-plum-line bg-plum-raise p-8 sm:p-12 lg:p-16">
          <div className="relative max-w-2xl">
            <p className="kicker">Early access</p>
            <h2 className="display-lg mt-4 text-bone">Want the dashboard without the agency?</h2>
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-ash">
              Bokuzu&apos;s portal is coming as a standalone subscription: connect your own Google and
              Meta ad accounts and see where every dollar went, what it made back, and where your
              ROAS trend is heading — over any date range you pick. Every change in your accounts,
              logged the moment it happens. No fabricated cross-platform numbers. No last-click
              theatre. Request access and we&apos;ll reach out when a seat opens. One email about your
              invite, nothing else.
            </p>

            <p className="mt-6 max-w-prose rounded-xl border border-plum-line bg-plum px-4 py-3 text-sm leading-relaxed text-bone/90">
              The portal is live today for every Lautzu engagement. Standalone subscriptions are in
              early access — request a seat below.
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
              <form className="mt-9 flex flex-col gap-3 sm:flex-row" onSubmit={openModal}>
                <label htmlFor="wl-email" className="sr-only">
                  Work email
                </label>
                <input
                  id="wl-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full flex-1 rounded-full border border-plum-line bg-ink px-5 py-3 text-sm text-bone placeholder:text-ash/70 transition-colors duration-200 ease-out focus:border-lime"
                />
                <button
                  type="submit"
                  disabled={!emailValid}
                  className="rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  Request access
                </button>
              </form>
            )}

            <p className="mt-4 font-mono text-[11px] text-ash">
              Your own credentials. Canadian data residency.
            </p>
          </div>
        </div>
      </SectionShell>
      </div>

      {/* Step 2: company-website modal. Confirm is disabled until a website is entered. */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) setModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wl-modal-title"
            className="w-full max-w-md rounded-2xl border border-plum-line bg-plum-raise p-6 shadow-lift sm:p-8"
          >
            <p className="kicker">One more thing</p>
            <h3 id="wl-modal-title" className="mt-3 text-2xl font-semibold tracking-tight text-bone">
              Your company website
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              So we can take a quick, honest look before we reach out. We assess only public data —
              nothing from your ad accounts.
            </p>

            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                confirm();
              }}
            >
              <label htmlFor="wl-website" className="sr-only">
                Company website
              </label>
              <input
                id="wl-website"
                type="text"
                inputMode="url"
                autoFocus
                required
                placeholder="yourcompany.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-full border border-plum-line bg-ink px-5 py-3 text-sm text-bone placeholder:text-ash/70 transition-colors duration-200 ease-out focus:border-lime"
              />

              {error && (
                <p className="mt-3 font-mono text-[11px] text-bad" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => !submitting && setModalOpen(false)}
                  disabled={submitting}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-plum-line px-5 text-sm font-medium text-bone transition-colors duration-200 ease-out hover:border-ash disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!websiteValid || submitting}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-lime px-5 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {submitting ? "Sending…" : "Confirm request"}
                </button>
              </div>
            </form>

            <p className="mt-4 font-mono text-[11px] text-ash">
              Requesting access for <span className="text-bone/80">{email}</span>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
