import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
const SUPPORT_TO = "support@bokuzu.com";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public early-access request from the marketing site. Emails the request (email + company website)
// to our support inbox. No auth, no DB — just a notification so no signup is lost. Inputs are
// length-capped; the email is validated and the website is required.
export async function POST(req: Request) {
  const { email, website } = (await req.json().catch(() => ({}))) as { email?: string; website?: string };
  const e = (email || "").trim().slice(0, 200);
  const w = (website || "").trim().slice(0, 300);

  if (!emailRe.test(e)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!w) return NextResponse.json({ error: "Please add your company website." }, { status: 400 });

  const res = await sendMail({
    to: SUPPORT_TO,
    subject: "New Bokuzu access request",
    text: `New early-access request from the Bokuzu site.\n\nEmail: ${e}\nCompany website: ${w}\n`,
  });

  // In production, treat a failed send as an error so the visitor isn't told "noted" when it wasn't.
  if (!res.delivered && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Could not submit right now. Please email support@bokuzu.com directly." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
