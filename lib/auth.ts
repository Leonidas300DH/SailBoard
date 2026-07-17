import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { ensureDatabase } from "./database";
import type { AdminRole } from "./domain";

export type AdminIdentity = ChatGPTUser & { role: AdminRole; status: "active" };

function localPreviewUser(): ChatGPTUser | null {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    return { email: "owner@sailboard.local", displayName: "Admin de démonstration", fullName: "Admin de démonstration" };
  }
  return null;
}

export async function getCurrentUser() {
  return (await getChatGPTUser()) ?? localPreviewUser();
}

export async function requireCurrentUser(returnTo: string) {
  const local = localPreviewUser();
  return local ?? requireChatGPTUser(returnTo);
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  await ensureDatabase();
  if (user.email === "owner@sailboard.local") return { ...user, role: "owner", status: "active" };
  const row = await getD1().prepare("SELECT role, status FROM admins WHERE lower(email) = lower(?)").bind(user.email).first<{ role: AdminRole; status: string }>();
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
