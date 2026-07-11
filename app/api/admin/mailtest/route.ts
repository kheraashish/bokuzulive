import { NextResponse } from "next/server";
import { checkOperatorKey } from "@/lib/adminAuth";
import { sendMail, mailConfigured } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnostic: GET /api/admin/mailtest?key=<OPERATOR_KEY>&to=<email>
// Attempts a real SMTP send and returns whether it worked + the exact error + the config it used
// (never the password). Use it to pinpoint email/SMTP problems in production.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!checkOperatorKey(url.searchParams.get("key") || "")) {
    return NextResponse.json({ error: "unauthorized (add ?key=YOUR_OPERATOR_KEY)" }, { status: 401 });
  }
  const to = url.searchParams.get("to") || "";
  const cfg = {
    configured: mailConfigured(),
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    user: process.env.SMTP_USER || null,
    from: process.env.MAIL_FROM || null,
  };
  if (!to) return NextResponse.json({ error: "add ?to=an-email-you-can-check", cfg }, { status: 400 });

  const r = await sendMail({ to, subject: "Bokuzu SMTP test", text: "If you received this, SMTP is working." });
  return NextResponse.json({ sent: r.delivered, error: r.error ?? null, cfg });
}
