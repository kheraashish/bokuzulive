import type { Metadata } from "next";
import { RedirectHome } from "./RedirectHome";

// Global not-found page. Shown for any unknown URL (bad path, typo, crawler guess) or when a route
// calls notFound(). Branded, reassuring, and auto-returns the visitor to the homepage.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="kicker mb-5">Error 404</p>

      <h1 className="display-md mb-4 max-w-xl text-balance">
        Looks like you took a wrong turn.
      </h1>

      <p className="mb-9 max-w-md text-pretty text-ash">
        That page doesn&apos;t exist on bokuzu.com — the link may be mistyped or out of date.
        We&apos;re taking you back to the homepage.
      </p>

      <a
        href="/"
        className="rounded-full bg-lime px-7 py-3.5 text-sm font-semibold text-ink shadow-glow transition-transform duration-200 ease-out hover:bg-lime-press active:scale-[0.98]"
      >
        Go to bokuzu.com now
      </a>

      <RedirectHome seconds={5} />
    </main>
  );
}
