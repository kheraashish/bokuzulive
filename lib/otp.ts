import "server-only";
import { newCode } from "./clientAuth";
import { saveCode } from "./db/auth";
import { sendMail } from "./mailer";
import { sendSms } from "./sms";

// Issue a one-time code to an email (and optionally SMS). Returns devCode only when no sender is
// configured and we're not in production, so the flow is testable before SMTP/SMS keys are added.
export async function issueCode(email: string, opts: { sms?: boolean; phone?: string | null } = {}): Promise<{ sent: boolean; devCode?: string; error?: string }> {
  const code = newCode();
  await saveCode(email, code);
  const body = `Your Bokuzu sign-in code is ${code}. It expires in 30 minutes. If you did not request this, ignore this message.`;

  const mail = await sendMail({ to: email, subject: "Your Bokuzu sign-in code", text: body });
  let smsSent = false;
  if (opts.sms && opts.phone) {
    const s = await sendSms(opts.phone, `Bokuzu code: ${code}`);
    smsSent = s.delivered;
  }

  const sent = mail.delivered || smsSent;
  return {
    sent,
    devCode: sent || process.env.NODE_ENV === "production" ? undefined : code,
    error: mail.error,
  };
}
