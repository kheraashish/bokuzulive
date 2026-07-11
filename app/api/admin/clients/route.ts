import { NextResponse } from "next/server";
import { isOperator } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db/pool";
import { createClient, listClients, getConnections } from "@/lib/db/clients";
import { addUserToClient, listUsersForClient, setAgencyOnboarded } from "@/lib/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET -> clients with connections + users + logo. POST { slug, brand, currency, loginEmail } -> create.
export async function GET() {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });
  const clients = await listClients();
  const out = await Promise.all(
    clients.map(async (c) => ({
      id: c.id,
      slug: c.slug,
      brand: c.brand,
      currency: c.currency,
      logoUrl: (c as unknown as { logo_url?: string | null }).logo_url ?? null,
      connections: (await getConnections(c.id)).map((x) => ({ platform: x.platform, status: x.status, accountId: x.external_account_id })),
      users: (await listUsersForClient(c.id)).map((u) => ({ id: u.id, email: u.email, role: u.role })),
    }))
  );
  return NextResponse.json({ clients: out });
}

export async function POST(req: Request) {
  if (!(await isOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { slug?: string; brand?: string; currency?: string; loginEmail?: string };
  const slug = (body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const brand = (body.brand || "").trim();
  if (!slug || !brand) return NextResponse.json({ error: "slug and brand are required" }, { status: 400 });
  if (["login", "example", "admin", "api", "top", "portal"].includes(slug)) {
    return NextResponse.json({ error: `"${slug}" is reserved, pick another slug` }, { status: 400 });
  }

  try {
    const id = await createClient({ slug, brand, currency: body.currency, loginEmail: body.loginEmail || null });
    await setAgencyOnboarded(id, "yes"); // operator-managed = already an agency client
    // The owner email becomes the first portal user for this company.
    const owner = (body.loginEmail || "").trim();
    if (owner) await addUserToClient(id, owner, "owner");
    return NextResponse.json({ ok: true, id, slug });
  } catch (e) {
    const msg = (e as Error).message;
    if (/duplicate/i.test(msg)) return NextResponse.json({ error: "That slug or email is already used." }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
