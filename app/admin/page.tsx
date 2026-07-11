import { redirect } from "next/navigation";
import { isOperator, operatorConfigured } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db/pool";
import { listClients, getConnections } from "@/lib/db/clients";
import { hasSetting } from "@/lib/db/settings";
import { AdminConsole, type ClientView } from "./AdminConsole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  if (!operatorConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md rounded-2xl border border-warn/40 bg-plum p-7 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-warn">Setup needed</p>
          <p className="mt-3 text-sm text-ash">
            Set the <span className="font-mono text-bone">OPERATOR_KEY</span> environment variable to enable the operator console.
          </p>
        </div>
      </main>
    );
  }
  if (!(await isOperator())) redirect("/admin/login");

  const dbOn = dbConfigured();
  let clients: ClientView[] = [];
  let agencyGoogle = false;
  let agencyMeta = false;
  if (dbOn) {
    const rows = await listClients();
    clients = await Promise.all(
      rows.map(async (c) => ({
        id: c.id,
        slug: c.slug,
        brand: c.brand,
        currency: c.currency,
        loginEmail: c.login_email,
        status: c.status,
        connections: (await getConnections(c.id)).map((x) => ({
          platform: x.platform,
          status: x.status,
          accountId: x.external_account_id,
        })),
      }))
    );
    agencyGoogle = await hasSetting("google_refresh_token");
    agencyMeta = await hasSetting("meta_system_token");
  }

  return (
    <AdminConsole
      initialClients={clients}
      dbOn={dbOn}
      agency={{
        googleAppReady: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
        metaAppReady: Boolean(process.env.META_APP_ID),
        googleConnected: agencyGoogle,
        metaConnected: agencyMeta,
      }}
    />
  );
}
