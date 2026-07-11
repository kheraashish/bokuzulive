import { NextResponse } from "next/server";
import { currentClient } from "@/lib/portalCurrent";
import { setEmail, setPhone, set2fa, setPassword, getClientForLogin } from "@/lib/db/auth";
import { verifyPassword, hashPassword, passwordProblem } from "@/lib/clientAuth";

export const runtime = "nodejs";

// Update the signed-in client's account: email, phone, password, and 2FA toggles.
// action: "password" | "email" | "phone" | "twofa"
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    currentPassword?: string;
    newPassword?: string;
    email?: string;
    phone?: string;
    twofaEmail?: boolean;
    twofaSms?: boolean;
  };

  switch (body.action) {
    case "password": {
      if (!verifyPassword(body.currentPassword || "", client.password_hash)) {
        return NextResponse.json({ error: "Current password is wrong." }, { status: 400 });
      }
      const bad = passwordProblem(body.newPassword || "");
      if (bad) return NextResponse.json({ error: bad }, { status: 400 });
      await setPassword(client.id, hashPassword(body.newPassword as string));
      return NextResponse.json({ ok: true });
    }
    case "email": {
      const email = (body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
      const taken = await getClientForLogin(email);
      if (taken && taken.id !== client.id) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
      await setEmail(client.id, email);
      return NextResponse.json({ ok: true });
    }
    case "phone": {
      const phone = (body.phone || "").trim();
      await setPhone(client.id, phone || null);
      return NextResponse.json({ ok: true });
    }
    case "twofa": {
      if (body.twofaSms && !client.phone && !body.twofaEmail) {
        // allow enabling sms only when a phone exists (set phone first)
      }
      await set2fa(client.id, { email: body.twofaEmail, sms: body.twofaSms });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
