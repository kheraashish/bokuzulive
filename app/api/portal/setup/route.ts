import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { dbConfigured } from "@/lib/db/pool";
import { completeSetup } from "@/lib/db/users";

export const runtime = "nodejs";

// First-sign-in setup: the new user provides their company details; we create a pending company
// and link them as its owner. The operator then connects their ad accounts and the portal goes live.
export async function POST(req: Request) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (ctx.client) return NextResponse.json({ ok: true, slug: ctx.client.slug }); // already set up

  const { companyName, website, country, phone } = (await req.json().catch(() => ({}))) as {
    companyName?: string; website?: string; country?: string; phone?: string;
  };
  if (!companyName?.trim()) return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  if (!country?.trim()) return NextResponse.json({ error: "Country is required." }, { status: 400 });
  if (website && website.trim() && !/^([a-z]+:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(website.trim())) {
    return NextResponse.json({ error: "Enter a valid website." }, { status: 400 });
  }

  await completeSetup(ctx.user.id, { companyName: companyName.trim(), website, country: country.trim(), phone });
  return NextResponse.json({ ok: true });
}
