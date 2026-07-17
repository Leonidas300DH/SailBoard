import type { RaceView } from "./domain";

const demoScoring = {
  direction: "high",
  positionPoints: { "1": 18, "2": 15, "3": 12, "4": 10, "5": 8, "6": 6, "7": 4, "8": 3, "9": 2, "10": 1 },
  participationPoints: 1,
  statusPoints: { dnf: 1, dns: 0, dsq: 0 },
  individualMode: "same_as_boat",
  roleWeights: { Barre: 1, Réglage: 1, Avant: 1 },
  tieBreakers: ["wins", "best_recent", "best_result"],
};

const competitors = [
  { id: "kaz", name: "Kaz a Barh", slug: "kaz-a-barh", sail: "FRA 701", color: "#f4f4ef", position: 1, seconds: 6678, points: 18, crew: [["Yann Le Clec’h", "yann-le-clech", "Barre"], ["Enora Péron", "enora-peron", "Réglage"], ["Maël Rio", "mael-rio", "Avant"]] },
  { id: "arm", name: "Ar Mor", slug: "ar-mor", sail: "FRA 228", color: "#d8ff00", position: 2, seconds: 6753, points: 15, crew: [["Camille Bernard", "camille-bernard", "Barre"], ["Nolwenn Le Bris", "nolwenn-le-bris", "Avant"], ["Yann Tanguy", "yann-tanguy", "Réglage"]] },
  { id: "bleu", name: "Bleuenn", slug: "bleuenn", sail: "FRA 319", color: "#35b8ff", position: 3, seconds: 6826, points: 12, crew: [["Ana Le Gall", "ana-le-gall", "Barre"], ["Pierre Morvan", "pierre-morvan", "Avant"], ["Tom Lemerle", "tom-lemerle", "Réglage"]] },
  { id: "hiziv", name: "Hiziv", slug: "hiziv", sail: "FRA 447", color: "#ff8b22", position: 4, seconds: 6912, points: 10, crew: [["Corentin Jean", "corentin-jean", "Barre"], ["Gaël Le Roux", "gael-le-roux", "Réglage"], ["Marine Quillivic", "marine-quillivic", "Avant"]] },
  { id: "mab", name: "Mab Den", slug: "mab-den", sail: "FRA 512", color: "#b968df", position: 5, seconds: 7005, points: 8, crew: [["Fanny Déniel", "fanny-deniel", "Barre"], ["Jules Appriou", "jules-appriou", "Réglage"], ["Lina Cicquel", "lina-cicquel", "Avant"]] },
  { id: "kreiz", name: "Kreiz", slug: "kreiz", sail: "FRA 609", color: "#9ac21a", position: 6, seconds: 7088, points: 6, crew: [["Alix Rault", "alix-rault", "Barre"], ["Soazig Le Floch", "soazig-le-floch", "Réglage"], ["Yves Coïc", "yves-coic", "Avant"]] },
] as const;

const course: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { kind: "route" }, geometry: { type: "LineString", coordinates: [[-2.915, 47.56], [-2.827, 47.603], [-2.764, 47.548], [-2.878, 47.514], [-2.944, 47.548]] } },
    { type: "Feature", properties: { id: "start", kind: "start", label: "1", name: "Ligne de départ" }, geometry: { type: "LineString", coordinates: [[-2.915, 47.56], [-2.903, 47.569]] } },
    { type: "Feature", properties: { id: "mark-1", kind: "mark", label: "2", name: "Marque 1" }, geometry: { type: "Point", coordinates: [-2.827, 47.603] } },
    { type: "Feature", properties: { id: "gate", kind: "gate", label: "3", name: "Porte 2" }, geometry: { type: "LineString", coordinates: [[-2.764, 47.548], [-2.748, 47.542]] } },
    { type: "Feature", properties: { id: "mark-3", kind: "mark", label: "4", name: "Marque 3" }, geometry: { type: "Point", coordinates: [-2.878, 47.514] } },
    { type: "Feature", properties: { id: "finish", kind: "finish", label: "5", name: "Ligne d’arrivée" }, geometry: { type: "LineString", coordinates: [[-2.944, 47.548], [-2.932, 47.557]] } },
  ],
};

export const demoRace: RaceView = {
  id: "race-golfe-6", name: "Manche 6", slug: "trophee-du-golfe-manche-6", status: "completed",
  scheduledAt: "2026-07-17T13:00:00.000Z", eventName: "Trophée du Golfe", eventSlug: "trophee-du-golfe",
  seasonName: "Championnat 2026", seasonSlug: "championnat-2026", locationName: "Golfe du Morbihan",
  center: [-2.835, 47.559], distanceNm: 8.4, laps: 1, courseGeoJson: course,
  leaderboard: competitors.map((item) => ({
    entryId: `entry-${item.slug}`, position: item.position, boatId: `boat-${item.id}`, boatName: item.name,
    boatSlug: item.slug, sailNumber: item.sail, color: item.color, status: "classified", elapsedSeconds: item.seconds,
    points: item.points, crew: item.crew.map(([name, slug, role], index) => ({ id: `p-${item.id}-${index}`, name, slug, role, points: item.points })),
  })),
};

export const demoBoats = competitors.map((item) => ({ id: `boat-${item.id}`, name: item.name, slug: item.slug, sail_number: item.sail, model: "J/80", color: item.color, races: 1, points: item.points }));
export const demoParticipants = demoRace.leaderboard.flatMap((entry) => entry.crew.map((member) => ({ id: member.id, name: member.name, slug: member.slug, nationality: "FR", public_visible: 1, races: 1, points: member.points, boat_name: entry.boatName, boat_slug: entry.boatSlug, role: member.role })));

export function demoOverview() {
  return { race: demoRace, boats: demoBoats, participants: demoParticipants };
}

export function demoBoatProfile(slug: string) {
  const boat = demoBoats.find((item) => item.slug === slug);
  const row = demoRace.leaderboard.find((item) => item.boatSlug === slug);
  if (!boat || !row) return null;
  return { boat, history: [{ race_name: demoRace.name, race_slug: demoRace.slug, event_name: demoRace.eventName, scheduled_at: demoRace.scheduledAt, position: row.position, boat_points: row.points, status: row.status }] };
}

export function demoParticipantProfile(slug: string) {
  const participant = demoParticipants.find((item) => item.slug === slug);
  const entry = demoRace.leaderboard.find((row) => row.crew.some((member) => member.slug === slug));
  if (!participant || !entry) return null;
  return { participant, history: [{ race_name: demoRace.name, race_slug: demoRace.slug, event_name: demoRace.eventName, scheduled_at: demoRace.scheduledAt, boat_name: entry.boatName, boat_slug: entry.boatSlug, role: participant.role, position: entry.position, points: participant.points }] };
}

export function demoAdminSnapshot() {
  return {
    ...demoOverview(),
    seasons: [{ id: "season-2026", name: "Championnat 2026", year: 2026, status: "active" }],
    events: [{ id: "event-golfe", name: "Trophée du Golfe", location_name: "Golfe du Morbihan" }],
    races: [{ id: demoRace.id, name: demoRace.name, scheduled_at: demoRace.scheduledAt, status: demoRace.status }],
    rules: [{ id: "rule-2026-v1", name: "Barème championnat 2026", version: 1, status: "published", config_json: JSON.stringify(demoScoring) }],
    accessRequests: [],
    admins: [{ id: "local-owner", email: "owner@sailboard.local", display_name: "Admin de démonstration", role: "owner", status: "active" }],
  };
}
