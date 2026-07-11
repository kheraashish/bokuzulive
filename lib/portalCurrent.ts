import "server-only";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE, DEVICE_COOKIE } from "./clientAuth";
import { getClientById, type LoginClient } from "./db/auth";

// Resolve the logged-in client from the signed session cookie. Returns null if not signed in.
export async function currentClient(): Promise<LoginClient | null> {
  const store = await cookies();
  const s = readSession(store.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  return getClientById(s.clientId);
}

export async function currentDeviceId(): Promise<string> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value || "";
}
