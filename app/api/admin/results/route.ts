import { NextResponse } from "next/server";
import { getDatabase, type PreparedStatement } from "@/db";
import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ensureDatabase, writeAudit } from "@/lib/database";
import type { ResultStatus, ScoringConfig } from "@/lib/domain";
import { scoreBoat, scoreCrew } from "@/lib/scoring.mjs";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await ensureDatabase();
    const body = await request.json() as { raceId?: string; results?: Array<Record<string, unknown>> };
    if (!body.raceId || !Array.isArray(body.results) || !body.results.length) throw new Error("Résultats incomplets");
    const db = getDatabase();
    const race = await db.prepare(`SELECT r.*, srv.config_json, srv.status AS rule_status, cv.status AS course_status
      FROM races r JOIN scoring_rule_versions srv ON srv.id = r.scoring_rule_version_id
      JOIN course_versions cv ON cv.id = r.course_version_id WHERE r.id = ?`).bind(body.raceId).first<Record<string, unknown>>();
    if (!race || race.rule_status !== "published" || race.course_status !== "published") throw new Error("Le parcours et le barème doivent être publiés");
    const config = JSON.parse(String(race.config_json)) as ScoringConfig;
    const now = new Date().toISOString();
    const statements: PreparedStatement[] = [];
    const auditResults: unknown[] = [];
    for (const item of body.results) {
      const entryId = String(item.entryId ?? "");
      const status = String(item.status) as ResultStatus;
      const position = status === "classified" ? Number(item.position) : null;
      const elapsedSeconds = Number(item.elapsedSeconds ?? 0) || null;
      const penaltyPoints = Math.max(0, Number(item.penaltyPoints ?? 0));
      if (!entryId || !["classified", "dnf", "dns", "dsq"].includes(status) || (status === "classified" && (!Number.isInteger(position) || Number(position) < 1))) throw new Error("Une ligne de résultat est invalide");
      const entry = await db.prepare("SELECT id FROM race_entries WHERE id = ? AND race_id = ?").bind(entryId, body.raceId).first();
      if (!entry) throw new Error("Engagement introuvable");
      const resultId = String((await db.prepare("SELECT id FROM results WHERE entry_id = ?").bind(entryId).first<{ id: string }>())?.id ?? crypto.randomUUID());
      const crew = await db.prepare("SELECT participant_id, role FROM crew_assignments WHERE entry_id = ? ORDER BY created_at").bind(entryId).all<{ participant_id: string; role: string }>();
      const boatPoints = scoreBoat(config, { position, status, penaltyPoints });
      const awards = scoreCrew(config, boatPoints, crew.results.map((member) => ({ participantId: member.participant_id, role: member.role })), item.manualAwards as Record<string, number> | undefined);
      statements.push(db.prepare(`INSERT INTO results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(entry_id) DO UPDATE SET position=excluded.position, elapsed_seconds=excluded.elapsed_seconds, status=excluded.status, penalty_points=excluded.penalty_points, penalty_note=excluded.penalty_note, boat_points=excluded.boat_points, scoring_snapshot_json=excluded.scoring_snapshot_json, finalized_at=excluded.finalized_at, updated_at=excluded.updated_at`).bind(resultId, entryId, position, elapsedSeconds, status, penaltyPoints, String(item.penaltyNote ?? "") || null, boatPoints, JSON.stringify(config), now, now));
      statements.push(db.prepare("DELETE FROM individual_awards WHERE result_id = ?").bind(resultId));
      for (const award of awards) statements.push(db.prepare("INSERT INTO individual_awards VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), resultId, award.participantId, award.points, config.individualMode, JSON.stringify({ role: award.role, config }), now));
      auditResults.push({ entryId, position, status, penaltyPoints, boatPoints, awards });
    }
    statements.push(db.prepare("UPDATE races SET status = 'completed', published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?").bind(now, now, body.raceId));
    await db.batch(statements);
    await writeAudit(admin.email, "finalize_results", "race", body.raceId, { results: auditResults });
    return NextResponse.json({ message: "Classement validé et points figés" });
  } catch (error) { return apiError(error); }
}
