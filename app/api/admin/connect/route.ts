import { NextResponse } from "next/server";
import { isOperator } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db/pool";
import { saveConnection, type Platform } from "@/lib/db/clients";

export const runtime = "nodejs";

// POST { clientId, platform, accountId } -> saves the client's ad-account ID for the manager model.
// No per-client tokens: the agency's manager credentials (in settings) read this account by ID.
export async function POST(req: Request) {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { clientId?: string; platform?: string; accountId?: string };
  const clientId = body.clientId || "";
  const platform = body.platform as Platform;
  if (!clientId || (platform !== "google" && platform !== "meta")) {
    return NextResponse.json({ error: "clientId and platform (google|meta) required" }, { status: 400 });
  }

  const raw = (body.accountId || "").trim();
  // Normalize: Google = 10 digits (strip dashes/spaces); Meta = act_<digits>.
  let accountId = "";
  if (raw) {
    if (platform === "google") {
      accountId = raw.replace(/[^0-9]/g, "");
      if (accountId.length < 8) return NextResponse.json({ error: "Google Customer ID should be ~10 digits (e.g. 123-456-7890)" }, { status: 400 });
    } else {
      const digits = raw.replace(/[^0-9]/g, "");
      if (!digits) return NextResponse.json({ error: "Meta Ad Account ID should look like act_1234567890" }, { status: 400 });
      accountId = `act_${digits}`;
    }
  }

  await saveConnection({
    clientId,
    platform,
    externalAccountId: accountId || null,
    accountName: null,
    status: accountId ? "linked" : "pending",
  });

  return NextResponse.json({ ok: true, platform, accountId });
}
