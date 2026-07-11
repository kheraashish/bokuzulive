import { NextResponse } from "next/server";
import { isOperator } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db/pool";
import { setSetting, clearSetting, hasSetting, type SettingKey } from "@/lib/db/settings";

export const runtime = "nodejs";

const ALLOWED: SettingKey[] = ["google_refresh_token", "meta_system_token"];

// GET -> which agency credentials are set (booleans only). POST { key, value } -> store one
// (encrypted). This is where the one-time Meta system-user token is pasted.
export async function GET() {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });
  return NextResponse.json({
    google_refresh_token: await hasSetting("google_refresh_token"),
    meta_system_token: await hasSetting("meta_system_token"),
  });
}

export async function POST(req: Request) {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { key?: string; value?: string };
  const key = body.key as SettingKey;
  if (!ALLOWED.includes(key)) return NextResponse.json({ error: "unknown setting" }, { status: 400 });

  const value = (body.value || "").trim();
  if (value) await setSetting(key, value);
  else await clearSetting(key);

  return NextResponse.json({ ok: true, set: Boolean(value) });
}
