import { NextResponse } from "next/server";
import { isOperator } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db/pool";
import { setClientLogo } from "@/lib/db/users";

export const runtime = "nodejs";

// Set (or clear) a client's white-label logo. logoUrl is a hosted image URL; empty clears it.
export async function POST(req: Request) {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { clientId, logoUrl } = (await req.json().catch(() => ({}))) as { clientId?: string; logoUrl?: string };
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  const url = (logoUrl || "").trim();
  if (url && !/^https:\/\//i.test(url)) return NextResponse.json({ error: "Logo URL must start with https://" }, { status: 400 });
  await setClientLogo(clientId, url || null);
  return NextResponse.json({ ok: true });
}
