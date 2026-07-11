import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { dbConfigured } from "@/lib/db/pool";
import { createTicket } from "@/lib/db/auth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
const SUPPORT_TO = "support@bokuzu.com";

// Raise a support ticket from a single message. Stored in the DB, emailed to our inbox with a fixed
// "Bokuzu client support ticket" subject (so we know it's from Bokuzu), and a confirmation with the
// same ticket number is emailed to the client.
export async function POST(req: Request) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  if (!message?.trim()) return NextResponse.json({ error: "Please describe what you need help with." }, { status: 400 });

  const brand = ctx.client?.brand ?? null;
  const email = ctx.user.email;
  const { ticketNo } = await createTicket({ clientId: ctx.client?.id ?? null, email, brand, subject: "Bokuzu client support ticket", message: message.trim() });

  // To us: fixed subject so it is unmistakably a Bokuzu ticket.
  await sendMail({
    to: SUPPORT_TO,
    subject: "Bokuzu client support ticket",
    text: `Ticket: ${ticketNo}\nFrom: ${email}${brand ? ` (${brand})` : ""}\n\n${message.trim()}`,
  }).catch(() => {});

  // To the client: confirmation carrying the same ticket number.
  await sendMail({
    to: email,
    subject: `Your Bokuzu support ticket ${ticketNo}`,
    text: `Hi,\n\nWe've received your support request. Your ticket number is ${ticketNo}. Our team will reply to this email shortly.\n\nWhat you sent us:\n${message.trim()}\n\nThanks,\nThe Bokuzu team`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, ticketNo });
}
