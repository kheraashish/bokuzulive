import "server-only";
import { authenticator } from "otplib";
import QRCode from "qrcode";

// Authenticator-app (TOTP) 2FA. Free: the app on the user's phone generates the code, nothing is
// sent. We store the secret encrypted (lib/crypto). Compatible with Google Authenticator, Authy, etc.

authenticator.options = { window: 1 }; // allow +/- 1 step (30s) for clock drift

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

/** Build the otpauth URI + a QR-code data URL the user scans to add the account. */
export async function setupData(email: string, secret: string): Promise<{ secret: string; qr: string; uri: string }> {
  const uri = authenticator.keyuri(email, "Bokuzu", secret);
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220, color: { dark: "#16121A", light: "#F2EEE6" } });
  return { secret, qr, uri };
}
