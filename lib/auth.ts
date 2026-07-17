import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/db";
import { auth, isAuthConfigured } from "./auth-server";
import { ensureDatabase } from "./database";
import type { AdminRole } from "./domain";

export type AuthUser = {
  id?: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export type AdminIdentity = AuthUser & { role: AdminRole; status: "active" };

function localPreviewUser(): AuthUser | null {
  if (process.env.NODE_ENV !== "production" && !isAuthConfigured()) {
    return { id: "local-owner", email: "owner@sailboard.local", displayName: "Admin de démonstration", fullName: "Admin de démonstration" };
  }
  return null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const local = localPreviewUser();
  if (local) return local;
  if (!isAuthConfigured()) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.name || session.user.email,
    fullName: session.user.name || null,
  };
}

export async function requireCurrentUser(returnTo: string) {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.email === "owner@sailboard.local") return { ...user, role: "owner", status: "active" };
  await ensureDatabase();
  const row = await getDatabase().prepare("SELECT role, status FROM admins WHERE lower(email) = lower(?)").bind(user.email).first<{ role: AdminRole; status: string }>();
  if (!row || row.status !== "active") return null;
  return { ...user, role: row.role, status: "active" };
}

export async function requireAdmin(returnTo = "/admin"): Promise<AdminIdentity> {
  await requireCurrentUser(returnTo);
  const admin = await getAdminIdentity();
  if (!admin) throw new Error("ADMIN_ACCESS_REQUIRED");
  return admin;
}

export async function requireOwner(): Promise<AdminIdentity> {
  const admin = await requireAdmin("/admin?tab=access");
  if (admin.role !== "owner") throw new Error("OWNER_ACCESS_REQUIRED");
  return admin;
}
