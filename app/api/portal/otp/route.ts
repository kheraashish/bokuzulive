import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db/pool";
import { getClientForLogin } from "@/lib/db/auth";
import { issueCode } from "@/lib/otp";

export const runtime = "nodejs";

// Send a one-time code to an email. Used for first-time / forgot password and to resend a 2FA code.
// Always responds ok (never reveals whether the email exists), but only actually sends to a real client.
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Portal not configured yet." }, { status: 503 });
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const client = await getClientForLogin(email);
  if (!client) return NextResponse.json({ ok: true }); // do not leak account existence

  const dev = await issueCode(email);
  return NextResponse.json({ ok: true, devCode: dev.devCode });
}
