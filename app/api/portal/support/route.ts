import { NextResponse } from "next/server";
import { currentClient } from "@/lib/portalCurrent";
import { dbConfigured } from "@/lib/db/pool";
import { createTicket } from "@/lib/db/auth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

const SUPPORT_TO = "info@lautzu.com";

// Raise a support ticket: stored in the DB and emailed to the support inbox.
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { subject, message } = (await req.json().catch(() => ({}))) as { subject?: string; message?: string };
  if (!subject?.trim() || !message?.trim()) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });

  const id = await createTicket({
    clientId: client.id,
    email: client.login_email || "",
    brand: client.brand,
    subject: subject.trim(),
    message: message.trim(),
  });

  await sendMail({
    to: SUPPORT_TO,
    subject: `[Bokuzu support] ${client.brand}: ${subject.trim()}`,
    text: `Ticket ${id}\nClient: ${client.brand} (${client.slug})\nFrom: ${client.login_email}\n\n${message.trim()}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, id });
}
