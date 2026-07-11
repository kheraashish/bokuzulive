import { NextResponse } from "next/server";
import { currentClient } from "@/lib/portalCurrent";
import { removeDevice } from "@/lib/db/auth";

export const runtime = "nodejs";

// Remove one trusted/logged-in device (sign it out of "remember this device").
export async function DELETE(req: Request) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await removeDevice(client.id, id);
  return NextResponse.json({ ok: true });
}
