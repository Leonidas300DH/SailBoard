import { getDatabase, isDatabaseConfigured, type DatabaseClient, type PreparedStatement } from "@/db";
import type { CourseMark, RaceView, ScoringConfig } from "./domain";

const NOW = "2026-07-17T12:00:00.000Z";
let initialization: Promise<void> | null = null;

const DEFAULT_SCORING: ScoringConfig = {
  direction: "high",
  positionPoints: { "1": 18, "2": 15, "3": 12, "4": 10, "5": 8, "6": 6, "7": 4, "8": 3, "9": 2, "10": 1 },
  participationPoints: 1,
  statusPoints: { dnf: 1, dns: 0, dsq: 0 },
  individualMode: "same_as_boat",
  roleWeights: { Barre: 1, Réglage: 1, Avant: 1 },
  tieBreakers: ["wins", "best_recent", "best_result"],
};

const DEFAULT_MARKS: CourseMark[] = [
  { id: "mark-start", name: "Ligne de départ", type: "start", rounding: "none", coordinates: [[-2.915, 47.560], [-2.903, 47.569]] },
  { id: "mark-1", name: "Marque 1", type: "mark", rounding: "starboard", coordinates: [[-2.827, 47.603]] },
  { id: "mark-2", name: "Porte 2", type: "gate", rounding: "either", coordinates: [[-2.764, 47.548], [-2.748, 47.542]] },
  { id: "mark-3", name: "Marque 3", type: "mark", rounding: "port", coordinates: [[-2.878, 47.514]] },
  { id: "mark-finish", name: "Ligne d’arrivée", type: "finish", rounding: "none", coordinates: [[-2.944, 47.548], [-2.932, 47.557]] },
];

