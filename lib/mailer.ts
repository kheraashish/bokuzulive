import "server-only";
import nodemailer from "nodemailer";

// Email sending via SMTP (Hostinger mailbox, or any SMTP). Configure with env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
// If SMTP is not configured, mail is NOT sent; in non-production we surface the body so flows can
// be tested without a mail server. Add the SMTP keys later and email starts working, no code change.

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let _tx: nodemailer.Transporter | null = null;
function tx(): nodemailer.Transporter {
  if (_tx) return _tx;
  _tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _tx;
}

export interface SendResult {
  delivered: boolean;
  devPreview?: string; // body echoed back in dev when SMTP is not configured (for testing only)
  error?: string; // the SMTP error, if the send failed
}

export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }): Promise<SendResult> {
  if (!mailConfigured()) {
    const preview = `[mail not configured] To:${opts.to} | ${opts.subject} | ${opts.text}`;
    console.log(preview);
    return { delivered: false, devPreview: process.env.NODE_ENV !== "production" ? opts.text : undefined };
  }
  try {
    await tx().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { delivered: true };
  } catch (e) {
    const msg = (e as Error).message;
    console.error("sendMail failed:", msg);
    return { delivered: false, error: msg };
  }
}
