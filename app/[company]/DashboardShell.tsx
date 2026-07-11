"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// The client's live dashboard header + body. Real Google/Meta numbers land here once the daily sync
// runs; until the first sync it shows a clean "connected, awaiting first data" state (honest, no
// fabricated numbers). White-label: the client's own logo shows in the header when set.
export function DashboardShell({ brand, logoUrl, email }: { brand: string; logoUrl: string | null; email: string }) {
  const router = useRouter();
  const signOut = async () => {
    await fetch("/api/portal/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ forgetDevice: false }) });
    router.push("/login"); router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-plum-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-shell items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt={brand} width={112} height={28} className="h-7 w-auto object-contain" unoptimized />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-md bg-lime font-mono text-sm font-bold text-ink">b</span>
            )}
            <div className="flex items-center gap-2.5">
              {!logoUrl && <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-lime">Bokuzu</span>}
              <span className="text-plum-line" aria-hidden>|</span>
              <span className="text-[15px] font-semibold tracking-tight text-bone">{brand}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/portal" className="rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone hover:border-ash hover:bg-plum-raise">Home</Link>
            <button onClick={signOut} className="rounded-full border border-plum-line px-3.5 py-1.5 text-xs font-medium text-bone hover:border-ash hover:bg-plum-raise">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-shell px-5 py-8 sm:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-bone">{brand} dashboard</h1>
        <div className="mt-6 rounded-2xl border border-plum-line bg-plum-raise p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ok">Connected</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">
            Your ad accounts are connected. Your Google and Meta performance appears here, updated every 24 hours.
            The first numbers land after the next daily sync.
          </p>
          <p className="mt-4 font-mono text-[11px] text-ash">Signed in as {email}</p>
        </div>
      </main>
    </div>
  );
}
