import { NextResponse } from "next/server";
import { checkOperatorKey, operatorCookie, operatorConfigured, clearOperatorCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

// POST { key } -> sets the operator cookie if the password matches. DELETE -> sign out.
export async function POST(req: Request) {
  if (!operatorConfigured()) {
    return NextResponse.json({ error: "OPERATOR_KEY is not set on the server." }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { key?: string };
  if (!checkOperatorKey(body.key || "")) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const c = operatorCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.opts);
  return res;
}

export async function DELETE() {
  const c = clearOperatorCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.opts);
  return res;
}
