import { NextResponse } from "next/server";
import { currentContext } from "@/lib/portalCurrent";
import { setUserPhone, setUser2faSms } from "@/lib/db/users";

export const runtime = "nodejs";

// Update the signed-in user's own settings. Passwordless: no password to change. Email is the
// identity (changed by the operator). action: "phone" | "smsCodes"
export async function POST(req: Request) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; phone?: string; smsCodes?: boolean };

  switch (body.action) {
    case "phone": {
      const phone = (body.phone || "").trim();
      await setUserPhone(ctx.user.id, phone || null);
      return NextResponse.json({ ok: true });
    }
    case "smsCodes": {
      if (body.smsCodes && !ctx.user.phone) return NextResponse.json({ error: "Add a mobile number first." }, { status: 400 });
      await setUser2faSms(ctx.user.id, Boolean(body.smsCodes));
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
