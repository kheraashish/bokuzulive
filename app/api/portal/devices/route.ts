import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { removeUserDevice } from "@/lib/db/users";

export const runtime = "nodejs";

// Remove one remembered device (sign it out of "remember this device").
export async function DELETE(req: Request) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await removeUserDevice(ctx.user.id, id);
  return NextResponse.json({ ok: true });
}
