import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { dbConfigured } from "@/lib/db/pool";
import { createTicket } from "@/lib/db/auth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
const SUPPORT_TO = "info@lautzu.com";

// Raise a support ticket: stored in the DB and emailed to the support inbox.
export async function POST(req: Request) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { subject, message } = (await req.json().catch(() => ({}))) as { subject?: string; message?: string };
  if (!subject?.trim() || !message?.trim()) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });

  const brand = ctx.client?.brand ?? null;
  const id = await createTicket({ clientId: ctx.client?.id ?? null, email: ctx.user.email, brand, subject: subject.trim(), message: message.trim() });

  await sendMail({
    to: SUPPORT_TO,
    subject: `[Bokuzu support] ${brand || ctx.user.email}: ${subject.trim()}`,
    text: `Ticket ${id}\nFrom: ${ctx.user.email}${brand ? ` (${brand})` : ""}\n\n${message.trim()}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, id });
}
