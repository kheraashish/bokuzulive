import "server-only";
import crypto from "crypto";

// AES-256-GCM encryption for OAuth tokens at rest. The key comes from the TOKEN_ENC_KEY env var
// (32 bytes, hex or base64). Generate one with: openssl rand -hex 32
// Output format: base64(iv).base64(authTag).base64(ciphertext)

function key(): Buffer {
  const raw = process.env.TOKEN_ENC_KEY || "";
  if (!raw) throw new Error("TOKEN_ENC_KEY is not set.");
  const buf = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("TOKEN_ENC_KEY must decode to 32 bytes (use: openssl rand -hex 32).");
  return buf;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed ciphertext.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}
