import { NextResponse } from "next/server";
import { dbConfigured, ensureSchema, ping } from "@/lib/db/pool";

// GET /api/health — reports whether the database is configured and reachable, and ensures the
// tables exist. Returns only booleans (no secrets). Use it to confirm setup after wiring env vars.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const configured = dbConfigured();
  if (!configured) {
    return NextResponse.json({ dbConfigured: false, canConnect: false, schemaReady: false, mode: "demo" });
  }
  try {
    const ok = await ping();
    await ensureSchema();
    return NextResponse.json({ dbConfigured: true, canConnect: ok, schemaReady: true, mode: "live" });
  } catch (e) {
    return NextResponse.json(
      { dbConfigured: true, canConnect: false, schemaReady: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
