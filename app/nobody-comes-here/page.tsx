import { notFound } from "next/navigation";

// The dead path the WrongLetter section links to. It is a real 404 — same status, same branded page,
// same takeover film as any typo — it just doesn't ask the database first.
//
// Without this, /nobody-comes-here falls through to app/[company]/page.tsx, which does a DB lookup to
// tell a real client slug from junk. That is right for an unknown URL, but this URL is not unknown:
// we ship the link ourselves and we already know it is dead. Routing it through the database means a
// homepage CTA that 500s whenever the DB blips, plus a pointless query on every click.
//
// Everything else about the joke is unchanged: unmatched URLs still 404 through [company] exactly as
// before, and the address bar still reads like the punchline.
export const metadata = { robots: { index: false, follow: false } };

export default function NobodyComesHere() {
  notFound();
}
