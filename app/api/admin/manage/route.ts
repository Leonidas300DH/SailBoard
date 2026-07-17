import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { apiError, isoDate, requiredString } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ensureDatabase, slugify, writeAudit } from "@/lib/database";

const placeCenters: Record<string, [number, number]> = {
  quiberon: [47.483, -3.12], concarneau: [47.872, -3.918], lorient: [47.748, -3.37],
  vannes: [47.657, -2.76], morbihan: [47.559, -2.835], brest: [48.39, -4.486],
};

function centerFor(place: string) {
  const normalized = slugify(place);
  const match = Object.entries(placeCenters).find(([key]) => normalized.includes(key));
  return match?.[1] ?? [47.559, -2.835];
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await ensureDatabase();
    const body = await request.json() as Record<string, unknown>;
    const action = requiredString(body.action, "Action");
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (action === "createSeason") {
      const name = requiredString(body.name, "Nom");
      const year = Number(body.year);
      const startsOn = requiredString(body.startsOn, "Date de début");
      const endsOn = requiredString(body.endsOn, "Date de fin");
      if (!Number.isInteger(year) || year < 2020 || year > 2100 || endsOn < startsOn) throw new Error("Période de saison invalide");
      await db.prepare("INSERT INTO seasons VALUES (?, ?, ?, ?, 'draft', ?, ?, NULL, ?, ?)").bind(id, name, `${slugify(name)}-${id.slice(0, 6)}`, year, startsOn, endsOn, now, now).run();
      await writeAudit(admin.email, action, "season", id, { name, year, startsOn, endsOn });
    } else if (action === "createEvent") {
      const seasonId = requiredString(body.seasonId, "Saison");
      const name = requiredString(body.name, "Nom");
      const locationName = requiredString(body.locationName, "Lieu");
      const startsOn = requiredString(body.startsOn, "Date");
      const [lat, lng] = centerFor(locationName);
      await db.prepare("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind(id, seasonId, name, `${slugify(name)}-${id.slice(0, 6)}`, locationName, lat, lng, startsOn, startsOn, now, now).run();
      await writeAudit(admin.email, action, "event", id, { seasonId, name, locationName, startsOn });
    } else if (action === "createRace") {
      const eventId = requiredString(body.eventId, "Événement");
      const name = requiredString(body.name, "Nom");
      const scheduledAt = isoDate(body.scheduledAt, "Départ");
      const ruleId = requiredString(body.scoringRuleVersionId, "Barème");
      const courseId = crypto.randomUUID();
      const emptyGeoJson = JSON.stringify({ type: "FeatureCollection", features: [] });
      await db.batch([
        db.prepare("INSERT INTO races VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, NULL, NULL, ?, ?)").bind(id, eventId, name, `${slugify(name)}-${id.slice(0, 6)}`, scheduledAt, courseId, ruleId, now, now),
        db.prepare("INSERT INTO course_versions VALUES (?, ?, 1, 'draft', ?, 1, 0, NULL, ?, ?)").bind(courseId, id, emptyGeoJson, now, now),
      ]);
      await writeAudit(admin.email, action, "race", id, { eventId, name, scheduledAt, ruleId });
    } else if (action === "createBoat") {
      const name = requiredString(body.name, "Nom");
      const sailNumber = requiredString(body.sailNumber, "Numéro de voile");
      const model = requiredString(body.model, "Modèle");
      const color = /^#[0-9a-f]{6}$/i.test(String(body.color)) ? String(body.color) : "#d8ff00";
      await db.prepare("INSERT INTO boats VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind(id, name, `${slugify(name)}-${id.slice(0, 6)}`, sailNumber, model, color, now, now).run();
      await writeAudit(admin.email, action, "boat", id, { name, sailNumber, model, color });
    } else if (action === "createParticipant") {
      const name = requiredString(body.name, "Nom");
      const nationality = String(body.nationality ?? "FR").trim().toUpperCase().slice(0, 2);
      const publicVisible = String(body.publicVisible) === "0" ? 0 : 1;
      await db.prepare("INSERT INTO participants VALUES (?, ?, ?, ?, ?, NULL, ?, ?)").bind(id, name, `${slugify(name)}-${id.slice(0, 6)}`, nationality, publicVisible, now, now).run();
      await writeAudit(admin.email, action, "participant", id, { name, nationality, publicVisible: Boolean(publicVisible) });
    } else if (action === "createEntry") {
      const raceId = requiredString(body.raceId, "Course");
      const boatId = requiredString(body.boatId, "Bateau");
      const startNumber = Number(body.startNumber);
      const crew = [{ participantId: String(body.helmId), role: "Barre" }, { participantId: String(body.trimId), role: "Réglage" }, { participantId: String(body.bowId), role: "Avant" }];
      if (!Number.isInteger(startNumber) || startNumber < 1 || new Set(crew.map((member) => member.participantId)).size !== 3) throw new Error("Équipage ou numéro de départ invalide");
      await db.batch([
        db.prepare("INSERT INTO race_entries VALUES (?, ?, ?, ?, 'confirmed', ?)").bind(id, raceId, boatId, startNumber, now),
        ...crew.map((member) => db.prepare("INSERT INTO crew_assignments VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, member.participantId, member.role, now)),
      ]);
      await writeAudit(admin.email, action, "race_entry", id, { raceId, boatId, startNumber, crew });
    } else {
      throw new Error("Action inconnue");
    }
    return NextResponse.json({ message: "Modification enregistrée" });
  } catch (error) { return apiError(error); }
}
