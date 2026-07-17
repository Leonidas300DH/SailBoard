import { NextResponse } from "next/server";
import { getDatabase, type PreparedStatement } from "@/db";
import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ensureDatabase, writeAudit } from "@/lib/database";
import type { CourseMark } from "@/lib/domain";

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b[1] - a[1]); const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]); const lat2 = toRad(b[1]);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3440.065 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function validateMarks(value: unknown): CourseMark[] {
  if (!Array.isArray(value)) throw new Error("Parcours invalide");
  const marks = value as CourseMark[];
  if (marks.length < 2 || marks[0]?.type !== "start" || marks.at(-1)?.type !== "finish") throw new Error("Le parcours doit commencer par un départ et finir par une arrivée");
  for (const mark of marks) {
    const expected = ["start", "gate", "finish"].includes(mark.type) ? 2 : 1;
    if (!mark.id || !mark.name?.trim() || mark.coordinates.length !== expected) throw new Error(`Géométrie invalide pour ${mark.name || "une marque"}`);
    for (const [lng, lat] of mark.coordinates) if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) throw new Error("Coordonnées invalides");
  }
  return marks;
}

function toGeoJson(marks: CourseMark[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [
    { type: "Feature", properties: { kind: "route" }, geometry: { type: "LineString", coordinates: marks.map((mark) => mark.coordinates[0]) } },
    ...marks.map((mark, index) => ({ type: "Feature" as const, properties: { id: mark.id, kind: mark.type, label: String(index + 1), name: mark.name, rounding: mark.rounding }, geometry: mark.coordinates.length > 1 ? { type: "LineString" as const, coordinates: mark.coordinates } : { type: "Point" as const, coordinates: mark.coordinates[0] } })),
  ] };
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await ensureDatabase();
    const body = await request.json() as Record<string, unknown>;
    const raceId = String(body.raceId ?? "");
    const marks = validateMarks(body.marks);
    const laps = Number(body.laps);
    const status = body.status === "published" ? "published" : "draft";
    if (!raceId || !Number.isInteger(laps) || laps < 1 || laps > 20) throw new Error("Course ou nombre de tours invalide");
    const distanceNm = marks.slice(1).reduce((sum, mark, index) => sum + haversine(marks[index].coordinates[0], mark.coordinates[0]), 0) * laps;
    const db = getDatabase(); const now = new Date().toISOString();
    const latest = await db.prepare("SELECT * FROM course_versions WHERE race_id = ? ORDER BY version DESC LIMIT 1").bind(raceId).first<Record<string, unknown>>();
    const reuseDraft = latest?.status === "draft";
    const versionId = reuseDraft ? String(latest.id) : crypto.randomUUID();
    const version = reuseDraft ? Number(latest.version) : Number(latest?.version ?? 0) + 1;
    const statements: PreparedStatement[] = [];
    if (reuseDraft) {
      statements.push(db.prepare("UPDATE course_versions SET status = ?, geojson = ?, laps = ?, distance_nm = ?, published_at = ?, updated_at = ? WHERE id = ?").bind(status, JSON.stringify(toGeoJson(marks)), laps, distanceNm, status === "published" ? now : null, now, versionId));
      statements.push(db.prepare("DELETE FROM course_marks WHERE course_version_id = ?").bind(versionId));
    } else {
      statements.push(db.prepare("INSERT INTO course_versions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(versionId, raceId, version, status, JSON.stringify(toGeoJson(marks)), laps, distanceNm, status === "published" ? now : null, now, now));
    }
    marks.forEach((mark, sequence) => { const secondary = mark.coordinates[1]; statements.push(db.prepare("INSERT INTO course_marks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), versionId, sequence, mark.name, mark.type, mark.rounding, mark.coordinates[0][1], mark.coordinates[0][0], secondary?.[1] ?? null, secondary?.[0] ?? null)); });
    if (status === "published") statements.push(db.prepare("UPDATE races SET course_version_id = ?, status = CASE WHEN status = 'draft' THEN 'scheduled' ELSE status END, updated_at = ? WHERE id = ?").bind(versionId, now, raceId));
    await db.batch(statements);
    await writeAudit(admin.email, `${status}_course`, "course_version", versionId, { raceId, version, laps, distanceNm, marks });
    return NextResponse.json({ message: status === "published" ? `Parcours v${version} publié · ${distanceNm.toFixed(2)} NM` : "Brouillon enregistré" });
  } catch (error) { return apiError(error); }
}
