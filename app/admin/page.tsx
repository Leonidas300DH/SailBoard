import { AdminConsole } from "@/components/AdminConsole";
import { AccessRequest } from "@/components/AccessRequest";
import { ContentNav } from "@/components/ContentNav";
import { getAdminIdentity, requireCurrentUser } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireCurrentUser("/admin");
  const admin = await getAdminIdentity();
  if (!admin) return <main className="content-page"><ContentNav /><AccessRequest user={user} /></main>;
  const snapshot = await getAdminSnapshot();
  return <AdminConsole admin={admin} snapshot={snapshot} />;
}
