"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Operator sign-in for the /admin console. Posts the shared OPERATOR_KEY to /api/admin/login.
export default function AdminLogin() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Sign in failed.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl border border-plum-line bg-plum p-7 shadow-lift">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ash">Operator console</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-bone">Sign in</h1>
        <p className="mt-2 text-sm text-ash">Enter your operator password.</p>
        <input
          type="password"
          autoFocus
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Operator password"
          className="mt-5 w-full rounded-xl border border-plum-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-ash/60 focus:border-lime"
        />
        {error && <p className="mt-3 font-mono text-[11px] text-bad">{error}</p>}
        <button
          type="submit"
          disabled={busy || !key}
          className="mt-5 w-full rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:bg-lime-press active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? "Checking…" : "Enter console"}
        </button>
      </form>
    </main>
  );
}
