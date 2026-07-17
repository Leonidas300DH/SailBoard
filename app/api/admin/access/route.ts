import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { apiError } from "@/lib/api";
import { getCurrentUser, requireOwner } from "@/lib/auth";
import { ensureDatabase, writeAudit } from "@/lib/database";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Connexion requise");
    await ensureDatabase();
    const now = new Date().toISOString();
    await getDatabase().prepare(`INSERT INTO admin_access_requests (id, email, display_name, status, created_at)
      SELECT ?, ?, ?, 'pending', ? WHERE NOT EXISTS (
        SELECT 1 FROM admin_access_requests WHERE lower(email) = lower(?) AND status = 'pending'
      )`).bind(crypto.randomUUID(), user.email.toLowerCase(), user.displayName, now, user.email).run();
    return NextResponse.json({ message: "Demande transmise au propriétaire" });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwner();
    await ensureDatabase();
    const body = await request.json() as { action?: string; requestId?: string; adminId?: string };
    const db = getDatabase();
    const now = new Date().toISOString();
    if (body.action === "approve" && body.requestId) {
      const access = await db.prepare("SELECT * FROM admin_access_requests WHERE id = ? AND status = 'pending'").bind(body.requestId).first<Record<string, unknown>>();
      if (!access) throw new Error("Demande introuvable");
      const adminId = crypto.randomUUID();
      await db.batch([
        db.prepare(`INSERT INTO admins VALUES (?, ?, ?, 'admin', 'active', ?, ?)
          ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, role = 'admin', status = 'active', updated_at = excluded.updated_at`).bind(adminId, access.email, access.display_name, now, now),
        db.prepare("UPDATE admin_access_requests SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?").bind(owner.email, now, body.requestId),
      ]);
      await writeAudit(owner.email, "approve", "admin_access_request", body.requestId, { email: access.email });
    } else if (body.action === "deny" && body.requestId) {
      await db.prepare("UPDATE admin_access_requests SET status = 'denied', reviewed_by = ?, reviewed_at = ? WHERE id = ? AND status = 'pending'").bind(owner.email, now, body.requestId).run();
      await writeAudit(owner.email, "deny", "admin_access_request", body.requestId, {});
    } else if ((body.action === "revoke" || body.action === "suspend" || body.action === "activate") && body.adminId) {
      const target = await db.prepare("SELECT role, email FROM admins WHERE id = ?").bind(body.adminId).first<{ role: string; email: string }>();
      if (!target || target.role === "owner") throw new Error("Cet accès ne peut pas être modifié");
      const status = body.action === "suspend" ? "suspended" : body.action === "activate" ? "active" : "revoked";
      await db.prepare("UPDATE admins SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, body.adminId).run();
      await writeAudit(owner.email, body.action, "admin", body.adminId, { email: target.email, status });
    } else throw new Error("Action d’accès invalide");
    return NextResponse.json({ message: "Accès mis à jour immédiatement" });
  } catch (error) { return apiError(error); }
}
