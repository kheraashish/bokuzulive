import "server-only";

// SMS sending seam for mobile OTP. Provider-agnostic: configure via env when you pick one (e.g.
// Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM). Until configured, this is inert and
// the app relies on email OTP. Wiring a provider later is a change only in this file + env.

export function smsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

export async function sendSms(to: string, message: string): Promise<{ delivered: boolean }> {
  if (!smsConfigured()) {
    console.log(`[sms not configured] To:${to} | ${message}`);
    return { delivered: false };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const token = process.env.TWILIO_AUTH_TOKEN as string;
  const from = process.env.TWILIO_FROM as string;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: message }).toString(),
  });
  return { delivered: res.ok };
}