function courseGeoJson(marks: CourseMark[]): GeoJSON.FeatureCollection {
  const routeCoordinates = marks.map((mark) => mark.coordinates[0]);
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "route" },
        geometry: { type: "LineString", coordinates: routeCoordinates },
      },
      ...marks.map((mark, index) => ({
        type: "Feature" as const,
        properties: { id: mark.id, kind: mark.type, label: String(index + 1), name: mark.name, rounding: mark.rounding },
        geometry: mark.coordinates.length > 1
          ? { type: "LineString" as const, coordinates: mark.coordinates }
          : { type: "Point" as const, coordinates: mark.coordinates[0] },
      })),
    ],
  };
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS admin_access_requests (id TEXT PRIMARY KEY, email TEXT NOT NULL, display_name TEXT NOT NULL, status TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, actor_email TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, changes_json TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS seasons (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, year INTEGER NOT NULL, status TEXT NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, season_id TEXT NOT NULL REFERENCES seasons(id), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, location_name TEXT NOT NULL, center_lat REAL NOT NULL, center_lng REAL NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS scoring_rule_versions (id TEXT PRIMARY KEY, name TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, config_json TEXT NOT NULL, published_at TEXT, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS races (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, scheduled_at TEXT NOT NULL, status TEXT NOT NULL, course_version_id TEXT, scoring_rule_version_id TEXT REFERENCES scoring_rule_versions(id), published_at TEXT, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS course_versions (id TEXT PRIMARY KEY, race_id TEXT NOT NULL REFERENCES races(id), version INTEGER NOT NULL, status TEXT NOT NULL, geojson TEXT NOT NULL, laps INTEGER NOT NULL DEFAULT 1, distance_nm REAL NOT NULL DEFAULT 0, published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS course_marks (id TEXT PRIMARY KEY, course_version_id TEXT NOT NULL REFERENCES course_versions(id), sequence INTEGER NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, rounding TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL, secondary_lat REAL, secondary_lng REAL)`,
  `CREATE TABLE IF NOT EXISTS boats (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sail_number TEXT NOT NULL, model TEXT NOT NULL, color TEXT NOT NULL, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, nationality TEXT NOT NULL DEFAULT 'FR', public_visible INTEGER NOT NULL DEFAULT 1, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS race_entries (id TEXT PRIMARY KEY, race_id TEXT NOT NULL REFERENCES races(id), boat_id TEXT NOT NULL REFERENCES boats(id), start_number INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(race_id, boat_id))`,
  `CREATE TABLE IF NOT EXISTS crew_assignments (id TEXT PRIMARY KEY, entry_id TEXT NOT NULL REFERENCES race_entries(id), participant_id TEXT NOT NULL REFERENCES participants(id), role TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(entry_id, participant_id))`,
  `CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, entry_id TEXT NOT NULL UNIQUE REFERENCES race_entries(id), position INTEGER, elapsed_seconds INTEGER, status TEXT NOT NULL, penalty_points REAL NOT NULL DEFAULT 0, penalty_note TEXT, boat_points REAL NOT NULL, scoring_snapshot_json TEXT NOT NULL, finalized_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS individual_awards (id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES results(id), participant_id TEXT NOT NULL REFERENCES participants(id), points REAL NOT NULL, mode TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(result_id, participant_id))`,
  `CREATE INDEX IF NOT EXISTS events_season_idx ON events(season_id)`,
  `CREATE INDEX IF NOT EXISTS races_event_idx ON races(event_id)`,
  `CREATE INDEX IF NOT EXISTS entries_race_idx ON race_entries(race_id)`,
  `CREATE INDEX IF NOT EXISTS course_marks_version_idx ON course_marks(course_version_id, sequence)`,
  `CREATE INDEX IF NOT EXISTS awards_participant_idx ON individual_awards(participant_id)`,
  `CREATE INDEX IF NOT EXISTS access_requests_status_idx ON admin_access_requests(status)`,
];

function runtimeValue(key: string): string | undefined {
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

export async function ensureDatabase(): Promise<void> {
  initialization ??= initialize();
  return initialization;
}

async function initialize(): Promise<void> {
  const db = getDatabase();
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  const count = await db.prepare("SELECT COUNT(*) AS count FROM seasons").first<{ count: number }>();
  if (!count?.count) await seedDatabase(db);
  await ensureInitialOwner(db);
}

async function ensureInitialOwner(db: DatabaseClient) {
  const email = runtimeValue("INITIAL_ADMIN_EMAIL")?.trim().toLowerCase();
  if (!email) return;
  await db.prepare(`INSERT INTO admins (id, email, display_name, role, status, created_at, updated_at)
    VALUES (?, ?, ?, 'owner', 'active', ?, ?)
    ON CONFLICT(email) DO NOTHING`)
    .bind(`admin-${slugify(email)}`, email, "Propriétaire SailBoard", NOW, NOW).run();
}

async function seedDatabase(db: DatabaseClient) {
  const geojson = JSON.stringify(courseGeoJson(DEFAULT_MARKS));
  const boats = [
    ["boat-kaz", "Kaz a Barh", "kaz-a-barh", "FRA 701", "J/80", "#f4f4ef"],
    ["boat-arm", "Ar Mor", "ar-mor", "FRA 228", "J/80", "#d8ff00"],
    ["boat-bleu", "Bleuenn", "bleuenn", "FRA 319", "J/80", "#35b8ff"],
    ["boat-hiziv", "Hiziv", "hiziv", "FRA 447", "J/80", "#ff8b22"],
    ["boat-mab", "Mab Den", "mab-den", "FRA 512", "J/80", "#b968df"],
    ["boat-kreiz", "Kreiz", "kreiz", "FRA 609", "J/80", "#9ac21a"],
  ];
  const people = [
    ["p-yle", "Yann Le Clec’h", "yann-le-clech"], ["p-ep", "Enora Péron", "enora-peron"], ["p-mr", "Maël Rio", "mael-rio"],
    ["p-cb", "Camille Bernard", "camille-bernard"], ["p-yt", "Yann Tanguy", "yann-tanguy"], ["p-nlb", "Nolwenn Le Bris", "nolwenn-le-bris"],
    ["p-al", "Ana Le Gall", "ana-le-gall"], ["p-tl", "Tom Lemerle", "tom-lemerle"], ["p-pm", "Pierre Morvan", "pierre-morvan"],
    ["p-gl", "Gaël Le Roux", "gael-le-roux"], ["p-mq", "Marine Quillivic", "marine-quillivic"], ["p-ce", "Corentin Jean", "corentin-jean"],
    ["p-fd", "Fanny Déniel", "fanny-deniel"], ["p-ja", "Jules Appriou", "jules-appriou"], ["p-lc", "Lina Cicquel", "lina-cicquel"],
    ["p-slf", "Soazig Le Floch", "soazig-le-floch"], ["p-yc", "Yves Coïc", "yves-coic"], ["p-ar", "Alix Rault", "alix-rault"],
  ];
  const roles = ["Barre", "Réglage", "Avant"];
  const elapsed = [6678, 6753, 6826, 6912, 7005, 7088];
  const points = [18, 15, 12, 10, 8, 6];

  const statements: PreparedStatement[] = [
    db.prepare("INSERT INTO seasons VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind("season-2026", "Championnat 2026", "championnat-2026", 2026, "active", "2026-03-01", "2026-10-31", NOW, NOW),
    db.prepare("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind("event-golfe", "season-2026", "Trophée du Golfe", "trophee-du-golfe", "Golfe du Morbihan", 47.559, -2.835, "2026-07-17", "2026-07-19", NOW, NOW),
    db.prepare("INSERT INTO scoring_rule_versions VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind("rule-2026-v1", "Barème championnat 2026", 1, "published", JSON.stringify(DEFAULT_SCORING), NOW, NOW, NOW),
    db.prepare("INSERT INTO races VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind("race-golfe-6", "event-golfe", "Manche 6", "trophee-du-golfe-manche-6", "2026-07-17T13:00:00.000Z", "completed", "course-golfe-v1", "rule-2026-v1", NOW, NOW, NOW),
    db.prepare("INSERT INTO course_versions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("course-golfe-v1", "race-golfe-6", 1, "published", geojson, 1, 8.4, NOW, NOW, NOW),
  ];

  for (const [id, name, slug, sail, model, color] of boats) {
    statements.push(db.prepare("INSERT INTO boats VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind(id, name, slug, sail, model, color, NOW, NOW));
  }
  for (const [id, name, slug] of people) {
    statements.push(db.prepare("INSERT INTO participants VALUES (?, ?, ?, 'FR', 1, NULL, ?, ?)").bind(id, name, slug, NOW, NOW));
  }
  DEFAULT_MARKS.forEach((mark, sequence) => {
    const [lng, lat] = mark.coordinates[0];
    const secondary = mark.coordinates[1];
    statements.push(db.prepare("INSERT INTO course_marks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(mark.id, "course-golfe-v1", sequence, mark.name, mark.type, mark.rounding, lat, lng, secondary?.[1] ?? null, secondary?.[0] ?? null));
  });
  boats.forEach((boat, boatIndex) => {
    const entryId = `entry-${boat[2]}`;
    const resultId = `result-${boat[2]}`;
    statements.push(db.prepare("INSERT INTO race_entries VALUES (?, ?, ?, ?, 'confirmed', ?)").bind(entryId, "race-golfe-6", boat[0], boatIndex + 1, NOW));
    for (let crewIndex = 0; crewIndex < 3; crewIndex++) {
      const person = people[boatIndex * 3 + crewIndex];
      statements.push(db.prepare("INSERT INTO crew_assignments VALUES (?, ?, ?, ?, ?)").bind(`crew-${boatIndex}-${crewIndex}`, entryId, person[0], roles[crewIndex], NOW));
    }
    const status = boatIndex === 4 ? "classified" : "classified";
    const penalty = boatIndex === 4 ? 2 : 0;
    statements.push(db.prepare("INSERT INTO results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(resultId, entryId, boatIndex + 1, elapsed[boatIndex], status, penalty, boatIndex === 4 ? "Pénalité de parcours" : null, points[boatIndex], JSON.stringify(DEFAULT_SCORING), NOW, NOW));
    for (let crewIndex = 0; crewIndex < 3; crewIndex++) {
      const person = people[boatIndex * 3 + crewIndex];
      statements.push(db.prepare("INSERT INTO individual_awards VALUES (?, ?, ?, ?, 'same_as_boat', ?, ?)")
        .bind(`award-${boatIndex}-${crewIndex}`, resultId, person[0], points[boatIndex], JSON.stringify({ rule: "rule-2026-v1", mode: "same_as_boat" }), NOW));
    }
  });
  await db.batch(statements);
}

export async function getRaceBySlug(slug?: string): Promise<RaceView> {
  if (!isDatabaseConfigured()) {
    const { demoRace } = await import("./demo-data");
    if (slug && slug !== demoRace.slug) throw new Error("Course introuvable");
    return demoRace;
  }
  await ensureDatabase();
  const db = getDatabase();
  const race = await db.prepare(`SELECT r.*, e.name AS event_name, e.slug AS event_slug, e.location_name,
    e.center_lat, e.center_lng, s.name AS season_name, s.slug AS season_slug,
    cv.geojson, cv.distance_nm, cv.laps
    FROM races r JOIN events e ON e.id = r.event_id JOIN seasons s ON s.id = e.season_id
    JOIN course_versions cv ON cv.id = r.course_version_id
    WHERE r.slug = COALESCE(?, r.slug) AND r.archived_at IS NULL
    ORDER BY r.scheduled_at DESC LIMIT 1`).bind(slug ?? null).first<Record<string, unknown>>();
  if (!race) throw new Error("Course introuvable");
  const entries = await db.prepare(`SELECT re.id AS entry_id, re.boat_id, b.name AS boat_name, b.slug AS boat_slug,
    b.sail_number, b.color, rs.position, rs.elapsed_seconds, rs.status, rs.boat_points
    FROM race_entries re JOIN boats b ON b.id = re.boat_id LEFT JOIN results rs ON rs.entry_id = re.id
    WHERE re.race_id = ? AND re.status != 'withdrawn'
    ORDER BY CASE WHEN rs.position IS NULL THEN 999 ELSE rs.position END, b.name`).bind(String(race.id)).all<Record<string, unknown>>();
  const crewRows = await db.prepare(`SELECT ca.entry_id, p.id, p.name, p.slug, ca.role, ia.points
    FROM crew_assignments ca JOIN participants p ON p.id = ca.participant_id
    LEFT JOIN results rs ON rs.entry_id = ca.entry_id
    LEFT JOIN individual_awards ia ON ia.result_id = rs.id AND ia.participant_id = p.id
    WHERE ca.entry_id IN (SELECT id FROM race_entries WHERE race_id = ?)
    ORDER BY ca.entry_id, ca.created_at`).bind(String(race.id)).all<Record<string, unknown>>();
  const crewByEntry = new Map<string, Array<{ id: string; name: string; slug: string; role: string; points?: number }>>();
  for (const row of crewRows.results) {
    const key = String(row.entry_id);
    const list = crewByEntry.get(key) ?? [];
    list.push({ id: String(row.id), name: String(row.name), slug: String(row.slug), role: String(row.role), points: row.points == null ? undefined : Number(row.points) });
    crewByEntry.set(key, list);
  }
  return {
    id: String(race.id), name: String(race.name), slug: String(race.slug), status: race.status as RaceView["status"],
    scheduledAt: String(race.scheduled_at), eventName: String(race.event_name), eventSlug: String(race.event_slug),
    seasonName: String(race.season_name), seasonSlug: String(race.season_slug), locationName: String(race.location_name),
    center: [Number(race.center_lng), Number(race.center_lat)], distanceNm: Number(race.distance_nm), laps: Number(race.laps),
    courseGeoJson: JSON.parse(String(race.geojson)) as GeoJSON.FeatureCollection,
    leaderboard: entries.results.map((row) => ({
      entryId: String(row.entry_id), position: row.position == null ? null : Number(row.position), boatId: String(row.boat_id),
      boatName: String(row.boat_name), boatSlug: String(row.boat_slug), sailNumber: String(row.sail_number), color: String(row.color),
      status: (row.status ?? "classified") as RaceView["leaderboard"][number]["status"],
      elapsedSeconds: row.elapsed_seconds == null ? null : Number(row.elapsed_seconds), points: Number(row.boat_points ?? 0),
      crew: crewByEntry.get(String(row.entry_id)) ?? [],
    })),
  };
}

export async function getPublicOverview() {
  if (!isDatabaseConfigured()) return (await import("./demo-data")).demoOverview();
  const race = await getRaceBySlug();
  const db = getDatabase();
  const boats = await db.prepare(`SELECT b.id, b.name, b.slug, b.sail_number, b.model, b.color, COUNT(re.id) AS races,
    COALESCE(SUM(rs.boat_points), 0) AS points FROM boats b LEFT JOIN race_entries re ON re.boat_id = b.id
    LEFT JOIN results rs ON rs.entry_id = re.id WHERE b.archived_at IS NULL GROUP BY b.id ORDER BY points DESC LIMIT 20`).all<Record<string, unknown>>();
  const participants = await db.prepare(`SELECT p.id, p.name, p.slug, p.nationality, p.public_visible, COUNT(ia.id) AS races,
    COALESCE(SUM(ia.points), 0) AS points FROM participants p LEFT JOIN individual_awards ia ON ia.participant_id = p.id
    WHERE p.archived_at IS NULL GROUP BY p.id ORDER BY points DESC LIMIT 30`).all<Record<string, unknown>>();
  return { race, boats: boats.results, participants: participants.results };
}

export async function getBoatProfile(slug: string) {
  if (!isDatabaseConfigured()) return (await import("./demo-data")).demoBoatProfile(slug);
  await ensureDatabase();
  const db = getDatabase();
  const boat = await db.prepare("SELECT * FROM boats WHERE slug = ? AND archived_at IS NULL").bind(slug).first<Record<string, unknown>>();
  if (!boat) return null;
  const history = await db.prepare(`SELECT r.name AS race_name, r.slug AS race_slug, e.name AS event_name, r.scheduled_at,
    rs.position, rs.boat_points, rs.status FROM race_entries re JOIN races r ON r.id = re.race_id
    JOIN events e ON e.id = r.event_id LEFT JOIN results rs ON rs.entry_id = re.id
    WHERE re.boat_id = ? ORDER BY r.scheduled_at DESC LIMIT 30`).bind(String(boat.id)).all<Record<string, unknown>>();
  return { boat, history: history.results };
}

export async function getParticipantProfile(slug: string) {
  if (!isDatabaseConfigured()) return (await import("./demo-data")).demoParticipantProfile(slug);
  await ensureDatabase();
  const db = getDatabase();
  const participant = await db.prepare("SELECT * FROM participants WHERE slug = ? AND archived_at IS NULL").bind(slug).first<Record<string, unknown>>();
  if (!participant || !participant.public_visible) return null;
  const history = await db.prepare(`SELECT r.name AS race_name, r.slug AS race_slug, e.name AS event_name, r.scheduled_at,
    b.name AS boat_name, b.slug AS boat_slug, ca.role, rs.position, ia.points
    FROM crew_assignments ca JOIN race_entries re ON re.id = ca.entry_id JOIN races r ON r.id = re.race_id
    JOIN events e ON e.id = r.event_id JOIN boats b ON b.id = re.boat_id
    LEFT JOIN results rs ON rs.entry_id = re.id LEFT JOIN individual_awards ia ON ia.result_id = rs.id AND ia.participant_id = ca.participant_id
    WHERE ca.participant_id = ? ORDER BY r.scheduled_at DESC LIMIT 30`).bind(String(participant.id)).all<Record<string, unknown>>();
  return { participant, history: history.results };
}

export async function getAdminSnapshot() {
  if (!isDatabaseConfigured()) return (await import("./demo-data")).demoAdminSnapshot();
  const overview = await getPublicOverview();
  const db = getDatabase();
  const [seasonsResult, eventsResult, racesResult, rulesResult, requestsResult, adminsResult] = await Promise.all([
    db.prepare("SELECT * FROM seasons WHERE archived_at IS NULL ORDER BY year DESC").all(),
    db.prepare("SELECT * FROM events WHERE archived_at IS NULL ORDER BY starts_on DESC").all(),
    db.prepare("SELECT * FROM races WHERE archived_at IS NULL ORDER BY scheduled_at DESC").all(),
    db.prepare("SELECT * FROM scoring_rule_versions WHERE archived_at IS NULL ORDER BY name, version DESC").all(),
    db.prepare("SELECT * FROM admin_access_requests ORDER BY created_at DESC LIMIT 30").all(),
    db.prepare("SELECT * FROM admins ORDER BY role DESC, display_name").all(),
  ]);
  return {
    ...overview,
    seasons: seasonsResult.results,
    events: eventsResult.results,
    races: racesResult.results,
    rules: rulesResult.results,
    accessRequests: requestsResult.results,
    admins: adminsResult.results,
  };
}

export async function writeAudit(actorEmail: string, action: string, entityType: string, entityId: string, changes: unknown) {
  const db = getDatabase();
  await db.prepare("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), actorEmail, action, entityType, entityId, JSON.stringify(changes), new Date().toISOString()).run();
}

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export { DEFAULT_SCORING };
