import "server-only";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE, DEVICE_COOKIE } from "./clientAuth";
import { getUserById, getClientPublic, clientIsLive, type UserRow, type ClientPublic } from "./db/users";

export interface PortalContext {
  user: UserRow;
  client: ClientPublic | null; // null if the user is not linked to a company yet
  live: boolean; // true once the company has an ad account linked (portal is live)
}

// Resolve the signed-in user (passwordless session) + their linked company + live status.
export async function currentContext(): Promise<PortalContext | null> {
  const store = await cookies();
  const s = readSession(store.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const user = await getUserById(s.clientId); // session payload holds the user id
  if (!user) return null;
  const client = user.client_id ? await getClientPublic(user.client_id) : null;
  const live = client ? await clientIsLive(client.id) : false;
  return { user, client, live };
}

export async function currentDeviceId(): Promise<string> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value || "";
}
