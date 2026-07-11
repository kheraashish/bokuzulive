import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db/pool";
import { getClientForLogin, verifyCode, setPassword } from "@/lib/db/auth";
import { hashPassword, passwordProblem, makeSession, cookieOpts, SESSION_COOKIE } from "@/lib/clientAuth";

export const runtime = "nodejs";

// First-time setup / forgot password: verify an emailed code, then set a new password and sign in.
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Portal not configured yet." }, { status: 503 });
  const { email, code, password } = (await req.json().catch(() => ({}))) as { email?: string; code?: string; password?: string };
  if (!email || !code || !password) return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const bad = passwordProblem(password);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });

  const client = await getClientForLogin(email);
  if (!client) return NextResponse.json({ error: "Wrong or expired code." }, { status: 401 });
  if (!(await verifyCode(email, code))) return NextResponse.json({ error: "Wrong or expired code." }, { status: 401 });

  await setPassword(client.id, hashPassword(password));
  const res = NextResponse.json({ status: "ok", slug: client.slug });
  res.cookies.set(SESSION_COOKIE, makeSession(client.id), { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });
  return res;
}
