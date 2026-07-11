import { NextResponse } from "next/server";
import { isOperator } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db/pool";
import { addUserToClient, removeUser } from "@/lib/db/users";

export const runtime = "nodejs";

// Manage the users (owner + members) who can sign in to a client's portal.
// POST { clientId, email, role } -> add/link. DELETE { userId } -> remove.
export async function POST(req: Request) {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { clientId, email, role } = (await req.json().catch(() => ({}))) as { clientId?: string; email?: string; role?: string };
  if (!clientId || !email) return NextResponse.json({ error: "clientId and email required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  await addUserToClient(clientId, email, role === "owner" ? "owner" : "member");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string };
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  await removeUser(userId);
  return NextResponse.json({ ok: true });
}
