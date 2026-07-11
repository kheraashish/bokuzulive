import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { dbConfigured } from "@/lib/db/pool";
import { setAgencyOnboarded } from "@/lib/db/users";

export const runtime = "nodejs";

// Records the one-question answer: have you onboarded with the Lautzu agency? yes | no.
export async function POST(req: Request) {
  const ctx = await currentContext();
  if (!ctx || !ctx.client) return NextResponse.json({ error: "finish account setup first" }, { status: 400 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { onboarded } = (await req.json().catch(() => ({}))) as { onboarded?: string };
  if (onboarded !== "yes" && onboarded !== "no") return NextResponse.json({ error: "answer yes or no" }, { status: 400 });
  await setAgencyOnboarded(ctx.client.id, onboarded);
  return NextResponse.json({ ok: true });
}
