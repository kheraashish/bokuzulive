import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { dbConfigured } from "@/lib/db/pool";
import { enableTotp, disableTotp, getTotpSecret } from "@/lib/db/users";
import { generateSecret, setupData, verifyTotp } from "@/lib/totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET  -> a fresh secret + QR to scan (not enabled until confirmed).
// POST { secret, code } -> confirm + enable.  { action: "disable", code } -> turn off.
export async function GET() {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const secret = generateSecret();
  const data = await setupData(ctx.user.email, secret);
  return NextResponse.json({ secret: data.secret, qr: data.qr });
}

export async function POST(req: Request) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; secret?: string; code?: string };

  if (body.action === "disable") {
    const secret = await getTotpSecret(ctx.user.id);
    if (secret && !(body.code && verifyTotp(body.code, secret))) {
      return NextResponse.json({ error: "Enter a current code from your app to turn it off." }, { status: 400 });
    }
    await disableTotp(ctx.user.id);
    return NextResponse.json({ ok: true });
  }

  // enable
  if (!body.secret || !body.code) return NextResponse.json({ error: "Missing code." }, { status: 400 });
  if (!verifyTotp(body.code, body.secret)) return NextResponse.json({ error: "That code did not match. Try again." }, { status: 400 });
  await enableTotp(ctx.user.id, body.secret);
  return NextResponse.json({ ok: true });
}
